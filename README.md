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
mise start && sleep 5

# vérifier l'état de l'application
mise health

# vérifier les data
mise showdata

# Créer des données de démo
mise bootstrap

# vérifier les data
mise showdata

# Afficher les logs en temps réel
mise logs

# Arrêter l'application complète
mise stop
```

L'application sera accessible sur :  
- 🌐 Frontend : http://localhost:4200  
- 🔌 Backend API : http://localhost:3000  
- 📚 Documentation : http://localhost:8000 (avec `mise run doc:start`)  

**En mode Docker (production) :**
```bash 
# Déployer l'application avec Docker (build images + start containers)
mise infra:deploy --build && sleep 5

# vérifier les data
mise infra:showdata

# Créer des données de démo
mise infra:bootstrap

# vérifier les data
mise infra:showdata

# Arrêter et détruire l'application Docker
mise infra:destroy [--flush] [--rmi]
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
mise dev:app:start

# Exemple : déployer en mode Docker
mise infra:deploy --build
```

### 🎯 Workflows rapides

| Commande | Description |
|----------|-------------|
| `mise prepare` | Installe les dépendances Python (venv) |
| `mise start` | Démarre l'application complète (backend + frontend) |
| `mise stop` | Arrête l'application complète |
| `mise restart` | Redémarre l'application complète |
| `mise logs` | Affiche les logs en temps réel (backend + frontend) |
| `mise bootstrap` | Crée des données de démonstration (utilisateurs + fichiers) |
| `mise health` | Vérifie l'état de santé de l'application |
| `mise showdata` | Affiche le contenu de la base de données et du storage |
| `mise reset` | Réinitialise l'application et efface toutes les données |

### 🐳 Infrastructure (Docker)

| Commande | Description |
|----------|-------------|
| `mise infra:deploy` | Déploie l'application avec Docker (build images + start containers) |
| `mise infra:destroy` | Détruit l'application Docker (stop + remove containers) |
| `mise infra:bootstrap` | Crée des données de démonstration dans Docker |
| `mise infra:showdata` | Affiche le contenu de la base de données et du storage Docker |

### Documentation

| Commande | Description |
|----------|-------------|
| `mise doc:start` | Démarre le serveur de documentation MkDocs (port 8000) |
| `mise doc:stop` | Arrête le serveur de documentation |
| `mise doc:restart` | Redémarre le serveur de documentation |

### ⚙️ Backend

| Commande | Description |
|----------|-------------|
| `mise dev:backend:build` | Compile le projet backend avec Maven |
| `mise dev:backend:start` | Démarre l'application Spring Boot (port 3000) |
| `mise dev:backend:stop` | Arrête l'application Spring Boot |
| `mise dev:backend:restart` | Redémarre l'application Spring Boot |
| `mise dev:backend:log` | Affiche les logs du backend en temps réel |

### 🎨 Frontend

| Commande | Description |
|----------|-------------|
| `mise dev:frontend:build` | Build l'application frontend pour la production |
| `mise dev:frontend:start` | Démarre le serveur de développement Angular (port 4200) |
| `mise dev:frontend:stop` | Arrête le serveur de développement |
| `mise dev:frontend:restart` | Redémarre le serveur de développement |
| `mise dev:frontend:log` | Affiche les logs du frontend en temps réel |

### 🧪 Tests

| Commande | Description |
|----------|-------------|
| `mise test:unit:backend` | Lance les tests unitaires backend |
| `mise test:unit:frontend` | Exécute tous les tests frontend (single run) |
| `mise test:e2e` | Exécute les tests e2e Playwright |
| `mise test:coverage:backend` | Génère le rapport de couverture des tests backend (JaCoCo) |
| `mise test:coverage:frontend` | Génère le rapport de couverture des tests frontend |
| `mise test:perf:load` | Exécute les tests de charge K6 sur l'endpoint de téléchargement |

### 🔒 Sécurité

| Commande | Description |
|----------|-------------|
| `mise security:scan:backend` | Scan des vulnérabilités CVE du backend (OWASP Dependency Check) |
| `mise security:scan:frontend` | Scan des vulnérabilités CVE du frontend (npm audit) |
| `mise security:scan:trivy` | Scan des vulnérabilités CVE des images Docker (Trivy) |

### 🗄️ Base de données

| Commande | Description |
|----------|-------------|
| `mise dev:db:show` | Affiche le contenu des tables de la base de données |
| `mise dev:db:flush` | Supprime toutes les données de la base de données |

### 📦 Storage

| Commande | Description |
|----------|-------------|
| `mise dev:storage:show` | Affiche l'arborescence complète du répertoire de stockage |
| `mise dev:storage:flush` | Supprime tous les fichiers du répertoire de stockage (destructif) |

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
