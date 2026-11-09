FROM node:22-alpine

WORKDIR /app

# Installation des dépendances globale en cache
COPY package*.json ./
RUN npm install

# Copie du reste des fichiers
COPY . .

# Port par défaut exposé par Nuxt 3 en dev
EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
