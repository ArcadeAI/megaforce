# Build stage
FROM node:20-slim AS build

WORKDIR /app

COPY package.json .
# Install deps (include dev deps for building)
RUN npm install --no-audit --no-fund

COPY . .

RUN npm run build

# Runtime stage: nginx serving static files and proxying /api to backend
FROM nginx:1.27-alpine

# Install envsubst for templating nginx config
RUN apk add --no-cache gettext

ENV PORT=10000

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 10000

ENTRYPOINT ["/entrypoint.sh"]


