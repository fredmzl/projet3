package com.openclassrooms.datashare.dto;

import java.time.LocalDateTime;

/**
 * DTO pour les informations publiques d'un fichier (endpoint GET /api/download/{token})
 * Utilisé pour afficher les détails avant téléchargement
 */
public class FileInfoResponseDto {
    
    private String originalFilename;
    private Long fileSize;
    private String mimeType;
    private LocalDateTime expirationDate;
    private Boolean isExpired;
    private Boolean hasPassword;
    private String message;  // Message optionnel (ex: "Ce fichier est protégé par mot de passe")
    
    public FileInfoResponseDto() {
    }
    
    public FileInfoResponseDto(String originalFilename, Long fileSize, String mimeType, 
                              LocalDateTime expirationDate, Boolean isExpired, Boolean hasPassword) {
        this.originalFilename = originalFilename;
        this.fileSize = fileSize;
        this.mimeType = mimeType;
        this.expirationDate = expirationDate;
        this.isExpired = isExpired;
        this.hasPassword = hasPassword;
    }

    // Getters and Setters
    
    public String getOriginalFilename() {
        return originalFilename;
    }

    public void setOriginalFilename(String originalFilename) {
        this.originalFilename = originalFilename;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public LocalDateTime getExpirationDate() {
        return expirationDate;
    }

    public void setExpirationDate(LocalDateTime expirationDate) {
        this.expirationDate = expirationDate;
    }

    public Boolean getIsExpired() {
        return isExpired;
    }

    public void setIsExpired(Boolean isExpired) {
        this.isExpired = isExpired;
    }

    public Boolean getHasPassword() {
        return hasPassword;
    }

    public void setHasPassword(Boolean hasPassword) {
        this.hasPassword = hasPassword;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
