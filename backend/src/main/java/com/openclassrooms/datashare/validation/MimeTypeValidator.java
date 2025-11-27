package com.openclassrooms.datashare.validation;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;
import java.util.Set;

/**
 * Validateur de types MIME pour les fichiers uploadés.
 * <p>
 * Responsabilités :
 * - Bloquer les extensions et types MIME dangereux (blacklist)
 * - Autoriser tous les autres types de fichiers
 * - Détecter les tentatives de contournement
 * <p>
 * Configuration :
 * - Blacklist : exécutables, scripts, fichiers système dangereux
 * - Tout le reste est autorisé par défaut
 */
@Component
@Slf4j
public class MimeTypeValidator {

    // Blacklist des types MIME dangereux
    private static final List<String> BLOCKED_MIME_TYPES = Arrays.asList(
            // Exécutables Windows
            "application/x-msdownload",
            "application/x-msdos-program",
            "application/x-msi",
            "application/x-exe",
            "application/exe",
            "application/x-winexe",
            // Scripts et code exécutable
            "application/x-sh",
            "application/x-shellscript",
            "application/x-bat",
            "application/x-java-archive",
            "application/java-archive",
            // Fichiers système dangereux
            "application/x-deb",
            "application/x-rpm",
            "application/x-apple-diskimage"
    );

    // Blacklist des extensions dangereuses
    private static final Set<String> BLOCKED_EXTENSIONS = Set.of(
            // Exécutables Windows
            "exe", "bat", "cmd", "com", "pif", "application",
            "gadget", "msi", "msp", "scr", "dll",
            // Scripts
            "vbs", "vbe", "js", "jse", "ws", "wsf", "wsh",
            "ps1", "psm1", "sh", "bash",
            // Packages et archives exécutables
            "jar", "app", "deb", "rpm", "dmg", "pkg",
            // Autres formats dangereux
            "cpl", "inf", "ins", "isp", "lnk", "msc", "reg"
    );

    /**
     * Valide le type MIME d'un fichier uploadé.
     * 
     * @param file Le fichier à valider
     * @return true si le fichier est autorisé, false sinon
     */
    public boolean isValid(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            log.warn("Validation failed: file is null or empty");
            return false;
        }

        String filename = file.getOriginalFilename();
        String contentType = file.getContentType();

        // Vérification de l'extension
        if (filename != null && hasBlockedExtension(filename)) {
            log.warn("Blocked file extension detected: {}", filename);
            return false;
        }

        // Vérification du MIME type
        if (contentType == null || contentType.isBlank()) {
            log.warn("Missing content type for file: {}", filename);
            return false;
        }

        // Vérifier si le MIME type est dans la blacklist
        boolean isBlocked = BLOCKED_MIME_TYPES.stream()
                .anyMatch(blockedType -> contentType.equals(blockedType) || 
                         contentType.startsWith(blockedType + ";"));

        if (isBlocked) {
            log.warn("MIME type blocked: {} for file: {}", contentType, filename);
            return false;
        }

        // Si pas bloqué, le fichier est autorisé
        log.debug("MIME type allowed: {} for file: {}", contentType, filename);
        return true;
    }

    /**
     * Vérifie si le fichier a une extension bloquée.
     * 
     * @param filename Le nom du fichier
     * @return true si l'extension est bloquée, false sinon
     */
    private boolean hasBlockedExtension(String filename) {
        if (filename == null || filename.isBlank()) {
            return false;
        }

        String lowerFilename = filename.toLowerCase();
        int lastDotIndex = lowerFilename.lastIndexOf('.');
        
        if (lastDotIndex == -1 || lastDotIndex == lowerFilename.length() - 1) {
            return false; // Pas d'extension
        }

        String extension = lowerFilename.substring(lastDotIndex + 1);
        return BLOCKED_EXTENSIONS.contains(extension);
    }

    /**
     * Valide et lance une exception si le fichier n'est pas autorisé.
     * 
     * @param file Le fichier à valider
     * @throws InvalidMimeTypeException Si le type MIME n'est pas autorisé
     */
    public void validateOrThrow(MultipartFile file) {
        if (!isValid(file)) {
            String filename = file.getOriginalFilename();
            String contentType = file.getContentType();
            
            throw new InvalidMimeTypeException(
                String.format("File type not allowed: %s (MIME: %s)", filename, contentType)
            );
        }
    }

    /**
     * Exception levée quand un type MIME n'est pas autorisé.
     */
    public static class InvalidMimeTypeException extends RuntimeException {
        public InvalidMimeTypeException(String message) {
            super(message);
        }
    }
}
