#!/usr/bin/env bash
# Starts cors-proxy (:3002), token-server (:3007) and nginx (:7860) in one
# container. If any of them exits, stop the rest and exit non-zero so the
# platform restarts the container instead of serving a half-dead app.
set -u

mkdir -p /tmp/nginx

pids=()
(cd /app/proxy && exec node cors-proxy.js) & pids+=($!)
(cd /app/token && exec node token-server.js) & pids+=($!)
nginx -e /dev/stderr & pids+=($!)

stop() { kill "${pids[@]}" 2>/dev/null || true; }
trap 'stop; exit 143' TERM INT

wait -n
code=$?
echo "entrypoint: a child process exited (status ${code}); shutting down" >&2
stop
wait 2>/dev/null
exit $(( code == 0 ? 1 : code ))
