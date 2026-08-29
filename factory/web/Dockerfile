FROM node:22-alpine AS builder
WORKDIR /app
# El rewrite /shop-api se resuelve en build: dentro del compose, Vendure es
# el servicio "vendure" (ver next.config.mjs).
ENV VENDURE_API_URL=http://vendure:3000
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# public/ NO va dentro de la salida standalone: Next obliga a copiarlo aparte.
# Sin esta línea, en producción faltan las imágenes de las plantillas, las
# tipografías propias y el service worker de las tiendas — y no falla el
# arranque, simplemente devuelve 404 y el sitio se ve a medias.
COPY --from=builder /app/public ./public
CMD ["node", "server.js"]
