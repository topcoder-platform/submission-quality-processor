#!/bin/bash
set -eo pipefail
UPDATE_CACHE=""
echo "">api.env
docker-compose -f docker/docker-compose.yml build submission-quality-processor
docker create --name app submission-quality-processor:latest

if [ -d node_modules ]
then
  mv package-lock.json old-package-lock.json
  docker cp app:/submission-quality-processor/package-lock.json package-lock.json
  set +eo pipefail
  UPDATE_CACHE=$(cmp package-lock.json old-package-lock.json)
  set -eo pipefail
else
  UPDATE_CACHE=1
fi

if [ "$UPDATE_CACHE" == 1 ]
then
  docker cp app:/submission-quality-processor/node_modules .
fi