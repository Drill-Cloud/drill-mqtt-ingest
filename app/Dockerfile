FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY public ./public
# Runtime mappers read JSON files from src/mappings, so they must be copied into the image.
COPY src ./src

CMD ["npm", "run", "start"]
