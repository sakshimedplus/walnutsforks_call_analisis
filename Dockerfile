# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files first and install deps
COPY package*.json ./
RUN npm install

# Copy rest of the files
COPY . .

# Explicitly pass build-time args
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Set env so Vite sees them
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Build the app
RUN npm run build

# --- Serve with nginx ---
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
