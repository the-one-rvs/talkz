#!/bin/sh
set -e

envsubst '$API_HOST $API_PORT $SOCKET_HOST $SOCKET_PORT' \
  < /etc/nginx/conf.d/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec "$@"
