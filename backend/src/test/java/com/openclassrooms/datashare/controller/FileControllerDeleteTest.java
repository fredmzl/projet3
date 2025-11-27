package com.openclassrooms.datashare.controller;

import com.openclassrooms.datashare.entities.File;
import com.openclassrooms.datashare.entities.User;
import com.openclassrooms.datashare.repository.FileRepository;
import com.openclassrooms.datashare.repository.UserRepository;
import com.openclassrooms.datashare.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests d'intégration pour le endpoint DELETE /api/files/{fileId}
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@Transactional
class FileControllerDeleteTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16.1-alpine")
            .withDatabaseName("testdb")
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
    private UserRepository userRepository;

    @Autowired
    private FileRepository fileRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private User testUser;
    private User otherUser;
    private String testUserToken;
    private String otherUserToken;

    @BeforeEach
    void setUp() {
        // Nettoyer la base
        fileRepository.deleteAll();
        userRepository.deleteAll();

        // Créer utilisateur de test
        testUser = new User();
        testUser.setLogin("testuser@example.com");
        testUser.setPassword(passwordEncoder.encode("password123"));
        testUser = userRepository.save(testUser);

        // Créer un autre utilisateur
        otherUser = new User();
        otherUser.setLogin("otheruser@example.com");
        otherUser.setPassword(passwordEncoder.encode("password123"));
        otherUser = userRepository.save(otherUser);

        // Générer tokens JWT
        testUserToken = jwtService.generateToken(testUser);
        otherUserToken = jwtService.generateToken(otherUser);
    }

    /**
     * Test 1: DELETE avec authentification et propriétaire correct → 204 No Content
     */
    @Test
    void deleteFile_WithAuthenticationAndOwner_Returns204() throws Exception {
        // Créer un fichier pour testUser
        File file = createTestFile(testUser, "test-document.pdf");
        UUID fileId = file.getId();

        // DELETE avec JWT de testUser
        mockMvc.perform(delete("/api/files/{fileId}", fileId)
                        .header("Authorization", "Bearer " + testUserToken))
                .andExpect(status().isNoContent());

        // Vérifier que le fichier est supprimé en base
        assertThat(fileRepository.findById(fileId)).isEmpty();
    }

    /**
     * Test 2: DELETE sans authentification → 401 Unauthorized
     */
    @Test
    void deleteFile_WithoutAuthentication_Returns401() throws Exception {
        // Créer un fichier
        File file = createTestFile(testUser, "test-document.pdf");

        // DELETE sans JWT
        mockMvc.perform(delete("/api/files/{fileId}", file.getId()))
                .andExpect(status().isUnauthorized());

        // Vérifier que le fichier existe toujours
        assertThat(fileRepository.findById(file.getId())).isPresent();
    }

    /**
     * Test 3: DELETE avec JWT invalide → 401 Unauthorized
     */
    @Test
    void deleteFile_WithInvalidJWT_Returns401() throws Exception {
        // Créer un fichier
        File file = createTestFile(testUser, "test-document.pdf");

        // DELETE avec JWT invalide
        mockMvc.perform(delete("/api/files/{fileId}", file.getId())
                        .header("Authorization", "Bearer INVALID_TOKEN"))
                .andExpect(status().isUnauthorized());

        // Vérifier que le fichier existe toujours
        assertThat(fileRepository.findById(file.getId())).isPresent();
    }

    /**
     * Test 4: DELETE d'un fichier qui n'existe pas → 404 Not Found
     */
    @Test
    void deleteFile_WithNonExistentFile_Returns404() throws Exception {
        UUID nonExistentFileId = UUID.randomUUID();

        // DELETE avec JWT valide mais fichier inexistant
        mockMvc.perform(delete("/api/files/{fileId}", nonExistentFileId)
                        .header("Authorization", "Bearer " + testUserToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Fichier non trouvé"));
    }

    /**
     * Test 5: DELETE d'un fichier d'un autre utilisateur → 403 Forbidden
     */
    @Test
    void deleteFile_OfAnotherUser_Returns403() throws Exception {
        // Créer un fichier pour otherUser
        File file = createTestFile(otherUser, "other-user-file.pdf");

        // Tenter de DELETE avec JWT de testUser (pas le propriétaire)
        mockMvc.perform(delete("/api/files/{fileId}", file.getId())
                        .header("Authorization", "Bearer " + testUserToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"))
                .andExpect(jsonPath("$.message").value("Vous n'êtes pas autorisé à supprimer ce fichier"));

        // Vérifier que le fichier existe toujours
        assertThat(fileRepository.findById(file.getId())).isPresent();
    }

    /**
     * Test 6: DELETE d'un fichier expiré (l'utilisateur peut toujours le supprimer)
     */
    @Test
    void deleteFile_WithExpiredFile_Returns204() throws Exception {
        // Créer un fichier expiré
        File file = createTestFile(testUser, "expired-file.pdf");
        file.setExpirationDate(LocalDateTime.now().minusDays(1)); // Expiré depuis 1 jour
        file = fileRepository.save(file);

        UUID fileId = file.getId();

        // DELETE avec JWT de testUser
        mockMvc.perform(delete("/api/files/{fileId}", fileId)
                        .header("Authorization", "Bearer " + testUserToken))
                .andExpect(status().isNoContent());

        // Vérifier que le fichier est supprimé
        assertThat(fileRepository.findById(fileId)).isEmpty();
    }

    /**
     * Test 7: DELETE d'un fichier protégé par mot de passe (l'utilisateur peut le supprimer)
     */
    @Test
    void deleteFile_WithPasswordProtectedFile_Returns204() throws Exception {
        // Créer un fichier protégé par mot de passe
        File file = createTestFile(testUser, "protected-file.pdf");
        file.setPasswordHash(passwordEncoder.encode("secret123"));
        file = fileRepository.save(file);

        UUID fileId = file.getId();

        // DELETE avec JWT de testUser
        mockMvc.perform(delete("/api/files/{fileId}", fileId)
                        .header("Authorization", "Bearer " + testUserToken))
                .andExpect(status().isNoContent());

        // Vérifier que le fichier est supprimé
        assertThat(fileRepository.findById(fileId)).isEmpty();
    }

    /**
     * Test 8: DELETE avec UUID malformé → 400 Bad Request
     */
    @Test
    void deleteFile_WithMalformedUUID_Returns400() throws Exception {
        // DELETE avec UUID invalide
        mockMvc.perform(delete("/api/files/{fileId}", "invalid-uuid")
                        .header("Authorization", "Bearer " + testUserToken))
                .andExpect(status().isBadRequest());
    }

    /**
     * Méthode helper pour créer un fichier de test
     */
    private File createTestFile(User user, String filename) {
        File file = new File();
        file.setUser(user);
        file.setOriginalFilename(filename);
        file.setFilename("stored-" + filename);
        file.setFilepath(user.getId() + "/2025/11/18/" + UUID.randomUUID() + "_" + filename);
        file.setFileSize(1024L);
        file.setMimeType("application/pdf");
        file.setDownloadToken(UUID.randomUUID().toString());
        file.setExpirationDate(LocalDateTime.now().plusDays(7));
        return fileRepository.save(file);
    }
}
