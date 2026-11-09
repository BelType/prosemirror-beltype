#!/bin/sh
# usage: sh scripts/verdicts-all.sh <out.jsonl> [runs] — every fixture under fixtures/ and fixtures/measure/ (the -80 and -200 ones left out: minutes each, measured) run through measure.mjs with `--pages` and no keystroke, each under the browser lock, `runs` times (1 by default), one JSON line per run appended to <out.jsonl>; scripts/verdicts.mjs compares two such files.
out=$1; runs=${2:-1}
for f in fixtures/*/index.html fixtures/measure/*/index.html; do
  d=$(dirname "$f")
  case $d in *-80|*-200) continue;; esac
  i=0
  while [ $i -lt "$runs" ]; do
    lockf -t 3600 /private/tmp/beltype-browser.lock node scripts/measure.mjs "$d" --keys none --pages >> "$out" || echo "{\"fixture\":\"$(basename "$d")\",\"failed\":true}" >> "$out"
    i=$((i + 1))
  done
done
