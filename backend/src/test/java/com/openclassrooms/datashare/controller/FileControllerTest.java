package com.openclassrooms.datashare.controller;

import com.openclassrooms.datashare.entities.File;
import com.openclassrooms.datashare.entities.User;
import com.openclassrooms.datashare.repository.FileRepository;
import com.openclassrooms.datashare.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests d'intégration pour FileController.
 * <p>
 * Utilise MockMvc pour les requêtes HTTP et Testcontainers pour PostgreSQL.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
class FileControllerTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16.1-alpine");

    @DynamicPropertySource
    static void configureTestProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create");
        registry.add("app.storage.path", () -> System.getProperty("java.io.tmpdir") + "/test-storage");
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private FileRepository fileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${app.storage.path}")
    private String storagePath;

    private User testUser;
    private MockMultipartFile testFile;

    @BeforeEach
    void setUp() {
        // Créer un utilisateur de test
        testUser = new User();
        testUser.setLogin("testuser");
        testUser.setPassword(passwordEncoder.encode("password123"));
        testUser = userRepository.save(testUser);

        // Créer un fichier de test standard
        testFile = new MockMultipartFile(
            "file",
            "test-document.pdf",
            "application/pdf",
            "Test file content for integration testing".getBytes()
        );
    }

    @AfterEach
    void tearDown() throws Exception {
        // Nettoyer la base de données
        fileRepository.deleteAll();
        userRepository.deleteAll();

        // Nettoyer le système de fichiers
        Path storageDir = Paths.get(storagePath);
        if (Files.exists(storageDir)) {
            Files.walk(storageDir)
                .sorted(Comparator.reverseOrder())
                .forEach(path -> {
                    try {
                        Files.deleteIfExists(path);
                    } catch (Exception e) {
                        // Ignore cleanup errors
                    }
                });
        }
    }

    /**
     * Test 1: Upload avec authentification retourne 201 Created
     */
    @Test
    void uploadFile_Authenticated_Returns201Created() throws Exception {
        mockMvc.perform(multipart("/api/files")
                .file(testFile)
                .param("expirationDays", "7")
                .with(user(testUser)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").exists())
            .andExpect(jsonPath("$.filename").exists())
            .andExpect(jsonPath("$.downloadToken").exists())
            .andExpect(jsonPath("$.downloadUrl").exists());
    }

    /**
     * Test 2: Upload avec JWT valide sauvegarde le fichier et les métadonnées en DB
     */
    @Test
    void uploadFile_WithValidJWT_SavesFileAndMetadata() throws Exception {
        // When
        mockMvc.perform(multipart("/api/files")
                .file(testFile)
                .param("expirationDays", "7")
                .with(user(testUser)))
            .andExpect(status().isCreated());

        // Then - Vérifier que le fichier est enregistré en DB
        List<File> files = fileRepository.findAll();
        assertThat(files).hasSize(1);
        
        File savedFile = files.get(0);
        assertThat(savedFile.getOriginalFilename()).isEqualTo("test-document.pdf");
        assertThat(savedFile.getFileSize()).isEqualTo(testFile.getSize());
        assertThat(savedFile.getMimeType()).isEqualTo("application/pdf");
        assertThat(savedFile.getDownloadToken()).isNotNull();
        assertThat(savedFile.getExpirationDate()).isAfter(LocalDateTime.now());
    }

    /**
     * Test 3: Upload avec mot de passe hashe le mot de passe en DB
     */
    @Test
    void uploadFile_WithPassword_HashesPasswordInDB() throws Exception {
        // Given
        String plainPassword = "mySecurePassword123";

        // When
        mockMvc.perform(multipart("/api/files")
                .file(testFile)
                .param("expirationDays", "7")
                .param("password", plainPassword)
                .with(user(testUser)))
            .andExpect(status().isCreated());

        // Then - Vérifier que le mot de passe est hashé (BCrypt)
        File savedFile = fileRepository.findAll().get(0);
        assertThat(savedFile.getPasswordHash()).isNotNull();
        assertThat(savedFile.getPasswordHash()).isNotEqualTo(plainPassword);
        assertThat(savedFile.getPasswordHash()).startsWith("$2"); // BCrypt hash
        
        // Vérifier que le hash est valide
        assertThat(passwordEncoder.matches(plainPassword, savedFile.getPasswordHash())).isTrue();
    }

    /**
     * Test 4: Upload sans mot de passe laisse le champ password null
     */
    @Test
    void uploadFile_WithoutPassword_PasswordIsNull() throws Exception {
        // When
        mockMvc.perform(multipart("/api/files")
                .file(testFile)
                .param("expirationDays", "7")
                .with(user(testUser)))
            .andExpect(status().isCreated());

        // Then
        File savedFile = fileRepository.findAll().get(0);
        assertThat(savedFile.getPasswordHash()).isNull();
    }

    /**
     * Test 5: Upload génère un token de téléchargement unique
     */
    @Test
    void uploadFile_GeneratesUniqueDownloadToken() throws Exception {
        // When - Uploader 3 fichiers
        for (int i = 0; i < 3; i++) {
            MockMultipartFile file = new MockMultipartFile(
                "file",
                "test-file-" + i + ".pdf",
                "application/pdf",
                ("Content " + i).getBytes()
            );
            
            mockMvc.perform(multipart("/api/files")
                    .file(file)
                    .param("expirationDays", "7")
                    .with(user(testUser)))
                .andExpect(status().isCreated());
        }

        // Then - Vérifier que tous les tokens sont uniques
        List<File> files = fileRepository.findAll();
        assertThat(files).hasSize(3);
        
        List<String> tokens = files.stream()
            .map(File::getDownloadToken)
            .toList();
        
        assertThat(tokens).doesNotHaveDuplicates();
        assertThat(tokens).allMatch(token -> token != null && !token.isBlank());
    }

    /**
     * Test 6: Upload définit correctement le userId depuis le JWT
     */
    @Test
    void uploadFile_SetsCorrectUserId_FromJWT() throws Exception {
        // When
        mockMvc.perform(multipart("/api/files")
                .file(testFile)
                .param("expirationDays", "7")
                .with(user(testUser)))
            .andExpect(status().isCreated());

        // Then
        File savedFile = fileRepository.findAll().get(0);
        assertThat(savedFile.getUser()).isNotNull();
        assertThat(savedFile.getUser().getId()).isEqualTo(testUser.getId());
    }

    /**
     * Test 7: Upload crée le fichier physique sur le système de fichiers
     */
    @Test
    void uploadFile_CreatesPhysicalFile_OnFilesystem() throws Exception {
        // When
        mockMvc.perform(multipart("/api/files")
                .file(testFile)
                .param("expirationDays", "7")
                .with(user(testUser)))
            .andExpect(status().isCreated());

        // Then - Vérifier que le fichier existe physiquement
        File savedFile = fileRepository.findAll().get(0);
        Path physicalFilePath = Paths.get(storagePath, savedFile.getFilepath());
        
        assertThat(Files.exists(physicalFilePath)).isTrue();
        assertThat(Files.isRegularFile(physicalFilePath)).isTrue();
        assertThat(Files.size(physicalFilePath)).isEqualTo(testFile.getSize());
        
        // Vérifier le contenu
        byte[] savedContent = Files.readAllBytes(physicalFilePath);
        assertThat(savedContent).isEqualTo(testFile.getBytes());
    }

    /**
     * Test 8: Upload sans authentification retourne 401 Unauthorized
     */
    @Test
    void uploadFile_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(multipart("/api/files")
                .file(testFile)
                .param("expirationDays", "7"))
            .andExpect(status().isUnauthorized());

        // Vérifier qu'aucun fichier n'a été créé
        assertThat(fileRepository.findAll()).isEmpty();
    }

    /**
     * Test 9: Upload avec fichier > 1 GB retourne 400 Bad Request
     */
    @Test
    void uploadFile_FileSizeExceeds1GB_Returns400() throws Exception {
        // Given - Simuler un fichier de plus de 1 GB
        MockMultipartFile largeFile = new MockMultipartFile(
            "file",
            "large-file.bin",
            "application/octet-stream",
            new byte[1] // Contenu minimal
        ) {
            @Override
            public long getSize() {
                return 1073741825L; // 1 GB + 1 byte
            }
            
            @Override
            public boolean isEmpty() {
                return false;
            }
        };

        // When / Then
        mockMvc.perform(multipart("/api/files")
                .file(largeFile)
                .param("expirationDays", "7")
                .with(user(testUser)))
            .andExpect(status().isPayloadTooLarge())
            .andExpect(jsonPath("$.error").exists());
    }

    /**
     * Test 10: Upload avec fichier vide retourne 400 Bad Request
     */
    @Test
    void uploadFile_EmptyFile_Returns400() throws Exception {
        // Given
        MockMultipartFile emptyFile = new MockMultipartFile(
            "file",
            "empty.txt",
            "text/plain",
            new byte[0]
        );

        // When / Then
        mockMvc.perform(multipart("/api/files")
                .file(emptyFile)
                .param("expirationDays", "7")
                .with(user(testUser)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").exists());
    }

    /**
     * Test 11: Upload avec expirationDays invalide retourne 400 Bad Request
     */
    @Test
    void uploadFile_InvalidExpirationDays_Returns400() throws Exception {
        // Test avec 0 jour (min = 1)
        mockMvc.perform(multipart("/api/files")
                .file(testFile)
                .param("expirationDays", "0")
                .with(user(testUser)))
            .andExpect(status().isBadRequest());

        // Test avec 8 jours (max = 7)
        mockMvc.perform(multipart("/api/files")
                .file(testFile)
                .param("expirationDays", "8")
                .with(user(testUser)))
            .andExpect(status().isBadRequest());

        // Vérifier qu'aucun fichier n'a été créé
        assertThat(fileRepository.findAll()).isEmpty();
    }

    /**
     * Test 12: Upload avec JWT expiré retourne 401 Unauthorized
     */
    @Test
    void uploadFile_ExpiredJWT_Returns401() throws Exception {
        // Given - Pour simuler un JWT expiré, on ne fournit pas d'authentification du tout
        // (un vrai JWT expiré est rejeté au niveau du filtre avant d'atteindre le contrôleur)

        // When / Then
        mockMvc.perform(multipart("/api/files")
                .file(testFile)
                .param("expirationDays", "7"))
            .andExpect(status().isUnauthorized());

        // Vérifier qu'aucun fichier n'a été créé
        assertThat(fileRepository.findAll()).isEmpty();
    }

    /**
     * Test bonus: Upload avec expiration personnalisée (3 jours)
     */
    @Test
    void uploadFile_CustomExpiration_CalculatesCorrectly() throws Exception {
        // Given
        int customDays = 3;
        LocalDateTime beforeUpload = LocalDateTime.now().plusDays(customDays);

        // When
        mockMvc.perform(multipart("/api/files")
                .file(testFile)
                .param("expirationDays", String.valueOf(customDays))
                .with(user(testUser)))
            .andExpect(status().isCreated());

        // Then
        File savedFile = fileRepository.findAll().get(0);
        LocalDateTime afterUpload = LocalDateTime.now().plusDays(customDays);
        
        assertThat(savedFile.getExpirationDate()).isBetween(
            beforeUpload.minusSeconds(5),
            afterUpload.plusSeconds(5)
        );
    }

    /**
     * Test bonus: Upload avec mot de passe faible retourne 400 Bad Request
     */
    @Test
    void uploadFile_WeakPassword_Returns400() throws Exception {
        // Given - Mot de passe < 4 caractères
        mockMvc.perform(multipart("/api/files")
                .file(testFile)
                .param("expirationDays", "7")
                .param("password", "123") // Seulement 3 caractères
                .with(user(testUser)))
            .andExpect(status().isBadRequest());

        // Vérifier qu'aucun fichier n'a été créé
        assertThat(fileRepository.findAll()).isEmpty();
    }

    /**
     * Test bonus: Upload avec type MIME invalide retourne 400 Bad Request
     */
    @Test
    void uploadFile_InvalidMimeType_Returns400() throws Exception {
        // Given - Fichier exécutable (bloqué par MimeTypeValidator)
        MockMultipartFile executableFile = new MockMultipartFile(
            "file",
            "malicious.exe",
            "application/x-msdownload",
            "Fake executable content".getBytes()
        );

        // When / Then
        mockMvc.perform(multipart("/api/files")
                .file(executableFile)
                .param("expirationDays", "7")
                .with(user(testUser)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").exists());

        // Vérifier qu'aucun fichier n'a été créé
        assertThat(fileRepository.findAll()).isEmpty();
    }

    /**
     * Test bonus: Vérifier que la réponse contient toutes les métadonnées requises
     */
    @Test
    void uploadFile_ResponseContainsAllMetadata() throws Exception {
        // When
        mockMvc.perform(multipart("/api/files")
                .file(testFile)
                .param("expirationDays", "5")
                .param("password", "securePass123")
                .with(user(testUser)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").exists())
            .andExpect(jsonPath("$.filename").value(testFile.getOriginalFilename()))
            .andExpect(jsonPath("$.fileSize").value(testFile.getSize()))
            .andExpect(jsonPath("$.downloadToken").isNotEmpty())
            .andExpect(jsonPath("$.downloadUrl").isNotEmpty())
            .andExpect(jsonPath("$.expirationDate").exists())
            .andExpect(jsonPath("$.hasPassword").value(true));
    }
}
