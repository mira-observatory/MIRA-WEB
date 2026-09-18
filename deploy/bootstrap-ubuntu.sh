#!/usr/bin/env bash
# Preparacion del servidor de frontend con Ubuntu 24.04.
# Instala Docker; para HTTPS tambien se configura Nginx/Certbot en el host.
# Ver README.md: el Nginx de la imagen solo sirve los archivos estaticos.
set -euo pipefail
test "$(id -u)" = 0
. /etc/os-release
test "$ID" = ubuntu
test "$VERSION_ID" = 24.04
export DEBIAN_FRONTEND=noninteractive

if ! command -v docker >/dev/null 2>&1; then
    apt-get -o DPkg::Lock::Timeout=120 update
    apt-get -o DPkg::Lock::Timeout=120 install -y ca-certificates curl
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc
    cat > /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: noble
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
    apt-get -o DPkg::Lock::Timeout=120 update
    apt-get -o DPkg::Lock::Timeout=120 install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
systemctl enable --now docker
install -d -m 0750 /opt/mira-web
docker --version
docker compose version
