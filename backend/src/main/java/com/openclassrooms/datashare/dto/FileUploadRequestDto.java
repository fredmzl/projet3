package com.openclassrooms.datashare.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FileUploadRequestDto {
    
    @Min(value = 1, message = "La durée d'expiration doit être au minimum de 1 jour")
    @Max(value = 7, message = "La durée d'expiration doit être au maximum de 7 jours")
    private Integer expirationDays = 7; // Défaut 7 jours

    @Size(min = 4, message = "Le mot de passe doit contenir au moins 4 caractères")
    private String password; // Optionnel
}
