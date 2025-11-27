package com.openclassrooms.datashare.service;

import com.openclassrooms.datashare.dto.FileDownloadRequestDto;
import com.openclassrooms.datashare.dto.FileInfoResponseDto;
import com.openclassrooms.datashare.entities.File;
import com.openclassrooms.datashare.exception.FileExpiredException;
import com.openclassrooms.datashare.exception.FileNotFoundException;
import com.openclassrooms.datashare.exception.InvalidPasswordException;
import com.openclassrooms.datashare.repository.FileRepository;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;

/**
 * Service pour gérer les téléchargements publics de fichiers
 * Endpoints non authentifiés accessibles via download token
 */
@Slf4j
@Service
public class DownloadService {

    private final Path storageLocation;

    @Autowired
    private FileRepository fileRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public DownloadService(@Value("${app.storage.path}") String storagePath) {
        this.storageLocation = Paths.get(storagePath).toAbsolutePath().normalize();
    }

    /**
     * Récupère les informations publiques d'un fichier
     * 
     * @param token Token de téléchargement unique
     * @return DTO avec les métadonnées du fichier
     * @throws FileNotFoundException Si le fichier n'existe pas
     * @throws FileExpiredException Si le fichier a expiré
     */
    public FileInfoResponseDto getFileInfo(String token) {
        // 1. Récupérer le fichier par token
        File file = fileRepository.findByDownloadToken(token)
                .orElseThrow(() -> new FileNotFoundException("Lien de téléchargement invalide ou fichier non trouvé"));

        // 2. Vérifier l'expiration
        boolean isExpired = file.getExpirationDate().isBefore(LocalDateTime.now());
        
        if (isExpired) {
            throw new FileExpiredException("Ce fichier a expiré et n'est plus disponible", file.getExpirationDate());
        }

        // 3. Construire la réponse
        FileInfoResponseDto response = new FileInfoResponseDto(
                file.getOriginalFilename(),
                file.getFileSize(),
                file.getMimeType(),
                file.getExpirationDate(),
                isExpired,
                file.getPasswordHash() != null
        );

        // 4. Ajouter message si protégé par mot de passe
        if (response.getHasPassword()) {
            response.setMessage("Ce fichier est protégé par mot de passe");
        }

        return response;
    }

    /**
     * Télécharge un fichier avec vérification optionnelle du mot de passe
     * 
     * @param token Token de téléchargement
     * @param requestDto DTO contenant le mot de passe optionnel
     * @return Resource Spring pointant vers le fichier
     * @throws FileNotFoundException Si le fichier n'existe pas
     * @throws FileExpiredException Si le fichier a expiré
     * @throws InvalidPasswordException Si le mot de passe est incorrect ou manquant
     */
    public Resource downloadFile(String token, FileDownloadRequestDto requestDto) {
        log.info("Tentative de téléchargement du fichier avec token: {}", token);
        
        // 1. Récupérer le fichier
        File file = fileRepository.findByDownloadToken(token)
                .orElseThrow(() -> {
                    log.warn("Fichier non trouvé pour le token: {}", token);
                    return new FileNotFoundException("Lien de téléchargement invalide");
                });

        log.debug("Fichier trouvé: {} (ID: {}, Taille: {} octets)", 
                file.getOriginalFilename(), file.getId(), file.getFileSize());

        // 2. Vérifier l'expiration
        if (file.getExpirationDate().isBefore(LocalDateTime.now())) {
            log.warn("Tentative de téléchargement d'un fichier expiré: {} (expiré le: {})", 
                    file.getOriginalFilename(), file.getExpirationDate());
            throw new FileExpiredException("Ce fichier a expiré et n'est plus disponible", file.getExpirationDate());
        }

        // 3. Vérifier le mot de passe si nécessaire
        if (file.getPasswordHash() != null) {
            log.debug("Fichier protégé par mot de passe: {}", file.getOriginalFilename());
            
            if (requestDto == null || requestDto.getPassword() == null || requestDto.getPassword().isEmpty()) {
                log.warn("Tentative de téléchargement sans mot de passe pour le fichier: {}", file.getOriginalFilename());
                throw new InvalidPasswordException("Ce fichier est protégé par mot de passe");
            }

            if (!passwordEncoder.matches(requestDto.getPassword(), file.getPasswordHash())) {
                log.warn("Mot de passe incorrect pour le fichier: {}", file.getOriginalFilename());
                throw new InvalidPasswordException("Mot de passe incorrect");
            }
            
            log.debug("Mot de passe validé avec succès pour le fichier: {}", file.getOriginalFilename());
        }

        // 4. Charger le fichier depuis le système de fichiers
        try {
            Path filePath = storageLocation.resolve(file.getFilepath()).normalize();
            log.debug("Chargement du fichier depuis: {}", filePath.toAbsolutePath());
            
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                log.error("Fichier physique introuvable ou illisible: {}", filePath.toAbsolutePath());
                throw new FileNotFoundException("Le fichier physique est introuvable ou illisible");
            }

            log.info("Téléchargement réussi du fichier: {} (ID: {}, Taille: {} octets)", 
                    file.getOriginalFilename(), file.getId(), file.getFileSize());
            
            return resource;
        } catch (IOException e) {
            log.error("Erreur IOException lors du chargement du fichier: {} - {}", 
                    file.getOriginalFilename(), e.getMessage(), e);
            throw new FileNotFoundException("Erreur lors de la lecture du fichier: " + e.getMessage());
        }
    }

    /**
     * Récupère un fichier par son token (utile pour obtenir les métadonnées)
     * 
     * @param token Token de téléchargement
     * @return Entity File
     * @throws FileNotFoundException Si le fichier n'existe pas
     */
    public File getFileByToken(String token) {
        return fileRepository.findByDownloadToken(token)
                .orElseThrow(() -> new FileNotFoundException("Fichier non trouvé"));
    }
}
