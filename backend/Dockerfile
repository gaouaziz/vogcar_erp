FROM node:20-alpine
WORKDIR /app

# Copie le package.json depuis le dossier backend vers le WORKDIR (/app)
COPY package.json ./
# Si vous avez un package-lock.json, utilisez plutôt : COPY package*.json ./

RUN npm install --omit=dev

# Copie le reste des fichiers du dossier backend
COPY . .

EXPOSE 5000
CMD ["node", "index.js"]
