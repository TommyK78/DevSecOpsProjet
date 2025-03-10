# Utiliser une version spécifique de MariaDB pour la sécurité
FROM mariadb:10.11

# Installation des dépendances
RUN apt-get update && apt-get install -y \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Création des répertoires nécessaires
RUN mkdir -p /var/lib/mysql-files \
    /etc/mysql/ssl \
    /var/log/mysql \
    && chown -R mysql:mysql \
        /var/lib/mysql-files \
        /etc/mysql/ssl \
        /var/log/mysql \
    && chmod 750 /var/lib/mysql-files \
    && chmod 750 /etc/mysql/ssl \
    && chmod 755 /var/log/mysql

# Génération des certificats SSL
RUN openssl genrsa 2048 > /etc/mysql/ssl/ca-key.pem \
    && openssl req -new -x509 -nodes -days 3650 \
        -key /etc/mysql/ssl/ca-key.pem \
        -out /etc/mysql/ssl/ca.pem \
        -subj "/CN=MariaDB CA" \
    && openssl req -newkey rsa:2048 -days 3650 \
        -nodes -keyout /etc/mysql/ssl/server-key.pem \
        -out /etc/mysql/ssl/server-req.pem \
        -subj "/CN=MariaDB Server" \
    && openssl rsa -in /etc/mysql/ssl/server-key.pem \
        -out /etc/mysql/ssl/server-key.pem \
    && openssl x509 -req -in /etc/mysql/ssl/server-req.pem \
        -days 3650 \
        -CA /etc/mysql/ssl/ca.pem \
        -CAkey /etc/mysql/ssl/ca-key.pem \
        -set_serial 01 \
        -out /etc/mysql/ssl/server-cert.pem \
    && chown -R mysql:mysql /etc/mysql/ssl \
    && chmod 400 /etc/mysql/ssl/*.pem

# Copie des fichiers de configuration
COPY docker/backend/mariadb.cnf /etc/mysql/mariadb.conf.d/50-server.cnf
COPY docker/backend/init.sql /docker-entrypoint-initdb.d/

# Exposition du port
EXPOSE 3306

# Utilisation de l'utilisateur non-root
USER mysql

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD mysqladmin ping -h localhost -u root -p$MYSQL_ROOT_PASSWORD || exit 1
