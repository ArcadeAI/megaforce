#!/bin/sh
set -e

# Render provides PORT; default to 10000
: "${PORT:=10000}"

# Build API_BASE_URL from host/port if not provided
if [ -z "${API_BASE_URL}" ]; then
  if [ -n "${API_HOST}" ] && [ -n "${API_PORT}" ]; then
    export API_BASE_URL="https://${API_HOST}:${API_PORT}"
  fi
fi

envsubst '${PORT} ${API_BASE_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'


