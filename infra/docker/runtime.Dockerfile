FROM node:22.23.4-bookworm-slim
RUN npm install --global pnpm@11.22.0
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile && pnpm build
ENV NODE_ENV=production HOST=0.0.0.0
USER node
CMD ["pnpm", "--filter", "@devpath/api", "exec", "tsx", "src/server.ts"]
