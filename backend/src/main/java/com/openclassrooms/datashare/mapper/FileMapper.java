package com.openclassrooms.datashare.mapper;

import com.openclassrooms.datashare.dto.FileMetadataDto;
import com.openclassrooms.datashare.dto.FileUploadResponseDto;
import com.openclassrooms.datashare.entities.File;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.time.LocalDateTime;

@Mapper(componentModel = "spring")
public interface FileMapper {
    
    @Mapping(target = "hasPassword", expression = "java(file.getPasswordHash() != null)")
    @Mapping(target = "downloadUrl", ignore = true)
    FileUploadResponseDto toUploadResponse(File file);
    
    @Mapping(target = "hasPassword", expression = "java(file.getPasswordHash() != null)")
    @Mapping(target = "downloadUrl", ignore = true)
    @Mapping(target = "isExpired", ignore = true)
    FileMetadataDto toMetadataDto(File file);
    
    @AfterMapping
    default void calculateIsExpired(@MappingTarget FileMetadataDto dto, File file) {
        dto.setIsExpired(file.getExpirationDate().isBefore(LocalDateTime.now()));
    }
}
