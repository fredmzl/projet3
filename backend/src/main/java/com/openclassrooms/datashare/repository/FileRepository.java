package com.openclassrooms.datashare.repository;

import com.openclassrooms.datashare.entities.File;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FileRepository extends JpaRepository<File, UUID> {
    Optional<File> findByDownloadToken(String token);
    List<File> findAllByUser_IdOrderByCreatedAtDesc(Long userId);
    Optional<File> findByIdAndUser_Id(UUID id, Long userId);
}
