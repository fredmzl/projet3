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
 * - Vérifier que le type MIME est autorisé (whitelist)
 * - Bloquer les extensions dangereuses (blacklist)
 * - Détecter les tentatives de contournement
 * <p>
 * Configuration :
 * - Whitelist : images, documents, archives
 * - Blacklist : exécutables, scripts shell
 */
@Component
@Slf4j
public class MimeTypeValidator {

    // Whitelist des types MIME autorisés
    private static final List<String> ALLOWED_MIME_TYPES = Arrays.asList(
            // Images
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/bmp",
            "image/webp",
            "image/svg+xml",
            // Documents
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
            "text/plain",
            "text/csv",
            "text/html",
            "text/css",
            "text/javascript",
            "text/markdown",
            // Archives
            "application/zip",
            "application/x-zip-compressed",
            "application/x-rar-compressed",
            "application/x-7z-compressed",
            "application/gzip",
            "application/x-tar"
    );

    // Blacklist des extensions dangereuses
    private static final Set<String> BLOCKED_EXTENSIONS = Set.of(
            "exe", "bat", "sh", "cmd", "com", "pif", "application",
            "gadget", "msi", "msp", "scr", "vbs", "js", "jar",
            "app", "deb", "rpm"
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

        boolean isAllowed = ALLOWED_MIME_TYPES.stream()
                .anyMatch(allowedType -> {
                    // Support pour les wildcards (e.g., image/*)
                    if (allowedType.endsWith("/*")) {
                        String prefix = allowedType.substring(0, allowedType.length() - 2);
                        return contentType.startsWith(prefix + "/");
                    }
                    return contentType.equals(allowedType);
                });

        if (!isAllowed) {
            log.warn("MIME type not allowed: {} for file: {}", contentType, filename);
        }

        return isAllowed;
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
