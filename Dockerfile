FROM node:18-alpine

# ---------------------------------------------------
# SECURITY PATCHES (Added based on Trivy Scan)
# 1. Update all Alpine OS libraries to their latest patched versions
# 2. Update the global npm CLI tool to fix minimizing/path vulnerabilities
# ---------------------------------------------------
RUN apk update && apk upgrade --no-cache && \
    npm install -g npm@10

WORKDIR /app

COPY package*.json ./

RUN npm install
    
COPY . .

EXPOSE 5004
CMD ["npm", "start"]
