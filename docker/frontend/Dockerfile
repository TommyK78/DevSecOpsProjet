FROM nginx:stable-alpine

# Installation des dépendances de base
RUN apk add --no-cache curl

# Copie des fichiers de configuration
COPY docker/frontend/conf/nginx.conf /etc/nginx/nginx.conf
COPY docker/frontend/conf/default.conf /etc/nginx/conf.d/default.conf

# Copie des fichiers statiques
COPY app/public/ /usr/share/nginx/html/

# Exposition des ports
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1
