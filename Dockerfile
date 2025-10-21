FROM node:latest As development
WORKDIR /src
COPY package*.json ./
RUN npm install -g sequelize-cli webpack
RUN npm install --save puppeteer@0.11.0
COPY . .
EXPOSE 3000
CMD bash -c "npm link webpack"