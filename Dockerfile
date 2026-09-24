FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
RUN npm install -g pnpm@11.25.0 && pnpm install --frozen-lockfile
COPY . .
ENV BUILD_STANDALONE=1
RUN pnpm build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN apk add --no-cache openssl && addgroup -S shop && adduser -S shop -G shop
COPY --from=build --chown=shop:shop /app/.next/standalone ./
COPY --from=build --chown=shop:shop /app/.next/static ./.next/static
COPY --from=build --chown=shop:shop /app/public ./public
USER shop
EXPOSE 3000
CMD ["node", "server.js"]
