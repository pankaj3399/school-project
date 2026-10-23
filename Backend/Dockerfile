FROM node:24.22.1-bookworm

# Canvas needs Cairo and giflib. Node 24.22.1 is the October 21, 2026
# security release. Bookworm supplies giflib from its own archive.
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

# canvas 3.2.0 ships an N-API binary that runs on Node 24.22.1.
# Do not pin 2.9.0: that release has no Node 24 binary and does not compile.
RUN npm install

# Copy rest of the code
COPY . .

EXPOSE 5000

CMD ["node", "index.js"]
