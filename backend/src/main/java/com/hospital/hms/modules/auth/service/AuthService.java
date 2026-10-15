package com.hospital.hms.modules.auth.service;

import com.hospital.hms.common.exceptions.AccountLockedException;
import com.hospital.hms.common.exceptions.BadRequestException;
import com.hospital.hms.common.exceptions.ResourceNotFoundException;
import com.hospital.hms.common.exceptions.UnauthorizedException;
import com.hospital.hms.modules.audit.service.AuditService;
import com.hospital.hms.modules.auth.dto.*;
import com.hospital.hms.modules.auth.entity.RefreshToken;
import com.hospital.hms.modules.auth.repository.RefreshTokenRepository;
import com.hospital.hms.modules.doctor.entity.Doctor;
import com.hospital.hms.modules.doctor.repository.DoctorRepository;
import com.hospital.hms.modules.patient.entity.Patient;
import com.hospital.hms.modules.patient.repository.PatientRepository;
import com.hospital.hms.modules.user.entity.Role;
import com.hospital.hms.modules.user.entity.User;
import com.hospital.hms.modules.user.repository.RoleRepository;
import com.hospital.hms.modules.user.repository.UserRepository;
import com.hospital.hms.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuditService auditService;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;

    @Value("${security.auth.max-failed-attempts:5}")
    private int maxFailedAttempts;

    @Value("${security.auth.lockout-duration-minutes:15}")
    private int lockoutDurationMinutes;

    @Transactional
    public JwtAuthResponse login(LoginRequest request, String ipAddress, String userAgent) {
        String identifier = request.getUsernameOrEmail().trim();
        User user = userRepository.findByUsernameOrEmail(identifier)
                .orElseThrow(() -> {
                    auditService.logEvent(null, identifier, "LOGIN_FAILED_UNKNOWN_USER", "USER", null, ipAddress, userAgent, "User not found");
                    return new BadCredentialsException("Invalid username or password");
                });

        // 1. Account Lockout Check
        if (user.isAccountLocked()) {
            if (user.getLockoutUntil() != null && user.getLockoutUntil().isAfter(LocalDateTime.now())) {
                auditService.logEvent(user.getId(), user.getUsername(), "LOGIN_ATTEMPT_LOCKED_ACCOUNT", "USER", String.valueOf(user.getId()), ipAddress, userAgent, "Locked until: " + user.getLockoutUntil());
                throw new AccountLockedException("Your account is locked due to multiple failed login attempts. Please try again after " + user.getLockoutUntil());
            } else {
                // Auto-unlock expired lockout
                user.setAccountLocked(false);
                user.setFailedLoginAttempts(0);
                user.setLockoutUntil(null);
            }
        }

        // 2. Active status check
        if (!user.isActive()) {
            auditService.logEvent(user.getId(), user.getUsername(), "LOGIN_ATTEMPT_DISABLED_ACCOUNT", "USER", String.valueOf(user.getId()), ipAddress, userAgent, "Account disabled");
            throw new UnauthorizedException("Your account has been deactivated. Please contact hospital administration.");
        }

        // 3. Password Verification
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            int attempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(attempts);

            if (attempts >= maxFailedAttempts) {
                user.setAccountLocked(true);
                user.setLockoutUntil(LocalDateTime.now().plusMinutes(lockoutDurationMinutes));
                userRepository.save(user);

                auditService.logEvent(user.getId(), user.getUsername(), "ACCOUNT_LOCKED", "USER", String.valueOf(user.getId()), ipAddress, userAgent, "Account locked after " + attempts + " consecutive failed attempts");
                throw new AccountLockedException("Account has been locked due to " + attempts + " consecutive failed attempts. Please try again in " + lockoutDurationMinutes + " minutes.");
            }

            userRepository.save(user);
            auditService.logEvent(user.getId(), user.getUsername(), "LOGIN_FAILED", "USER", String.valueOf(user.getId()), ipAddress, userAgent, "Incorrect password attempt " + attempts + " of " + maxFailedAttempts);
            throw new BadCredentialsException("Invalid username or password");
        }

        // 4. Successful Login - Reset attempts
        user.setFailedLoginAttempts(0);
        user.setAccountLocked(false);
        user.setLockoutUntil(null);
        userRepository.save(user);

        // 5. Generate Tokens
        List<String> roles = user.getRoles().stream().map(Role::getName).collect(Collectors.toList());
        String accessToken = tokenProvider.generateAccessTokenForUser(user.getId(), user.getUsername(), user.getEmail(), roles);

        String rawRefreshToken = tokenProvider.generateRawRefreshToken();
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(rawRefreshToken)
                .expiryDate(LocalDateTime.now().plusSeconds(tokenProvider.getRefreshExpirationMs() / 1000))
                .isRevoked(false)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();
        refreshTokenRepository.save(refreshToken);

        auditService.logEvent(user.getId(), user.getUsername(), "LOGIN_SUCCESS", "USER", String.valueOf(user.getId()), ipAddress, userAgent, "Successful authentication");

        return JwtAuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(rawRefreshToken)
                .tokenType("Bearer")
                .expiresIn(tokenProvider.getAccessExpirationMs() / 1000)
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .gender(resolveUserGender(user.getId(), roles))
                .roles(roles)
                .build();
    }

    private String resolveUserGender(Long userId, List<String> roles) {
        if (roles != null && roles.contains("ROLE_DOCTOR")) {
            return doctorRepository.findByUserId(userId).map(Doctor::getGender).orElse(null);
        } else if (roles != null && roles.contains("ROLE_PATIENT")) {
            return patientRepository.findByUserId(userId).map(Patient::getGender).orElse(null);
        }
        return null;
    }

    @Transactional
    public JwtAuthResponse refreshToken(RefreshTokenRequest request, String ipAddress, String userAgent) {
        String tokenStr = request.getRefreshToken().trim();
        RefreshToken existingToken = refreshTokenRepository.findByTokenHash(tokenStr)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (existingToken.isRevoked()) {
            // Potential token reuse / compromise: revoke all user tokens
            refreshTokenRepository.revokeAllTokensForUser(existingToken.getUser());
            auditService.logEvent(existingToken.getUser().getId(), existingToken.getUser().getUsername(), "REVOKED_REFRESH_TOKEN_REUSE_DETECTED", "TOKEN", String.valueOf(existingToken.getId()), ipAddress, userAgent, "Suspicious reuse of revoked token");
            throw new UnauthorizedException("Revoked refresh token presented. All active sessions have been invalidated for security.");
        }

        if (existingToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            existingToken.setRevoked(true);
            refreshTokenRepository.save(existingToken);
            throw new UnauthorizedException("Refresh token has expired. Please log in again.");
        }

        // Rotate Refresh Token
        existingToken.setRevoked(true);
        refreshTokenRepository.save(existingToken);

        User user = existingToken.getUser();
        List<String> roles = user.getRoles().stream().map(Role::getName).collect(Collectors.toList());
        String newAccessToken = tokenProvider.generateAccessTokenForUser(user.getId(), user.getUsername(), user.getEmail(), roles);

        String newRawRefreshToken = tokenProvider.generateRawRefreshToken();
        RefreshToken newRefreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(newRawRefreshToken)
                .expiryDate(LocalDateTime.now().plusSeconds(tokenProvider.getRefreshExpirationMs() / 1000))
                .isRevoked(false)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();
        refreshTokenRepository.save(newRefreshToken);

        auditService.logEvent(user.getId(), user.getUsername(), "TOKEN_REFRESH_SUCCESS", "TOKEN", String.valueOf(newRefreshToken.getId()), ipAddress, userAgent, "Rotated refresh token");

        return JwtAuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRawRefreshToken)
                .tokenType("Bearer")
                .expiresIn(tokenProvider.getAccessExpirationMs() / 1000)
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .gender(resolveUserGender(user.getId(), roles))
                .roles(roles)
                .build();
    }

    @Transactional
    public UserSummaryResponse register(RegisterRequest request, String ipAddress, String userAgent) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered");
        }

        Set<Role> roles = new HashSet<>();
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            for (String roleName : request.getRoles()) {
                String normalizedRole = roleName.startsWith("ROLE_") ? roleName : "ROLE_" + roleName;
                Role role = roleRepository.findByName(normalizedRole)
                        .orElseThrow(() -> new BadRequestException("Role not found: " + roleName));
                roles.add(role);
            }
        } else {
            // Default to PATIENT role
            Role defaultRole = roleRepository.findByName("ROLE_PATIENT")
                    .orElseThrow(() -> new BadRequestException("Default ROLE_PATIENT not found in system"));
            roles.add(defaultRole);
        }

        User user = User.builder()
                .username(request.getUsername().trim())
                .email(request.getEmail().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .phoneNumber(request.getPhoneNumber())
                .isActive(true)
                .roles(roles)
                .build();

        User savedUser = userRepository.save(user);

        auditService.logEvent(savedUser.getId(), savedUser.getUsername(), "USER_REGISTERED", "USER", String.valueOf(savedUser.getId()), ipAddress, userAgent, "Registered with roles: " + roles.stream().map(Role::getName).collect(Collectors.joining(", ")));

        return UserSummaryResponse.builder()
                .id(savedUser.getId())
                .username(savedUser.getUsername())
                .email(savedUser.getEmail())
                .firstName(savedUser.getFirstName())
                .lastName(savedUser.getLastName())
                .phoneNumber(savedUser.getPhoneNumber())
                .roles(savedUser.getRoles().stream().map(Role::getName).collect(Collectors.toList()))
                .active(savedUser.isActive())
                .build();
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request, String ipAddress, String userAgent) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            auditService.logEvent(userId, user.getUsername(), "PASSWORD_CHANGE_FAILED", "USER", String.valueOf(userId), ipAddress, userAgent, "Invalid current password provided");
            throw new BadRequestException("Current password does not match");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Invalidate all active refresh tokens on password change
        refreshTokenRepository.revokeAllTokensForUser(user);

        auditService.logEvent(userId, user.getUsername(), "PASSWORD_CHANGED", "USER", String.valueOf(userId), ipAddress, userAgent, "Password successfully updated and tokens revoked");
    }

    @Transactional(readOnly = true)
    public UserSummaryResponse getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        return UserSummaryResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phoneNumber(user.getPhoneNumber())
                .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toList()))
                .active(user.isActive())
                .build();
    }
}
