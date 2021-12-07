FROM node:17.0.1

RUN mkdir -p /home/node/app

WORKDIR /home/node/app

ENV NPM_CONFIG_PREFIX=/home/node/.npm-global

COPY package.json ./

RUN npm install

COPY . .

ENV PORT=__PORT__
ENV DATABASE_HOST=__DATABASE_HOST__
ENV SECRET_KEY_ACCESS_TOKEN=__SECRET_KEY_ACCESS_TOKEN__
ENV ACCESS_TOKEN_EXP_TIME=__ACCESS_TOKEN_EXP_TIME__
ENV SECRET_KEY_REFRESH_TOKEN=__SECRET_KEY_REFRESH_TOKEN__
ENV REFRESH_TOKEN_EXP_TIME=__REFRESH_TOKEN_EXP_TIME__
ENV SALT_PASSWORD=__SALT_PASSWORD__
ENV AWS_S3_REGION=__AWS_S3_REGION__
ENV AWS_ACCESS_KEY=__AWS_ACCESS_KEY__
ENV AWS_SECRET_KEY=__AWS_SECRET_KEY__

RUN npm run build

EXPOSE 80

CMD [ "npm", "run", "start:prod" ]
