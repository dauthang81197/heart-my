FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build \
 && npx tsc prisma/seed.ts --outDir /seed --module commonjs --target ES2022 --esModuleInterop --skipLibCheck

FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm i --no-save prisma@5
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma
COPY --from=build /seed/seed.js ./prisma/seed.js
RUN mkdir -p uploads
EXPOSE 3000
CMD ["sh","-c","npx prisma migrate deploy && node prisma/seed.js && node dist/main.js"]
