-- Migration V3: Create files table
-- Description: Table pour stocker les métadonnées des fichiers uploadés par les utilisateurs

CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NULLABLE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size >= 0),
    mime_type VARCHAR(100) NOT NULL,
    download_token VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(60) NULLABLE,
    expiration_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_files_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index pour optimiser la recherche par token de téléchargement (US01)
CREATE INDEX idx_files_download_token ON files(download_token);

-- Index pour optimiser la récupération de l'historique utilisateur (US05)
CREATE INDEX idx_files_user_id ON files(user_id);

-- Index pour optimiser la suppression automatique des fichiers expirés
CREATE INDEX idx_files_expiration_date ON files(expiration_date);

-- Commentaires pour documentation
COMMENT ON TABLE files IS 'Métadonnées des fichiers uploadés par les utilisateurs';
COMMENT ON COLUMN files.user_id IS 'FK vers users, NULLABLE pour supporter les uploads anonymes futurs';
COMMENT ON COLUMN files.filename IS 'Nom du fichier stocké sur le système de fichiers';
COMMENT ON COLUMN files.original_filename IS 'Nom original du fichier uploadé par l''utilisateur';
COMMENT ON COLUMN files.filepath IS 'Chemin relatif du fichier dans le storage';
COMMENT ON COLUMN files.file_size IS 'Taille du fichier en octets';
COMMENT ON COLUMN files.mime_type IS 'Type MIME du fichier (ex: application/pdf)';
COMMENT ON COLUMN files.download_token IS 'Token unique pour le téléchargement public';
COMMENT ON COLUMN files.password_hash IS 'Hash BCrypt du mot de passe optionnel pour restreindre le téléchargement';
COMMENT ON COLUMN files.expiration_date IS 'Date d''expiration du fichier (1-7 jours après upload)';
