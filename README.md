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
