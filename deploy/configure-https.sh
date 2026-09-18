#!/usr/bin/env bash
# Uso: bash deploy/configure-https.sh DOMINIO ALIAS API_IP_PRIVADA [PUERTO_WEB]
# CERTBOT_EMAIL es opcional; sin el se registra una cuenta sin correo.
set -euo pipefail
test "$(id -u)" = 0
if [[ $# -lt 3 || $# -gt 4 ]]; then
    echo 'Uso: configure-https.sh DOMINIO ALIAS API_IP_PRIVADA [PUERTO_WEB]' >&2
    exit 2
fi
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
domain="${1,,}"
alias_domain="${2,,}"
api_ip="$3"
web_port="${4:-8080}"
valid_domain() {
    local label='[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?'
    [[ ${#1} -le 253 && "$1" =~ ^$label(\.$label)+$ ]]
}
private_ipv4() {
    local a b c d
    [[ "$1" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]] || return 1
    IFS=. read -r a b c d <<< "$1"
    a=$((10#$a)); b=$((10#$b)); c=$((10#$c)); d=$((10#$d))
    (( a <= 255 && b <= 255 && c <= 255 && d <= 255 )) || return 1
    (( a == 10 || (a == 172 && b >= 16 && b <= 31) || (a == 192 && b == 168) ))
}
if ! valid_domain "$domain" || ! valid_domain "$alias_domain" || \
   [[ "$domain" = "$alias_domain" ]] || ! private_ipv4 "$api_ip"; then
    echo 'Indicar dos dominios DNS distintos y la IPv4 privada de la API.' >&2
    exit 2
fi
if [[ ! "$web_port" =~ ^[1-9][0-9]{3,4}$ ]] || (( web_port < 1024 || web_port > 65535 )); then
    echo 'El puerto local debe estar entre 1024 y 65535.' >&2
    exit 2
fi
candidate="$(mktemp -d)"
trap 'rm -rf -- "$candidate"' EXIT
# Solo se reemplazan marcadores; $host, $uri y otras variables son de Nginx.
render() {
    sed -e "s/@@DOMAINS@@/$domain $alias_domain/g" \
        -e "s/@@CERT_NAME@@/$domain/g" -e "s/@@API_PRIVATE_IP@@/$api_ip/g" \
        -e "s/@@WEB_PORT@@/$web_port/g" "$1"
}
install_site() (
    # Subshell para limitar los traps a esta instalacion.
    local staged
    staged="$(mktemp -d)"
    trap 'rm -rf -- "$staged"' EXIT
    cp -- "$1" "$staged/site.conf"
    printf 'events {}\nhttp { include %s/site.conf; }\n' "$staged" > "$staged/nginx.conf"
    nginx -t -c "$staged/nginx.conf"
    local site=/etc/nginx/sites-available/mira-web
    local enabled=/etc/nginx/sites-enabled/mira-web
    local default=/etc/nginx/sites-enabled/default
    test ! -e "$enabled" || test "$(readlink "$enabled")" = "$site"
    test ! -e "$default" || test "$(readlink "$default")" = /etc/nginx/sites-available/default
    test ! -f "$site" || cp -p "$site" "$staged/previous"
    local had_default=false
    if test -L "$default"; then had_default=true; unlink "$default"; fi
    rollback() {
        if test -f "$staged/previous"; then
            cp -p "$staged/previous" "$site"
        else
            rm -f -- "$enabled" "$site"
        fi
        if "$had_default"; then ln -sfn /etc/nginx/sites-available/default "$default"; fi
    }
    trap 'rollback' ERR
    install -m 0644 "$staged/site.conf" "$site"
    ln -sfn "$site" "$enabled"
    nginx -t
    if systemctl is-active --quiet nginx; then systemctl reload nginx; else systemctl start nginx; fi
    systemctl enable nginx
    trap - ERR
)
render "$script_dir/nginx-edge.conf" > "$candidate/https.conf"
install -d -m 0755 /var/www/letsencrypt/.well-known/acme-challenge
cert_dir="/etc/letsencrypt/live/$domain"
if [[ ! -f "$cert_dir/fullchain.pem" || ! -f "$cert_dir/privkey.pem" ]]; then
    # Primera emision: aun no existe un certificado para habilitar HTTPS.
    cat > "$candidate/http.template" <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name @@DOMAINS@@;
    server_tokens off;
    location ^~ /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
        default_type text/plain;
        try_files $uri =404;
    }
    location / { return 503; }
}
EOF
    render "$candidate/http.template" > "$candidate/http.conf"
    install_site "$candidate/http.conf"
else
    # Tambien cubre certificados restaurados y cambios en los alias.
    install_site "$candidate/https.conf"
fi
email_args=(--register-unsafely-without-email)
if [[ -n "${CERTBOT_EMAIL:-}" ]]; then email_args=(--email "$CERTBOT_EMAIL"); fi
# DNS de ambos nombres debe apuntar aqui; nunca usar --force-renewal por rutina.
certbot certonly --webroot -w /var/www/letsencrypt \
    --cert-name "$domain" -d "$domain" -d "$alias_domain" \
    --non-interactive --agree-tos --keep-until-expiring "${email_args[@]}"
install_site "$candidate/https.conf"
install -d -m 0755 /etc/letsencrypt/renewal-hooks/deploy
install -m 0755 "$script_dir/reload-nginx.sh" /etc/letsencrypt/renewal-hooks/deploy/reload-nginx
systemctl enable --now certbot.timer
echo 'HTTPS configurado. Ver las comprobaciones en docs/operations-and-recovery.md.'
