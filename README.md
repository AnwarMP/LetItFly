# LetItFly - Docker Setup Guide

This guide explains how to run the LetItFly application using Docker. The application consists of a React frontend, Node.js backend, PostgreSQL database, and Redis cache.

## Prerequisites

- Docker installed on your machine
- Docker Compose installed on your machine
- Git (to clone the repository)

## Project Structure
```
LETITFLY/
├── docker-compose.yml        # Main Docker configuration
├── frontend/
│   ├── Dockerfile           # Frontend container config
│   ├── .dockerignore        # Frontend ignore rules
│   ├── .env                 # Frontend environment variables
│   └── ... (other frontend files)
├── backend/
│   ├── Dockerfile           # Backend container config
│   ├── .dockerignore        # Backend ignore rules
│   ├── .env                 # Backend environment variables
│   └── ... (other backend files)
└── README.md
```

## Environment Setup

1. **Frontend Environment (.env)**
   ```env
   REACT_APP_MAPBOX_ACCESS_TOKEN=your_mapbox_token
   ```

2. **Backend Environment (.env)**
   ```env
   PGUSER=admin
   PGPASSWORD=admin123
   PGDATABASE=letitfly_db
   PGHOST=postgres
   PGPORT=5432
   JWT_SECRET=supersecretkey
   PORT=3000
   MAPBOX_ACCESS_TOKEN=your_mapbox_token
   ```

## Running the Application
### Environment Setup

1. **Copy Environment Template**
   ```bash
   # From root directory (LETITFLY/)
   cp .env.template .env
   ```

2. **Edit the .env file**
   Open the `.env` file and insert your Mapbox API key:
   ```env
      REACT_APP_MAPBOX_ACCESS_TOKEN=""
   ```

3. **Verify Environment Files**
   Make sure you have:
   - `.env` in root directory (created from template)
   - `.env.template` in root directory (for reference)
   - Do NOT commit your `.env` file with your actual Mapbox key

Note: The .env.template should look like this:
```env
      REACT_APP_MAPBOX_ACCESS_TOKEN=""
```

4. **Getting a Mapbox Token**
   - Sign up at https://www.mapbox.com/
   - Navigate to your account's tokens page
   - Create a new token with the necessary permissions
   - Copy the token into your .env file

⚠️ Important Notes:
- Never commit your actual Mapbox API key to the repository
- The .env file is listed in .gitignore to prevent accidental commits
- Keep your API keys secure and never share them publicly
- If you accidentally commit an API key, revoke it immediately and generate a new one

### Quick Start
From the root directory:
```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

### Step-by-Step Setup

1. **First Time Setup**
   ```bash
   # Stop any running containers and remove volumes
   docker-compose down -v

   # Build all services
   docker-compose build

   # Start everything up
   docker-compose up
   ```

2. **Regular Usage**
   ```bash
   # Start all services
   docker-compose up

   # Start in background
   docker-compose up -d
   ```

3. **Stopping the Application**
   ```bash
   # Stop all services
   docker-compose down

   # Stop and remove volumes (clean slate)
   docker-compose down -v
   ```

### Accessing the Applications

- Frontend: http://localhost:3001
- Backend API: http://localhost:3000

### Test Users
```
Riders:
- Email: alice@rider.com
- Password: password123
- Email: bob@rider.com
- Password: password123

Drivers:
- Email: russ@driver.com
- Password: password123
- Email: will@driver.com
- Password: password123
```

## Monitoring and Debugging

### Viewing Logs
```bash
# View all logs
docker-compose logs

# Follow all logs
docker-compose logs -f

# View specific service logs
docker-compose logs frontend
docker-compose logs backend
docker-compose logs postgres
docker-compose logs redis

# Follow specific service logs
docker-compose logs -f frontend
```

### Container Management
```bash
# List running containers
docker-compose ps

# Restart a specific service
docker-compose restart frontend
docker-compose restart backend

# Access container shell
docker exec -it letitfly_frontend sh
docker exec -it letitfly_backend sh

# Check PostgreSQL
docker exec -it letitfly_postgres psql -U admin -d letitfly_db
```

## Common Issues and Solutions

1. **Port Conflicts**
   - Error: "port is already allocated"
   - Solution: Check for running processes on ports 3000, 3001, 5432, or 6379
   ```bash
   # On Linux/Mac
   sudo lsof -i :3000
   # On Windows
   netstat -ano | findstr :3000
   ```

2. **Database Connection Issues**
   - Solution: Ensure PostgreSQL is fully initialized
   ```bash
   docker-compose logs postgres
   ```

3. **Redis Connection Issues**
   - Solution: Check Redis logs and connections
   ```bash
   docker-compose logs redis
   ```

4. **Clean Restart**
   If you encounter any issues, try a complete reset:
   ```bash
   docker-compose down -v
   docker system prune -f
   docker-compose up --build
   ```

## Development Workflow

### Making Changes
- Frontend changes will auto-reload thanks to React's development server
- Backend changes require a service restart:
  ```bash
  docker-compose restart backend
  ```

### Running Tests
```bash
# Run frontend tests
docker exec -it letitfly_frontend npm test

# Run backend tests
docker exec -it letitfly_backend npm test
```