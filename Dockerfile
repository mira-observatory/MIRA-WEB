# Digests de la construccion HTTPS validada; actualizar de forma deliberada.
FROM node:24-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1 AS builder

WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Vite incorpora este valor PUBLICO en el JavaScript del navegador.
# Nunca pasar secretos como argumentos VITE_.
ARG VITE_MIRA_API_BASE_URL
RUN test -n "$VITE_MIRA_API_BASE_URL" && npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine@sha256:daa17b944bac2b578e962da4c61ad72a59233b3c63abea17113acaf4e6b9aea4
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /build/dist /usr/share/nginx/html

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
