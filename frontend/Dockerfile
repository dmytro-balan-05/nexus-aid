FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Build-time env vars:
# NEXT_PUBLIC_API_URL — browser-side (WebSocket, embedded in JS bundle)
# INTERNAL_API_URL    — server-side (Next.js rewrites, not exposed to browser)
ARG NEXT_PUBLIC_API_URL=https://nexus-aid-production.up.railway.app
ARG INTERNAL_API_URL=https://nexus-aid-production.up.railway.app
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV INTERNAL_API_URL=$INTERNAL_API_URL

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3001
ENV PORT=3001
CMD ["node", "server.js"]