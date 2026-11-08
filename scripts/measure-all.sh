#!/bin/sh
# usage: sh scripts/measure-all.sh <out.jsonl> <keys> <n> <fixture>... — three runs of each fixture under the browser lock, one JSON line each appended to <out.jsonl>. A fixture ending in -200 is run once: a single fill takes tens of minutes (measured), and the lock is shared.
out=$1; keys=$2; n=$3; shift 3
for f in "$@"; do
  runs="1 2 3"
  case $f in *-200) runs="1";; esac
  for r in $runs; do
    lockf -t 3600 /private/tmp/beltype-browser.lock node scripts/measure.mjs "fixtures/measure/$f" --keys "$keys" --n "$n" >> "$out"
  done
done
