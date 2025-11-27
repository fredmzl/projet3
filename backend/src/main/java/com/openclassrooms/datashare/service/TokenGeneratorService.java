package com.openclassrooms.datashare.service;

import com.openclassrooms.datashare.repository.FileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Service de génération de tokens uniques pour les liens de téléchargement.
 * <p>
 * Ce service découple la logique de génération de tokens du FileService,
 * facilitant les tests et permettant de centraliser la stratégie de génération.
 * <p>
 * Responsabilités :
 * - Génération de tokens aléatoires
 * - Vérification d'unicité des tokens en base de données
 * - Stratégie de retry en cas de collision
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class TokenGeneratorService {

    private final FileRepository fileRepository;
    
    private static final int MAX_RETRY_ATTEMPTS = 10;

    /**
     * Génère un token unique pour le téléchargement de fichiers.
     * <p>
     * Le token est généré via UUID.randomUUID() et vérifié pour son unicité
     * en base de données. En cas de collision (très rare), la génération est
     * retentée jusqu'à MAX_RETRY_ATTEMPTS fois.
     * 
     * @return Un token unique sous forme de String
     * @throws TokenGenerationException Si impossible de générer un token unique après MAX_RETRY_ATTEMPTS
     */
    public String generateUniqueToken() {
        int attempt = 0;
        
        while (attempt < MAX_RETRY_ATTEMPTS) {
            String token = UUID.randomUUID().toString();
            attempt++;
            
            if (isTokenUnique(token)) {
                log.debug("Generated unique token in {} attempt(s)", attempt);
                return token;
            }
            
            log.warn("Token collision detected on attempt {}/{}", attempt, MAX_RETRY_ATTEMPTS);
        }
        
        log.error("Failed to generate unique token after {} attempts", MAX_RETRY_ATTEMPTS);
        throw new TokenGenerationException(
            String.format("Could not generate unique token after %d attempts", MAX_RETRY_ATTEMPTS)
        );
    }

    /**
     * Vérifie si un token est unique dans la base de données.
     * 
     * @param token Le token à vérifier
     * @return true si le token n'existe pas en base, false sinon
     */
    public boolean isTokenUnique(String token) {
        return fileRepository.findByDownloadToken(token).isEmpty();
    }

    /**
     * Exception levée quand la génération d'un token unique échoue.
     */
    public static class TokenGenerationException extends RuntimeException {
        public TokenGenerationException(String message) {
            super(message);
        }
    }
}
