#!/usr/bin/env bash
set -euo pipefail
pattern=/home/monujesh/.cache/puppeteer/chrome-headless-shell/linux-*/chrome-headless-shell-linux64/chrome-headless-shell
shopt -s nullglob
matches=( $pattern )
shopt -u nullglob
[[ ${#matches[@]} -eq 1 ]] || { echo "Pinned Chromium binary not found" >&2; exit 127; }
export PDF_CHROME_BINARY="${matches[0]}"
export LD_LIBRARY_PATH="/home/monujesh/.local/chrome-libs/usr/lib/x86_64-linux-gnu${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
mkdir -p /home/monujesh/.local/run
chmod 700 /home/monujesh/.local/run
exec /usr/bin/firejail --quiet --net=none --private-tmp --private-dev \
  --caps.drop=all --nonewprivs --seccomp --env="PDF_CHROME_BINARY=$PDF_CHROME_BINARY" \
  --env="LD_LIBRARY_PATH=$LD_LIBRARY_PATH" --rlimit-cpu=30 --rlimit-fsize=31457280 \
  --rlimit-nofile=1024 --rlimit-nproc=128 \
  /usr/bin/node scripts/secure-pdf-renderer.mjs
