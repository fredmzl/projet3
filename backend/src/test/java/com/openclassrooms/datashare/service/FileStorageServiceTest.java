package com.openclassrooms.datashare.service;

import com.openclassrooms.datashare.service.FileStorageService.FileStorageException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;

import static org.assertj.core.api.Assertions.*;

/**
 * Tests unitaires pour FileStorageService.
 * <p>
 * Utilise un répertoire temporaire pour simuler le système de fichiers.
 */
class FileStorageServiceTest {

    @TempDir
    Path tempDir;

    private FileStorageService fileStorageService;
    private MockMultipartFile testFile;
    private Long testUserId;

    @BeforeEach
    void setUp() throws FileStorageException {
        // Création du service avec le répertoire temporaire
        String storagePath = tempDir.toString();
        long maxFileSize = 1073741824L; // 1 GB
        
        fileStorageService = new FileStorageService(storagePath, maxFileSize);
        
        // Fichier de test standard
        testFile = new MockMultipartFile(
            "file",
            "test-document.pdf",
            "application/pdf",
            "Test file content".getBytes()
        );
        
        testUserId = 1L;
    }

    @AfterEach
    void tearDown() throws IOException {
        // Nettoyage du répertoire temporaire
        if (Files.exists(tempDir)) {
            Files.walk(tempDir)
                .sorted(Comparator.reverseOrder())
                .forEach(path -> {
                    try {
                        Files.deleteIfExists(path);
                    } catch (IOException e) {
                        // Ignore
                    }
                });
        }
    }

    /**
     * Test 1: storeFile crée les répertoires et sauvegarde le fichier
     */
    @Test
    void storeFile_CreatesDirectoriesAndSavesFile() throws FileStorageException, IOException {
        // When
        String filepath = fileStorageService.storeFile(testFile, testUserId);

        // Then
        assertThat(filepath).isNotNull();
        assertThat(filepath).isNotEmpty();
        
        // Vérifier que le fichier existe physiquement
        Path fullPath = tempDir.resolve(filepath);
        assertThat(Files.exists(fullPath)).isTrue();
        assertThat(Files.isRegularFile(fullPath)).isTrue();
        
        // Vérifier le contenu du fichier
        byte[] savedContent = Files.readAllBytes(fullPath);
        assertThat(savedContent).isEqualTo(testFile.getBytes());
        
        // Vérifier que les répertoires ont été créés (userId/yyyy/mm/dd)
        assertThat(filepath).startsWith(testUserId.toString());
        String[] parts = filepath.split("/");
        assertThat(parts).hasSizeGreaterThanOrEqualTo(5); // userId/yyyy/mm/dd/filename
    }

    /**
     * Test 2: storeFile génère le chemin correct selon le format {userId}/{yyyy}/{mm}/{dd}/{UUID}_{filename}
     */
    @Test
    void storeFile_GeneratesCorrectFilepath() throws FileStorageException {
        // Given
        LocalDateTime now = LocalDateTime.now();
        String expectedYear = now.format(DateTimeFormatter.ofPattern("yyyy"));
        String expectedMonth = now.format(DateTimeFormatter.ofPattern("MM"));
        String expectedDay = now.format(DateTimeFormatter.ofPattern("dd"));

        // When
        String filepath = fileStorageService.storeFile(testFile, testUserId);

        // Then
        assertThat(filepath).isNotNull();
        
        // Format attendu: {userId}/{yyyy}/{mm}/{dd}/{UUID}_{filename}
        String expectedPrefix = String.format("%d/%s/%s/%s/", testUserId, expectedYear, expectedMonth, expectedDay);
        assertThat(filepath).startsWith(expectedPrefix);
        
        // Vérifier que le nom de fichier contient le nom original
        assertThat(filepath).contains("test-document.pdf");
        
        // Vérifier qu'il y a un UUID (36 caractères) avant le underscore
        String filename = filepath.substring(filepath.lastIndexOf('/') + 1);
        assertThat(filename).matches("^[a-f0-9\\-]{36}_.*");
    }

    /**
     * Test 3: loadFileAsResource charge un fichier existant avec succès
     */
    @Test
    void loadFileAsResource_ExistingFile_ReturnsResource() throws FileStorageException, IOException {
        // Given - Stocker d'abord un fichier
        String filepath = fileStorageService.storeFile(testFile, testUserId);

        // When
        Resource resource = fileStorageService.loadFileAsResource(filepath);

        // Then
        assertThat(resource).isNotNull();
        assertThat(resource.exists()).isTrue();
        assertThat(resource.isReadable()).isTrue();
        assertThat(resource.contentLength()).isEqualTo(testFile.getSize());
        
        // Vérifier le contenu
        byte[] resourceContent = resource.getInputStream().readAllBytes();
        assertThat(resourceContent).isEqualTo(testFile.getBytes());
    }

    /**
     * Test 4: loadFileAsResource lève une exception pour un fichier inexistant
     */
    @Test
    void loadFileAsResource_NonExistingFile_ThrowsException() {
        // Given
        String nonExistingFilepath = "1/2024/11/17/non-existing-file.pdf";

        // When / Then
        assertThatThrownBy(() -> fileStorageService.loadFileAsResource(nonExistingFilepath))
            .isInstanceOf(FileStorageException.class)
            .hasMessageContaining("File not found or not readable");
    }

    /**
     * Test 5: deleteFile supprime un fichier existant avec succès
     */
    @Test
    void deleteFile_ExistingFile_DeletesSuccessfully() throws FileStorageException, IOException {
        // Given - Stocker d'abord un fichier
        String filepath = fileStorageService.storeFile(testFile, testUserId);
        Path fullPath = tempDir.resolve(filepath);
        
        // Vérifier que le fichier existe
        assertThat(Files.exists(fullPath)).isTrue();

        // When
        fileStorageService.deleteFile(filepath);

        // Then
        assertThat(Files.exists(fullPath)).isFalse();
    }

    /**
     * Test 6: detectMimeType retourne le type MIME correct
     */
    @Test
    void detectMimeType_ReturnsCorrectType() {
        // Given - Fichiers avec différents types
        MockMultipartFile pdfFile = new MockMultipartFile(
            "file", "document.pdf", "application/pdf", "PDF content".getBytes()
        );
        
        MockMultipartFile jpegFile = new MockMultipartFile(
            "file", "image.jpg", "image/jpeg", "JPEG content".getBytes()
        );
        
        MockMultipartFile txtFile = new MockMultipartFile(
            "file", "text.txt", "text/plain", "Text content".getBytes()
        );

        // When
        String pdfMimeType = fileStorageService.detectMimeType(pdfFile);
        String jpegMimeType = fileStorageService.detectMimeType(jpegFile);
        String txtMimeType = fileStorageService.detectMimeType(txtFile);

        // Then
        assertThat(pdfMimeType).isEqualTo("application/pdf");
        assertThat(jpegMimeType).isEqualTo("image/jpeg");
        assertThat(txtMimeType).isEqualTo("text/plain");
    }

    /**
     * Test 7: storeFile lève une FileStorageException en cas d'erreur I/O
     */
    @Test
    void storeFile_IOError_ThrowsStorageException() {
        // Given - Fichier trop volumineux (> 1 GB)
        long fileSize = 1073741825L; // 1 GB + 1 byte
        MockMultipartFile largeFile = new MockMultipartFile(
            "file",
            "large-file.bin",
            "application/octet-stream",
            new byte[1] // Au moins 1 byte pour éviter le check isEmpty()
        ) {
            @Override
            public long getSize() {
                return fileSize;
            }
            
            @Override
            public boolean isEmpty() {
                return false; // Force le fichier à ne pas être considéré comme vide
            }
        };

        // When / Then
        assertThatThrownBy(() -> fileStorageService.storeFile(largeFile, testUserId))
            .isInstanceOf(FileStorageException.class)
            .hasMessageContaining("File size exceeds maximum allowed size");
    }

    /**
     * Test supplémentaire: storeFile rejette un fichier vide
     */
    @Test
    void storeFile_EmptyFile_ThrowsException() {
        // Given
        MockMultipartFile emptyFile = new MockMultipartFile(
            "file", "empty.txt", "text/plain", new byte[0]
        );

        // When / Then
        assertThatThrownBy(() -> fileStorageService.storeFile(emptyFile, testUserId))
            .isInstanceOf(FileStorageException.class)
            .hasMessageContaining("Cannot store empty file");
    }

    /**
     * Test supplémentaire: loadFileAsResource rejette les chemins en dehors du répertoire de stockage
     */
    @Test
    void loadFileAsResource_PathTraversalAttempt_ThrowsException() {
        // Given - Tentative de path traversal
        String maliciousPath = "../../../etc/passwd";

        // When / Then
        assertThatThrownBy(() -> fileStorageService.loadFileAsResource(maliciousPath))
            .isInstanceOf(FileStorageException.class)
            .hasMessageContaining("Cannot access file outside storage directory");
    }

    /**
     * Test supplémentaire: deleteFile gère les fichiers inexistants sans erreur
     */
    @Test
    void deleteFile_NonExistingFile_HandlesGracefully() {
        // Given
        String nonExistingFilepath = "1/2024/11/17/non-existing-file.pdf";

        // When / Then - Ne doit pas lever d'exception
        assertThatCode(() -> fileStorageService.deleteFile(nonExistingFilepath))
            .doesNotThrowAnyException();
    }

    /**
     * Test supplémentaire: detectMimeType retourne un défaut si le type ne peut pas être détecté
     */
    @Test
    void detectMimeType_UnknownType_ReturnsDefault() {
        // Given - Fichier sans extension et sans content type
        MockMultipartFile unknownFile = new MockMultipartFile(
            "file", "unknownfile", null, "Unknown content".getBytes()
        );

        // When
        String mimeType = fileStorageService.detectMimeType(unknownFile);

        // Then
        assertThat(mimeType).isEqualTo("application/octet-stream");
    }

    /**
     * Test supplémentaire: storeFile gère correctement les noms de fichiers sans extension
     */
    @Test
    void storeFile_FilenameWithoutExtension_StoresSuccessfully() throws FileStorageException {
        // Given
        MockMultipartFile fileWithoutExtension = new MockMultipartFile(
            "file", "README", "text/plain", "README content".getBytes()
        );

        // When
        String filepath = fileStorageService.storeFile(fileWithoutExtension, testUserId);

        // Then
        assertThat(filepath).isNotNull();
        assertThat(filepath).contains("README");
        
        Path fullPath = tempDir.resolve(filepath);
        assertThat(Files.exists(fullPath)).isTrue();
    }

    /**
     * Test supplémentaire: storeFile gère les noms de fichiers null ou vides
     */
    @Test
    void storeFile_NullFilename_UsesUnnamed() throws FileStorageException {
        // Given
        MockMultipartFile fileWithNullName = new MockMultipartFile(
            "file", null, "application/octet-stream", "Content".getBytes()
        );

        // When
        String filepath = fileStorageService.storeFile(fileWithNullName, testUserId);

        // Then
        assertThat(filepath).isNotNull();
        assertThat(filepath).contains("unnamed");
    }
}
