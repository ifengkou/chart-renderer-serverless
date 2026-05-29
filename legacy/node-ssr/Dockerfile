FROM node:20-bookworm-slim

ENV NODE_ENV=production

WORKDIR /service

RUN set -eux; \
    apt-get update -o Acquire::Retries=5; \
    for attempt in 1 2 3 4 5; do \
      apt-get install -y --no-install-recommends --fix-missing \
        -o Acquire::Retries=5 \
        -o Acquire::http::Timeout=60 \
        build-essential \
        ca-certificates \
        libcairo2-dev \
        libjpeg-dev \
        libpango1.0-dev \
        libgif-dev \
        librsvg2-dev \
        pkg-config \
        python3 \
      && break; \
      if [ "$attempt" = "5" ]; then exit 1; fi; \
      apt-get update -o Acquire::Retries=5; \
      apt-get install -f -y -o Acquire::Retries=5 || true; \
      sleep 5; \
    done; \
    rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

EXPOSE 8787
CMD ["npm", "start"]
