# LetItFly
"Let It Fly" is an airport shuttle service platform connecting passengers with drivers for seamless, safe, and affordable transportation to and from Bay Area airports.


## Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/en/)
- [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/) (for PostgreSQL)
- [Git](https://git-scm.com/)


## 1. Backend Setup

### Install Dependencies

Navigate to the backend directory:

```bash
cd backend
npm install
docker-compose up -d
```

Create a .env file 
```json
PGUSER=admin
PGPASSWORD=admin123
PGDATABASE=letitfly_db
PGHOST=localhost
PGPORT=5432
JWT_SECRET=supersecretkey
PORT=3000
```

Start the backend: 
```
npm start
```

## 2. Frontend Setup

Install Dependencies
Navigate to the frontend directory:
```bash
cd frontend
```

Install all necessary dependencies:
```bash
npm install
```

Start the Frontend
To start the React frontend, run:
```bash
npm start
```

The frontend will be available at http://localhost:3001.

## 6. Checking the PostgreSQL Database

To check the contents of the PostgreSQL database (e.g., to verify if users have been registered correctly), follow the instructions below.

### Option 1: Using PostgreSQL CLI (Docker)

If you are using Docker to run PostgreSQL, you can connect to the database inside the running Docker container.

1. **Enter the PostgreSQL container**:

   ```bash
   docker exec -it letitfly_postgres psql -U admin -d letitfly_db
   ```
   Once in the cli run
   * `SELECT * FROM users;` shows current users
   * `\dt+` lists all tables
   

