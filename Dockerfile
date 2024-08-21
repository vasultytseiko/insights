FROM node:18

WORKDIR /app

COPY package*.json package-lock.json ./

RUN npm install

COPY . .

ENV PORT=$PORT

ENV DB_URL=$MONGO_URL

ENV JWT_ACCESS_SECRET=$JWT_ACCESS_SECRET

ENV JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET

EXPOSE $PORT

RUN npm run build

CMD ["npm", "start"]