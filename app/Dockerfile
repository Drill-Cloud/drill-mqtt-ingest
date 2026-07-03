FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build && npm prune --omit=dev

# app/public/index.html has content for video preview
# TODO move all static files (html, mappers) to a separate folder "assets"
COPY public ./public 

ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
