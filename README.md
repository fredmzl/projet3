# oc-projet3

## Getting started

install mise :

```bash
curl https://mise.run | sh
echo "eval \"\$(/home/fred/.local/bin/mise activate bash)\"" >> ~/.bashrc
source ~/.bashrc
mise doctor # to verify installation
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
| `mise run backend:test` | Lance les tests unitaires et d'intégration |
| `mise run backend:coverage` | Génère le rapport de couverture des tests (JaCoCo) |
| `mise run backend:log` | Affiche les logs du backend en temps réel |

### Base de données

| Commande | Description |
|----------|-------------|
| `mise run database:flush` | Supprime tous les conteneurs et volumes de la base de données postgresql |

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
