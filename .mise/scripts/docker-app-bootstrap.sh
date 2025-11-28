#!/bin/bash

# Script pour seeder la base de données avec des données de démonstration
# Crée 2 utilisateurs avec différents types de fichiers
# Usage: ./seed-test-data.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="$SCRIPT_DIR/app-bootstrap-data.sql"
STORAGE_PATH="${STORAGE_PATH:-/var/datashare/storage}"
COMPOSE_FILE="${MISE_CONFIG_ROOT}/docker-compose.yml"

# Couleurs pour l'output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}🌱 Seeding database with demo data${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Vérifier que docker postgres est lancé
echo -e "${BLUE}🔍 Checking PostgreSQL container...${NC}"
if ! docker compose -f "${COMPOSE_FILE}" ps postgres 2>/dev/null | grep -q "Up"; then
    echo -e "${RED}❌ PostgreSQL container is not running!${NC}"
    echo "Please start the app first: mise app:docker:deploy"
    exit 1
fi
echo -e "${GREEN}✅ PostgreSQL is running${NC}"
echo ""

# Exécuter le script SQL
echo -e "${BLUE}📊 Executing SQL seed script...${NC}"
docker compose -f "${COMPOSE_FILE}" exec -T postgres \
    psql -U db_user -d datashare < "$SQL_FILE"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to seed database${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Database seeded${NC}"
echo ""

# Créer les fichiers physiques dans le storage
echo -e "${BLUE}📁 Creating physical files in storage...${NC}"

# Récupérer les IDs des utilisateurs depuis la base
ALICE_ID=$(docker compose -f "${COMPOSE_FILE}" exec -T postgres \
    psql -U db_user -d datashare -t -c "SELECT id FROM users WHERE login = 'alice@example.com';" | tr -d ' ')

BOB_ID=$(docker compose -f "${COMPOSE_FILE}" exec -T postgres \
    psql -U db_user -d datashare -t -c "SELECT id FROM users WHERE login = 'bob@example.com';" | tr -d ' ')

# Vérifier que docker posbackend est lancé
echo -e "${BLUE}🔍 Checking backend container...${NC}"
if ! docker compose -f "${COMPOSE_FILE}" ps backend 2>/dev/null | grep -q "Up"; then
    echo -e "${RED}❌ Backend container is not running!${NC}"
    echo "Please start the app first: mise app:docker:deploy"
    exit 1
fi
echo -e "${GREEN}✅ Backend is running${NC}"
echo ""

# Créer les répertoires
docker compose -f "${COMPOSE_FILE}" exec -T backend mkdir -p "$STORAGE_PATH/$ALICE_ID/demo"
docker compose -f "${COMPOSE_FILE}" exec -T backend mkdir -p "$STORAGE_PATH/$BOB_ID/demo"

# Créer les fichiers d'Alice
docker compose -f "${COMPOSE_FILE}" exec -T backend sh -c "cat > $STORAGE_PATH/$ALICE_ID/demo/presentation.txt << 'EOFFILE'
Project Presentation

This document contains the project presentation.
Created for demonstration purposes.

Key features:
- File upload with expiration
- Secure password protection
- Public download links
- User authentication

Status: Active
EOFFILE
"


docker compose -f "${COMPOSE_FILE}" exec -T backend sh -c "cat > $STORAGE_PATH/$ALICE_ID/demo/secret-notes.md << 'EOFFILE'
# Secret Notes

🔒 **This file is protected by password: SecretAlice2024**

## Confidential Information

These notes contain sensitive information:
- Meeting notes from 2025-11-21
- Project roadmap Q1 2026
- Budget estimates

⚠️ Do not share without authorization.
EOFFILE
"

docker compose -f "${COMPOSE_FILE}" exec -T backend sh -c "cat > $STORAGE_PATH/$ALICE_ID/demo/report.txt << 'EOFFILE'
Monthly Report - November 2025

Summary of activities:
1. Development progress: 85% complete
2. Testing results: All tests passing
3. Documentation updates: In progress

Next steps:
- Finalize user documentation
- Prepare deployment
- Conduct final testing
EOFFILE
"

docker compose -f "${COMPOSE_FILE}" exec -T backend sh -c "cat > $STORAGE_PATH/$ALICE_ID/demo/old-document.txt << 'EOFFILE'
This is an old document that has already expired.
Last update: 2024-01-15

This file is kept for archival purposes only.
EOFFILE
"

# Créer les fichiers de Bob
docker compose -f "${COMPOSE_FILE}" exec -T backend sh -c "cat > $STORAGE_PATH/$BOB_ID/demo/budget.txt << 'EOFFILE'
Project Budget Q4 2025

Total Budget: €50,000

Breakdown:
- Development: €30,000 (60%)
- Testing: €10,000 (20%)
- Documentation: €10,000 (20%)

Status: Approved
EOFFILE
"

docker compose -f "${COMPOSE_FILE}" exec -T backend sh -c "cat > $STORAGE_PATH/$BOB_ID/demo/private-data.txt << 'EOFFILE'
CONFIDENTIAL DATA

🔒 **Password required: BobPass2024**

Access restricted to authorized personnel only.

Contents:
- Client information
- Contract details
- Financial data

Classification: Confidential
EOFFILE
"

docker compose -f "${COMPOSE_FILE}" exec -T backend sh -c "cat > $STORAGE_PATH/$BOB_ID/demo/meeting-notes.md << 'EOFFILE'
# Meeting Notes - 2025-11-21

## Attendees
- Alice (Project Manager)
- Bob (Tech Lead)
- Carol (Designer)

## Agenda
1. Project status update
2. Next milestones planning
3. Q&A session

## Decisions
- Deploy to production next week
- Schedule additional testing phase
- Update documentation
EOFFILE
"

echo -e "${GREEN}✅ Physical files created${NC}"
echo ""

echo -e "${YELLOW}========================================${NC}"
echo -e "${GREEN}✅ Bootstrap completed successfully!${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

echo -e "${BLUE}👤 Demo Users Created:${NC}"
echo ""
echo "  📧 alice@example.com"
echo "     🔑 Password: password"
echo "     📁 Files: 4 (2 public, 1 protected, 1 expired)"
echo ""
echo "  📧 bob@example.com"
echo "     🔑 Password: password"
echo "     📁 Files: 3 (2 public, 1 protected)"
echo ""

echo -e "${BLUE}🔐 Protected Files Passwords:${NC}"
echo "  • alice@example.com - secret-notes.md → ${YELLOW}password${NC}"
echo "  • bob@example.com - private-data.txt → ${YELLOW}password${NC}"
echo ""

echo -e "${BLUE}🧪 Quick Test Commands:${NC}"
echo ""
echo "# Login as Alice:"
echo "ALICE_TOKEN=\$(curl -ks -X POST \"https://www.datashare.projet3.oc/api/auth/login\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"login\":\"alice@example.com\",\"password\":\"password\"}' 2>/dev/null | jq -r '.token')"
echo ""
echo "# List Alice's files:"
echo "curl -ks -X GET \"https://www.datashare.projet3.oc/api/files\" \\"
echo "  -H \"Authorization: Bearer \\\$ALICE_TOKEN\" | jq '.content'"
echo ""
echo "# Download a protected file (replace {TOKEN} with actual token from list above):"
echo "curl -ks -X POST \"https://www.datashare.projet3.oc/api/download/{TOKEN}\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"password\":\"password\"}' -o downloaded.md"
echo ""

