# =========================================
# Stage 1: Build the Angular Application
# =========================================
ARG NODE_VERSION=24.11-alpine
ARG NGINX_VERSION=alpine3.22

FROM node:${NODE_VERSION} AS builder

# Set the working directory inside the container
WORKDIR /build

# Copy package-related files first to leverage Docker's caching mechanism
COPY frontend/package.json frontend/package-lock.json ./

# Install project dependencies using npm ci (ensures a clean, reproducible install)
RUN --mount=type=cache,target=/root/.npm npm ci

# Copy the rest of the application source code into the container
COPY ./frontend .

RUN npm install

RUN npm install -g @angular/cli

# Build the Angular application
RUN npm run build 

# =========================================
# Stage 2: Prepare Nginx to Serve Static Files
# =========================================

FROM nginxinc/nginx-unprivileged:${NGINX_VERSION} AS runner

# Use a built-in non-root user for security best practices
USER nginx

# Copy custom Nginx config
COPY frontend/docker/nginx.conf /etc/nginx/nginx.conf

# Copy the static build output from the build stage to Nginx's default HTML serving directory
COPY --chown=nginx:nginx --from=builder /build/dist/*/browser /usr/share/nginx/html

# Expose port 4200 to allow HTTP traffic
# Note: The default NGINX container now listens on port 4200 instead of 80 
EXPOSE 4200

# Start Nginx directly with custom config
ENTRYPOINT ["nginx", "-c", "/etc/nginx/nginx.conf"]
CMD ["-g", "daemon off;"]