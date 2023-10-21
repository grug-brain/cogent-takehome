FROM node:18.18.2

WORKDIR /app

COPY package*.json ./

RUN npm ci

ENV NODE_ENV=production

COPY . .

RUN npm run build

EXPOSE 3000

CMD [ "npm", "start" ]
