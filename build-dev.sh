#!/bin/bash -e
./node_modules/.bin/webpack --mode development
cp -v serve.py /mnt/c/mark/dev/ati17/
cp -vr build /mnt/c/mark/dev/ati17/
