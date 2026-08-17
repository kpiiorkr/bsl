FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html tsconfig*.json vite.config.ts ./
COPY src ./src
RUN npm run build

FROM nginx:1.29-alpine AS runtime
RUN addgroup -S app && adduser -S app -G app
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist /usr/share/nginx/html
RUN chown -R app:app /var/cache/nginx /var/run /usr/share/nginx/html
USER app
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
