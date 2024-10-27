#!/bin/bash -e
cd "$(dirname "$0")"
NODE_OPTIONS=--openssl-legacy-provider ./node_modules/.bin/webpack --mode development
