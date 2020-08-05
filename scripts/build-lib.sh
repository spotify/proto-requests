#!/usr/bin/env bash
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
PATH="$(pwd)/node_modules/.bin:$PATH"

rm -rf lib
mkdir lib
echo -e "${YELLOW}Building js${NC}"
NODE_ENV=development RELEASE_ENV=production babel src --out-dir lib
echo -e "${YELLOW}Building lib/index.js${NC}"
scripts/create-index.js
echo -e "${YELLOW}Building index.js${NC}"
NODE_ENV=development RELEASE_ENV=production babel lib/temp.index.js -o lib/index.js
rm lib/temp.index.js
echo -e "${GREEN}Done!${NC}"
