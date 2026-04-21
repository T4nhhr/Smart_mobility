FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src

FROM base AS development
RUN npm install --only=development
CMD ["npm", "run", "dev"]

FROM base AS production
ENV NODE_ENV=production
CMD ["npm", "start"]

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1
