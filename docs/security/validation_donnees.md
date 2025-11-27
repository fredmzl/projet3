# Validation des Données

## 🛡️ Principe Fondamental

!!! danger "Règle d'or"
    **JAMAIS faire confiance au client**
    
    Toutes les données entrantes doivent être validées et sanitizées côté serveur, même si une validation existe côté client.

---

## ✅ Validation Côté Serveur

### Obligatoire pour toutes les entrées

La validation côté serveur est **OBLIGATOIRE** car :

- Le client peut être modifié (DevTools, Postman, curl)
- Le JavaScript peut être désactivé
- Les requêtes peuvent être forgées manuellement
- C'est la dernière ligne de défense

### Types de validation

**Format**
:   - Email valide (RFC 5322)
    - Format UUID pour les identifiants
    - Types MIME acceptés pour les fichiers

**Longueur**
:   - Minimum/maximum pour les chaînes
    - Taille maximale des fichiers (ex: 100MB)

**Contenu**
:   - Caractères autorisés
    - Patterns regex pour formats spécifiques
    - Whitelist vs blacklist (préférer whitelist)

**Logique métier**
:   - Utilisateur existe
    - Fichier appartient à l'utilisateur
    - Token non expiré

---

## 🔒 Protection contre les Injections

### SQL Injection

!!! success "Solutions"
    **Requêtes paramétrées (Prepared Statements)**
    ```java
    // ✅ BON - Utilise des paramètres
    String query = "SELECT * FROM users WHERE email = ?";
    PreparedStatement stmt = connection.prepareStatement(query);
    stmt.setString(1, email);
    
    // ❌ MAUVAIS - Concaténation de chaînes
    String query = "SELECT * FROM users WHERE email = '" + email + "'";
    ```
    
    **ORM (Hibernate/JPA)**
    ```java
    // ✅ BON - JPA Repository
    Optional<User> user = userRepository.findByEmail(email);
    ```

### Path Traversal

!!! warning "Risque"
    Accès à des fichiers en dehors du répertoire autorisé via `../../../etc/passwd`

**Protection :**
```java
// Normaliser et valider le chemin
Path basePath = Paths.get("/var/datashare/storage").toRealPath();
Path filePath = basePath.resolve(filename).normalize();

// Vérifier que le fichier est bien dans le répertoire autorisé
if (!filePath.startsWith(basePath)) {
    throw new SecurityException("Path traversal attempt detected");
}
```

### XSS (Cross-Site Scripting)

!!! info "Contexte API"
    DataShare est une API REST → pas de rendu HTML côté serveur
    
    Le risque XSS est principalement côté frontend (Angular)

**Protection côté backend :**
```java
// Échapper les caractères spéciaux dans les réponses JSON
// Spring fait ça automatiquement avec Jackson

// Header de sécurité
response.setHeader("X-Content-Type-Options", "nosniff");
response.setHeader("Content-Type", "application/json; charset=UTF-8");
```

**Protection côté frontend :**
- Angular sanitize automatiquement le contenu
- Utiliser `[innerText]` plutôt que `[innerHTML]`
- Valider et encoder les données affichées

---

## 🚫 Protection CSRF

!!! success "Configuration pour API REST"
    Pour DataShare (API REST stateless avec JWT) :
    
    ✅ **CSRF désactivé** : Les API stateless avec JWT ne sont pas vulnérables au CSRF classique
    
    ✅ **Tokens JWT dans headers** : Pas dans les cookies (impossible à exploiter en CSRF)
    
    ✅ **SameSite cookies** : Si utilisation de cookies pour autre chose

### Pourquoi CSRF n'est pas un problème ici ?

**CSRF nécessite :**
1. Cookies envoyés automatiquement par le navigateur
2. Session basée sur cookies

**DataShare utilise :**
1. JWT dans header `Authorization: Bearer <token>`
2. Headers explicites (pas automatiques)
3. JavaScript requis pour envoyer les headers

---

## 🎯 Validation avec Spring Boot

### Annotations de validation

```java
import javax.validation.constraints.*;

@Entity
public class User {
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 255)
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 64, message = "Password must be between 8 and 64 characters")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$", 
             message = "Password must contain at least one uppercase, one lowercase and one digit")
    private String password;
}
```

### Validation dans les Controllers

```java
@RestController
@RequestMapping("/api/files")
public class FileController {
    
    @PostMapping
    public ResponseEntity<?> uploadFile(
            @Valid @RequestBody FileUploadRequest request,
            BindingResult result) {
        
        if (result.hasErrors()) {
            return ResponseEntity.badRequest()
                .body(result.getAllErrors());
        }
        
        // Validation supplémentaire
        if (request.getFileSize() > MAX_FILE_SIZE) {
            throw new ValidationException("File too large");
        }
        
        // ...
    }
}
```

---

## 📋 Checklist de Validation

!!! tip "À vérifier systématiquement"
    **Authentification**
    - [ ] JWT valide et non expiré
    - [ ] Utilisateur existe en base
    - [ ] Permissions suffisantes
    
    **Upload de fichiers**
    - [ ] Taille maximale respectée (100MB)
    - [ ] Type MIME autorisé (whitelist)
    - [ ] Nom de fichier sanitizé (pas de path traversal)
    - [ ] Extension validée
    
    **Formulaires**
    - [ ] Tous les champs requis présents
    - [ ] Format des données valide
    - [ ] Longueurs min/max respectées
    - [ ] Caractères spéciaux gérés
    
    **Identifiants**
    - [ ] Format UUID valide
    - [ ] Ressource existe
    - [ ] Utilisateur propriétaire de la ressource

---

## ⚠️ Erreurs Courantes

!!! warning "Pièges à éviter"
    - ❌ Se fier uniquement à la validation côté client
    - ❌ Valider avec une blacklist (toujours préférer whitelist)
    - ❌ Logguer les données sensibles dans les erreurs
    - ❌ Exposer trop de détails dans les messages d'erreur
    - ❌ Oublier de valider les données provenant d'autres sources (APIs externes, fichiers de config)