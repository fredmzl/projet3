-- Script de seed pour créer des données de démonstration
-- Crée 2 utilisateurs avec différents types de fichiers (publics, protégés, expirés)

-- ========================================
-- Nettoyer les tables avant d'insérer des données de test
-- ========================================

DELETE FROM files;
DELETE FROM users;

-- reinitialiser les ids des tables
ALTER SEQUENCE users_id_seq RESTART WITH 1;

-- ========================================
-- Créer les utilisateurs
-- ========================================

-- Alice (mot de passe: AliceDemo123)
-- Hash BCrypt: $2a$10$8K1p/a0dL3.XR4t/Zt5pxea5Y5PdYjKfH4xYzYv.BZLMxYXQqLxsi
INSERT INTO users (login, password, created_at, updated_at)
VALUES (
    'alice@example.com',
    '$2a$10$FDDOYpHTNvXQ5.E1Q8uyc.YGFs1e8I.BeRAptodDi9IHDOSu8xeZy',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Bob (mot de passe: BobDemo123)
-- Hash BCrypt: $2a$10$N9qo8uLOickgx2ZMRZoMye1JjJ0UjZZxBLHR/9nzJ5xHhLDLl3jG6
INSERT INTO users (login, password, created_at, updated_at)
VALUES (
    'bob@example.com',
    '$2a$10$FDDOYpHTNvXQ5.E1Q8uyc.YGFs1e8I.BeRAptodDi9IHDOSu8xeZy',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- ========================================
-- Créer les fichiers pour Alice
-- ========================================

-- Fichier 1: Public, expiré
INSERT INTO files (
    id, user_id, original_filename, filename, filepath, file_size, mime_type,
    download_token, password_hash, expiration_date, created_at, updated_at
)
VALUES (
    gen_random_uuid(),
    (SELECT id FROM users WHERE login = 'alice@example.com'),
    'presentation.txt',
    'presentation.txt',
    (SELECT id FROM users WHERE login = 'alice@example.com') || '/demo/presentation.txt',
    245,
    'text/plain',
    gen_random_uuid()::text,
    NULL,
    CURRENT_TIMESTAMP - INTERVAL '1 days',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Fichier 2: Protégé par mot de passe (password), expire dans 7 jours
-- Hash BCrypt de "password": $2a$10$FDDOYpHTNvXQ5.E1Q8uyc.YGFs1e8I.BeRAptodDi9IHDOSu8xeZy
INSERT INTO files (
    id, user_id, original_filename, filename, filepath, file_size, mime_type,
    download_token, password_hash, expiration_date, created_at, updated_at
)
VALUES (
    gen_random_uuid(),
    (SELECT id FROM users WHERE login = 'alice@example.com'),
    'secret-notes.md',
    'secret-notes.md',
    (SELECT id FROM users WHERE login = 'alice@example.com') || '/demo/secret-notes.md',
    271,
    'text/markdown',
    gen_random_uuid()::text,
    '$2a$10$FDDOYpHTNvXQ5.E1Q8uyc.YGFs1e8I.BeRAptodDi9IHDOSu8xeZy',
    CURRENT_TIMESTAMP + INTERVAL '7 days',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Fichier 3: Public, expire dans 7 jours
INSERT INTO files (
    id, user_id, original_filename, filename, filepath, file_size, mime_type,
    download_token, password_hash, expiration_date, created_at, updated_at
)
VALUES (
    gen_random_uuid(),
    (SELECT id FROM users WHERE login = 'alice@example.com'),
    'report.txt',
    'report.txt',
    (SELECT id FROM users WHERE login = 'alice@example.com') || '/demo/report.txt',
    257,
    'text/plain',
    gen_random_uuid()::text,
    NULL,
    CURRENT_TIMESTAMP + INTERVAL '7 days',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Fichier 4: Expiré (date dans le passé)
INSERT INTO files (
    id, user_id, original_filename, filename, filepath, file_size, mime_type,
    download_token, password_hash, expiration_date, created_at, updated_at
)
VALUES (
    gen_random_uuid(),
    (SELECT id FROM users WHERE login = 'alice@example.com'),
    'old-document.txt',
    'old-document.txt',
    (SELECT id FROM users WHERE login = 'alice@example.com') || '/demo/old-document.txt',
    121,
    'text/plain',
    gen_random_uuid()::text,
    NULL,
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '10 days',
    CURRENT_TIMESTAMP - INTERVAL '10 days'
);

-- ========================================
-- Créer les fichiers pour Bob
-- ========================================

-- Fichier 1: Public, expire dans 7 jours
INSERT INTO files (
    id, user_id, original_filename, filename, filepath, file_size, mime_type,
    download_token, password_hash, expiration_date, created_at, updated_at
)
VALUES (
    gen_random_uuid(),
    (SELECT id FROM users WHERE login = 'bob@example.com'),
    'budget.txt',
    'budget.txt',
    (SELECT id FROM users WHERE login = 'bob@example.com') || '/demo/budget.txt',
    169,
    'text/plain',
    gen_random_uuid()::text,
    NULL,
    CURRENT_TIMESTAMP + INTERVAL '7 days',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Fichier 2: Protégé par mot de passe (password), expire dans 5 jours
-- Hash BCrypt de "password": $2a$10$FDDOYpHTNvXQ5.E1Q8uyc.YGFs1e8I.BeRAptodDi9IHDOSu8xeZy
INSERT INTO files (
    id, user_id, original_filename, filename, filepath, file_size, mime_type,
    download_token, password_hash, expiration_date, created_at, updated_at
)
VALUES (
    gen_random_uuid(),
    (SELECT id FROM users WHERE login = 'bob@example.com'),
    'private-data.txt',
    'private-data.txt',
    (SELECT id FROM users WHERE login = 'bob@example.com') || '/demo/private-data.txt',
    206,
    'text/plain',
    gen_random_uuid()::text,
    '$2a$10$FDDOYpHTNvXQ5.E1Q8uyc.YGFs1e8I.BeRAptodDi9IHDOSu8xeZy',
    CURRENT_TIMESTAMP + INTERVAL '5 days',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Fichier 3: Public, expire dans 3 jours
INSERT INTO files (
    id, user_id, original_filename, filename, filepath, file_size, mime_type,
    download_token, password_hash, expiration_date, created_at, updated_at
)
VALUES (
    gen_random_uuid(),
    (SELECT id FROM users WHERE login = 'bob@example.com'),
    'meeting-notes.md',
    'meeting-notes.md',
    (SELECT id FROM users WHERE login = 'bob@example.com') || '/demo/meeting-notes.md',
    291,
    'text/markdown',
    gen_random_uuid()::text,
    NULL,
    CURRENT_TIMESTAMP + INTERVAL '3 days',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

