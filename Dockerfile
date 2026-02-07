FROM oven/bun:1 AS base
WORKDIR /app

# --- Install dependencies (Bun is fast here) ---
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# --- Build with Node (Bun has a known memory issue with Vite builds) ---
FROM node:22-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

# --- Production image (Bun is fast here) ---
FROM base AS production
ENV NODE_ENV=production
COPY --from=build /app/.output ./.output
EXPOSE 3000
CMD ["bun", ".output/server/index.mjs"]
