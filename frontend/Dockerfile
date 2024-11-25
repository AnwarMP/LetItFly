# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies and the missing babel plugin
RUN npm install
RUN npm install --save-dev @babel/plugin-proposal-private-property-in-object

# Copy the rest of the frontend code
COPY . .

# Set the port and environment variables
ENV PORT=3000
ENV WDS_SOCKET_PORT=0
ENV CHOKIDAR_USEPOLLING=true
ENV CI=true  
# This will treat warnings as warnings, not errors

EXPOSE 3000

CMD ["npm", "start"]