### Backend README


# School Management App - Backend

This is the backend for the School Management App, responsible for managing the database, authentication, and server-side logic.

## Features
- User Authentication with JWT.
- CRUD operations for managing schools, teachers, and students.
- Role-based access control.
- API endpoints for managing rewards and notifications.



## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/Yashvardhandhondge/School_project.git
cd School_project/Backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
Create a `.env` file in the root of the `Backend` directory and add the following keys:
```
MONGO_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-jwt-secret-key>
```

### 4. Start the Server
To start the development server:
```bash
nodemon index.js
```
The server will run at `http://localhost:5000` by default.




