package com.openclassrooms.datashare.controller;

import com.openclassrooms.datashare.dto.FileDownloadRequestDto;
import com.openclassrooms.datashare.dto.FileInfoResponseDto;
import com.openclassrooms.datashare.entities.File;
import com.openclassrooms.datashare.entities.User;
import com.openclassrooms.datashare.exception.AccessDeniedException;
import com.openclassrooms.datashare.exception.FileExpiredException;
import com.openclassrooms.datashare.repository.UserRepository;
import com.openclassrooms.datashare.service.DownloadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

/**
 * Contrôleur pour les téléchargements publics de fichiers (endpoints non authentifiés)
 * US01 - Téléchargement via lien
 */
@RestController
@RequestMapping("/api/download")
public class DownloadController {

    @Autowired
    private DownloadService downloadService;

    @Autowired
    private UserRepository userRepository;

    /**
     * GET /api/download/{token}
     * Récupère les informations publiques d'un fichier sans le télécharger
     * 
     * @param token Token unique de téléchargement
     * @return DTO avec métadonnées du fichier (nom, taille, type, expiration, hasPassword)
     */
    @GetMapping("/{token}")
    public ResponseEntity<FileInfoResponseDto> getFileInfo(@PathVariable String token) {
        FileInfoResponseDto fileInfo = downloadService.getFileInfo(token);
        return ResponseEntity.ok(fileInfo);
    }

    /**
     * POST /api/download/{token}
     * Télécharge le fichier avec vérification optionnelle du mot de passe
     * 
     * @param token Token unique de téléchargement
     * @param requestDto DTO optionnel contenant le mot de passe
     * @return Stream du fichier avec headers appropriés (Content-Type, Content-Disposition)
     */
    @PostMapping("/{token}")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable String token,
            @RequestBody(required = false) FileDownloadRequestDto requestDto) {
        
        // 1. Télécharger le fichier (avec vérification mot de passe si nécessaire)
        Resource resource = downloadService.downloadFile(token, requestDto);
        
        // 2. Récupérer les métadonnées pour les headers
        File file = downloadService.getFileByToken(token);
        
        // 3. Construire les headers HTTP
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(file.getMimeType()));
        headers.setContentDisposition(
                org.springframework.http.ContentDisposition
                        .attachment()
                        .filename(file.getOriginalFilename())
                        .build()
        );
        headers.setContentLength(file.getFileSize());
        headers.setCacheControl("no-cache, no-store, must-revalidate");
        headers.add("X-File-Id", file.getId().toString());
        
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .headers(headers)
                .body(resource);
    }

    /**
     * GET /api/download/owner/{token}
     * Télécharge un fichier en tant que propriétaire (utilisateur authentifié)
     * Pas besoin de mot de passe si l'utilisateur est le propriétaire du fichier
     * 
     * US05 - Permet à l'utilisateur de télécharger ses propres fichiers depuis son historique
     * sans avoir à fournir le mot de passe, même si le fichier est protégé.
     * 
     * @param token Token unique de téléchargement
     * @param authentication Informations d'authentification JWT (userId extrait automatiquement)
     * @return Stream du fichier avec headers appropriés
     * @throws AccessDeniedException Si l'utilisateur n'est pas le propriétaire
     * @throws FileExpiredException Si le fichier a expiré
     */
    @GetMapping("/owner/{token}")
    public ResponseEntity<Resource> downloadFileAsOwner(
            @PathVariable String token,
            Authentication authentication) {
        
        // 1. Extraire le login depuis le JWT (Authentication.getName() retourne le login)
        String login = authentication.getName();
        
        // 2. Récupérer l'utilisateur par login pour obtenir l'ID
        User user = userRepository.findByLogin(login)
                .orElseThrow(() -> new AccessDeniedException("Utilisateur non trouvé"));
        Long userId = user.getId();
        
        // 3. Récupérer le fichier par token
        File file = downloadService.getFileByToken(token);
        
        // 4. Vérifier que l'utilisateur est le propriétaire
        if (!file.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Vous n'êtes pas autorisé à télécharger ce fichier");
        }
        
        // 5. Vérifier que le fichier n'est pas expiré
        if (file.getExpirationDate().isBefore(LocalDateTime.now())) {
            throw new FileExpiredException("Le fichier a expiré", file.getExpirationDate());
        }
        
        // 6. Télécharger le fichier sans vérifier le mot de passe (méthode spéciale propriétaire)
        Resource resource = downloadService.downloadFileAsOwner(token);
        
        // 7. Construire les headers HTTP
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(file.getMimeType()));
        headers.setContentDisposition(
                org.springframework.http.ContentDisposition
                        .attachment()
                        .filename(file.getOriginalFilename())
                        .build()
        );
        headers.setContentLength(file.getFileSize());
        headers.setCacheControl("no-cache, no-store, must-revalidate");
        headers.add("X-File-Id", file.getId().toString());
        headers.add("X-Owner-Download", "true"); // Indicateur que c'est un download propriétaire
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(resource);
    }
}
