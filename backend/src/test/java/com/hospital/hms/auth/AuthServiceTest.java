package com.hospital.hms.auth;

import com.hospital.hms.common.exceptions.AccountLockedException;
import com.hospital.hms.modules.audit.service.AuditService;
import com.hospital.hms.modules.auth.dto.JwtAuthResponse;
import com.hospital.hms.modules.auth.dto.LoginRequest;
import com.hospital.hms.modules.auth.entity.RefreshToken;
import com.hospital.hms.modules.auth.repository.RefreshTokenRepository;
import com.hospital.hms.modules.auth.service.AuthService;
import com.hospital.hms.modules.user.entity.Role;
import com.hospital.hms.modules.user.entity.User;
import com.hospital.hms.modules.user.repository.RoleRepository;
import com.hospital.hms.modules.user.repository.UserRepository;
import com.hospital.hms.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;
    private Role adminRole;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "maxFailedAttempts", 5);
        ReflectionTestUtils.setField(authService, "lockoutDurationMinutes", 15);

        adminRole = Role.builder()
                .id(1L)
                .name("ROLE_HOSPITAL_ADMIN")
                .description("Hospital Administrator")
                .build();

        sampleUser = User.builder()
                .id(10L)
                .username("admin")
                .email("admin@pulse-hospital.com")
                .passwordHash("hashed_password")
                .firstName("John")
                .lastName("Doe")
                .isActive(true)
                .isAccountLocked(false)
                .failedLoginAttempts(0)
                .roles(Set.of(adminRole))
                .build();
    }

    @Test
    @DisplayName("Should successfully authenticate user with valid credentials")
    void testSuccessfulLogin() {
        LoginRequest request = new LoginRequest("admin", "Password@123");

        when(userRepository.findByUsernameOrEmail("admin")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("Password@123", "hashed_password")).thenReturn(true);
        when(tokenProvider.generateAccessTokenForUser(eq(10L), eq("admin"), eq("admin@pulse-hospital.com"), any())).thenReturn("mock-access-token");
        when(tokenProvider.generateRawRefreshToken()).thenReturn("mock-refresh-token");
        when(tokenProvider.getRefreshExpirationMs()).thenReturn(604800000L);
        when(tokenProvider.getAccessExpirationMs()).thenReturn(900000L);
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        JwtAuthResponse response = authService.login(request, "127.0.0.1", "Mozilla/5.0");

        assertNotNull(response);
        assertEquals("mock-access-token", response.getAccessToken());
        assertEquals("admin", response.getUsername());
        assertEquals("John", response.getFirstName());
        assertEquals(0, sampleUser.getFailedLoginAttempts());
        verify(userRepository, atLeastOnce()).save(sampleUser);
    }

    @Test
    @DisplayName("Should reject invalid password and increment failed login count")
    void testInvalidPasswordIncrementsFailureCount() {
        LoginRequest request = new LoginRequest("admin", "WrongPassword");

        when(userRepository.findByUsernameOrEmail("admin")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("WrongPassword", "hashed_password")).thenReturn(false);

        assertThrows(BadCredentialsException.class, () -> {
            authService.login(request, "127.0.0.1", "Mozilla/5.0");
        });

        assertEquals(1, sampleUser.getFailedLoginAttempts());
        verify(userRepository).save(sampleUser);
    }

    @Test
    @DisplayName("Should lock account when failed login attempts reach threshold")
    void testAccountLockoutAfterMaxFailures() {
        sampleUser.setFailedLoginAttempts(4);
        LoginRequest request = new LoginRequest("admin", "WrongPassword");

        when(userRepository.findByUsernameOrEmail("admin")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("WrongPassword", "hashed_password")).thenReturn(false);

        assertThrows(AccountLockedException.class, () -> {
            authService.login(request, "127.0.0.1", "Mozilla/5.0");
        });

        assertTrue(sampleUser.isAccountLocked());
        assertNotNull(sampleUser.getLockoutUntil());
        verify(userRepository).save(sampleUser);
    }
}
