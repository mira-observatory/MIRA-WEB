#!/usr/bin/env bash
# Entrada unica para un frontend nuevo con Ubuntu 24.04.
# El archivo de imagen es opcional; sin el se construye en este servidor.
set -euo pipefail
if [[ $# -lt 3 || $# -gt 4 ]]; then
    echo 'Uso: bash deploy/bootstrap-ubuntu.sh DOMINIO ALIAS API_IP_PRIVADA [IMAGEN_TAR]' >&2
    exit 2
fi
test "$(id -u)" = 0
image_archive=''
if [[ $# = 4 ]]; then
    test -f "$4"
    image_archive="$(realpath "$4")"
fi
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$script_dir/.."
if [[ ! -f .env.digitalocean ]]; then
    echo 'Crear .env.digitalocean desde .env.example segun docs/operations-and-recovery.md.' >&2
    exit 1
fi
. /etc/os-release
test "$ID" = ubuntu
test "$VERSION_ID" = 24.04
export DEBIAN_FRONTEND=noninteractive

apt-get -o DPkg::Lock::Timeout=120 update
echo '1/3 Instalando Docker, Nginx y Certbot...'
apt-get -o DPkg::Lock::Timeout=120 install -y ca-certificates curl nginx certbot git

if ! command -v docker >/dev/null 2>&1; then
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
nginx -v
certbot --version

echo '2/3 Preparando y arrancando la imagen web...'
chmod 600 .env.digitalocean
compose=(docker compose --env-file .env.digitalocean)
"${compose[@]}" config --quiet
# Leer solo configuracion publica resuelta por Compose, sin ejecutar el .env.
web_bind="$("${compose[@]}" config --environment | sed -n 's/^MIRA_HTTP_BIND=//p')"
web_port="$("${compose[@]}" config --environment | sed -n 's/^MIRA_HTTP_PORT=//p')"
api_url="$("${compose[@]}" config --environment | sed -n 's/^VITE_MIRA_API_BASE_URL=//p')"
if [[ "${web_bind:-127.0.0.1}" != 127.0.0.1 || "$api_url" != /api ]]; then
    echo 'Este despliegue requiere MIRA_HTTP_BIND=127.0.0.1 y VITE_MIRA_API_BASE_URL=/api.' >&2
    exit 1
fi
if [[ -n "$image_archive" ]]; then
    docker load --input "$image_archive"
else
    "${compose[@]}" build
fi
"${compose[@]}" up -d --no-build --pull never --wait --wait-timeout 120
curl --fail --silent --show-error "http://127.0.0.1:${web_port:-8080}/healthz"

echo '3/3 Configurando HTTPS y renovacion automatica...'
bash "$script_dir/configure-https.sh" "$1" "$2" "$3" "${web_port:-8080}"
echo 'Frontend preparado. Verificar ambos dominios y la renovacion segun la guia.'
