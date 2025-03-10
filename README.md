# Projet DevSecOps

Ce projet implémente une infrastructure sécurisée dans le cloud AWS avec une application conteneurisée et un système de supervision.

## Structure du Projet

```
DevSecOpsProjet/
├── terraform/               # Configuration Infrastructure AWS
│   ├── main.tf             # Configuration principale
│   └── variables.tf        # Variables Terraform
├── docker/                 # Configuration des conteneurs
│   ├── frontend/          # Frontend Nginx
│   │   ├── Dockerfile
│   │   └── nginx.conf
│   ├── backend/           # Backend MariaDB
│   │   ├── Dockerfile
│   │   └── my.cnf
│   └── monitoring/        # Supervision
│       ├── Dockerfile
│       └── prometheus.yml
├── secrets/               # Stockage sécurisé des secrets
└── docker-compose.yml    # Orchestration des conteneurs
```

## Prérequis

- AWS CLI configuré
- Terraform >= 1.2.0
- Docker et Docker Compose
- Git

## Configuration des Secrets

1. Créer les fichiers de secrets nécessaires :
```bash
# Générer des mots de passe sécurisés
openssl rand -base64 32 > secrets/db_root_password.txt
openssl rand -base64 32 > secrets/db_user_password.txt
```

## Déploiement de l'Infrastructure

1. Initialiser Terraform :
```bash
cd terraform
terraform init
```

2. Vérifier le plan Terraform :
```bash
terraform plan
```

3. Appliquer la configuration :
```bash
terraform apply
```

## Déploiement des Conteneurs

1. Générer les certificats SSL :
```bash
# Pour Nginx
mkdir -p docker/frontend/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout docker/frontend/certs/nginx.key -out docker/frontend/certs/nginx.crt

# Pour MariaDB
mkdir -p docker/backend/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout docker/backend/certs/server-key.pem -out docker/backend/certs/server-cert.pem

# Pour Prometheus/Grafana
mkdir -p docker/monitoring/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout docker/monitoring/certs/prometheus.key -out docker/monitoring/certs/prometheus.crt
```

2. Démarrer les conteneurs :
```bash
docker-compose up -d
```

## Sécurité

- Tous les conteneurs utilisent des utilisateurs non-root
- Chiffrement TLS/SSL activé pour tous les services
- Secrets gérés de manière sécurisée
- Réseaux Docker isolés
- Configuration sécurisée pour chaque service

## Supervision

- Grafana : http://localhost:3000 (credentials par défaut : admin/admin)
- Prometheus : http://localhost:9090

## Maintenance

- Sauvegardes automatiques vers S3
- Logs centralisés
- Monitoring des conteneurs
- Alerting configuré dans Grafana

## Sécurité et Bonnes Pratiques

1. **Gestion des Secrets**
   - Utilisation de fichiers secrets Docker
   - Pas de secrets en clair dans le code
   - Rotation régulière des credentials

2. **Sécurité des Conteneurs**
   - Images de base minimales et à jour
   - Utilisateurs non-root
   - Scan des vulnérabilités avec Trivy

3. **Sécurité Réseau**
   - TLS/SSL partout
   - Réseaux Docker isolés
   - Pare-feu AWS configuré

4. **Monitoring**
   - Métriques des conteneurs
   - Alerting
   - Logs centralisés

## Support

Pour toute question ou problème, veuillez ouvrir une issue dans le dépôt Git du projet.
