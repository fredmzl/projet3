package com.openclassrooms.datashare.repository;

import com.openclassrooms.datashare.entities.File;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FileRepository extends JpaRepository<File, UUID> {
    Optional<File> findByDownloadToken(String token);
    List<File> findAllByUser_IdOrderByCreatedAtDesc(Long userId);
    Optional<File> findByIdAndUser_Id(UUID id, Long userId);
    
    /**
     * Trouve tous les fichiers d'un utilisateur avec pagination.
     * 
     * @param userId L'identifiant de l'utilisateur
     * @param pageable Les paramètres de pagination et tri
     * @return Une page de fichiers
     */
    Page<File> findAllByUser_Id(Long userId, Pageable pageable);
    
    /**
     * Trouve tous les fichiers non expirés d'un utilisateur avec pagination.
     * 
     * @param userId L'identifiant de l'utilisateur
     * @param now La date/heure actuelle pour comparaison
     * @param pageable Les paramètres de pagination et tri
     * @return Une page de fichiers non expirés
     */
    @Query("SELECT f FROM File f WHERE f.user.id = :userId AND f.expirationDate > :now")
    Page<File> findNonExpiredByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now, Pageable pageable);
}
