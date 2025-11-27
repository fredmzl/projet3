package com.openclassrooms.datashare.controller;

import com.openclassrooms.datashare.dto.FileDownloadRequestDto;
import com.openclassrooms.datashare.dto.FileInfoResponseDto;
import com.openclassrooms.datashare.entities.File;
import com.openclassrooms.datashare.service.DownloadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Contrôleur pour les téléchargements publics de fichiers (endpoints non authentifiés)
 * US01 - Téléchargement via lien
 */
@RestController
@RequestMapping("/api/download")
public class DownloadController {

    @Autowired
    private DownloadService downloadService;

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
                .headers(headers)
                .body(resource);
    }
}
