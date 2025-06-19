FROM node:latest
WORKDIR /app

# Copy package files and install dependencies
COPY ./package.json /app 
COPY ./pnpm-lock.yaml /app
RUN npm install -g pnpm && pnpm install

# Copy all files (except those in .dockerignore)
COPY . /app

# Build the application
RUN npx prisma generate && npx tsc

# Start the application
CMD npx prisma migrate deploy && npm run start
EXPOSE 3000