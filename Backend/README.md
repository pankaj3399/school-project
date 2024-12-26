
# School Management App - Backend

This is the backend for the School Management App, responsible for managing the database, authentication, and server-side logic.

---

## Features
- User Authentication with JWT.
- CRUD operations for managing schools, teachers, and students.
- Role-based access control.
- API endpoints for managing rewards and notifications.

---

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/Yashvardhandhondge/School_project.git
cd School_project/Backend
```

---

### 2. Install Dependencies
```bash
npm install
```



### 3. Set Up Environment Variables
Create a `.env` file in the root of the `Backend` directory and add the following variables:

```
MONGO_URI=
JWT_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD=
SESSION_SECRET=
CLOUDINARY_API_SECRET=
CLOUD_NAME=
CLOUDINARY_API_KEY=
EMAIL_USER=
EMAIL_PASS=
FRONTEND_URL=
```

---

### 4. Seed Database and Build the Server
To seed the database and start the server in production:
```bash
npm run build
```

---

### 5. Start the Development Server
For development purposes, you can use:
```bash
nodemon index.js
```

The server will run at `http://localhost:5000` by default.

---

### 6. Access the Admin Dashboard
Once the server is running and you've logged in as the admin:

- Go to `http://localhost:5000/admin/` to access the admin dashboard.
- Log in using the admin credentials you set in the `.env` file (`ADMIN_EMAIL` and `ADMIN_PASSWORD`).

---

### Notes
- Ensure the `.env` file is correctly configured before running the application.
- Use the `npm run build` command to build and start the server for production.
- The `ADMIN_EMAIL` and `ADMIN_PASSWORD` are used for creating an initial system admin account.
```
