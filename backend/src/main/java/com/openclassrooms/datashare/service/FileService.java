package com.openclassrooms.datashare.service;

import com.openclassrooms.datashare.dto.FileUploadRequestDto;
import com.openclassrooms.datashare.dto.FileUploadResponseDto;
import com.openclassrooms.datashare.entities.File;
import com.openclassrooms.datashare.entities.User;
import com.openclassrooms.datashare.mapper.FileMapper;
import com.openclassrooms.datashare.repository.FileRepository;
import com.openclassrooms.datashare.validation.MimeTypeValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;

/**
 * Service de gestion de la logique métier pour l'upload de fichiers.
 * <p>
 * Responsabilités :
 * - Orchestration du processus d'upload
 * - Validation des règles métier
 * - Génération des tokens uniques
 * - Hash des mots de passe
 * - Sauvegarde des métadonnées en base de données
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class FileService {

    private final FileRepository fileRepository;
    private final FileStorageService storageService;
    private final PasswordEncoder passwordEncoder;
    private final FileMapper fileMapper;
    private final TokenGeneratorService tokenGeneratorService;
    private final MimeTypeValidator mimeTypeValidator;

    @Value("${app.file.max-size}")
    private long maxFileSize;

    @Value("${app.download.base-url}")
    private String downloadBaseUrl;

    /**
     * Upload un fichier avec ses métadonnées.
     * 
     * @param file Le fichier à uploader
     * @param request Les paramètres de l'upload (expiration, password)
     * @param user L'utilisateur effectuant l'upload
     * @return Le DTO de réponse avec les informations du fichier uploadé
     * @throws FileSizeExceededException Si le fichier dépasse 1 GB
     * @throws EmptyFileException Si le fichier est vide
     * @throws InvalidExpirationException Si la durée d'expiration est invalide
     * @throws WeakPasswordException Si le mot de passe est trop faible
     * @throws IOException Si une erreur I/O se produit lors du stockage
     */
    @Transactional
    public FileUploadResponseDto uploadFile(MultipartFile file, FileUploadRequestDto request, User user) 
            throws IOException {
        log.info("Starting file upload for user: {} (id={})", user.getLogin(), user.getId());

        // 1. Valider taille fichier (< 1 GB)
        if (file.getSize() > maxFileSize) {
            throw new FileSizeExceededException(
                String.format("File size %d bytes exceeds maximum allowed size of %d bytes", 
                    file.getSize(), maxFileSize)
            );
        }

        // 2. Valider fichier non vide
        if (file.isEmpty() || file.getSize() == 0) {
            throw new EmptyFileException("Cannot upload empty file");
        }

        // 2.5. Valider MIME type (optionnel)
        mimeTypeValidator.validateOrThrow(file);

        // Valider expirationDays (normalement géré par @Valid, mais double vérification)
        Integer expirationDays = request.getExpirationDays() != null ? request.getExpirationDays() : 7;
        if (expirationDays < 1 || expirationDays > 7) {
            throw new InvalidExpirationException(
                String.format("Expiration days must be between 1 and 7, got: %d", expirationDays)
            );
        }

        // Valider password si fourni
        String password = request.getPassword();
        if (password != null && !password.isBlank() && password.length() < 4) {
            throw new WeakPasswordException("Password must be at least 4 characters long");
        }

        // 3. Générer token unique
        String downloadToken = tokenGeneratorService.generateUniqueToken();

        // 4. Calculer expiration date
        LocalDateTime expirationDate = calculateExpirationDate(expirationDays);

        // 5. Détecter MIME type
        String mimeType = storageService.detectMimeType(file);

        // 6. Hasher password si fourni (BCrypt)
        String passwordHash = null;
        if (password != null && !password.isBlank()) {
            passwordHash = passwordEncoder.encode(password);
            log.debug("Password hashed for file upload");
        }

        // 7. Appeler FileStorageService.storeFile()
        String filepath = storageService.storeFile(file, user.getId());
        log.debug("File stored at: {}", filepath);

        // 8. Sauvegarder métadonnées en DB
        File fileEntity = new File();
        fileEntity.setUser(user);
        fileEntity.setFilename(generateSafeFilename(file.getOriginalFilename()));
        fileEntity.setOriginalFilename(file.getOriginalFilename());
        fileEntity.setFilepath(filepath);
        fileEntity.setFileSize(file.getSize());
        fileEntity.setMimeType(mimeType);
        fileEntity.setDownloadToken(downloadToken);
        fileEntity.setPasswordHash(passwordHash);
        fileEntity.setExpirationDate(expirationDate);

        File savedFile = fileRepository.save(fileEntity);
        log.info("File metadata saved with id: {}", savedFile.getId());

        // 9. Construire downloadUrl
        FileUploadResponseDto response = fileMapper.toUploadResponse(savedFile);
        String downloadUrl = buildDownloadUrl(downloadToken);
        response.setDownloadUrl(downloadUrl);

        // 10. Retourner DTO
        log.info("File upload completed successfully: {} ({} bytes)", 
            savedFile.getFilename(), savedFile.getFileSize());
        
        return response;
    }

    /**
     * Calcule la date d'expiration à partir du nombre de jours.
     * 
     * @param days Le nombre de jours avant expiration (1-7)
     * @return La date et heure d'expiration
     */
    public LocalDateTime calculateExpirationDate(Integer days) {
        if (days == null) {
            days = 7;
        }
        return LocalDateTime.now().plusDays(days);
    }

    /**
     * Construit l'URL de téléchargement complète.
     * 
     * @param token Le token de téléchargement
     * @return L'URL complète
     */
    private String buildDownloadUrl(String token) {
        return downloadBaseUrl + "/" + token;
    }

    /**
     * Génère un nom de fichier sécurisé en supprimant les caractères dangereux.
     * 
     * @param originalFilename Le nom de fichier original
     * @return Un nom de fichier sécurisé
     */
    private String generateSafeFilename(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) {
            return "unnamed";
        }
        
        // Supprimer les caractères dangereux et normaliser
        return originalFilename
            .replaceAll("[^a-zA-Z0-9._-]", "_")
            .replaceAll("_{2,}", "_");
    }

    // ==================== Custom Exceptions ====================

    /**
     * Exception levée quand un fichier dépasse la taille maximale autorisée.
     */
    public static class FileSizeExceededException extends RuntimeException {
        public FileSizeExceededException(String message) {
            super(message);
        }
    }

    /**
     * Exception levée quand un fichier vide est uploadé.
     */
    public static class EmptyFileException extends RuntimeException {
        public EmptyFileException(String message) {
            super(message);
        }
    }

    /**
     * Exception levée quand la durée d'expiration est invalide.
     */
    public static class InvalidExpirationException extends RuntimeException {
        public InvalidExpirationException(String message) {
            super(message);
        }
    }

    /**
     * Exception levée quand le mot de passe est trop faible.
     */
    public static class WeakPasswordException extends RuntimeException {
        public WeakPasswordException(String message) {
            super(message);
        }
    }
}
