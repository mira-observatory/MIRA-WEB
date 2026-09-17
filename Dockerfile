FROM node:24-alpine AS builder

WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Vite incorpora este valor PUBLICO en el JavaScript del navegador.
# Nunca pasar secretos como argumentos VITE_.
ARG VITE_MIRA_API_BASE_URL
RUN test -n "$VITE_MIRA_API_BASE_URL" && npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /build/dist /usr/share/nginx/html

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
