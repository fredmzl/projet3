package com.openclassrooms.datashare.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.openclassrooms.datashare.dto.FileDownloadRequestDto;
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
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests d'intégration pour DownloadController
 * US01 - Téléchargement via lien
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
class DownloadControllerTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16.1-alpine")
            .withDatabaseName("datashare_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private FileRepository fileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${app.storage.path}")
    private String storagePath;

    private User testUser;
    private File testFile;
    private File passwordProtectedFile;
    private File expiredFile;
    private Path testFilePath;
    private String validToken;
    private String protectedToken;
    private String expiredToken;

    @BeforeEach
    void setUp() throws IOException {
        // Nettoyer la base
        fileRepository.deleteAll();
        userRepository.deleteAll();

        // Créer un utilisateur
        testUser = new User();
        testUser.setLogin("download-test@example.com");
        testUser.setPassword(passwordEncoder.encode("password"));
        testUser = userRepository.save(testUser);

        // Créer le répertoire de stockage de test
        Path userStoragePath = Paths.get(storagePath, testUser.getId().toString());
        Files.createDirectories(userStoragePath);

        // Créer un fichier physique de test
        testFilePath = userStoragePath.resolve("test-download-file.txt");
        Files.writeString(testFilePath, "Test file content for download");

        validToken = UUID.randomUUID().toString();
        protectedToken = UUID.randomUUID().toString();
        expiredToken = UUID.randomUUID().toString();

        // Fichier sans mot de passe
        testFile = new File();
        testFile.setOriginalFilename("test-file.txt");
        testFile.setFilename("test-download-file.txt");
        testFile.setFilepath(testFilePath.toString());
        testFile.setFileSize(Files.size(testFilePath));
        testFile.setMimeType("text/plain");
        testFile.setDownloadToken(validToken);
        testFile.setExpirationDate(LocalDateTime.now().plusDays(7));
        testFile.setUser(testUser);
        testFile.setCreatedAt(LocalDateTime.now());
        testFile.setUpdatedAt(LocalDateTime.now());
        testFile = fileRepository.save(testFile);

        // Fichier protégé par mot de passe
        passwordProtectedFile = new File();
        passwordProtectedFile.setOriginalFilename("protected-file.txt");
        passwordProtectedFile.setFilename("test-download-file.txt");
        passwordProtectedFile.setFilepath(testFilePath.toString());
        passwordProtectedFile.setFileSize(Files.size(testFilePath));
        passwordProtectedFile.setMimeType("text/plain");
        passwordProtectedFile.setDownloadToken(protectedToken);
        passwordProtectedFile.setPasswordHash(passwordEncoder.encode("secret123"));
        passwordProtectedFile.setExpirationDate(LocalDateTime.now().plusDays(7));
        passwordProtectedFile.setUser(testUser);
        passwordProtectedFile.setCreatedAt(LocalDateTime.now());
        passwordProtectedFile.setUpdatedAt(LocalDateTime.now());
        passwordProtectedFile = fileRepository.save(passwordProtectedFile);

        // Fichier expiré
        expiredFile = new File();
        expiredFile.setOriginalFilename("expired-file.txt");
        expiredFile.setFilename("test-download-file.txt");
        expiredFile.setFilepath(testFilePath.toString());
        expiredFile.setFileSize(Files.size(testFilePath));
        expiredFile.setMimeType("text/plain");
        expiredFile.setDownloadToken(expiredToken);
        expiredFile.setExpirationDate(LocalDateTime.now().minusDays(1));
        expiredFile.setUser(testUser);
        expiredFile.setCreatedAt(LocalDateTime.now());
        expiredFile.setUpdatedAt(LocalDateTime.now());
        expiredFile = fileRepository.save(expiredFile);
    }

    @AfterEach
    void tearDown() throws IOException {
        // Nettoyer le fichier physique
        if (testFilePath != null && Files.exists(testFilePath)) {
            Files.delete(testFilePath);
        }
        fileRepository.deleteAll();
        userRepository.deleteAll();
    }

    // ==================== Tests GET /api/download/{token} ====================

    @Test
    void getFileInfo_WithValidToken_ShouldReturnFileInfo() throws Exception {
        mockMvc.perform(get("/api/download/{token}", validToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.originalFilename", is("test-file.txt")))
                .andExpect(jsonPath("$.fileSize", is(30)))
                .andExpect(jsonPath("$.mimeType", is("text/plain")))
                .andExpect(jsonPath("$.expirationDate", notNullValue()))
                .andExpect(jsonPath("$.isExpired", is(false)))
                .andExpect(jsonPath("$.hasPassword", is(false)));
    }

    @Test
    void getFileInfo_WithPasswordProtectedFile_ShouldReturnInfoWithMessage() throws Exception {
        mockMvc.perform(get("/api/download/{token}", protectedToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.originalFilename", is("protected-file.txt")))
                .andExpect(jsonPath("$.hasPassword", is(true)))
                .andExpect(jsonPath("$.message", is("Ce fichier est protégé par mot de passe")));
    }

    @Test
    void getFileInfo_WithInvalidToken_ShouldReturn404() throws Exception {
        mockMvc.perform(get("/api/download/{token}", "invalid-token-12345"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error", is("Not Found")))
                .andExpect(jsonPath("$.message", is("Lien de téléchargement invalide ou fichier non trouvé")));
    }

    @Test
    void getFileInfo_WithExpiredFile_ShouldReturn410() throws Exception {
        mockMvc.perform(get("/api/download/{token}", expiredToken))
                .andExpect(status().isGone())
                .andExpect(jsonPath("$.error", is("Gone")))
                .andExpect(jsonPath("$.message", is("Ce fichier a expiré et n'est plus disponible")))
                .andExpect(jsonPath("$.expirationDate", notNullValue()));
    }

    // ==================== Tests POST /api/download/{token} ====================

    @Test
    void downloadFile_WithoutPassword_ShouldReturnFile() throws Exception {
        mockMvc.perform(post("/api/download/{token}", validToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "text/plain"))
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"test-file.txt\""))
                .andExpect(header().string("Content-Length", "30"))
                .andExpect(header().exists("X-File-Id"))
                .andExpect(content().string("Test file content for download"));
    }

    @Test
    void downloadFile_WithCorrectPassword_ShouldReturnFile() throws Exception {
        FileDownloadRequestDto requestDto = new FileDownloadRequestDto("secret123");

        mockMvc.perform(post("/api/download/{token}", protectedToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "text/plain"))
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"protected-file.txt\""))
                .andExpect(content().string("Test file content for download"));
    }

    @Test
    void downloadFile_WithIncorrectPassword_ShouldReturn401() throws Exception {
        FileDownloadRequestDto requestDto = new FileDownloadRequestDto("wrong-password");

        mockMvc.perform(post("/api/download/{token}", protectedToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", is("Unauthorized")))
                .andExpect(jsonPath("$.message", is("Mot de passe incorrect")));
    }

    @Test
    void downloadFile_ProtectedFileWithoutPassword_ShouldReturn401() throws Exception {
        mockMvc.perform(post("/api/download/{token}", protectedToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", is("Unauthorized")))
                .andExpect(jsonPath("$.message", is("Ce fichier est protégé par mot de passe")));
    }

    @Test
    void downloadFile_WithEmptyPassword_ShouldReturn401() throws Exception {
        FileDownloadRequestDto requestDto = new FileDownloadRequestDto("");

        mockMvc.perform(post("/api/download/{token}", protectedToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message", is("Ce fichier est protégé par mot de passe")));
    }

    @Test
    void downloadFile_WithExpiredFile_ShouldReturn410() throws Exception {
        mockMvc.perform(post("/api/download/{token}", expiredToken))
                .andExpect(status().isGone())
                .andExpect(jsonPath("$.error", is("Gone")))
                .andExpect(jsonPath("$.message", is("Ce fichier a expiré et n'est plus disponible")));
    }

    @Test
    void downloadFile_WithInvalidToken_ShouldReturn404() throws Exception {
        mockMvc.perform(post("/api/download/{token}", "invalid-token-xyz"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error", is("Not Found")))
                .andExpect(jsonPath("$.message", is("Lien de téléchargement invalide")));
    }

    @Test
    void downloadFile_WithNonExistentPhysicalFile_ShouldReturn404() throws Exception {
        // Créer un fichier en base avec un chemin invalide
        File brokenFile = new File();
        brokenFile.setOriginalFilename("broken-file.txt");
        brokenFile.setFilename("broken-file.txt");
        brokenFile.setFilepath("/non/existent/path/broken-file.txt");
        brokenFile.setFileSize(100L);
        brokenFile.setMimeType("text/plain");
        brokenFile.setDownloadToken(UUID.randomUUID().toString());
        brokenFile.setExpirationDate(LocalDateTime.now().plusDays(7));
        brokenFile.setUser(testUser);
        brokenFile.setCreatedAt(LocalDateTime.now());
        brokenFile.setUpdatedAt(LocalDateTime.now());
        brokenFile = fileRepository.save(brokenFile);

        mockMvc.perform(post("/api/download/{token}", brokenFile.getDownloadToken()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error", is("Not Found")))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Le fichier physique est introuvable")));
    }

    // ==================== Tests d'accès public ====================

    @Test
    void downloadEndpoints_ShouldBeAccessibleWithoutAuthentication() throws Exception {
        // Vérifier que GET /api/download/{token} ne nécessite pas d'authentification
        mockMvc.perform(get("/api/download/{token}", validToken))
                .andExpect(status().isOk());

        // Vérifier que POST /api/download/{token} ne nécessite pas d'authentification
        mockMvc.perform(post("/api/download/{token}", validToken))
                .andExpect(status().isOk());
    }
}
