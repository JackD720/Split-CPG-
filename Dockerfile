FROM node:20-slim

WORKDIR /app

# Copy server package files
COPY server/package*.json ./

# Install dependencies
RUN npm install --production

# Copy server code
COPY server/ ./

# Cloud Run uses PORT env variable
ENV PORT=8080

EXPOSE 8080

CMD ["node", "index.js"]
