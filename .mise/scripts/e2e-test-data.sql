-- Script de seed pour les tests E2E
-- Crée un utilisateur de test avec des credentials connus

-- ========================================
-- Nettoyer les tables avant d'insérer des données de test
-- ========================================

DELETE FROM files;
DELETE FROM users;

-- reinitialiser les ids des tables
ALTER SEQUENCE users_id_seq RESTART WITH 1;

-- Créer l'utilisateur de test
-- Mot de passe: "password" hashé avec BCrypt (10 rounds)
-- Hash généré avec: BCrypt.hashpw("password", BCrypt.gensalt(10))
INSERT INTO users (login, password, created_at, updated_at)
VALUES (
    'testuser@example.net',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- BCrypt hash de "password"
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (login) DO UPDATE SET
    password = EXCLUDED.password,
    updated_at = CURRENT_TIMESTAMP;

-- Message de confirmation
-- SELECT 'Utilisateur de test créé: testuser@example.net / password' as status;
