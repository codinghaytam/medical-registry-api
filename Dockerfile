FROM node
WORKDIR /app
COPY ./package.json /app 
COPY ./app.yaml /app
RUN npm install
COPY . /app
CMD npx prisma generate;npm run start
EXPOSE 3000