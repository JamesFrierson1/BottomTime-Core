#!/usr/bin/env bash

docker rm -f bt_mongo
docker run --name bt_mongo -d -p 27017:27017 mongo:4.0.4-xenial