FROM node:16-bullseye

# Install required dependencies for canvas (more compatible versions)
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    pkg-config \
    python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Modify package.json to use a specific compatible canvas version
RUN npm pkg set dependencies.canvas="2.9.0"

# Install dependencies without rebuilding canvas
RUN npm install

# Copy rest of the code
COPY . .

EXPOSE 5000

CMD ["node", "index.js"]
