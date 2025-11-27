#!/bin/bash

# Script pour seeder la base de données avec les données de test
# Usage: ./seed-test-data.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="$SCRIPT_DIR/src/main/resources/db/seed/test-data.sql"

# Couleurs pour l'output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🌱 Seeding database with test data...${NC}"

# Vérifier que Docker Compose est lancé
if ! docker compose ps postgresql | grep -q "Up"; then
    echo -e "${RED}❌ PostgreSQL container is not running!${NC}"
    echo "Please start it with: docker compose up -d postgresql"
    exit 1
fi

# Exécuter le script SQL
docker compose exec -T postgresql psql -U db_user -d datashare < "$SQL_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database seeded successfully!${NC}"
    echo -e "${GREEN}Test user created: testuser@example.net / password${NC}"
else
    echo -e "${RED}❌ Failed to seed database${NC}"
    exit 1
fi
