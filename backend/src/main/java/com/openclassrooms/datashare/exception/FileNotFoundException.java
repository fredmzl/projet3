package com.openclassrooms.datashare.exception;

/**
 * Exception levée lorsqu'un fichier est introuvable
 */
public class FileNotFoundException extends RuntimeException {
    
    public FileNotFoundException(String message) {
        super(message);
    }
}
