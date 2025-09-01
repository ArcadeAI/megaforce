#!/bin/sh
set -e

# Render provides PORT; default to 10000
: "${PORT:=10000}"

# API_BASE_URL must end with / for our proxy_pass
if [ -n "${API_BASE_URL}" ]; then
  case "$API_BASE_URL" in
    */) ;;
    *) export API_BASE_URL="${API_BASE_URL}/" ;;
  esac
fi

envsubst '${PORT} ${API_BASE_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'


