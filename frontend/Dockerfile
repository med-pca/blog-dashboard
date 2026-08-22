FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g npm@11
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ARG VITE_UMAMI_URL
ARG VITE_UMAMI_WEBSITE_ID
ARG VITE_SENTRY_DSN
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_UMAMI_URL=$VITE_UMAMI_URL
ENV VITE_UMAMI_WEBSITE_ID=$VITE_UMAMI_WEBSITE_ID
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
RUN npm run build

FROM nginxinc/nginx-unprivileged:alpine
ENV PRERENDER_ORIGIN=https://pulserecipe.com
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY security-headers.conf /etc/nginx/snippets/security-headers.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
