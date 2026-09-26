FROM node:16-bullseye

# Install required dependencies for canvas (more compatible versions).
# Debian 11 security still indexes giflib 5.1.9-2+deb11u1, but those .debs 404.
# Pin the Bullseye main build, which is still on deb.debian.org.
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif7=5.1.9-2 \
    libgif-dev=5.1.9-2 \
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
