#!/bin/bash

export GIT_REPO_URL="$GIT_REPO_URL"

CLONE_DIR="/home/app/output"

git clone "$GIT_REPO_URL" "$CLONE_DIR"

echo "Cloned the project into $CLONE_DIR"

exec node script.js
