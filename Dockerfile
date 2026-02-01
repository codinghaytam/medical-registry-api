FROM node:latest
WORKDIR /app

# Define build arguments for environment variables
ARG DATABASE_URL
ARG PORT
ARG KEYCLOAK_URL
ARG KEYCLOAK_REALM
ARG KEYCLOAK_CLIENT
ARG KEYCLOAK_CLIENT_SECRET
ARG GCS_BUCKET_NAME
ARG GCS_PROJECT_ID
ARG GCS_SA_KEY
ARG SERVICE_NAME
ARG OTEL_EXPORTER_OTLP_ENDPOINT
ARG OTEL_EXPORTER_OTLP_PROTOCOL
ARG OTEL_RESOURCE_ATTRIBUTES
ARG OTEL_LOG_LEVEL
ARG OTEL_TRACES_EXPORTER
ARG OTEL_METRICS_EXPORTER
ARG OTEL_LOGS_EXPORTER


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
    echo "KEYCLOAK_CLIENT_ID=${KEYCLOAK_CLIENT}" >> .env && \
    echo "KEYCLOAK_BASE_URL=${KEYCLOAK_URL}" >> .env && \
    echo "KEYCLOAK_CLIENT_SECRET=${KEYCLOAK_CLIENT_SECRET}" >> .env && \
    echo "GCS_BUCKET_NAME=${GCS_BUCKET_NAME}" >> .env && \
    echo "GCS_PROJECT_ID=${GCS_PROJECT_ID}" >> .env && \
    echo "SERVICE_NAME=${SERVICE_NAME}" >> .env && \
    echo "OTEL_EXPORTER_OTLP_ENDPOINT=${OTEL_EXPORTER_OTLP_ENDPOINT}" >> .env && \
    echo "OTEL_EXPORTER_OTLP_PROTOCOL=${OTEL_EXPORTER_OTLP_PROTOCOL}" >> .env && \
    echo "OTEL_RESOURCE_ATTRIBUTES=${OTEL_RESOURCE_ATTRIBUTES}" >> .env && \
    echo "OTEL_LOG_LEVEL=${OTEL_LOG_LEVEL}" >> .env && \
    echo "OTEL_TRACES_EXPORTER=${OTEL_TRACES_EXPORTER}" >> .env && \
    echo "OTEL_METRICS_EXPORTER=${OTEL_METRICS_EXPORTER}" >> .env && \
    echo "OTEL_LOGS_EXPORTER=${OTEL_LOGS_EXPORTER}" >> .env

# Handle GCS Key: Decode Base64 to JSON file
# We assume GCS_SA_KEY is passed as a Base64 encoded string of the JSON key.
RUN echo "${GCS_SA_KEY}" | base64 -d > /app/gcs-key.json

# Set Google Application Credentials environment variable
ENV GOOGLE_APPLICATION_CREDENTIALS="/app/gcs-key.json"

# Start the application
CMD npx prisma generate && npx prisma migrate deploy && npx tsc && npm run start
EXPOSE 3000