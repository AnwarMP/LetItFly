# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install PostgreSQL client for wait-for-it script
RUN apk add --no-cache postgresql-client

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend code
COPY . .

EXPOSE 3000

# Make wait-for-it script executable
COPY wait-for-it.sh .
RUN chmod +x wait-for-it.sh

# Wait for Postgres then start the app
CMD ["./wait-for-it.sh", "postgres", "npm", "start"]