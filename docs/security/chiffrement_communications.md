# 🔐 Chiffrement des Communications

L'application DataShare utilise **HTTPS avec TLS** pour sécuriser toutes les communications entre le client et le serveur.

## Architecture de Sécurité

### Flux de Communication

```
Client (Browser)
    ↓ HTTPS (TLS 1.2/1.3)
Reverse Proxy (rproxy - Nginx)
    ↓ HTTP (réseau interne Docker)
Frontend Container (Nginx)
Backend Container (Spring Boot)
```

!!! info "Sécurité par couches"
    - **Externe** : Communication chiffrée HTTPS entre client et reverse proxy
    - **Interne** : Communication HTTP sur réseau Docker isolé (`datashare-net`)
    - **Isolation** : Le réseau interne est marqué `internal: true` (pas d'accès Internet direct)

---

## 🛡️ Configuration TLS/SSL

### Protocoles Supportés

La configuration Nginx du reverse proxy autorise uniquement :

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
```

!!! success "Sécurité moderne"
    - ✅ **TLS 1.2** : Standard actuel, largement supporté
    - ✅ **TLS 1.3** : Version la plus récente, plus rapide et sécurisée
    - ❌ **TLS 1.0/1.1** : Dépréciés et vulnérables (désactivés)

### Suites de Chiffrement

Configuration Mozilla Intermediate (équilibre sécurité/compatibilité) :

```nginx
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:
            ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:
            ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:
            DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
```

### Certificats SSL/TLS

#### Infrastructure PKI (Public Key Infrastructure)

!!! Danger "Certificats auto-signés"
    Les certificats utilisés en environnement de test sont auto-signés et ne doivent **jamais** être utilisés en production.  
    Ces certificats sont uniquement destinés à des fins de développement et de test.

L'application utilise une PKI complète avec certificats auto-signés pour l'environnement de test :

```
docker/pki/
├── root/                  # Autorité racine (Root CA)
├── intermediate/          # Autorité intermédiaire (Intermediate CA)
│   └── certs/
│       └── intermediate_server_ca.cert.pem
└── server/                # Certificats serveur
    ├── certs/
    │   └── datashare.projet3.oc.cert.pem
    └── private/
        └── datashare.projet3.oc.key.pem
```

#### Configuration Nginx

```nginx
server {
    listen 443 ssl;
    server_name www.datashare.projet3.oc;
    
    ssl_certificate     /etc/nginx/server.crt;
    ssl_certificate_key /etc/nginx/server.key;
    ssl_trusted_certificate /etc/nginx/ssl/trusted_chain.crt;
}
```

Montage des certificats dans `docker-compose.yml` :

```yaml
rproxy:
  volumes:
    - ./docker/pki/server/certs/datashare.projet3.oc.cert.pem:/etc/nginx/server.crt:ro
    - ./docker/pki/server/private/datashare.projet3.oc.key.pem:/etc/nginx/server.key:ro
    - ./docker/pki/intermediate/certs/intermediate_server_ca.cert.pem:/etc/nginx/ssl/trusted_chain.crt:ro
```

!!! note "Production"
    En production réelle, remplacer par des certificats Let's Encrypt ou d'une autorité reconnue.

### Sessions SSL

```nginx
ssl_session_timeout    1d;
ssl_session_cache      shared:SSL:10m;
ssl_session_tickets    off;
```

- **Timeout** : 1 jour de cache pour réutiliser les sessions
- **Cache partagé** : 10 MB entre workers Nginx
- **Session tickets désactivés** : Évite vulnérabilités potentielles

---

## 🔒 Headers de Sécurité HTTP

Le reverse proxy ajoute automatiquement des headers de sécurité à toutes les réponses :

### HSTS (HTTP Strict Transport Security)

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

Force les navigateurs à utiliser HTTPS pour toutes les requêtes futures (1 an).

### Content Security Policy (CSP)

```nginx
add_header Content-Security-Policy 
    "default-src 'self' http: https: ws: wss: data: blob: 'unsafe-inline'; 
     frame-ancestors 'self';" always;
```

Contrôle les ressources autorisées à charger (scripts, styles, images, etc.).

### Protection XSS

```nginx
add_header X-XSS-Protection "1; mode=block" always;
```

Active la protection XSS intégrée des navigateurs (mode blocage).

### Protection Type Sniffing

```nginx
add_header X-Content-Type-Options "nosniff" always;
```

Empêche les navigateurs de deviner le type MIME des fichiers.

### Referrer Policy

```nginx
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

Ne transmet l'URL référente que sur connexions HTTPS→HTTPS ou HTTP→HTTP.

### Permissions Policy

```nginx
add_header Permissions-Policy "interest-cohort=()" always;
```

Désactive FLoC (Federated Learning of Cohorts) de Google.

---

## 🔄 Redirection HTTP → HTTPS

Toutes les requêtes HTTP (port 80) sont automatiquement redirigées vers HTTPS (port 443) :

```nginx
server {
    listen 80;
    server_name www.datashare.projet3.oc;
    return 301 https://$host$request_uri;
}
```

De même, les requêtes vers des sous-domaines ou le domaine sans `www` sont redirigées :

```nginx
server {
    listen 443 ssl;
    server_name .datashare.projet3.oc;
    return 301 https://www.datashare.projet3.oc$request_uri;
}
```

!!! success "Résultat"
    - `http://www.datashare.projet3.oc` → `https://www.datashare.projet3.oc`
    - `https://datashare.projet3.oc` → `https://www.datashare.projet3.oc`
    - `https://api.datashare.projet3.oc` → `https://www.datashare.projet3.oc`

---

## 🌐 Configuration CORS

Le backend Spring Boot gère les requêtes CORS (Cross-Origin Resource Sharing) pour autoriser les appels API depuis différentes origines.

### Origines Autorisées

Configurées via la variable d'environnement `CORS_ALLOWED_ORIGINS` :

```bash
# backend/.env
CORS_ALLOWED_ORIGINS=http://localhost:4200,http://127.0.0.1:4200,http://192.168.10.163:4200,http://frontend:4200,https://www.datashare.projet3.oc
```

!!! info "Multiples environnements"
    - `localhost:4200` et `127.0.0.1:4200` : Développement local
    - `192.168.10.163:4200` : Accès réseau local (tests multi-devices)
    - `frontend:4200` : Communication Docker interne
    - `www.datashare.projet3.oc` : Environnement de production

### Headers CORS Retournés

Le backend ajoute automatiquement :

```
Access-Control-Allow-Origin: <origine autorisée>
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Allow-Credentials: true
```

---

## 🚀 Optimisations de Performance

### Compression gzip

```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_min_length 256;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript 
           application/javascript application/json application/xml
           font/ttf font/otf image/svg+xml;
```

Réduit la taille des réponses HTTP (~70% pour text/json/css).

### Keepalive

```nginx
keepalive_timeout 65;
keepalive_requests 1000;
```

Réutilise les connexions TCP pour réduire la latence.

### Buffering Uploads

```nginx
proxy_buffering off;
proxy_request_buffering off;
```

Désactive le buffering pour les uploads de fichiers (streaming direct).

---

## 📊 Monitoring et Logs

Les logs Nginx sont redirigés vers Docker pour visibilité :

```nginx
access_log /var/log/nginx/access.log;
error_log  /var/log/nginx/error.log debug;
```

Montage dans `docker-compose.yml` :

```yaml
rproxy:
  volumes:
    - ./logs/nginx:/var/log/nginx
```

Les logs sont accessibles dans le dossier `logs/nginx/` de l'hôte.

---

## ✅ Checklist de Sécurité

- [x] TLS 1.2+ uniquement (1.0/1.1 désactivés)
- [x] Suites de chiffrement modernes (Mozilla Intermediate)
- [x] Certificats SSL/TLS configurés
- [x] HSTS activé (force HTTPS pendant 1 an)
- [x] Redirection automatique HTTP → HTTPS
- [x] Headers de sécurité (CSP, X-Frame-Options, etc.)
- [x] CORS configuré avec origines restreintes
- [x] Compression gzip pour performance
- [x] Logs accessibles pour audit
- [x] Réseau Docker interne isolé

!!! warning "Production réelle"
    Pour un déploiement production :
    
    1. Utiliser des certificats Let's Encrypt ou d'une CA reconnue
    2. Configurer un WAF (Web Application Firewall)
    3. Activer rate limiting
    4. Centraliser les logs (ELK, Splunk, etc.)
    5. Mettre en place une surveillance (Prometheus, Grafana)

---
