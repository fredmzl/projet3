package com.openclassrooms.datashare.controller;

import com.openclassrooms.datashare.dto.FileListResponseDto;
import com.openclassrooms.datashare.dto.FileUploadRequestDto;
import com.openclassrooms.datashare.dto.FileUploadResponseDto;
import com.openclassrooms.datashare.entities.User;
import com.openclassrooms.datashare.service.FileService;
import com.openclassrooms.datashare.validation.MimeTypeValidator;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

/**
 * Contrôleur REST pour la gestion des fichiers.
 * <p>
 * Endpoints :
 * - GET /api/files : Liste paginée des fichiers de l'utilisateur
 * - POST /api/files : Upload d'un fichier avec authentification JWT
 * - DELETE /api/files/{fileId} : Suppression d'un fichier
 * <p>
 * Sécurité : Tous les endpoints requièrent une authentification JWT valide.
 */
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Slf4j
public class FileController {

    private final FileService fileService;

    /**
     * Liste les fichiers de l'utilisateur connecté avec pagination.
     * <p>
     * Authentification requise via JWT.
     * 
     * @param page Le numéro de page (commence à 0, défaut: 0)
     * @param size Le nombre d'éléments par page (min: 1, max: 100, défaut: 20)
     * @param sort Le critère de tri (défaut: "createdAt,desc")
     * @param includeExpired Inclure les fichiers expirés (défaut: true)
     * @param userDetails L'utilisateur authentifié extrait du JWT
     * @return 200 OK avec FileListResponseDto
     */
    @GetMapping
    public ResponseEntity<?> listFiles(
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false, defaultValue = "20") Integer size,
            @RequestParam(required = false, defaultValue = "createdAt,desc") String sort,
            @RequestParam(required = false, defaultValue = "true") Boolean includeExpired,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        try {
            // Extraire User depuis UserDetails
            if (!(userDetails instanceof User)) {
                log.error("UserDetails is not an instance of User");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Authentication error"));
            }
            
            User user = (User) userDetails;
            log.info("List files request from user: {} (id={})", user.getLogin(), user.getId());
            
            // Appeler FileService.listUserFiles()
            FileListResponseDto response = fileService.listUserFiles(user, page, size, sort, includeExpired);
            
            // Retourner 200 OK avec FileListResponseDto
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Unexpected error during file listing", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "An unexpected error occurred"));
        }
    }

    /**
     * Upload un fichier avec métadonnées.
     * <p>
     * Authentification requise via JWT.
     * Content-Type: multipart/form-data
     * 
     * @param file Le fichier à uploader (required)
     * @param request Les paramètres d'upload (expirationDays, password)
     * @param userDetails L'utilisateur authentifié extrait du JWT
     * @return 201 Created avec FileUploadResponseDto
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @Valid @ModelAttribute FileUploadRequestDto request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        try {
            // Extraire User depuis UserDetails
            if (!(userDetails instanceof User)) {
                log.error("UserDetails is not an instance of User");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Authentication error"));
            }
            
            User user = (User) userDetails;
            log.info("File upload request from user: {} (id={})", user.getLogin(), user.getId());
            
            // Appeler FileService.uploadFile()
            FileUploadResponseDto response = fileService.uploadFile(file, request, user);
            
            // Retourner 201 Created avec FileUploadResponseDto
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (FileService.FileSizeExceededException e) {
            log.warn("File size exceeded: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                    .body(Map.of("error", e.getMessage()));
                    
        } catch (FileService.EmptyFileException e) {
            log.warn("Empty file upload attempt: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
                    
        } catch (FileService.InvalidExpirationException e) {
            log.warn("Invalid expiration: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
                    
        } catch (FileService.WeakPasswordException e) {
            log.warn("Weak password: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
                    
        } catch (MimeTypeValidator.InvalidMimeTypeException e) {
            log.warn("Invalid MIME type: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
                    
        } catch (IOException e) {
            log.error("Storage error during file upload", e);
            return ResponseEntity.status(HttpStatus.INSUFFICIENT_STORAGE)
                    .body(Map.of("error", "Insufficient storage or I/O error"));
                    
        } catch (Exception e) {
            log.error("Unexpected error during file upload", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "An unexpected error occurred"));
        }
    }

    /**
     * Supprime un fichier de l'utilisateur.
     * <p>
     * Authentification requise via JWT.
     * L'utilisateur doit être le propriétaire du fichier.
     * 
     * @param fileId L'identifiant UUID du fichier à supprimer
     * @param userDetails L'utilisateur authentifié extrait du JWT
     * @return 204 No Content si succès, ou erreur appropriée (401/403/404)
     */
    @DeleteMapping("/{fileId}")
    public ResponseEntity<?> deleteFile(
            @PathVariable java.util.UUID fileId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        try {
            // Extraire User depuis UserDetails
            if (!(userDetails instanceof User)) {
                log.error("UserDetails is not an instance of User");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Authentication error"));
            }
            
            User user = (User) userDetails;
            log.info("Delete file request from user: {} (id={}) for fileId: {}", 
                user.getLogin(), user.getId(), fileId);
            
            // Appeler FileService.deleteFile()
            fileService.deleteFile(fileId, user);
            
            // Retourner 204 No Content
            return ResponseEntity.noContent().build();
            
        } catch (FileService.FileNotFoundException e) {
            log.warn("File not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Not Found", "message", "Fichier non trouvé"));
                    
        } catch (FileService.ForbiddenFileAccessException e) {
            log.warn("Forbidden file access: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Forbidden", "message", "Vous n'êtes pas autorisé à supprimer ce fichier"));
                    
        } catch (Exception e) {
            log.error("Unexpected error during file deletion", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "An unexpected error occurred"));
        }
    }
}
