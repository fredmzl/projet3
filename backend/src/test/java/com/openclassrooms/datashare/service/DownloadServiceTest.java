package com.openclassrooms.datashare.service;

import com.openclassrooms.datashare.dto.FileDownloadRequestDto;
import com.openclassrooms.datashare.dto.FileInfoResponseDto;
import com.openclassrooms.datashare.entities.File;
import com.openclassrooms.datashare.entities.User;
import com.openclassrooms.datashare.exception.FileExpiredException;
import com.openclassrooms.datashare.exception.FileNotFoundException;
import com.openclassrooms.datashare.exception.InvalidPasswordException;
import com.openclassrooms.datashare.repository.FileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * Tests unitaires pour DownloadService
 * US01 - Téléchargement via lien
 */
@ExtendWith(MockitoExtension.class)
class DownloadServiceTest {

    @Mock
    private FileRepository fileRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private DownloadService downloadService;

    @TempDir
    Path tempDir;

    private File testFile;
    private User testUser;
    private String validToken;
    private Path testFilePath;

    @BeforeEach
    void setUp() throws IOException {
        validToken = "3326f92e-76a6-4e6d-8687-4d80f088045a";
        
        // Créer un utilisateur de test
        testUser = new User();
        testUser.setId(1L);
        testUser.setLogin("test@example.com");
        
        // Créer un fichier physique de test
        testFilePath = tempDir.resolve("test-file.txt");
        Files.writeString(testFilePath, "Test file content");
        
        // Créer une entité File de test
        testFile = new File();
        testFile.setId(UUID.randomUUID());
        testFile.setOriginalFilename("test-file.txt");
        testFile.setFilename("test-file.txt");
        testFile.setFilepath(testFilePath.toString());
        testFile.setFileSize(18L);
        testFile.setMimeType("text/plain");
        testFile.setDownloadToken(validToken);
        testFile.setExpirationDate(LocalDateTime.now().plusDays(7));
        testFile.setUser(testUser);
        testFile.setCreatedAt(LocalDateTime.now());
        testFile.setUpdatedAt(LocalDateTime.now());
    }

    // ==================== Tests getFileInfo() ====================

    @Test
    void getFileInfo_WithValidToken_ShouldReturnFileInfo() {
        // Given
        when(fileRepository.findByDownloadToken(validToken)).thenReturn(Optional.of(testFile));

        // When
        FileInfoResponseDto result = downloadService.getFileInfo(validToken);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getOriginalFilename()).isEqualTo("test-file.txt");
        assertThat(result.getFileSize()).isEqualTo(18L);
        assertThat(result.getMimeType()).isEqualTo("text/plain");
        assertThat(result.getIsExpired()).isFalse();
        assertThat(result.getHasPassword()).isFalse();
        assertThat(result.getMessage()).isNull();
    }

    @Test
    void getFileInfo_WithPasswordProtectedFile_ShouldIncludeMessage() {
        // Given
        testFile.setPasswordHash("$2a$10$hashed_password");
        when(fileRepository.findByDownloadToken(validToken)).thenReturn(Optional.of(testFile));

        // When
        FileInfoResponseDto result = downloadService.getFileInfo(validToken);

        // Then
        assertThat(result.getHasPassword()).isTrue();
        assertThat(result.getMessage()).isEqualTo("Ce fichier est protégé par mot de passe");
    }

    @Test
    void getFileInfo_WithInvalidToken_ShouldThrowFileNotFoundException() {
        // Given
        when(fileRepository.findByDownloadToken("invalid-token")).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> downloadService.getFileInfo("invalid-token"))
                .isInstanceOf(FileNotFoundException.class)
                .hasMessage("Lien de téléchargement invalide ou fichier non trouvé");
    }

    @Test
    void getFileInfo_WithExpiredFile_ShouldThrowFileExpiredException() {
        // Given
        testFile.setExpirationDate(LocalDateTime.now().minusDays(1));
        when(fileRepository.findByDownloadToken(validToken)).thenReturn(Optional.of(testFile));

        // When & Then
        assertThatThrownBy(() -> downloadService.getFileInfo(validToken))
                .isInstanceOf(FileExpiredException.class)
                .hasMessage("Ce fichier a expiré et n'est plus disponible");
    }

    // ==================== Tests downloadFile() ====================

    @Test
    void downloadFile_WithoutPassword_ShouldReturnResource() {
        // Given
        when(fileRepository.findByDownloadToken(validToken)).thenReturn(Optional.of(testFile));

        // When
        Resource result = downloadService.downloadFile(validToken, null);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.exists()).isTrue();
        assertThat(result.isReadable()).isTrue();
    }

    @Test
    void downloadFile_WithCorrectPassword_ShouldReturnResource() {
        // Given
        testFile.setPasswordHash("$2a$10$hashed_password");
        when(fileRepository.findByDownloadToken(validToken)).thenReturn(Optional.of(testFile));
        when(passwordEncoder.matches("correct-password", "$2a$10$hashed_password")).thenReturn(true);
        
        FileDownloadRequestDto requestDto = new FileDownloadRequestDto("correct-password");

        // When
        Resource result = downloadService.downloadFile(validToken, requestDto);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.exists()).isTrue();
    }

    @Test
    void downloadFile_WithIncorrectPassword_ShouldThrowInvalidPasswordException() {
        // Given
        testFile.setPasswordHash("$2a$10$hashed_password");
        when(fileRepository.findByDownloadToken(validToken)).thenReturn(Optional.of(testFile));
        when(passwordEncoder.matches("wrong-password", "$2a$10$hashed_password")).thenReturn(false);
        
        FileDownloadRequestDto requestDto = new FileDownloadRequestDto("wrong-password");

        // When & Then
        assertThatThrownBy(() -> downloadService.downloadFile(validToken, requestDto))
                .isInstanceOf(InvalidPasswordException.class)
                .hasMessage("Mot de passe incorrect");
    }

    @Test
    void downloadFile_WithMissingPassword_ShouldThrowInvalidPasswordException() {
        // Given
        testFile.setPasswordHash("$2a$10$hashed_password");
        when(fileRepository.findByDownloadToken(validToken)).thenReturn(Optional.of(testFile));

        // When & Then
        assertThatThrownBy(() -> downloadService.downloadFile(validToken, null))
                .isInstanceOf(InvalidPasswordException.class)
                .hasMessage("Ce fichier est protégé par mot de passe");
    }

    @Test
    void downloadFile_WithEmptyPassword_ShouldThrowInvalidPasswordException() {
        // Given
        testFile.setPasswordHash("$2a$10$hashed_password");
        when(fileRepository.findByDownloadToken(validToken)).thenReturn(Optional.of(testFile));
        
        FileDownloadRequestDto requestDto = new FileDownloadRequestDto("");

        // When & Then
        assertThatThrownBy(() -> downloadService.downloadFile(validToken, requestDto))
                .isInstanceOf(InvalidPasswordException.class)
                .hasMessage("Ce fichier est protégé par mot de passe");
    }

    @Test
    void downloadFile_WithExpiredFile_ShouldThrowFileExpiredException() {
        // Given
        testFile.setExpirationDate(LocalDateTime.now().minusHours(1));
        when(fileRepository.findByDownloadToken(validToken)).thenReturn(Optional.of(testFile));

        // When & Then
        assertThatThrownBy(() -> downloadService.downloadFile(validToken, null))
                .isInstanceOf(FileExpiredException.class)
                .hasMessage("Ce fichier a expiré et n'est plus disponible");
    }

    @Test
    void downloadFile_WithInvalidToken_ShouldThrowFileNotFoundException() {
        // Given
        when(fileRepository.findByDownloadToken("invalid-token")).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> downloadService.downloadFile("invalid-token", null))
                .isInstanceOf(FileNotFoundException.class)
                .hasMessage("Lien de téléchargement invalide");
    }

    @Test
    void downloadFile_WithNonExistentPhysicalFile_ShouldThrowFileNotFoundException() {
        // Given
        testFile.setFilepath("/non/existent/path/file.txt");
        when(fileRepository.findByDownloadToken(validToken)).thenReturn(Optional.of(testFile));

        // When & Then
        assertThatThrownBy(() -> downloadService.downloadFile(validToken, null))
                .isInstanceOf(FileNotFoundException.class)
                .hasMessageContaining("Le fichier physique est introuvable ou illisible");
    }

    // ==================== Tests getFileByToken() ====================

    @Test
    void getFileByToken_WithValidToken_ShouldReturnFile() {
        // Given
        when(fileRepository.findByDownloadToken(validToken)).thenReturn(Optional.of(testFile));

        // When
        File result = downloadService.getFileByToken(validToken);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(testFile.getId());
        assertThat(result.getOriginalFilename()).isEqualTo("test-file.txt");
    }

    @Test
    void getFileByToken_WithInvalidToken_ShouldThrowFileNotFoundException() {
        // Given
        when(fileRepository.findByDownloadToken("invalid-token")).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> downloadService.getFileByToken("invalid-token"))
                .isInstanceOf(FileNotFoundException.class)
                .hasMessage("Fichier non trouvé");
    }
}
