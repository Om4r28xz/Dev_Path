FROM node:22.23.4-bookworm-slim AS build
RUN npm install --global pnpm@11.22.0
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @devpath/web build
FROM nginx:1.28-alpine
COPY infra/proxy/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
