# School Management System Deployment Guide

This repository contains a MERN stack application with Frontend (React/Vite) and Backend (Node.js/Express) components that are deployed to AWS EC2 using Docker and GitHub Actions.

## Repository Structure

```
./
  /Backend     - Node.js/Express backend
  /Frontend    - React/Vite frontend
  /README.md   - This documentation
```

## Deployment Architecture

The application is deployed with the following architecture:

- **GitHub Actions**: Handles CI/CD pipeline
- **Docker**: Containerizes the application components
- **Docker Hub**: Stores the container images
- **AWS EC2**: Hosts the application
- **Docker Compose**: Orchestrates the containers on the server

## Prerequisites

To deploy this application, you need:

1. GitHub account
2. Docker Hub account
3. AWS account with an EC2 instance
4. MongoDB Atlas account (or other MongoDB provider)
5. Cloudinary account (for image storage)

## Initial Setup

### 1. AWS EC2 Setup

1. Launch an EC2 instance (recommended: t2.micro or larger with Ubuntu)
2. Configure security groups to allow:
   - SSH (port 22)
   - HTTP (port 80)
   - HTTPS (port 443)
3. Create and download an SSH key pair
4. Install Docker and Docker Compose on your EC2 instance:
   ```bash
   sudo apt update
   sudo apt install -y docker.io
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   sudo usermod -aG docker $USER
   ```
5. Log out and log back in for group changes to take effect

### 2. GitHub Repository Secrets

In your GitHub repository, add the following secrets:

1. `AWS_EC2_HOST`: Public DNS of your EC2 instance
2. `AWS_EC2_USERNAME`: Username for your EC2 instance (usually "ubuntu" for Ubuntu AMIs)
3. `AWS_SSH_KEY`: Private SSH key for your EC2 instance
4. `DOCKER_USERNAME`: Your Docker Hub username
5. `DOCKER_PASSWORD`: Your Docker Hub password
6. `MONGO_URI`: MongoDB connection string
7. `JWT_SECRET`: Secret key for JWT authentication
8.  `CLOUD_NAME`: Cloudinary cloud name
9.  `CLOUDINARY_API_KEY`: Cloudinary API key
10. `CLOUDINARY_API_SECRET`: Cloudinary API secret
11. `EMAIL_USER`: Email address for sending notifications
12. `EMAIL_PASS`: Password for the email address
13. `FRONTEND_URL`: URL of your frontend application (e.g., http://your-ec2-public-dns)
14. `LOGO_URL`: URL for application logo
15. `LEAD_PDF_URL`: PDF guide URL for lead teachers
16. `LEAD_VIDEO_URL`: Tutorial video URL for lead teachers
17. `TEAM_MEMBER_PDF_URL`: PDF guide URL for team members
18. `TEAM_MEMBER_VIDEO_URL`: Tutorial video URL for team members
19. `SUPPORT_EMAIL`: Email address for support inquiries

## Deployment Process

Once you've set up all the configuration files and GitHub secrets, the deployment process is:

1. Push changes to the `main` branch of your GitHub repository
2. GitHub Actions will automatically:
   - Build the frontend and backend Docker images
   - Push the images to Docker Hub
   - Deploy the application to your EC2 instance

### Docker Hub Repository Setup
You don't need to manually create repositories in Docker Hub before deploying. When GitHub Actions pushes the Docker images for the first time, repositories named `<your-username>/school-frontend` and `<your-username>/school-backend` will be automatically created in your Docker Hub account.
By default, these will be public repositories. If you need private repositories:

- Upgrade to a paid Docker Hub account that supports private repositories
- Create the repositories manually as private before the first deployment
- Update the GitHub workflow to push to these private repositories

#### Getting Docker Hub Username and Access Token
To set up the required GitHub secrets for Docker Hub authentication:

##### Docker Hub Username:

1. Create a Docker Hub account at [Docker Hub](https://hub.docker.com/) if you don't have one
2. Your username is displayed in the top-right corner after logging in
3. Use this username for the `DOCKER_USERNAME` GitHub secret


##### Docker Hub Access Token (recommended instead of password):

1. Log in to your [Docker Hub](https://hub.docker.com/) account
2. Click on your username in the top-right corner and select "Account Settings"
3. In the left sidebar, click "Security"
4. Under "Access Tokens," click "New Access Token"
5. Enter a description (e.g., "GitHub Actions Deployment")
6. Select the appropriate permissions (at minimum, "Read & Write" access)
7. Click "Generate"
8. *Important*: Copy the token immediately as it will only be shown once
9. Use this token for the `DOCKER_PASSWORD` GitHub secret

_Using an access token instead of your actual Docker Hub password is more secure and allows you to grant specific permissions and revoke access if needed._

## Troubleshooting

### API Route Issues

If you encounter issues with API routes not working:

1. Check that the nginx configuration is properly set up to proxy requests to the backend
2. Ensure the `proxy_pass` directive includes the `/api/` path: `proxy_pass http://backend:5000/api/;`
3. Verify that backend routes match the expected paths

### Connection Issues

If the frontend cannot connect to the backend:

1. Check that the `VITE_API_URL` environment variable is set correctly
2. Verify that the backend container is running: `docker ps`
3. Check backend logs for any errors: `docker logs <container_id>`

### Database Connection Issues

If the backend cannot connect to the database:

1. Verify that the `MONGO_URI` secret is set correctly in GitHub
2. Check that the MongoDB Atlas network access allows connections from anywhere or your EC2 IP
3. Check the backend logs for connection errors

## Maintenance

### Updating the Application

To update the application:

1. Make changes to your code
2. Commit and push to the `main` branch
3. GitHub Actions will automatically redeploy the application

### Viewing Logs

To view container logs:

```bash
ssh <username>@<ec2-host>
cd ~/app
docker-compose logs -f
```

### Restarting Services

To restart services:

```bash
ssh <username>@<ec2-host>
cd ~/app
docker-compose restart
```

## Security Considerations

1. Keep your GitHub secrets secure
2. Consider setting up HTTPS with a certificate
3. Regularly update your Docker images
4. Monitor your EC2 instance for security updates