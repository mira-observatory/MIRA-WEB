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

La preparacion, HTTPS, actualizacion y recuperacion **del frontend** estan en
[la guia de operacion del web](docs/operations-and-recovery.md). Incluye un
comando de entrada para preparar el servidor, con sus requisitos previos.

La web se publica en `https://proyectomira.org` y `https://www.proyectomira.org`.
Nginx de Ubuntu maneja HTTPS y envia `/api` a la API por la VPC; el Nginx del
contenedor sirve los archivos estaticos. Swagger esta en `/api/docs`.

La API se prepara desde su propio repositorio:
[MIRA-API: despliegue](https://github.com/byronalb146/MIRA-API/blob/main/docs/digitalocean.md).
La base de datos se prepara o recupera desde
[MIRA-ETL: base de datos](https://github.com/byronalb146/MIRA-ETL/blob/main/docs/database_recovery.md).

## Licencia

MIT. Ver [LICENSE](LICENSE).
