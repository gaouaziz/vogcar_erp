FROM node:20-alpine
WORKDIR /app

# Copie des manifests de paquets pour profiter du cache Docker
COPY package*.json ./

RUN npm install --omit=dev --fetch-retries=5 --fetch-retry-maxtimeout=120000

# Copie du code source backend
COPY . .

EXPOSE 5000
CMD ["node", "index.js"]
