-- Script de seed pour les tests E2E
-- Crée un utilisateur de test avec des credentials connus

-- Supprimer l'utilisateur existant s'il existe (pour éviter les conflits)
DELETE FROM files WHERE user_id IN (SELECT id FROM users WHERE login = 'testuser@example.net');
DELETE FROM users WHERE login = 'testuser@example.net';

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
