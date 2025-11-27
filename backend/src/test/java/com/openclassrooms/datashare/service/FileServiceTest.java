package com.openclassrooms.datashare.service;

import com.openclassrooms.datashare.dto.FileUploadRequestDto;
import com.openclassrooms.datashare.dto.FileUploadResponseDto;
import com.openclassrooms.datashare.entities.File;
import com.openclassrooms.datashare.entities.User;
import com.openclassrooms.datashare.mapper.FileMapper;
import com.openclassrooms.datashare.repository.FileRepository;
import com.openclassrooms.datashare.validation.MimeTypeValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitaires pour FileService.
 * <p>
 * Tests couverts :
 * - Upload avec données valides
 * - Upload avec/sans mot de passe
 * - Validation des expirations (défaut et custom)
 * - Génération de tokens uniques
 * - Gestion des erreurs (fichier vide, trop gros, expiration invalide)
 * - Calcul de date d'expiration
 */
@ExtendWith(MockitoExtension.class)
class FileServiceTest {

    @Mock
    private FileRepository fileRepository;
    
    @Mock
    private FileStorageService storageService;
    
    @Mock
    private PasswordEncoder passwordEncoder;
    
    @Mock
    private FileMapper fileMapper;
    
    @Mock
    private TokenGeneratorService tokenGeneratorService;
    
    @Mock
    private MimeTypeValidator mimeTypeValidator;
    
    @InjectMocks
    private FileService fileService;

    private User testUser;
    private MockMultipartFile testFile;
    private FileUploadRequestDto testRequest;

    @BeforeEach
    void setUp() {
        // Initialiser les @Value via ReflectionTestUtils
        ReflectionTestUtils.setField(fileService, "maxFileSize", 1073741824L); // 1 GB
        ReflectionTestUtils.setField(fileService, "downloadBaseUrl", "http://localhost:3000/api/files/download");

        // Créer un utilisateur test
        testUser = new User();
        testUser.setId(1L);
        testUser.setLogin("testuser");

        // Créer un fichier test (10 KB)
        testFile = new MockMultipartFile(
                "file",
                "test.pdf",
                "application/pdf",
                "test content".getBytes()
        );

        // Créer une requête test
        testRequest = new FileUploadRequestDto();
        testRequest.setExpirationDays(7);
    }

    @Test
    void uploadFile_WithValidData_ReturnsDto() throws IOException {
        // Given
        String token = "test-token-123";
        String filepath = "1/2025/11/17/uuid_test.pdf";
        File savedFile = createMockFile(token, filepath, null);
        FileUploadResponseDto expectedDto = createMockResponseDto(savedFile);

        when(tokenGeneratorService.generateUniqueToken()).thenReturn(token);
        when(storageService.detectMimeType(testFile)).thenReturn("application/pdf");
        doNothing().when(mimeTypeValidator).validateOrThrow(testFile);
        when(storageService.storeFile(testFile, testUser.getId())).thenReturn(filepath);
        when(fileRepository.save(any(File.class))).thenReturn(savedFile);
        when(fileMapper.toUploadResponse(savedFile)).thenReturn(expectedDto);

        // When
        FileUploadResponseDto result = fileService.uploadFile(testFile, testRequest, testUser);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getDownloadUrl()).isEqualTo("http://localhost:3000/api/files/download/test-token-123");
        verify(fileRepository).save(any(File.class));
        verify(storageService).storeFile(testFile, testUser.getId());
    }

    @Test
    void uploadFile_WithPassword_HashesPassword() throws IOException {
        // Given
        testRequest.setPassword("mypassword");
        String token = "test-token";
        String filepath = "1/2025/11/17/uuid_test.pdf";
        String hashedPassword = "$2a$10$hashedpassword";

        when(tokenGeneratorService.generateUniqueToken()).thenReturn(token);
        when(storageService.detectMimeType(testFile)).thenReturn("application/pdf");
        doNothing().when(mimeTypeValidator).validateOrThrow(testFile);
        when(passwordEncoder.encode("mypassword")).thenReturn(hashedPassword);
        when(storageService.storeFile(testFile, testUser.getId())).thenReturn(filepath);
        when(fileRepository.save(any(File.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(fileMapper.toUploadResponse(any(File.class))).thenReturn(new FileUploadResponseDto());

        // When
        fileService.uploadFile(testFile, testRequest, testUser);

        // Then
        verify(passwordEncoder).encode("mypassword");
        verify(fileRepository).save(argThat(file -> 
            file.getPasswordHash() != null && file.getPasswordHash().equals(hashedPassword)
        ));
    }

    @Test
    void uploadFile_WithoutPassword_PasswordIsNull() throws IOException {
        // Given
        testRequest.setPassword(null);
        String token = "test-token";
        String filepath = "1/2025/11/17/uuid_test.pdf";

        when(tokenGeneratorService.generateUniqueToken()).thenReturn(token);
        when(storageService.detectMimeType(testFile)).thenReturn("application/pdf");
        doNothing().when(mimeTypeValidator).validateOrThrow(testFile);
        when(storageService.storeFile(testFile, testUser.getId())).thenReturn(filepath);
        when(fileRepository.save(any(File.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(fileMapper.toUploadResponse(any(File.class))).thenReturn(new FileUploadResponseDto());

        // When
        fileService.uploadFile(testFile, testRequest, testUser);

        // Then
        verify(passwordEncoder, never()).encode(anyString());
        verify(fileRepository).save(argThat(file -> file.getPasswordHash() == null));
    }

    @Test
    void uploadFile_DefaultExpiration_Is7Days() throws IOException {
        // Given
        testRequest.setExpirationDays(null); // Test du défaut
        String token = "test-token";
        String filepath = "1/2025/11/17/uuid_test.pdf";

        when(tokenGeneratorService.generateUniqueToken()).thenReturn(token);
        when(storageService.detectMimeType(testFile)).thenReturn("application/pdf");
        doNothing().when(mimeTypeValidator).validateOrThrow(testFile);
        when(storageService.storeFile(testFile, testUser.getId())).thenReturn(filepath);
        when(fileRepository.save(any(File.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(fileMapper.toUploadResponse(any(File.class))).thenReturn(new FileUploadResponseDto());

        // When
        fileService.uploadFile(testFile, testRequest, testUser);

        // Then
        verify(fileRepository).save(argThat(file -> {
            LocalDateTime expected = LocalDateTime.now().plusDays(7);
            return file.getExpirationDate().isAfter(expected.minusSeconds(5)) &&
                   file.getExpirationDate().isBefore(expected.plusSeconds(5));
        }));
    }

    @Test
    void uploadFile_CustomExpiration_CalculatesCorrectly() throws IOException {
        // Given
        testRequest.setExpirationDays(3);
        String token = "test-token";
        String filepath = "1/2025/11/17/uuid_test.pdf";

        when(tokenGeneratorService.generateUniqueToken()).thenReturn(token);
        when(storageService.detectMimeType(testFile)).thenReturn("application/pdf");
        doNothing().when(mimeTypeValidator).validateOrThrow(testFile);
        when(storageService.storeFile(testFile, testUser.getId())).thenReturn(filepath);
        when(fileRepository.save(any(File.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(fileMapper.toUploadResponse(any(File.class))).thenReturn(new FileUploadResponseDto());

        // When
        fileService.uploadFile(testFile, testRequest, testUser);

        // Then
        verify(fileRepository).save(argThat(file -> {
            LocalDateTime expected = LocalDateTime.now().plusDays(3);
            return file.getExpirationDate().isAfter(expected.minusSeconds(5)) &&
                   file.getExpirationDate().isBefore(expected.plusSeconds(5));
        }));
    }

    @Test
    void uploadFile_FileSizeExceeds1GB_ThrowsException() {
        // Given
        MockMultipartFile largeFile = new MockMultipartFile(
                "file",
                "large.pdf",
                "application/pdf",
                new byte[1] // Simuler un fichier qui dépasse la limite
        );
        // Simuler une taille > 1GB via spy
        MultipartFile largeFileSpy = spy(largeFile);
        when(largeFileSpy.getSize()).thenReturn(1073741825L); // 1 GB + 1 byte

        // When/Then
        assertThatThrownBy(() -> fileService.uploadFile(largeFileSpy, testRequest, testUser))
                .isInstanceOf(FileService.FileSizeExceededException.class)
                .hasMessageContaining("exceeds maximum allowed size");
    }

    @Test
    void uploadFile_EmptyFile_ThrowsException() {
        // Given
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file",
                "empty.pdf",
                "application/pdf",
                new byte[0]
        );

        // When/Then
        assertThatThrownBy(() -> fileService.uploadFile(emptyFile, testRequest, testUser))
                .isInstanceOf(FileService.EmptyFileException.class)
                .hasMessageContaining("empty file");
    }

    @Test
    void uploadFile_InvalidExpirationDays_ThrowsException() {
        // Given
        testRequest.setExpirationDays(10); // > 7 jours

        // When/Then
        assertThatThrownBy(() -> fileService.uploadFile(testFile, testRequest, testUser))
                .isInstanceOf(FileService.InvalidExpirationException.class)
                .hasMessageContaining("between 1 and 7");
    }

    @Test
    void calculateExpirationDate_WithDays_ReturnsCorrectDate() {
        // Given
        int days = 5;
        LocalDateTime before = LocalDateTime.now().plusDays(days);

        // When
        LocalDateTime result = fileService.calculateExpirationDate(days);

        // Then
        LocalDateTime after = LocalDateTime.now().plusDays(days);
        assertThat(result).isAfter(before.minusSeconds(1));
        assertThat(result).isBefore(after.plusSeconds(1));
    }

    @Test
    void deleteFile_WithValidOwner_DeletesSuccessfully() {
        // Given
        UUID fileId = UUID.randomUUID();
        String filepath = "1/2025/11/18/uuid_test.pdf";
        File file = createMockFile("token", filepath, null);
        file.setId(fileId);

        when(fileRepository.findByIdAndUser_Id(fileId, testUser.getId()))
                .thenReturn(Optional.of(file));
        doNothing().when(storageService).deleteFile(filepath);

        // When
        fileService.deleteFile(fileId, testUser);

        // Then
        verify(fileRepository).findByIdAndUser_Id(fileId, testUser.getId());
        verify(storageService).deleteFile(filepath);
        verify(fileRepository).delete(file);
    }

    @Test
    void deleteFile_FileNotFound_ThrowsFileNotFoundException() {
        // Given
        UUID fileId = UUID.randomUUID();

        when(fileRepository.findByIdAndUser_Id(fileId, testUser.getId()))
                .thenReturn(Optional.empty());
        when(fileRepository.findById(fileId)).thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> fileService.deleteFile(fileId, testUser))
                .isInstanceOf(FileService.FileNotFoundException.class)
                .hasMessageContaining("File not found");

        verify(fileRepository).findByIdAndUser_Id(fileId, testUser.getId());
        verify(fileRepository).findById(fileId);
        verify(storageService, never()).deleteFile(anyString());
        verify(fileRepository, never()).delete(any());
    }

    @Test
    void deleteFile_UserNotOwner_ThrowsForbiddenFileAccessException() {
        // Given
        UUID fileId = UUID.randomUUID();
        File file = createMockFile("token", "2/2025/11/18/uuid_test.pdf", null);
        User otherUser = new User();
        otherUser.setId(2L);
        file.setUser(otherUser);

        when(fileRepository.findByIdAndUser_Id(fileId, testUser.getId()))
                .thenReturn(Optional.empty());
        when(fileRepository.findById(fileId)).thenReturn(Optional.of(file));

        // When/Then
        assertThatThrownBy(() -> fileService.deleteFile(fileId, testUser))
                .isInstanceOf(FileService.ForbiddenFileAccessException.class)
                .hasMessageContaining("not authorized");

        verify(fileRepository).findByIdAndUser_Id(fileId, testUser.getId());
        verify(fileRepository).findById(fileId);
        verify(storageService, never()).deleteFile(anyString());
        verify(fileRepository, never()).delete(any());
    }

    @Test
    void deleteFile_WithExpiredFile_DeletesSuccessfully() {
        // Given
        UUID fileId = UUID.randomUUID();
        String filepath = "1/2025/11/18/uuid_test.pdf";
        File file = createMockFile("token", filepath, null);
        file.setId(fileId);
        file.setExpirationDate(LocalDateTime.now().minusDays(1)); // Fichier expiré

        when(fileRepository.findByIdAndUser_Id(fileId, testUser.getId()))
                .thenReturn(Optional.of(file));
        doNothing().when(storageService).deleteFile(filepath);

        // When
        fileService.deleteFile(fileId, testUser);

        // Then
        verify(fileRepository).delete(file);
        verify(storageService).deleteFile(filepath);
    }

    @Test
    void deleteFile_WithPasswordProtectedFile_DeletesWithoutPasswordCheck() {
        // Given
        UUID fileId = UUID.randomUUID();
        String filepath = "1/2025/11/18/uuid_test.pdf";
        File file = createMockFile("token", filepath, "$2a$10$hashedpassword");
        file.setId(fileId);

        when(fileRepository.findByIdAndUser_Id(fileId, testUser.getId()))
                .thenReturn(Optional.of(file));
        doNothing().when(storageService).deleteFile(filepath);

        // When
        fileService.deleteFile(fileId, testUser);

        // Then
        verify(fileRepository).delete(file);
        verify(storageService).deleteFile(filepath);
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    // Helper methods
    private File createMockFile(String token, String filepath, String passwordHash) {
        File file = new File();
        file.setId(UUID.randomUUID());
        file.setUser(testUser);
        file.setFilename("test.pdf");
        file.setOriginalFilename("test.pdf");
        file.setFilepath(filepath);
        file.setFileSize(testFile.getSize());
        file.setMimeType("application/pdf");
        file.setDownloadToken(token);
        file.setPasswordHash(passwordHash);
        file.setExpirationDate(LocalDateTime.now().plusDays(7));
        file.setCreatedAt(LocalDateTime.now());
        return file;
    }

    private FileUploadResponseDto createMockResponseDto(File file) {
        FileUploadResponseDto dto = new FileUploadResponseDto();
        dto.setId(file.getId());
        dto.setFilename(file.getFilename());
        dto.setFileSize(file.getFileSize());
        dto.setDownloadToken(file.getDownloadToken());
        dto.setExpirationDate(file.getExpirationDate());
        dto.setHasPassword(file.getPasswordHash() != null);
        dto.setCreatedAt(file.getCreatedAt());
        return dto;
    }
}
