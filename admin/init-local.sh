#!/usr/bin/env bash

docker rm -f bt_mongo
docker rm -f bt_s3
docker rm -f bt_smtp
docker run --name bt_mongo -d -p 27017:27017 mongo:4.0.4-xenial
docker run --name bt_s3 -d -p 4569:4569 lphoward/fake-s3:latest
docker run --name bt_smtp -d -p 15025:25 tecnativa/smtp-sink:latest

npm run init-local
