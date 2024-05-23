FROM node:16

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
COPY *.ts ./
COPY *.json ./
COPY *.js ./
RUN mkdir ./src
ADD src ./src/
COPY src ./src/

RUN npm install -g typescript
RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

RUN npm run build

EXPOSE 4001 5001
CMD [ "node", "./dist/main.js" ]