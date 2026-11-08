#!/bin/sh
# usage: sh scripts/measure-all.sh <out.jsonl> <keys> <n> <fixture>... — three runs of each fixture under the browser lock, one JSON line each appended to <out.jsonl>.
out=$1; keys=$2; n=$3; shift 3
for f in "$@"; do
  for r in 1 2 3; do
    lockf -t 3600 /private/tmp/beltype-browser.lock node scripts/measure.mjs "fixtures/measure/$f" --keys "$keys" --n "$n" >> "$out"
  done
done
