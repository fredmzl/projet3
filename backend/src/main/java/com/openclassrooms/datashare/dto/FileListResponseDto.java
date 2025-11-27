package com.openclassrooms.datashare.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO pour la réponse paginée de la liste des fichiers.
 * 
 * Contient :
 * - Liste des fichiers avec leurs métadonnées
 * - Informations de pagination (totalElements, totalPages, currentPage, pageSize)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FileListResponseDto {
    private List<FileMetadataDto> files;
    private Long totalElements;
    private Integer totalPages;
    private Integer currentPage;
    private Integer pageSize;
}
