package com.openclassrooms.datashare.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FileUploadResponseDto {
    private UUID id;
    private String filename;
    private Long fileSize;
    private String mimeType;
    private String downloadToken;
    private String downloadUrl;
    private LocalDateTime expirationDate;
    private Boolean hasPassword;
    private LocalDateTime createdAt;
}
