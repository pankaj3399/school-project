#!/bin/bash

# Stop and remove existing containers
docker-compose down

# Pull latest changes (if using git)
git pull

# Build and start containers
docker-compose up -d --build

# Clean up unused images
docker image prune -f