#!/bin/sh
set -e
/usr/sbin/nginx -t -q
/bin/systemctl reload nginx
