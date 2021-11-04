FROM node:14-alpine as builder

ENV NODE_ENV build

RUN apk update && \
    apk add --no-cache git openssh

RUN npm install -g npm && \
    npm -v

WORKDIR /opt
RUN chown node:node .

USER node

COPY --chown=node:node \
  package.json \
  package-lock.json \
  [.]env \
  ./

COPY --chown=node:node \
  index.mjs \
  ./

RUN mkdir ~/.ssh && \
  ssh-keyscan github.com >> ~/.ssh/known_hosts

RUN npm clean-install
# && \
#  npm run build

FROM node:14-alpine

ENV TZ "Europe/Moscow"

#ENV NODE_ENV production
ENV NODE_ENV development

RUN wget -O /usr/bin/dumb-init https://github.com/Yelp/dumb-init/releases/download/v1.2.5/dumb-init_1.2.5_x86_64 && \
	chmod +x /usr/bin/dumb-init

ENTRYPOINT ["/usr/bin/dumb-init", "--"]

WORKDIR /opt

COPY --from=builder /opt/package*.json /opt/.env ./
COPY --from=builder /opt/node_modules ./node_modules/
COPY --from=builder /opt/index.mjs ./
#COPY --from=builder /opt/dist ./dist/

EXPOSE 3025

USER node

CMD [ "node", "index.mjs" ]
