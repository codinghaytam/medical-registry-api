FROM node:latest
WORKDIR /app

# Define build arguments for environment variables
ARG DATABASE_URL
ARG PORT
ARG KEYCLOAK_URL
ARG KEYCLOAK_REALM
ARG KEYCLOAK_CLIENT
ARG KEYCLOAK_CLIENT_SECRET


# Copy package files and install dependencies
COPY ./package.json /app 
COPY ./app.yaml /app
RUN npm install

# Copy all files
COPY . /app

# Create .env file from build arguments
RUN set -e && \
    echo "${DATABASE_URL}" && \
    echo "# Environment variables declared in this file are automatically made available to Prisma." > .env && \
    echo "# See the documentation for more detail: https://pris.ly/d/prisma-schema#accessing-environment-variables-from-the-schema" >> .env && \
    echo "" >> .env && \
    echo "DATABASE_URL=${DATABASE_URL}" >> .env && \
    echo "PORT=${PORT:-3000}" >> .env && \
    echo "" >> .env && \
    echo "KEYCLOAK_REALM=${KEYCLOAK_REALM}" >> .env && \
    echo "KEYCLOAK_CLIENT=${KEYCLOAK_CLIENT}" >> .env && \
    echo "KEYCLOAK_URL=${KEYCLOAK_URL}" >> .env && \
    echo "KEYCLOAK_CLIENT_SECRET=${KEYCLOAK_CLIENT_SECRET}" >> .env

# Start the application
CMD npx prisma generate && npm run start
EXPOSE 3000