# Utiliser une image Node.js LTS officielle
FROM node:18-slim

# Création d'un utilisateur non-root
RUN groupadd -r nodeapp && \
    useradd -r -g nodeapp -s /bin/bash -d /home/nodeapp nodeapp && \
    mkdir -p /home/nodeapp && \
    chown -R nodeapp:nodeapp /home/nodeapp

# Installation des dépendances de sécurité
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Définition du répertoire de travail
WORKDIR /app

# Création et configuration des permissions du répertoire de l'application
RUN mkdir -p /app/node_modules && \
    chown -R nodeapp:nodeapp /app

# Copie des fichiers de dépendances
COPY --chown=nodeapp:nodeapp package*.json ./

# Installation des dépendances en tant que nodeapp
USER nodeapp
RUN npm install --only=production

# Copie du code source
COPY --chown=nodeapp:nodeapp . .

# Configuration de sécurité
ENV NODE_ENV=production
ENV PORT=3000

# Exposition du port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Démarrage de l'application
CMD ["node", "server.js"]
