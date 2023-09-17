#! /bin/bash
set -e
wget "http://0.0.0.0:62362/openapi.json" -O shared/openapi.json
npx --yes openapi-client-axios-typegen shared/openapi.json -t > shared/clients/types.d.ts
