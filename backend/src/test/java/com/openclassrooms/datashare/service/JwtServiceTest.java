package com.openclassrooms.datashare.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Tests unitaires pour JwtService
 * Tests de génération et validation des tokens JWT
 */
@ExtendWith(SpringExtension.class)
public class JwtServiceTest {

    private static final String TEST_USERNAME = "testuser@domain.net";
    private static final String TEST_PASSWORD = "password";
    private static final String TEST_SECRET_KEY = "testSecretKeyForJwtTokenGenerationThatIsLongEnoughForHS256Algorithm";
    private static final Long TEST_EXPIRATION = 86400000L; // 24 heures

    @InjectMocks
    private JwtService jwtService;

    private UserDetails userDetails;

    @BeforeEach
    public void setUp() {
        // Configuration des propriétés de test via ReflectionTestUtils
        ReflectionTestUtils.setField(jwtService, "secretKey", TEST_SECRET_KEY);
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", TEST_EXPIRATION);
        
        // Création d'un UserDetails de test
        userDetails = User.builder()
                .username(TEST_USERNAME)
                .password(TEST_PASSWORD)
                .authorities(new ArrayList<>())
                .build();
    }

    @Test
    public void test_generate_token_returns_valid_jwt() {
        // GIVEN
        // UserDetails configuré dans setUp()

        // WHEN
        String token = jwtService.generateToken(userDetails);

        // THEN
        // Vérifie que le token n'est pas null et n'est pas vide
        assertNotNull(token, "Le token généré ne doit pas être null");
        assertThat(token).isNotEmpty();
        
        // Vérifie que le token contient les parties d'un JWT (header.payload.signature)
        String[] tokenParts = token.split("\\.");
        assertThat(tokenParts).hasSize(3);
        assertThat(tokenParts[0]).isNotEmpty(); // Header
        assertThat(tokenParts[1]).isNotEmpty(); // Payload  
        assertThat(tokenParts[2]).isNotEmpty(); // Signature
    }

    @Test
    public void test_extract_username_from_valid_token() {
        // GIVEN
        String token = jwtService.generateToken(userDetails);

        // WHEN
        String extractedUsername = jwtService.extractUsername(token);

        // THEN
        assertThat(extractedUsername).isEqualTo(TEST_USERNAME);
    }

    @Test
    public void test_is_token_valid_with_valid_token_returns_true() {
        // GIVEN
        String token = jwtService.generateToken(userDetails);

        // WHEN
        boolean isValid = jwtService.isTokenValid(token, userDetails);

        // THEN
        assertTrue(isValid, "Le token valide doit retourner true");
    }

    @Test
    public void test_is_token_valid_with_valid_token_and_username_returns_true() {
        // GIVEN
        String token = jwtService.generateToken(userDetails);

        // WHEN
        boolean isValid = jwtService.isTokenValid(token, TEST_USERNAME);

        // THEN
        assertTrue(isValid, "Le token valide avec username correct doit retourner true");
    }

    @Test
    public void test_is_token_valid_with_wrong_username_returns_false() {
        // GIVEN
        String token = jwtService.generateToken(userDetails);
        String wrongUsername = "wronguser";

        // WHEN
        boolean isValid = jwtService.isTokenValid(token, wrongUsername);

        // THEN
        assertFalse(isValid, "Le token avec un mauvais username doit retourner false");
    }

    @Test
    public void test_is_token_valid_with_different_userdetails_returns_false() {
        // GIVEN
        String token = jwtService.generateToken(userDetails);
        
        UserDetails differentUserDetails = User.builder()
                .username("differentuser")
                .password("password")
                .authorities(new ArrayList<>())
                .build();

        // WHEN
        boolean isValid = jwtService.isTokenValid(token, differentUserDetails);

        // THEN
        assertFalse(isValid, "Le token avec des UserDetails différents doit retourner false");
    }

    @Test
    public void test_generate_token_with_extra_claims() {
        // GIVEN
        java.util.Map<String, Object> extraClaims = new java.util.HashMap<>();
        extraClaims.put("role", "USER");
        extraClaims.put("userId", 123L);

        // WHEN
        String token = jwtService.generateToken(extraClaims, userDetails);

        // THEN
        assertNotNull(token, "Le token avec claims supplémentaires ne doit pas être null");
        assertThat(token).isNotEmpty();
        
        // Vérifie que le username peut toujours être extrait
        String extractedUsername = jwtService.extractUsername(token);
        assertThat(extractedUsername).isEqualTo(TEST_USERNAME);
    }
}