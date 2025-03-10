# Multi-stage build pour Prometheus
FROM prom/prometheus:latest as prometheus

# Multi-stage build pour Grafana
FROM grafana/grafana:latest as grafana

# Image finale
FROM ubuntu:22.04

# Installation des dépendances
RUN apt-get update && apt-get install -y \
    supervisor \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Création des répertoires nécessaires
RUN mkdir -p \
    /var/log/supervisor \
    /etc/supervisor/conf.d \
    /var/log/prometheus \
    /var/log/grafana \
    /etc/prometheus \
    /usr/share/prometheus \
    /usr/share/grafana \
    /prometheus \
    /var/lib/grafana \
    && touch /var/log/supervisor/supervisord.log \
    && chown -R nobody:nogroup \
        /var/log/supervisor \
        /var/log/prometheus \
        /var/log/grafana \
        /etc/supervisor/conf.d \
        /etc/prometheus \
        /usr/share/prometheus \
        /usr/share/grafana \
        /prometheus \
        /var/lib/grafana \
    && chmod -R 755 \
        /var/log/supervisor \
        /var/log/prometheus \
        /var/log/grafana \
        /etc/supervisor/conf.d \
        /etc/prometheus \
        /usr/share/prometheus \
        /usr/share/grafana \
        /prometheus \
        /var/lib/grafana

# Copie des binaires et configurations
COPY --from=prometheus /bin/prometheus /bin/prometheus
COPY --from=prometheus /etc/prometheus/prometheus.yml /etc/prometheus/
COPY --from=grafana /usr/share/grafana /usr/share/grafana

# Copie des fichiers de configuration
COPY docker/monitoring/prometheus/prometheus.yml /etc/prometheus/
COPY docker/monitoring/prometheus/alert.rules /etc/prometheus/
COPY docker/monitoring/grafana/provisioning /etc/grafana/provisioning/
COPY docker/monitoring/grafana/dashboards /var/lib/grafana/dashboards/
COPY docker/monitoring/supervisord.conf /etc/supervisor/conf.d/

# Exposition des ports
EXPOSE 3000 9090

# Utilisation de l'utilisateur non-root
USER nobody

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:9090/-/healthy || exit 1

# Démarrage des services
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
