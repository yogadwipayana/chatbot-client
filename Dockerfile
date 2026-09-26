FROM node:24-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# --- Dependensi lengkap untuk build ------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# --- Dependensi produksi saja untuk runtime ----------------------------------
FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- Build --------------------------------------------------------------------
FROM base AS builder
# NEXT_PUBLIC_* dan EMBED_ALLOWED_ORIGINS dibaca saat build: mengubahnya berarti
# build ulang. Sumber nilainya, berurutan: build arg dari compose (.env root)
# bila diisi, lalu .env aplikasi ini, lalu bawaan kode. NEXT_PUBLIC_API_BASE_URL
# adalah alamat API yang dipanggil PERAMBAN.
ARG NEXT_PUBLIC_API_BASE_URL=
ARG EMBED_ALLOWED_ORIGINS=
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN [ -n "$NEXT_PUBLIC_API_BASE_URL" ] || unset NEXT_PUBLIC_API_BASE_URL; \
    [ -n "$EMBED_ALLOWED_ORIGINS" ] || unset EMBED_ALLOWED_ORIGINS; \
    npm run build

# --- Runtime ------------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production PORT=3001 HOSTNAME=0.0.0.0
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/package.json /app/next.config.ts ./
USER node
EXPOSE 3001
CMD ["npm", "run", "start"]
