# oc-projet3 - DataShare

Application de partage de fichiers sécurisé avec expiration automatique et protection par mot de passe.

## 🚀 Quick Start

### 1. Prérequis

- Java 21
- Node.js 20+
- Docker et Docker Compose
- [Mise](https://mise.jdx.dev/) (gestionnaire de tâches)

### 2. Installation de Mise

```bash
curl https://mise.run | sh
echo "eval \"\$(~/.local/bin/mise activate bash)\"" >> ~/.bashrc
source ~/.bashrc
mise doctor # Vérifier l'installation
mise use -g usage # to enable auto-completion and help
```

### 3. Démarrer et tester l'application

```bash
# Cloner le projet
git clone <repository-url>
cd oc-projet3

# Installer les dépendances
mise install

# bootstraper le projet 
mise prepare

# Déployer la documentation (localhost:8000)
mise doc:start
```

**En mode dev local :**
```bash
# Démarrer l'application complète (backend + frontend)
mise app:dev:start && sleep 5

# vérifier l'état de l'application
mise app:dev:health

# vérifier les data
mise app:dev:showdata

# Créer des données de démo
mise app:dev:bootstrap

# vérifier les data
mise app:dev:showdata

# Afficher les logs de l'backend en temps réel
mise app:dev:logs

# Arrêter l'application complète
mise app:dev:stop
```

L'application sera accessible sur :  
- 🌐 Frontend : http://localhost:4200  
- 🔌 Backend API : http://localhost:3000  
- 📚 Documentation : http://localhost:8000 (avec `mise run doc:start`)  

**En mode Docker (production) :**
```bash 
# Déployer l'application avec Docker (build images + start containers)
mise app:docker:deploy --build && sleep 5

# vérifier les data
mise app:docker:showdata

# Créer des données de démo
mise app:docker:bootstrap

# vérifier les data
mise app:docker:showdata

# Arrêter et détruire l'application Docker
mise app:docker:destroy [--flush] [--rmi]
```

L'application sera accessible sur :  
- 🌐 Frontend : https://www.datashare.projet3.oc  

### 4. Comptes de démonstration

Après avoir exécuté `mise run app:[dev|docker]:bootstrap`, vous disposez de 2 utilisateurs de test :

| Email | Mot de passe | Fichiers |
|-------|--------------|----------|
| `alice@example.com` | `password` | 4 fichiers (1 public, 1 protégé, 2 expirés) |
| `bob@example.com` | `password` | 3 fichiers (2 publics, 1 protégé) |

**Fichiers protégés par mot de passe :**  
- Alice : `secret-notes.md` → mot de passe : `password`  
- Bob : `private-data.txt` → mot de passe : `password`  

### 5. Tester l'application (en mode dev)

#### directement via le backend avec curl

```bash
# Se connecter en tant qu'Alice
ALICE_TOKEN=$(curl -s -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"login":"alice@example.com","password":"password"}' | jq -r '.token')

# Lister les fichiers d'Alice
curl -s -X GET "http://localhost:3000/api/files" \
  -H "Authorization: Bearer $ALICE_TOKEN" | jq '.content[] | {filename, hasPassword, expirationDate}'

# Télécharger un fichier public (remplacer {token} par un vrai token)
curl -X POST "http://localhost:3000/api/download/{token}" \
  -H "Content-Type: application/json" \
  -d '{}' -o fichier-telecharge.txt

# Télécharger un fichier protégé
curl -X POST "http://localhost:3000/api/download/{token}" \
  -H "Content-Type: application/json" \
  -d '{"password":"password"}' -o fichier-protege.txt
```

#### via l'interface web

**se connecter et voir l'historique des fichiers**    
1. Ouvrez votre navigateur et allez à l'adresse [http://localhost:4200](http://localhost:4200)   
2. Connectez-vous avec les identifiants d'Alice ou Bob.    
3. Explorez les fonctionnalités de l'application : téléversement, téléchargement, gestion des fichiers, etc.    

**Tester le téléchargement d'un fichier non protégé**    
1. Depuis l'interface web, essayez de télécharger un fichier non protégé (ex: `public-report.pdf` pour Alice), à l'adresse suivante [http://localhost:4200/download/93ae4861-3dba-424a-bb60-28bf31640cfb](http://localhost:4200/download/93ae4861-3dba-424a-bb60-28bf31640cfb)   
2. cliquer sur le bouton de téléchargement    
3. Le téléchargement du fichier devrait commencer automatiquement    

**Tester le téléchargement d'un fichier protégé**    
1. Depuis l'interface web, essayez de télécharger un fichier protégé (ex: `secret-notes.md` pour Alice), à l'adresse suivante [http://localhost:4200/download/13c0ab76-8cb4-43d6-a9ac-a31da32f148b](http://localhost:4200/download/13c0ab76-8cb4-43d6-a9ac-a31da32f148b)    
2. Une fenêtre modale apparaîtra vous demandant le mot de passe.    
3. Entrez le mot de passe correct (`password`) et validez.    
4. Le téléchargement du fichier devrait commencer automatiquement si le mot de passe est correct.      
 
**Tester le téléchargement d'un fichier expiré**    
1. Depuis l'interface web, essayez de télécharger un fichier non protégé (ex: `public-report.pdf` pour Alice), à l'adresse suivante [http://localhost:4200/download/c649035e-da13-4c59-bb30-bd9f599d53cb](http://localhost:4200/download/c649035e-da13-4c59-bb30-bd9f599d53cb)    
2. Une alerte apparaîtra indiquant que le lien a expiré.    

**Tester le téléchargement avec un token invalide**    
1. Depuis l'interface web, essayez de télécharger un fichier non protégé (ex: `public-report.pdf` pour Alice), à l'adresse suivante [http://localhost:4200/download/c649435e-da13-4c59-bb30-bd9f599d53cb](http://localhost:4200/download/c649435e-da13-4c59-bb30-bd9f599d53cb)    
2. Une alerte apparaîtra indiquant que le fichier n'existe pas.    

---

## Tâches Mise disponibles

Ce projet utilise [Mise](https://mise.jdx.dev/) pour automatiser les tâches de développement.

### Utilisation

```bash
# Lister toutes les tâches disponibles
mise tasks

# Exécuter une tâche
mise <nom-de-la-tache>

# Exemple : démarrer le backend en mode dev
mise app:dev:start

# Exemple : déployer en mode Docker
mise app:docker:deploy --build
```

### Application complète

#### bootstrap environnement de dev 

| Commande | Description |
|----------|-------------|
| `mise prepare` | Vérifie les prérequis et prépare l'environnement de développement |

#### Mode Dev (Local)

| Commande | Description |
|----------|-------------|
| `mise app:dev:start` | Démarre l'application complète en mode dev (backend + frontend) |
| `mise app:dev:stop` | Arrête l'application complète |
| `mise app:dev:restart` | Redémarre l'application complète |
| `mise app:dev:bootstrap` | Crée des données de démonstration (utilisateurs + fichiers) |
| `mise app:dev:health` | Vérifie l'état de santé de l'application en cours d'exécution |
| `mise app:dev:showdata` | Affiche le contenu de la base de données et du storage |
| `mise app:dev:reset` | Arrête l'application et efface toutes les données (database + storage) |

#### Mode Docker (Production)

| Commande | Description |
|----------|-------------|
| `mise app:docker:deploy` | Déploie l'application avec Docker (build images + start containers) |
| `mise app:docker:deploy --build` | Déploie avec rebuild des images Docker |
| `mise app:docker:destroy` | Détruit l'application Docker (stop + remove containers) |
| `mise app:docker:bootstrap` | Crée des données de démonstration dans Docker |
| `mise app:docker:showdata` | Affiche le contenu de la base de données et du storage Docker |

### Documentation

| Commande | Description |
|----------|-------------|
| `mise doc:start` | Démarre le serveur de documentation MkDocs (port 8000) |
| `mise doc:stop` | Arrête le serveur de documentation |
| `mise doc:restart` | Redémarre le serveur de documentation |

### Backend

| Commande | Description |
|----------|-------------|
| `mise backend:build` | Compile le projet backend avec Maven |
| `mise backend:start` | Démarre l'application Spring Boot (port 3000) |
| `mise backend:stop` | Arrête l'application Spring Boot |
| `mise backend:restart` | Redémarre l'application Spring Boot |
| `mise backend:tests:all` | Lance les tests unitaires et d'intégration |
| `mise backend:tests:coverage` | Génère le rapport de couverture des tests (JaCoCo) |
| `mise backend:log` | Affiche les logs du backend en temps réel |

### Frontend

| Commande | Description |
|----------|-------------|
| `mise frontend:build` | Build l'application frontend pour la production |
| `mise frontend:start` | Démarre le serveur de développement Angular (port 4200) |
| `mise frontend:stop` | Arrête le serveur de développement |
| `mise frontend:restart` | Redémarre le serveur de développement |
| `mise frontend:log` | Affiche les logs du frontend en temps réel |
| `mise frontend:tests:all` | Exécute tous les tests frontend (single run) |
| `mise frontend:tests:coverage` | Génère le rapport de couverture des tests frontend |
| `mise frontend:tests:e2e` | Exécute les tests e2e Playwright |

### Base de données

| Commande | Description |
|----------|-------------|
| `mise db:show` | Affiche le contenu des tables de la base de données |
| `mise db:flush` | Supprime tous les conteneurs et volumes de la base de données PostgreSQL |
| `mise db:seed` | Crée un utilisateur de test pour les tests E2E |

### Storage

| Commande | Description |
|----------|-------------|
| `mise storage:show` | Affiche l'arborescence complète du répertoire de stockage `/var/datashare/storage` |
| `mise storage:flush` | Supprime tous les fichiers du répertoire de stockage (destructif) |

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
