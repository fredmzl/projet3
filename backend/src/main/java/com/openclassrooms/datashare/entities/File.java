package com.openclassrooms.datashare.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity
@Table(name = "files")
public class File {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)
    private User user;

    @NotBlank
    @Column(name = "filename", nullable = false, length = 255)
    private String filename;

    @NotBlank
    @Column(name = "original_filename", nullable = false, length = 255)
    private String originalFilename;

    @NotBlank
    @Column(name = "filepath", nullable = false, length = 500)
    private String filepath;

    @NotNull
    @Positive
    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @NotBlank
    @Column(name = "mime_type", nullable = false, length = 100)
    private String mimeType;

    @NotBlank
    @Column(name = "download_token", nullable = false, unique = true, length = 100)
    private String downloadToken;

    @Column(name = "password_hash", length = 60)
    private String passwordHash;

    @NotNull
    @Column(name = "expiration_date", nullable = false)
    private LocalDateTime expirationDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
