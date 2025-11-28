package com.openclassrooms.datashare.exception;

/**
 * Exception levée lorsqu'un utilisateur tente d'accéder à une ressource
 * qui ne lui appartient pas.
 * 
 * Retourne un HTTP 403 Forbidden.
 */
public class AccessDeniedException extends RuntimeException {
    
    public AccessDeniedException(String message) {
        super(message);
    }
    
    public AccessDeniedException(String message, Throwable cause) {
        super(message, cause);
    }
}
