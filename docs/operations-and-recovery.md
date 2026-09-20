# Operacion y recuperacion del frontend

Los despliegues desde `main`, secretos de Actions y rollback se explican en
[GitHub Actions](github-actions.md). Esta guia cubre el aprovisionamiento del host.

Esta guia cubre solo MIRA-WEB. La [API](https://github.com/byronalb146/MIRA-API/blob/main/docs/digitalocean.md)
y la [base de datos](https://github.com/byronalb146/MIRA-ETL/blob/main/docs/database_recovery.md)
se preparan desde sus respectivos repositorios, antes del frontend.

## Servidor actual

- `mira-front-prod`, Ubuntu 24.04 x64, 1 GB; `/opt/mira-web`.
- IP publica `165.227.127.2`, privada `10.108.0.2`.
- Dominios: `proyectomira.org` y `www.proyectomira.org`.
- Imagen al 18/09/2026: `mira-web:8328e8a-https1`.
- Nginx de Ubuntu recibe 80/443, redirige HTTP a HTTPS, envia `/` al contenedor
  local `127.0.0.1:8080` y `/api/` a `10.108.0.4:8081/` por la VPC.
- Nginx dentro de Docker sirve React; no administra certificados.

Ambos Droplets tienen actualmente el mismo hostname interno: distinguirlos por IP.

## Preparar un servidor nuevo

Antes de ejecutar el comando:

1. Tener Ubuntu 24.04 x64, acceso root y conectividad VPC con la API. El backend
   debe permitir la IP privada del nuevo frontend (ver la guia de MIRA-API).
2. Apuntar ambos dominios al nuevo frontend y permitir 80/443 en el firewall.
   Revisar A/CNAME y AAAA. El script no crea Droplets, DNS ni reglas de DigitalOcean.
3. Clonar este repo en `/opt/mira-web` y elegir el commit aprobado. Si falta Git,
   instalarlo antes o transferir las fuentes de esa version.
4. Crear `.env.digitalocean` desde la unica plantilla `.env.example`:

   ```dotenv
   VITE_MIRA_API_BASE_URL=/api
   MIRA_IMAGE_TAG=VERSION
   MIRA_HTTP_BIND=127.0.0.1
   MIRA_HTTP_PORT=8080
   ```

   Reemplazar `VERSION` por la etiqueta elegida. `VITE_` es publico y se incorpora
   durante el build: nunca colocar secretos alli.

Desde el repo, como root, **un comando prepara el servidor**:

```bash
bash deploy/bootstrap-ubuntu.sh proyectomira.org www.proyectomira.org 10.108.0.4
```

Cambiar dominios/IP al trasladarlo. Hace tres etapas: instala Docker, Compose,
Nginx y Certbot; construye/arranca la web y verifica su salud; configura HTTPS,
redirecciones y renovacion. Se detiene si una etapa falla.

### Construir fuera del Droplet de 1 GB

La compilacion puede necesitar mas memoria. En otra maquina Linux x64 con Docker
(por ejemplo, el backend de 4 GB), desde el mismo commit del repo web:

```bash
docker build --build-arg VITE_MIRA_API_BASE_URL=/api -t mira-web:VERSION .
docker save mira-web:VERSION | gzip > mira-web-VERSION.tar.gz
```

Transferir por SCP. Usar la misma etiqueta en `.env.digitalocean` del destino y
pasar el archivo al mismo comando de preparacion:

```bash
bash deploy/bootstrap-ubuntu.sh proyectomira.org www.proyectomira.org 10.108.0.4 /ruta/mira-web-VERSION.tar.gz
```

Asi carga la imagen en lugar de compilarla. Descartar el archivo tras validar.

## Archivos de deploy

| Archivo | Responsabilidad |
| --- | --- |
| `bootstrap-ubuntu.sh` | Entrada para preparar el servidor y arrancar la web |
| `configure-https.sh` | Configura Nginx, certificado y renovacion; lo llama el bootstrap |
| `nginx-edge.conf` | Plantilla del Nginx de Ubuntu: HTTPS y proxy hacia web/API |
| `nginx.conf` | Nginx del contenedor: estaticos y rutas de React |
| `reload-nginx.sh` | Hook de Certbot: valida y recarga Nginx despues de renovar |

No hay Python auxiliares de despliegue ni pruebas de esos auxiliares.
Los marcadores `@@...@@` se sustituyen en Bash; se conservan las variables de
Nginx y se ejecuta `nginx -t` antes de recargar. No instalar la plantilla directamente.

## HTTPS y comprobaciones

El sitio vive en `/etc/nginx/sites-available/mira-web`; los certificados, en
`/etc/letsencrypt/live/proyectomira.org/`. `certbot.timer` renueva automaticamente.
Se puede definir `CERTBOT_EMAIL` antes del bootstrap/configurador; sin el se
registra una cuenta sin correo. Para cambiar solo dominios o IP del backend:

```bash
bash deploy/configure-https.sh proyectomira.org www.proyectomira.org 10.108.0.4
```

Desde una maquina con acceso publico, verificar ambos dominios:

```bash
for domain in proyectomira.org www.proyectomira.org; do
    curl --fail --silent --show-error -I "http://$domain/procedimientos?prueba=1"
    curl --fail --silent --show-error -o /dev/null "https://$domain/"
    curl --fail --silent --show-error "https://$domain/api/healthz"
    curl --fail --silent --show-error -o /dev/null "https://$domain/api/docs"
done
```

La primera respuesta debe ser 308 con `Location` HTTPS conservando ruta/parametros.
Las demas deben responder sin ignorar errores TLS. Abrir inicio, catalogo y una
consulta en el navegador. Desde el frontend comprobar renovacion:

```bash
certbot renew --cert-name proyectomira.org --dry-run --run-deploy-hooks
systemctl list-timers certbot.timer
```

Para migrar un dominio activo, preparar primero la imagen. Transferir
`/etc/letsencrypt` completo por un canal seguro o coordinar una ventana para DNS
y nueva emision. La primera emision usa HTTP temporal para ACME; no garantiza
continuidad HTTPS durante la migracion.

## Actualizaciones y recuperacion

Una actualizacion de la web no necesita reinstalar Ubuntu: construir una imagen
nueva como arriba, transferir/cargar con `docker load --input ARCHIVO`, cambiar
`MIRA_IMAGE_TAG` en el destino y ejecutar:

```bash
docker compose --env-file .env.digitalocean up -d --no-build --pull never --wait
docker compose --env-file .env.digitalocean ps
```

Conservar la imagen anterior hasta validar. Para volver atras, restaurar su
etiqueta/configuracion compatible y repetir `up`. Revisar Compose si cambia.
El despliegue inicial copio archivos: no asumir que el directorio activo sea un clon Git.

Git conserva fuentes, plantillas, scripts y esta guia. El `.env` del web se recrea
con valores publicos; las llaves TLS se transfieren de forma segura o reemiten.
Cada administrador necesita su propia llave SSH y verificar la huella del servidor
por consola. Se requiere acceso del equipo a Git, DigitalOcean y DNS; aun falta
acordar una boveda compartida y responsables de los accesos.

Las bases Docker y dependencias estan fijadas por digest/lockfile: actualizarlas
con pruebas para recibir parches. Reconstruir no garantiza bytes identicos;
conservar imagenes en un registry/respaldo permite recuperar el mismo artefacto.
La auditoria reconstruyo la imagen desde fuentes limpias y verifico HTTPS actual;
falta ensayar el bootstrap completo en un Droplet nuevo. Publicar estos cambios
en Git es necesario para completar el traspaso al equipo.
