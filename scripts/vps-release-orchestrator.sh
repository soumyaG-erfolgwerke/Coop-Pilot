#!/usr/bin/env bash
set -euo pipefail

release_name="${1:?release name required}"
source_release="${2:?source release required}"
release_dir="/home/monujesh/apps/cooppilot/releases/$release_name"

if [[ ! -f "$release_dir/.next/BUILD_ID" ]]; then
  bash /tmp/vps-prepare-patch-release.sh "$release_name" "$source_release"
fi

# The activation helper can briefly fail its immediate health probe while the
# new process starts. The bounded probe below is the authoritative check.
bash /tmp/vps-activate-patch-release.sh "$release_name" || true

for _ in $(seq 1 30); do
  if [[ "$(readlink -f /home/monujesh/apps/cooppilot/current)" == "$release_dir" ]] && \
     curl -fsS -o /dev/null http://127.0.0.1:3101/signinpage; then
    echo "DEPLOYED_RELEASE=$release_name"
    echo "HEALTH_HTTP=200"
    exit 0
  fi
  sleep 2
done

echo "Post-deployment health check failed" >&2
exit 1
