#!/usr/bin/env bash
PATH="$(pwd)/node_modules/.bin:$PATH"
git clean -X -f -d src/
concurrently --kill-others-on-fail -n 'lib' -c 'magenta,cyan' \
  'scripts/build-lib.sh'
