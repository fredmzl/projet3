#!/bin/bash

# Script pour seeder la base de données avec les données de test
# Usage: ./seed-test-data.sh

set -x
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="$SCRIPT_DIR/e2e-test-data.sql"

# Couleurs pour l'output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🌱 Seeding database with test data...${NC}"

# Check PostgreSQL container
echo "🗄️  Checking PostgreSQL..."
if docker ps --format "{{.Names}}" | grep -q "backend-postgresql-1"; then
    if docker exec backend-postgresql-1 pg_isready -U postgres > /dev/null 2>&1; then
        echo "   ✅ PostgreSQL is ready and accepting connections"
    else
        echo "   ❌ PostgreSQL container running but not ready"
        exit 1
    fi
else
    echo "   ❌ PostgreSQL container not running"
    exit 1
fi
echo ""

# Exécuter le script SQL
docker compose -f ${MISE_CONFIG_ROOT}/backend/compose.yaml exec -T postgresql psql -U db_user -d datashare < "$SQL_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database seeded successfully!${NC}"
    echo -e "${GREEN}Test user created: testuser@example.net / password${NC}"
else
    echo -e "${RED}❌ Failed to seed database${NC}"
    exit 1
fi
