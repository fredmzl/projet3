package com.openclassrooms.datashare.exception;

import java.time.LocalDateTime;

/**
 * Exception levée lorsqu'un fichier a expiré
 */
public class FileExpiredException extends RuntimeException {
    
    private final LocalDateTime expirationDate;

    public FileExpiredException(String message, LocalDateTime expirationDate) {
        super(message);
        this.expirationDate = expirationDate;
    }

    public LocalDateTime getExpirationDate() {
        return expirationDate;
    }
}
