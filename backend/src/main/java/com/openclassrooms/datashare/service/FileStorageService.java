package com.openclassrooms.datashare.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * Service de gestion physique des fichiers sur le système de fichiers.
 * <p>
 * Responsabilités :
 * - Stockage des fichiers uploadés avec organisation par utilisateur et date
 * - Chargement des fichiers depuis le filesystem
 * - Suppression physique des fichiers
 * - Détection du type MIME des fichiers
 */
@Service
@Slf4j
public class FileStorageService {

    private final Path storageLocation;
    private final long maxFileSize;

    public FileStorageService(
            @Value("${app.storage.path}") String storagePath,
            @Value("${app.file.max-size}") long maxFileSize) throws FileStorageException {
        this.storageLocation = Paths.get(storagePath).toAbsolutePath().normalize();
        this.maxFileSize = maxFileSize;
        
        try {
            Files.createDirectories(this.storageLocation);
            log.info("Storage location initialized: {}", this.storageLocation);
        } catch (IOException e) {
            log.error("Could not create storage directory", e);
            throw new FileStorageException("Could not create storage directory", e);
        }
    }

    /**
     * Stocke un fichier uploadé sur le système de fichiers.
     * <p>
     * Organisation : /storage/{userId}/{yyyy}/{mm}/{dd}/{UUID}_{filename}
     * 
     * @param file Le fichier à stocker
     * @param userId L'identifiant de l'utilisateur
     * @return Le chemin relatif du fichier stocké
     * @throws FileStorageException Si le fichier ne peut pas être stocké
     */
    public String storeFile(MultipartFile file, Long userId) throws FileStorageException {
        // Validation fichier non vide
        if (file.isEmpty()) {
            throw new FileStorageException("Cannot store empty file");
        }

        // Validation taille max (1 GB)
        if (file.getSize() > maxFileSize) {
            throw new FileStorageException(
                String.format("File size exceeds maximum allowed size of %d bytes", maxFileSize)
            );
        }

        // Génération du nom de fichier unique
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            originalFilename = "unnamed";
        }
        
        String uniqueFilename = UUID.randomUUID() + "_" + originalFilename;

        // Construction du chemin organisé par date
        LocalDateTime now = LocalDateTime.now();
        String year = now.format(DateTimeFormatter.ofPattern("yyyy"));
        String month = now.format(DateTimeFormatter.ofPattern("MM"));
        String day = now.format(DateTimeFormatter.ofPattern("dd"));

        // Chemin relatif : {userId}/{yyyy}/{mm}/{dd}
        String relativePath = String.format("%d/%s/%s/%s", userId, year, month, day);
        
        // Chemin complet du répertoire
        Path targetDirectory = this.storageLocation.resolve(relativePath);
        
        try {
            // Création des répertoires si nécessaire
            Files.createDirectories(targetDirectory);
            
            // Chemin complet du fichier
            Path targetFile = targetDirectory.resolve(uniqueFilename);
            
            // Copie du fichier
            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
            
            // Retour du chemin relatif complet
            String fullRelativePath = relativePath + "/" + uniqueFilename;
            log.info("File stored successfully: {}", fullRelativePath);
            
            return fullRelativePath;
            
        } catch (IOException e) {
            log.error("Failed to store file: {}", uniqueFilename, e);
            throw new FileStorageException("Failed to store file: " + uniqueFilename, e);
        }
    }

    /**
     * Charge un fichier depuis le système de fichiers.
     * 
     * @param filepath Le chemin relatif du fichier
     * @return La ressource du fichier
     * @throws FileStorageException Si le fichier n'existe pas ou ne peut pas être lu
     */
    public Resource loadFileAsResource(String filepath) throws FileStorageException {
        try {
            Path filePath = this.storageLocation.resolve(filepath).normalize();
            
            // Vérification de sécurité : le fichier doit être dans le répertoire de stockage
            if (!filePath.startsWith(this.storageLocation)) {
                throw new FileStorageException("Cannot access file outside storage directory");
            }
            
            Resource resource = new FileSystemResource(filePath);
            
            if (!resource.exists() || !resource.isReadable()) {
                throw new FileStorageException("File not found or not readable: " + filepath);
            }
            
            log.debug("File loaded successfully: {}", filepath);
            return resource;
            
        } catch (FileStorageException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to load file: {}", filepath, e);
            throw new FileStorageException("Failed to load file: " + filepath, e);
        }
    }

    /**
     * Supprime un fichier du système de fichiers.
     * <p>
     * Gestion des erreurs silencieuse avec log warning si échec.
     * 
     * @param filepath Le chemin relatif du fichier à supprimer
     */
    public void deleteFile(String filepath) {
        try {
            Path filePath = this.storageLocation.resolve(filepath).normalize();
            
            // Vérification de sécurité
            if (!filePath.startsWith(this.storageLocation)) {
                log.warn("Attempt to delete file outside storage directory: {}", filepath);
                return;
            }
            
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("File deleted successfully: {}", filepath);
            } else {
                log.warn("File not found for deletion: {}", filepath);
            }
            
        } catch (IOException e) {
            log.warn("Failed to delete file: {}", filepath, e);
        }
    }

    /**
     * Détecte le type MIME d'un fichier uploadé.
     * 
     * @param file Le fichier uploadé
     * @return Le type MIME détecté
     */
    public String detectMimeType(MultipartFile file) {
        try {
            // Tentative de détection via Files.probeContentType()
            if (file.getOriginalFilename() != null) {
                Path tempPath = Paths.get(file.getOriginalFilename());
                String contentType = Files.probeContentType(tempPath);
                
                if (contentType != null && !contentType.isBlank()) {
                    return contentType;
                }
            }
            
            // Fallback sur le content type fourni par le client
            String clientContentType = file.getContentType();
            if (clientContentType != null && !clientContentType.isBlank()) {
                return clientContentType;
            }
            
        } catch (IOException e) {
            log.debug("Could not probe content type", e);
        }
        
        // Défaut
        return "application/octet-stream";
    }

    /**
     * Exception personnalisée pour les erreurs de stockage de fichiers.
     */
    public static class FileStorageException extends IOException {
        public FileStorageException(String message) {
            super(message);
        }

        public FileStorageException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
