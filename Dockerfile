ARG BUILD_IMAGE=node:14-alpine
ARG RUNTIME_IMAGE=node:14-alpine
FROM $BUILD_IMAGE AS build

ENV NODE_ENV production
ARG BUILD_ENV

WORKDIR /build/
COPY ./package.json ./

RUN yarn config set registry "${NPM_REGISTRY}" \
  && NODE_ENV=development yarn --dev-only \
  && yarn add -G gulp-cli

COPY ./.es* ./
COPY ./*.js ./
COPY ./src/ ./src/

RUN NODE_ENV="${BUILD_ENV}" gulp compile:publish --max_old_space_size=16384 

FROM $BUILD_IMAGE AS packages
ARG NPM_REGISTRY

RUN mkdir -p /packages/
WORKDIR /packages/
COPY --from=build /build/package.json /packages/

RUN yarn config set registry "${NPM_REGISTRY}" \
  && NODE_ENV=production yarn install --production  

FROM $RUNTIME_IMAGE

ARG SYS_VERSION=notset
ARG TZ="Australia/Brisbane"

ENV NODE_ENV production
ENV DEBUG * 

RUN addgroup -S service && adduser -S service -G service 

RUN mkdir -p /app/ && chown service:service -R /app

WORKDIR /app/

RUN apk update && apk add --no-cache tzdata ca-certificates \
  && cp "/usr/share/zoneinfo/$TZ" /etc/localtime \
  && echo "$TZ" > /etc/timezone && apk del --no-cache tzdata

RUN echo "${SYS_VERSION}" > ./version

COPY --chown=service --from=packages /packages/ /app/
COPY --chown=service --from=build /build/build/ /app/build/

USER service

CMD node --max_old_space_size=16384 ./build/start.js
