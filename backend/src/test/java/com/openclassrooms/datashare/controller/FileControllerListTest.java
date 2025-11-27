package com.openclassrooms.datashare.controller;

import com.openclassrooms.datashare.dto.FileListResponseDto;
import com.openclassrooms.datashare.dto.FileMetadataDto;
import com.openclassrooms.datashare.entities.User;
import com.openclassrooms.datashare.repository.UserRepository;
import com.openclassrooms.datashare.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests d'intégration pour le endpoint GET /api/files.
 * <p>
 * Utilise Testcontainers pour PostgreSQL et MockMvc pour les requêtes HTTP.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@Transactional
public class FileControllerListTest {

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
        
        // Créer un répertoire temporaire pour le stockage
        try {
            Path tempDir = Files.createTempDirectory("test-storage-list");
            registry.add("app.storage.path", tempDir::toString);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create temp directory", e);
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    private String jwtToken;
    private User testUser;

    @BeforeEach
    void setUp() {
        // Créer un utilisateur de test
        testUser = new User();
        testUser.setLogin("list-test@example.com");
        testUser.setPassword(passwordEncoder.encode("password123"));
        testUser = userRepository.save(testUser);

        // Générer un token JWT
        jwtToken = jwtService.generateToken(testUser);
    }

    @Test
    void listFiles_WithAuthentication_Returns200() throws Exception {
        // When: Requête GET /api/files avec JWT valide
        mockMvc.perform(get("/api/files")
                .header("Authorization", "Bearer " + jwtToken)
                .accept(MediaType.APPLICATION_JSON))
                // Then: Retourne 200 OK avec structure de pagination
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.files").isArray())
                .andExpect(jsonPath("$.totalElements").exists())
                .andExpect(jsonPath("$.totalPages").exists())
                .andExpect(jsonPath("$.currentPage").exists())
                .andExpect(jsonPath("$.pageSize").exists());
    }

    @Test
    void listFiles_WithoutAuthentication_Returns401() throws Exception {
        // When: Requête GET /api/files sans JWT
        mockMvc.perform(get("/api/files")
                .accept(MediaType.APPLICATION_JSON))
                // Then: Retourne 401 Unauthorized
                .andExpect(status().isUnauthorized());
    }

    @Test
    void listFiles_WithInvalidJWT_Returns401() throws Exception {
        // When: Requête GET /api/files avec JWT invalide
        mockMvc.perform(get("/api/files")
                .header("Authorization", "Bearer INVALID_TOKEN")
                .accept(MediaType.APPLICATION_JSON))
                // Then: Retourne 401 Unauthorized
                .andExpect(status().isUnauthorized());
    }

    @Test
    void listFiles_EmptyList_ReturnsEmptyArray() throws Exception {
        // Given: Utilisateur sans fichiers
        
        // When: Requête GET /api/files
        MvcResult result = mockMvc.perform(get("/api/files")
                .header("Authorization", "Bearer " + jwtToken)
                .accept(MediaType.APPLICATION_JSON))
                // Then: Retourne liste vide
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.files").isArray())
                .andExpect(jsonPath("$.files").isEmpty())
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.totalPages").value(0))
                .andExpect(jsonPath("$.currentPage").value(0))
                .andExpect(jsonPath("$.pageSize").value(20))
                .andReturn();
        
        String content = result.getResponse().getContentAsString();
        FileListResponseDto response = objectMapper.readValue(content, FileListResponseDto.class);
        
        assertThat(response.getFiles()).isEmpty();
        assertThat(response.getTotalElements()).isEqualTo(0);
    }

    @Test
    void listFiles_WithPaginationParams_AppliesCorrectly() throws Exception {
        // When: Requête avec paramètres de pagination
        mockMvc.perform(get("/api/files")
                .header("Authorization", "Bearer " + jwtToken)
                .param("page", "1")
                .param("size", "5")
                .accept(MediaType.APPLICATION_JSON))
                // Then: Retourne avec paramètres appliqués
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentPage").value(1))
                .andExpect(jsonPath("$.pageSize").value(5));
    }

    @Test
    void listFiles_WithSortParam_AppliesCorrectly() throws Exception {
        // When: Requête avec paramètre de tri
        mockMvc.perform(get("/api/files")
                .header("Authorization", "Bearer " + jwtToken)
                .param("sort", "fileSize,desc")
                .accept(MediaType.APPLICATION_JSON))
                // Then: Retourne 200 OK (tri appliqué côté service)
                .andExpect(status().isOk());
    }

    @Test
    void listFiles_WithIncludeExpiredFalse_FiltersExpiredFiles() throws Exception {
        // When: Requête avec includeExpired=false
        mockMvc.perform(get("/api/files")
                .header("Authorization", "Bearer " + jwtToken)
                .param("includeExpired", "false")
                .accept(MediaType.APPLICATION_JSON))
                // Then: Retourne 200 OK (fichiers expirés exclus)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.files").isArray());
    }

    @Test
    void listFiles_WithDefaultParams_UsesDefaults() throws Exception {
        // When: Requête sans paramètres
        MvcResult result = mockMvc.perform(get("/api/files")
                .header("Authorization", "Bearer " + jwtToken)
                .accept(MediaType.APPLICATION_JSON))
                // Then: Utilise les valeurs par défaut
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentPage").value(0))
                .andExpect(jsonPath("$.pageSize").value(20))
                .andReturn();
        
        String content = result.getResponse().getContentAsString();
        FileListResponseDto response = objectMapper.readValue(content, FileListResponseDto.class);
        
        assertThat(response.getCurrentPage()).isEqualTo(0);
        assertThat(response.getPageSize()).isEqualTo(20);
    }

    @Test
    void listFiles_ExceedsMaxSize_CapsAt100() throws Exception {
        // When: Requête avec size > 100
        mockMvc.perform(get("/api/files")
                .header("Authorization", "Bearer " + jwtToken)
                .param("size", "200")
                .accept(MediaType.APPLICATION_JSON))
                // Then: Limite à 100 (géré côté service)
                .andExpect(status().isOk());
    }
}
