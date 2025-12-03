# Code Review - Backend Spring Boot

> **Contexte** : Revue de code du backend DataShare MVP (Spring Boot 3.5.7 + Java 21)  
> **Date** : Décembre 2025  
> **Objectif** : Validation des bonnes pratiques Java/Spring Boot

---

## 📊 Vue d'ensemble

| Métrique | Valeur | Statut |
|----------|--------|--------|
| **Tests unitaires** | 120+ méthodes | ✅ Excellent |
| **Couverture code** | > 85% (JaCoCo) | ✅ Excellent |
| **Architecture** | Controller → Service → Repository | ✅ Clean |
| **Sécurité** | JWT + BCrypt + CORS + Validation | ✅ Robuste |
| **Spring Boot** | 3.5.7 | ✅ Dernière version |
| **Java** | 21 (LTS) | ✅ Version moderne |

---

## ✅ Points forts

### 1. Architecture & Organisation

**✅ Séparation des couches strictement respectée**
```
com.openclassrooms.datashare/
├── controller/        # API REST (3 contrôleurs)
├── service/           # Logique métier (6 services)
├── repository/        # Accès données (2 repositories JPA)
├── entities/          # Modèle de domaine
├── dto/               # Data Transfer Objects
├── mapper/            # MapStruct (conversion DTO/Entity)
├── exception/         # Exceptions métier personnalisées
├── configuration/     # Configuration Spring (Security, CORS, Logging)
└── validation/        # Validateurs personnalisés
```

**✅ Single Responsibility Principle**  
- `FileService` : orchestration upload/liste/suppression  
- `FileStorageService` : gestion physique des fichiers (filesystem)  
- `DownloadService` : logique de téléchargement (validation, expiration)  
- `TokenGeneratorService` : génération tokens uniques  
- `JwtService` : gestion tokens JWT (génération, validation)  
- `UserService` : authentification et enregistrement  

### 2. Sécurité

**✅ Authentification JWT robuste**
```java
@Service
public class JwtService {
    @Value("${jwt.secret}")          // ✅ Externalisé
    private String secretKey;
    
    @Value("${jwt.expiration:86400000}") // ✅ 24h par défaut
    private Long jwtExpiration;
    
    // ✅ HMAC-SHA256 avec clé secrète
    // ✅ Validation expiration automatique
}
```

**✅ Protection des endpoints**
```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) {
    return http
        .csrf(AbstractHttpConfigurer::disable)  // ✅ Stateless API
        .sessionManagement(STATELESS)           // ✅ Pas de session
        .authorizeHttpRequests(authorize -> authorize
            .requestMatchers("/api/auth/**").permitAll()      // ✅ Public
            .requestMatchers("/api/download/{token}").permitAll()  
            .requestMatchers("/api/files/**").authenticated() // ✅ Protected
        )
        .addFilterBefore(jwtAuthenticationFilter, ...)
        .build();
}
```

**✅ Hachage mots de passe BCrypt**
```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();  // ✅ Work factor 10 (défaut)
}
```

**✅ Validation MIME type**
```java
@Component
public class MimeTypeValidator {
    private static final Set<String> DANGEROUS_TYPES = Set.of(
        "application/x-msdownload",  // .exe
        "application/x-sh",          // .sh
        "application/x-executable"   // binaires
    );
    // ✅ Bloque les fichiers dangereux
}
```

**✅ Contrôle d'accès propriétaire**
```java
@DeleteMapping("/{fileId}")
public ResponseEntity<?> deleteFile(@PathVariable UUID fileId, @AuthenticationPrincipal User user) {
    // ✅ Vérifie que user.id == file.user.id avant suppression
    fileService.deleteFile(fileId, user);
}
```

### 3. Gestion des erreurs

**✅ Handler global avec `@RestControllerAdvice`**
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(...) {
        // ✅ Retourne détails de validation par champ
    }
    
    @ExceptionHandler(FileNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleFileNotFoundException(...) {
        // ✅ HTTP 404 avec message structuré
    }
    
    @ExceptionHandler(FileExpiredException.class)
    public ResponseEntity<Map<String, String>> handleFileExpiredException(...) {
        // ✅ HTTP 410 Gone (sémantique correcte)
    }
}
```

**✅ Exceptions métier personnalisées**  
- `FileNotFoundException` → HTTP 404  
- `FileExpiredException` → HTTP 410 Gone  
- `InvalidPasswordException` → HTTP 403  
- `AccessDeniedException` → HTTP 403  

### 4. Tests

**✅ Couverture excellente : 85%+ (114 tests backend)**

**Tests unitaires avec Mockito**
```java
@ExtendWith(MockitoExtension.class)
class FileServiceTest {
    @Mock private FileRepository fileRepository;
    @Mock private FileStorageService storageService;
    @InjectMocks private FileService fileService;
    
    @Test
    void uploadFile_shouldValidateFileSize() { ... }
}
```

**Tests d'intégration avec Testcontainers**
```java
@SpringBootTest
@Testcontainers
class FileControllerTest {
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");
    
    @Autowired private MockMvc mockMvc;
    
    @Test
    void uploadFile_shouldReturn201_whenValid() { ... }
}
```

### 5. Qualité du code

**✅ Lombok** : réduit le boilerplate
```java
@Data @NoArgsConstructor @AllArgsConstructor
@RequiredArgsConstructor  // Injection par constructeur
@Slf4j                     // Logger automatique
```

**✅ MapStruct** : mapping type-safe DTO ↔ Entity
```java
@Mapper(componentModel = "spring")
public interface FileMapper {
    @Mapping(target = "hasPassword", expression = "java(file.getPasswordHash() != null)")
    FileUploadResponseDto toUploadResponse(File file);
    
    @AfterMapping
    default void calculateIsExpired(@MappingTarget FileMetadataDto dto, File file) {
        dto.setIsExpired(file.getExpirationDate().isBefore(LocalDateTime.now()));
    }
}
```

**✅ Bean Validation** : validation déclarative
```java
public class FileUploadRequestDto {
    @Min(value = 1, message = "La durée d'expiration doit être au minimum de 1 jour")
    @Max(value = 7, message = "La durée d'expiration doit être au maximum de 7 jours")
    private Integer expirationDays = 7;

    @Size(min = 4, message = "Le mot de passe doit contenir au moins 4 caractères")
    private String password;
}
```

**✅ Logging structuré**
```java
log.info("Starting file upload for user: {} (id={})", user.getLogin(), user.getId());
log.warn("File size exceeded: {}", e.getMessage());
log.error("Unexpected error during file upload", e);
```

### 6. Configuration externalisée

**✅ Propriétés via environment variables**
```properties
# application.properties
app.storage.path=${STORAGE_PATH:/var/datashare/storage}
app.download.base-url=${DOWNLOAD_BASE_URL:http://localhost:4200/download}
jwt.secret=${JWT_SECRET}
cors.allowed-origins=${CORS_ORIGINS:http://localhost:4200}
```

---

## ⚠️ Points d'amélioration

### Mineurs

#### 1. Secret JWT par défaut 🔐

**Issue** : Valeur par défaut dans `application.properties`
```properties
jwt.secret=${JWT_SECRET:mySecretKey}  # ⚠️ Fallback faible
```

**Recommandation** :
```java
@PostConstruct
public void validateConfig() {
    if ("mySecretKey".equals(secretKey)) {
        throw new IllegalStateException("JWT_SECRET environment variable must be set in production");
    }
}
```

#### 2. Naming conventions 🔤

**Issue** : Champs `User` en snake_case
```java
private LocalDateTime created_at;  // ⚠️ Java convention = camelCase
private LocalDateTime updated_at;
```

**Recommandation** :
```java
@CreationTimestamp
@Column(name = "created_at")
private LocalDateTime createdAt;  // ✅ Java style
```

#### 3. Limite pagination 📄

**Issue** : Paramètre `size` sans limite max
```java
@GetMapping
public ResponseEntity<?> listFiles(
    @RequestParam(defaultValue = "20") Integer size  // ⚠️ Pas de @Max
) { ... }
```

**Recommandation** :
```java
@RequestParam(defaultValue = "20") 
@Max(value = 100, message = "Maximum 100 items per page")
Integer size
```

### Moyens

#### 4. Stratégie validation MIME 🛡️

**Situation actuelle** : Blacklist des types dangereux
```java
private static final Set<String> DANGEROUS_TYPES = Set.of(
    "application/x-msdownload",  // .exe
    "application/x-sh",          // .sh
    "application/java-archive"   // .jar
);
```

**Analyse** :  
- ✅ Adapté pour un MVP (flexibilité)  
- ⚠️ Nouveaux types malveillants non bloqués  
- ⚠️ Bypass possible avec double extension  

**Recommandation** :
```java
// Pour contextes haute sécurité, préférer whitelist
private static final Set<String> ALLOWED_TYPES = Set.of(
    "image/jpeg", "image/png", "application/pdf", 
    "text/plain", "application/zip"
);
```

#### 5. Transactions et filesystem ⚛️

**Issue** : Suppression DB vs filesystem non atomique
```java
@Transactional
public void deleteFile(UUID fileId, User user) {
    fileRepository.deleteById(fileId);      // ✅ Transactionnel
    storageService.deleteFile(file.getFilepath());  // ⚠️ Hors transaction
}
```

**Risque** : Enregistrement supprimé en BDD mais fichier reste sur disque  

**Recommandations** :  
1. **Court terme** : Job de nettoyage périodique (fichiers orphelins)  
2. **Long terme** : Pattern Saga ou compensating transaction  

---

## Structure générale

1. **Architecture clean** : Controller → Service → Repository strictement respecté  
2. **Sécurité multicouche** : JWT + BCrypt + validation MIME + contrôle accès propriétaire  
3. **Tests robustes** : 85%+ de couverture avec Testcontainers (PostgreSQL réel)  
4. **Production-ready** : Configuration externalisée, logging structuré, health checks Actuator  


### Évolutions techniques

**Pour passage en production** :  
1. ✅ Configurer `JWT_SECRET` via secrets manager (AWS Secrets Manager, HashiCorp Vault)  
2. ✅ Activer Spring Actuator metrics + export vers Prometheus  
3. ✅ Implémenter rate limiting sur endpoints publics (`/api/download`)  
4. ✅ Ajouter audit logging (qui télécharge quoi, quand)  
5. ✅ Scheduled task pour nettoyage fichiers expirés (cron)  

**Pour scaling horizontal** :  
1. ✅ JWT stateless permet load balancing sans session affinity  
2. ⚠️ Remplacer filesystem local par S3 (stockage distribué)  
3. ✅ PostgreSQL déjà adapté au scaling (read replicas)  

---

## 🎯 Verdict final

| Critère | Note | Commentaire |
|---------|------|-------------|
| **Architecture** | A | Clean, maintenable, testable |
| **Sécurité** | A- | Excellente, quelques durcissements possibles |
| **Tests** | A+ | Couverture 85%+, Testcontainers, mocking approprié |
| **Qualité code** | A | Lombok, MapStruct, validation déclarative |
| **Production-ready** | B+ | Excellente base, config hardening nécessaire |

**Note globale : A (17/20)**  

**Points forts** :  
- Architecture exemplaire pour un MVP  
- Sécurité complète et moderne  
- Couverture de tests exceptionnelle  
- Code propre et idiomatique Spring Boot  

**Points d'attention** :  
- Durcir configuration production (secrets, limites)  
- Documenter stratégie validation MIME (blacklist = choix conscient pour MVP)  
- Prévoir évolution stockage filesystem → S3 pour scaling  

---

## 📚 Références  

- [Spring Security Best Practices](https://docs.spring.io/spring-security/reference/features/exploits/index.html)  
- [OWASP Top 10 2021](https://owasp.org/Top10/)  
- [JWT Best Practices (RFC 8725)](https://datatracker.ietf.org/doc/html/rfc8725)  
- [12-Factor App Methodology](https://12factor.net/)  
- [JaCoCo Code Coverage](https://www.jacoco.org/jacoco/trunk/doc/)  
