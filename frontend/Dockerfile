# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
WORKDIR /app

# Étape des dépendances
FROM base AS dependencies
COPY package*.json ./
RUN npm install

# Étape Développement (pour le dev local)
FROM base AS development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
ENV HOST=0.0.0.0
ENV PORT=3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Étape de compilation (Build Nuxt Nitro)
FROM dependencies AS build
WORKDIR /app
COPY . .
ARG NUXT_PUBLIC_API_BASE
ENV NUXT_PUBLIC_API_BASE=${NUXT_PUBLIC_API_BASE}
RUN npm run build

# Étape Production (Image légère, uniquement le serveur Nitro compilé)
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=build /app/.output ./.output

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
