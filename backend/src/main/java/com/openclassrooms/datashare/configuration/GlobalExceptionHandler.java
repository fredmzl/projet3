package com.openclassrooms.datashare.configuration;

import com.openclassrooms.datashare.exception.FileExpiredException;
import com.openclassrooms.datashare.exception.FileNotFoundException;
import com.openclassrooms.datashare.exception.InvalidPasswordException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Gestionnaire global des exceptions pour l'API REST.
 * <p>
 * Intercepte les exceptions et retourne des réponses HTTP appropriées avec des messages d'erreur structurés.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Gère les erreurs de validation (@Valid sur les DTO).
     * <p>
     * Retourne HTTP 400 Bad Request avec les détails des erreurs de validation.
     * 
     * @param ex Exception de validation Bean Validation
     * @return Map des champs en erreur avec leurs messages
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        log.warn("Validation failed: {}", errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }

    /**
     * Gère les erreurs de conversion de type des paramètres (ex: UUID invalide).
     * <p>
     * Retourne HTTP 400 Bad Request quand un paramètre ne peut pas être converti.
     * 
     * @param ex Exception de conversion de type
     * @return Message d'erreur
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, String>> handleTypeMismatchException(MethodArgumentTypeMismatchException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Invalid parameter");
        error.put("message", String.format("Le paramètre '%s' a une valeur invalide: %s", 
            ex.getName(), ex.getValue()));
        
        log.warn("Type mismatch for parameter '{}': {}", ex.getName(), ex.getValue());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * Gère les exceptions génériques non catchées ailleurs.
     * 
     * @param ex Exception générique
     * @return Message d'erreur générique
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGenericException(Exception ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "An unexpected error occurred");
        error.put("message", ex.getMessage());
        
        log.error("Unexpected error: ", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    /**
     * Gère les erreurs de fichier non trouvé (US01 - Download).
     * <p>
     * Retourne HTTP 404 Not Found quand un fichier est introuvable.
     * 
     * @param ex Exception FileNotFoundException
     * @return Message d'erreur
     */
    @ExceptionHandler(FileNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleFileNotFoundException(FileNotFoundException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Not Found");
        error.put("message", ex.getMessage());
        error.put("timestamp", LocalDateTime.now().toString());
        
        log.warn("File not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    /**
     * Gère les erreurs de fichier expiré (US01 - Download).
     * <p>
     * Retourne HTTP 410 Gone quand un fichier a expiré.
     * 
     * @param ex Exception FileExpiredException
     * @return Message d'erreur avec date d'expiration
     */
    @ExceptionHandler(FileExpiredException.class)
    public ResponseEntity<Map<String, String>> handleFileExpiredException(FileExpiredException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Gone");
        error.put("message", ex.getMessage());
        error.put("expirationDate", ex.getExpirationDate().toString());
        error.put("timestamp", LocalDateTime.now().toString());
        
        log.warn("File expired: {} (expired at {})", ex.getMessage(), ex.getExpirationDate());
        return ResponseEntity.status(HttpStatus.GONE).body(error);
    }

    /**
     * Gère les erreurs de mot de passe invalide (US01 - Download protégé).
     * <p>
     * Retourne HTTP 401 Unauthorized quand le mot de passe est incorrect ou manquant.
     * 
     * @param ex Exception InvalidPasswordException
     * @return Message d'erreur
     */
    @ExceptionHandler(InvalidPasswordException.class)
    public ResponseEntity<Map<String, String>> handleInvalidPasswordException(InvalidPasswordException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Unauthorized");
        error.put("message", ex.getMessage());
        error.put("timestamp", LocalDateTime.now().toString());
        
        log.warn("Invalid password attempt: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }
}
