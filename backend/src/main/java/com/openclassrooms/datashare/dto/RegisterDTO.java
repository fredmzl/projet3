package com.openclassrooms.datashare.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterDTO {
    @NotBlank
    @Email
    private String login;
    @NotBlank
    @Size(min = 8, message = "Password must be at least 8 characters long")
    private String password;

}
