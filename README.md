# MIRA-WEB

Interfaz publica del observatorio de contrataciones de Centroamerica. Consulta en
lenguaje natural sobre los datos que produce
[MIRA-ETL](https://github.com/byronalb146/MIRA-ETL), a traves de MIRA-API.

React + TypeScript + Tailwind + Vite. Sitio estatico, sin servidor propio.

## La regla que ordena toda la interfaz

**Los numeros vienen de la base de datos. El parrafo lo escribe un modelo.**
La interfaz debe hacer visible esa diferencia en todo momento:

- Orden vertical fijo: **datos arriba, prosa abajo**.
- Tipografia monoespaciada para todo lo que viene de la base (numeros, montos,
  identificadores, SQL). Serif para el texto generado.
- El SQL ejecutado se muestra, colapsable, para cualquier usuario. Es la prueba de
  que el numero no fue inventado.
- Los numeros dentro del parrafo generado **no se destacan**: destacarlos les daria
  una autoridad que no tienen.

### Desambiguacion de entidades

Si la busqueda encuentra `Karro y Limon S.A` (6 procesos) y `Carro y Limon S.A`
(9 procesos), se muestran **los dos, con sus conteos**, junto con la evidencia de la
sospecha (similitud, pais, identificador fiscal ausente). Al seleccionar varios, la
tabla vuelve segmentada por entidad, con subtotales y **sin fila de total**. La
interfaz nunca insinua que los sumo.

### Un cero nunca aparece desnudo

Todo resultado vacio pasa por un explicador que enumera, en orden: los filtros
activos, los paises consultados sin datos cargados, los periodos fuera del rango
disponible y, solo al final, "no se encontraron registros". "No hubo contrataciones"
y "no tenemos esos datos" son afirmaciones muy distintas y solo una de las dos es
cierta.

## Estado

En construccion. Fase 0 del plan de arquitectura.

## Desarrollo

```bash
npm install
cp .env.example .env.local
npm run dev
```

Requiere MIRA-API corriendo en local (por defecto `http://localhost:8000`).

## Tipos del backend

**Los tipos de la API no se escriben a mano.** Se generan desde el OpenAPI que
publica FastAPI:

```bash
npm run api:types
```

El archivo `src/api/generated/schema.d.ts` no se edita nunca. En integracion
continua se regenera y se compara: si el backend cambio un modelo y este repositorio
no regenero, el cambio no se puede fusionar.

## Estructura

| Ruta                           | Responsabilidad                                                    |
| ------------------------------ | ------------------------------------------------------------------ |
| `src/api/`                     | Cliente HTTP tipado y hooks de consulta                            |
| `src/features/ask/`            | Caja de pregunta, selector de paises, filtros suaves               |
| `src/features/answer/`         | Tabla, SQL desplegable, conteo de filas, narrativa                 |
| `src/features/disambiguation/` | Lista de candidatos de entidad. El nucleo del producto             |
| `src/features/coverage/`       | Franja del istmo, matriz de cobertura, explicador de ceros         |
| `src/lib/`                     | Formato de montos y fechas, diccionarios de enums, exportacion CSV |

## Lo que este repositorio nunca hace

- **Nunca habla con la base de datos.** Ni `supabase-js`, ni claves de proveedor en
  el paquete. Toda consulta pasa por MIRA-API, que es donde viven las cuotas.
- **Nunca cuenta la cuota en el cliente.** El valor mostrado viene del servidor.
- **Nunca suma montos de monedas distintas.** `formatMoney` exige el codigo de
  moneda; sin el, no formatea como dinero.

## Despliegue con Docker Compose

La web esta publicada en `https://proyectomira.org` y
`https://www.proyectomira.org`. Ambos dominios redirigen de HTTP a HTTPS,
conservando la ruta y los parametros. La imagen es `mira-web:8328e8a-https1`.
Se construye en `mira-app-prod` y se transfiere a `mira-front-prod`
(`165.227.127.2`), que la ejecuta desde `/opt/mira-web` con Compose.

El navegador consulta `/api` en el mismo dominio. Nginx del host termina TLS
y conecta con el backend por la VPC (`10.108.0.4:8081`); el gateway del backend
solo admite al frontend (`10.108.0.2`). No se necesitan un dominio adicional
para la API ni peticiones HTTP desde el navegador. Swagger esta en `/api/docs`.

Para preparar otro servidor vacio con Ubuntu 24.04, ejecutar como root
`bash deploy/bootstrap-ubuntu.sh`. Instala Docker y Compose. El despliegue
HTTPS requiere ademas Nginx y Certbot en el host; ver la seccion HTTPS.

La imagen compila la web con Node.js y sirve `dist/` con Nginx sin privilegios
de administrador. El contenedor final no contiene Node.js ni credenciales.

Crear `.env.digitalocean` desde la unica plantilla `.env.example` y definir
`VITE_MIRA_API_BASE_URL=/api`, `MIRA_HTTP_BIND=127.0.0.1` y
`MIRA_HTTP_PORT=8080`. Elegir `MIRA_IMAGE_TAG` para identificar la version y
ejecutar:

```bash
docker compose --env-file .env.digitalocean config --quiet
docker compose --env-file .env.digitalocean build --pull
docker compose --env-file .env.digitalocean up -d --wait --wait-timeout 120
```

El contenedor escucha solo en `127.0.0.1:8080`; el acceso publico pasa por
Nginx del host en 80/443. Nginx dentro del contenedor resuelve las rutas de
React al recargar. La API usa `UVICORN_ROOT_PATH=/api` para generar las rutas
de Swagger y permite ambos origenes HTTPS en `CORS_ORIGINS`.

Si la imagen se construye en otra maquina o en CI, publicarla en un registro
o transferirla con `docker save` / `docker load`. Luego ejecutar Compose con
`up -d --no-build --pull never --wait` para una imagen cargada localmente.
En el servidor de destino hacen falta la imagen, `compose.yaml`, su archivo
de configuracion y la configuracion de Nginx/Certbot del host.

Cambiar `VITE_MIRA_API_BASE_URL` requiere reconstruir la imagen: Vite lo
incorpora durante el build. El valor relativo `/api` sirve para ambos dominios.

### HTTPS y renovacion

`deploy/nginx-edge.conf` se instala en `/etc/nginx/sites-available/mira-web`,
con un enlace en `sites-enabled`. Reemplaza el sitio predeterminado de Nginx.
El certificado de Let's Encrypt cubre los dos dominios y vive en
`/etc/letsencrypt/live/proyectomira.org/`, fuera de la imagen y del repositorio.

Para una instalacion nueva, instalar `nginx` y `certbot`, configurar primero
un sitio HTTP que sirva `/.well-known/acme-challenge/` desde
`/var/www/letsencrypt`, y emitir el certificado con:

```bash
certbot certonly --webroot -w /var/www/letsencrypt \
  --cert-name proyectomira.org -d proyectomira.org -d www.proyectomira.org
```

Una vez emitido, instalar la configuracion HTTPS, comprobar `nginx -t` y
recargar Nginx. Ambos registros DNS deben apuntar al frontend y los puertos
80/443 deben ser accesibles. En el backend instalar tambien
`MIRA-API/deploy/nginx-api.conf`; su puerto 8081 es exclusivo de la VPC.

`certbot.timer` esta habilitado para renovar automaticamente. El hook
`/etc/letsencrypt/renewal-hooks/deploy/reload-nginx` ejecuta `nginx -t` y
`systemctl reload nginx` tras cada renovacion. El puerto 80 conserva la ruta
ACME sin redireccion para que Certbot pueda validar los dominios.

Verificado el 18 de septiembre de 2026: certificados validos para ambos
dominios, redireccion 308 conservando ruta y parametros, inicio y catalogo en
Chrome con llamadas HTTPS a la API sin errores de red/JavaScript. La simulacion
de renovacion con recarga de Nginx tambien termino correctamente.

```bash
sudo certbot certificates
sudo systemctl list-timers certbot.timer
sudo certbot renew --cert-name proyectomira.org --dry-run --run-deploy-hooks
```

Tras validar HTTPS se eliminaron las imagenes HTTP anteriores, los paquetes
de transferencia, los directorios de construccion temporales y los respaldos
previos a HTTPS. Los servidores conservan sus imagenes activas y configuracion
actual. Para desplegar otra version, construirla manteniendo `/api` y el bind
local; una imagen con la antigua URL HTTP de la API no es compatible con HTTPS.

## Licencia

MIT. Ver [LICENSE](LICENSE).
