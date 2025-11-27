package com.openclassrooms.datashare.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.openclassrooms.datashare.dto.LoginRequestDTO;
import com.openclassrooms.datashare.dto.RegisterDTO;
import com.openclassrooms.datashare.entities.User;
import com.openclassrooms.datashare.repository.UserRepository;
import com.openclassrooms.datashare.service.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
public class UserControllerTest {

    private static final String REGISTER_URL = "/api/auth/register";
    private static final String LOGIN_URL = "/api/auth/login";
    private static final String LOGIN = "login@domain.net";
    private static final String PASSWORD = "password";


    @Container
    static PostgreSQLContainer myPostgreSQLContainer = new PostgreSQLContainer("postgres:16.1-alpine");

    @Autowired
    private UserService userService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private MockMvc mockMvc;

    @DynamicPropertySource
    static void configureTestProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> myPostgreSQLContainer.getJdbcUrl());
        registry.add("spring.datasource.username", () -> myPostgreSQLContainer.getUsername());
        registry.add("spring.datasource.password", () -> myPostgreSQLContainer.getPassword());
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create");
        registry.add("app.storage.path", () -> System.getProperty("java.io.tmpdir") + "/test-storage-user");
    }

    @AfterEach
    public void afterEach() {
        userRepository.deleteAll();
    }

    @Test
    public void registerUserWithoutRequiredData() throws Exception {
        // GIVEN
        RegisterDTO registerDTO = new RegisterDTO();

        // WHEN
        mockMvc.perform(MockMvcRequestBuilders.post(REGISTER_URL)
                        .content(objectMapper.writeValueAsString(registerDTO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isBadRequest());
    }

    @Test
    public void registerAlreadyExistUser() throws Exception {
        // GIVEN
        User user = new User();
        user.setLogin(LOGIN);
        user.setPassword(PASSWORD);
        userService.register(user);

        RegisterDTO registerDTO = new RegisterDTO();
        registerDTO.setLogin(LOGIN);
        registerDTO.setPassword(PASSWORD);

        // WHEN
        mockMvc.perform(MockMvcRequestBuilders.post(REGISTER_URL)
                        .content(objectMapper.writeValueAsString(registerDTO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isBadRequest());
    }

    @Test
    public void registerUserSuccessful() throws Exception {
        // GIVEN
        RegisterDTO registerDTO = new RegisterDTO();
        registerDTO.setLogin(LOGIN);
        registerDTO.setPassword(PASSWORD);

        // WHEN
        mockMvc.perform(MockMvcRequestBuilders.post(REGISTER_URL)
                        .content(objectMapper.writeValueAsString(registerDTO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isCreated());
    }

    @Test
    public void test_register_with_invalid_email_format() throws Exception {
        // GIVEN
        RegisterDTO registerDTO = new RegisterDTO();
        registerDTO.setLogin("invalid-email-format");
        registerDTO.setPassword(PASSWORD);
        // WHEN
        mockMvc.perform(MockMvcRequestBuilders.post(REGISTER_URL)
                        .content(objectMapper.writeValueAsString(registerDTO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isBadRequest());
    }

    @Test
    public void test_register_with_short_password() throws Exception {
        // GIVEN
        RegisterDTO registerDTO = new RegisterDTO();
        registerDTO.setLogin(LOGIN);
        registerDTO.setPassword("123" ); // Mot de passe trop court

        // WHEN
        mockMvc.perform(MockMvcRequestBuilders.post(REGISTER_URL)
                        .content(objectMapper.writeValueAsString(registerDTO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isBadRequest());
    }

    @Test
    public void test_register_with_empty_password() throws Exception {
        // GIVEN
        RegisterDTO registerDTO = new RegisterDTO();
        registerDTO.setLogin(LOGIN);
        registerDTO.setPassword(""); // Mot de passe vide
        // WHEN
        mockMvc.perform(MockMvcRequestBuilders.post(REGISTER_URL)
                        .content(objectMapper.writeValueAsString(registerDTO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isBadRequest());
    }

    @Test
    public void test_register_verify_password_is_hashed() throws Exception {
        // GIVEN
        String plainPassword = "password123";
        RegisterDTO registerDTO = new RegisterDTO();
        registerDTO.setLogin("newuser@domain.net");
        registerDTO.setPassword(plainPassword);

        // WHEN - Créer via l'API
        mockMvc.perform(MockMvcRequestBuilders.post(REGISTER_URL)
                .content(objectMapper.writeValueAsString(registerDTO))
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(MockMvcResultMatchers.status().isCreated());

        // THEN - Vérifier le hash en base
        User savedUser = userRepository.findByLogin("newuser@domain.net").orElseThrow();
        assertThat(savedUser.getPassword()).isNotEqualTo(plainPassword);
        assertThat(savedUser.getPassword()).startsWith("$2a$"); // BCrypt
        assertThat(savedUser.getPassword()).hasSize(60); // BCrypt hash length
    }

    // ===== TESTS LOGIN ENDPOINT =====

    @Test
    public void test_login_with_valid_credentials_returns_jwt_token() throws Exception {
        // GIVEN
        // Créer d'abord un utilisateur pour pouvoir se connecter
        User user = new User();
        user.setLogin(LOGIN);
        user.setPassword(PASSWORD);
        userService.register(user);

        LoginRequestDTO loginRequest = new LoginRequestDTO();
        loginRequest.setLogin(LOGIN);
        loginRequest.setPassword(PASSWORD);

        // WHEN
        mockMvc.perform(MockMvcRequestBuilders.post(LOGIN_URL)
                        .content(objectMapper.writeValueAsString(loginRequest))
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.token").exists())
                .andExpect(MockMvcResultMatchers.jsonPath("$.token").isNotEmpty());
    }

    @Test
    public void test_login_with_invalid_credentials_returns_unauthorized() throws Exception {
        // GIVEN
        // Créer un utilisateur avec un mot de passe différent
        User user = new User();
        user.setLogin(LOGIN);
        user.setPassword(PASSWORD);
        userService.register(user);

        LoginRequestDTO loginRequest = new LoginRequestDTO();
        loginRequest.setLogin(LOGIN);
        loginRequest.setPassword("wrongpassword");

        // WHEN
        mockMvc.perform(MockMvcRequestBuilders.post(LOGIN_URL)
                        .content(objectMapper.writeValueAsString(loginRequest))
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isUnauthorized())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").exists());
    }

    @Test
    public void test_login_with_non_existing_user_returns_unauthorized() throws Exception {
        // GIVEN
        LoginRequestDTO loginRequest = new LoginRequestDTO();
        loginRequest.setLogin("nonexistinguser");
        loginRequest.setPassword(PASSWORD);

        // WHEN
        mockMvc.perform(MockMvcRequestBuilders.post(LOGIN_URL)
                        .content(objectMapper.writeValueAsString(loginRequest))
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isUnauthorized())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").exists());
    }

    @Test
    public void test_login_without_required_data_returns_bad_request() throws Exception {
        // GIVEN
        LoginRequestDTO loginRequest = new LoginRequestDTO();
        // Pas de login ni password

        // WHEN
        mockMvc.perform(MockMvcRequestBuilders.post(LOGIN_URL)
                        .content(objectMapper.writeValueAsString(loginRequest))
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isBadRequest());
    }
}
