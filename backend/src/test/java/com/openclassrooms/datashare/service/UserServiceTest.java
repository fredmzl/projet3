package com.openclassrooms.datashare.service;

import com.openclassrooms.datashare.entities.User;
import com.openclassrooms.datashare.repository.UserRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {
    private static final String LOGIN = "login@domain.net";
    private static final String PASSWORD = "PASSWORD";
    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @InjectMocks
    private UserService userService;

    @Test
    public void test_create_null_user_throws_IllegalArgumentException() {
        // GIVEN

        // THEN
        Assertions.assertThrows(IllegalArgumentException.class,
                () -> userService.register(null));
    }

    @Test
    public void test_create_already_exist_user_throws_IllegalArgumentException() {
        // GIVEN
        User user = new User();
        user.setLogin(LOGIN);
        user.setPassword(PASSWORD);
        when(userRepository.findByLogin(any())).thenReturn(Optional.of(user));

        // THEN
        Assertions.assertThrows(IllegalArgumentException.class,
                () -> userService.register(user));
    }

    @Test
    public void test_create_user() {
        // GIVEN
        User user = new User();
        user.setLogin(LOGIN);
        user.setPassword(PASSWORD);
        when(passwordEncoder.encode(PASSWORD)).thenReturn(PASSWORD);
        when(userRepository.findByLogin(any())).thenReturn(Optional.empty());

        // WHEN
        userService.register(user);

        // THEN
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertThat(userCaptor.getValue()).isEqualTo(user);
    }

    @Test
    public void test_login_with_valid_credentials_returns_jwt_token() {
        // GIVEN
        User user = new User();
        user.setLogin(LOGIN);
        user.setPassword("encodedPassword");
        
        String expectedToken = "jwt.token.here";
        
        when(userRepository.findByLogin(LOGIN)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(PASSWORD, "encodedPassword")).thenReturn(true);
        when(jwtService.generateToken(any())).thenReturn(expectedToken);

        // WHEN
        String actualToken = userService.login(LOGIN, PASSWORD);

        // THEN
        assertThat(actualToken).isEqualTo(expectedToken);
        verify(userRepository).findByLogin(LOGIN);
        verify(passwordEncoder).matches(PASSWORD, "encodedPassword");
        verify(jwtService).generateToken(any());
    }

    @Test
    public void test_login_with_invalid_password_throws_IllegalArgumentException() {
        // GIVEN
        User user = new User();
        user.setLogin(LOGIN);
        user.setPassword("encodedPassword");
        
        when(userRepository.findByLogin(LOGIN)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(PASSWORD, "encodedPassword")).thenReturn(false);

        // THEN
        Assertions.assertThrows(IllegalArgumentException.class,
                () -> userService.login(LOGIN, PASSWORD),
                "Invalid credentials");
    }

    @Test
    public void test_login_with_non_existing_user_throws_IllegalArgumentException() {
        // GIVEN
        when(userRepository.findByLogin(LOGIN)).thenReturn(Optional.empty());

        // THEN
        Assertions.assertThrows(IllegalArgumentException.class,
                () -> userService.login(LOGIN, PASSWORD),
                "Invalid credentials");
    }

    @Test
    public void test_login_with_null_login_throws_IllegalArgumentException() {
        // GIVEN
        String nullLogin = null;

        // THEN
        Assertions.assertThrows(IllegalArgumentException.class,
                () -> userService.login(nullLogin, PASSWORD),
                "Login must not be null");
    }

    @Test
    public void test_login_with_null_password_throws_IllegalArgumentException() {
        // GIVEN
        String nullPassword = null;

        // THEN
        Assertions.assertThrows(IllegalArgumentException.class,
                () -> userService.login(LOGIN, nullPassword),
                "Password must not be null");
    }
        
    @Test
    void register_should_hash_password() {
        // GIVEN
        String rawPassword = "password123";
        String hashedPassword = "$2a$10$...";
        
        when(passwordEncoder.encode(rawPassword)).thenReturn(hashedPassword);
        when(userRepository.findByLogin(any())).thenReturn(Optional.empty());
        
        User user = new User();
        user.setLogin("test@test.com");
        user.setPassword(rawPassword);
        
        // WHEN
        userService.register(user);
        
        // THEN
        verify(passwordEncoder).encode(rawPassword);
        assertThat(user.getPassword()).isEqualTo(hashedPassword);
        verify(userRepository).save(user);
    }
}
