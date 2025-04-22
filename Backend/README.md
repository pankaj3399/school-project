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

```env
# Database and Authentication
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret

# Cloudinary Configuration
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key

# Email Configuration
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_app_password
FRONTEND_URL=http://localhost:5173

# Resource URLs
LOGO_URL=your_logo_url
LEAD_PDF_URL=your_lead_pdf_url
LEAD_VIDEO_URL=your_lead_video_url
TEAM_MEMBER_PDF_URL=your_team_member_pdf_url
TEAM_MEMBER_VIDEO_URL=your_team_member_video_url

# Support Configuration
SUPPORT_EMAIL=support@example.com
```

#### Environment Variables Description:
- **Database & Auth**: 
  - `MONGO_URI`: MongoDB connection string
  - `JWT_SECRET`: Secret key for JWT token generation
  - `SESSION_SECRET`: Secret for session management

- **Cloudinary**:
  - `CLOUDINARY_API_SECRET`: Cloudinary API secret
  - `CLOUD_NAME`: Cloudinary cloud name
  - `CLOUDINARY_API_KEY`: Cloudinary API key

- **Email**:
  - `EMAIL_USER`: Email address for sending notifications
  - `EMAIL_PASS`: Email app password
  - `FRONTEND_URL`: URL of the frontend application

- **Resources**:
  - `LOGO_URL`: URL for application logo
  - `VERTICAL_LOGO`: vertical logo URL
  - `LEAD_PDF_URL`: PDF guide for lead teachers
  - `LEAD_VIDEO_URL`: Tutorial video for lead teachers
  - `TEAM_MEMBER_PDF_URL`: PDF guide for team members
  - `TEAM_MEMBER_VIDEO_URL`: Tutorial video for team members

- **Support**:
  - `SUPPORT_EMAIL`: Email address for support inquiries

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
