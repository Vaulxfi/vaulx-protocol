#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
for p in trdc vault loan auction; do
  cp "target/idl/${p}.json" "packages/idls/src/${p}.json"
done
echo "copied 4 IDLs → packages/idls/src/"
