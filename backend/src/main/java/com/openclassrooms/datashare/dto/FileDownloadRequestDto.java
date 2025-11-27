package com.openclassrooms.datashare.dto;

/**
 * DTO pour la requête de téléchargement (endpoint POST /api/download/{token})
 * Contient le mot de passe optionnel si le fichier est protégé
 */
public class FileDownloadRequestDto {
    
    private String password;
    
    public FileDownloadRequestDto() {
    }
    
    public FileDownloadRequestDto(String password) {
        this.password = password;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
