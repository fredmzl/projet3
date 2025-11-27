package com.openclassrooms.datashare.exception;

/**
 * Exception levée lorsqu'un mot de passe est incorrect ou manquant
 */
public class InvalidPasswordException extends RuntimeException {
    
    public InvalidPasswordException(String message) {
        super(message);
    }
}
