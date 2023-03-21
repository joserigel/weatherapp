FROM node:18

WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install
ADD build ./build
COPY App.js ./

EXPOSE 80
CMD ["node", "App.js"]