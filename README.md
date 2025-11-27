# oc-projet3

## Getting started

install mise :

```bash
curl https://mise.run | sh
echo "eval \"\$(/home/fred/.local/bin/mise activate bash)\"" >> ~/.bashrc
source ~/.bashrc
mise doctor # to verify installation
mise use -g usage # to enable auto-completion and help
```

Then, in the project root, run:
```

bootstrap documentation site
```bash
mise install
mise run prepare
mise run doc:start
```

---

## Tâches Mise disponibles

Ce projet utilise [Mise](https://mise.jdx.dev/) pour automatiser les tâches de développement.

### Application complète

| Commande | Description |
|----------|-------------|
| `mise run app:start` | Démarre l'application complète (backend + frontend) |
| `mise run app:stop` | Arrête l'application complète |
| `mise run app:check` | Vérifie l'état de santé de l'application en cours d'exécution |
| `mise run app:reset` | Réinitialise l'application et toutes les données (database + storage) |

### Documentation

| Commande | Description |
|----------|-------------|
| `mise run doc:start` | Démarre le serveur de documentation MkDocs (port 8000) |
| `mise run doc:stop` | Arrête le serveur de documentation |
| `mise run doc:restart` | Redémarre le serveur de documentation |

### Backend

| Commande | Description |
|----------|-------------|
| `mise run backend:build` | Compile le projet backend avec Maven |
| `mise run backend:start` | Démarre l'application Spring Boot (port 3000) |
| `mise run backend:stop` | Arrête l'application Spring Boot |
| `mise run backend:restart` | Redémarre l'application Spring Boot |
| `mise run backend:tests:all` | Lance les tests unitaires et d'intégration |
| `mise run backend:tests:coverage` | Génère le rapport de couverture des tests (JaCoCo) |
| `mise run backend:log` | Affiche les logs du backend en temps réel |

### Frontend

| Commande | Description |
|----------|-------------|
| `mise run frontend:build` | Build l'application frontend pour la production |
| `mise run frontend:start` | Démarre le serveur de développement Angular (port 4200) |
| `mise run frontend:stop` | Arrête le serveur de développement |
| `mise run frontend:restart` | Redémarre le serveur de développement |
| `mise run frontend:log` | Affiche les logs du frontend en temps réel |
| `mise run frontend:tests:all` | Exécute tous les tests frontend (single run) |
| `mise run frontend:tests:coverage` | Génère le rapport de couverture des tests frontend |

### Base de données

| Commande | Description |
|----------|-------------|
| `mise run database:show` | Affiche le contenu des tables de la base de données |
| `mise run database:flush` | Supprime tous les conteneurs et volumes de la base de données PostgreSQL |
| `mise run database:flush --storage` | Supprime la base de données ET tous les fichiers du storage |
| `mise run database:bootstrap` | Crée des utilisateurs et fichiers de test (testuser, listuser, alice) |

### Storage

| Commande | Description |
|----------|-------------|
| `mise run storage:show` | Affiche l'arborescence complète du répertoire de stockage `/var/datashare/storage` |
| `mise run storage:flush` | Supprime tous les fichiers du répertoire de stockage (destructif) |

### Données (Database + Storage)

| Commande | Description |
|----------|-------------|
| `mise run showdata` | Affiche le contenu de la base de données et du storage |

### Configuration

| Commande | Description |
|----------|-------------|
| `mise run prepare` | Installe les dépendances Python pour la documentation |

### Utilisation

```bash
# Lister toutes les tâches disponibles
mise tasks

# Exécuter une tâche
mise run <nom-de-la-tache>

# Exemple : démarrer le backend
mise run backend:start
```

---

## Configuration Git - Conventional Commits

Ce projet utilise les [Conventional Commits](https://www.conventionalcommits.org/) pour standardiser les messages de commit.

### Format des messages de commit

**Structure :**
```
type(scope): description

[body optionnel]

[footer optionnel]
```

**Types principaux :**  
- `feat`: Nouvelle fonctionnalité  
- `fix`: Correction de bug  
- `docs`: Documentation uniquement    
- `style`: Formatage, point-virgules manquants, etc.  
- `refactor`: Refactoring de code sans ajout de fonctionnalité  
- `perf`: Amélioration des performances  
- `test`: Ajout ou modification de tests  
- `build`: Changements du système de build  
- `ci`: Changements de configuration CI/CD  
- `chore`: Maintenance diverse  

**Exemples :**
```bash
feat(upload): add file size validation  
fix(auth): correct JWT expiration handling  
docs(readme): update installation instructions  
refactor(api): simplify error handling  
test(upload): add unit tests for file validation  
```
