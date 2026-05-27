#!/bin/bash
set -e

if [ -f ".env" ]; then
  echo ".env file exists. ✅"
else
  echo ".env file does not exist. Creating from .env.example..."
  cp .env.example .env
fi

ROOT_ENV="$(realpath .env)"

for dir in apps/* packages/*; do
  if [ -d "$dir" ]; then
    target="$dir/.env"

    if [ -L "$target" ] && [ "$(readlink "$target")" = "$ROOT_ENV" ]; then
      continue
    fi

    rm -f "$target"
    ln -s "$ROOT_ENV" "$target"
    echo "linked $target -> $ROOT_ENV"
  fi
done
