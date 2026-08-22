#!/usr/bin/env bash
# Loads the seeded blog posts into the running database by executing the
# compiled seeder inside the backend container.
#
# Usage, on the server:
#   ./scripts/seed-blog.sh                                 # auto-detect the container
#   ./scripts/seed-blog.sh -y                               # skip the confirmation
#   BACKEND_CONTAINER=my-backend ./scripts/seed-blog.sh     # name it yourself
#
# Works with plain Docker Compose and with Coolify alike. Coolify names its
# containers unpredictably, so the backend is found by looking for
# dist/seed-blog.js inside it rather than by guessing a name.
#
# WARNING: the seeder matches posts on their slug and overwrites them, so edits
# made in the admin panel to those posts are replaced. Posts you created
# yourself are never touched.
set -euo pipefail

SEED_PATH="dist/seed-blog.js"
ASSUME_YES=0
[ "${1:-}" = "-y" ] && ASSUME_YES=1

die() { printf '\nError: %s\n' "$1" >&2; exit 1; }

command -v docker >/dev/null 2>&1 || die "docker is not installed or not on PATH."
docker info >/dev/null 2>&1 || die "cannot talk to the Docker daemon — try again with sudo."

# Returns 0 if the container carries the compiled seeder.
has_seeder() {
  docker exec "$1" test -f "$SEED_PATH" >/dev/null 2>&1
}

find_backend() {
  local name
  # Cheap pass first: containers whose name mentions the backend.
  for name in $(docker ps --format '{{.Names}}' | grep -i backend || true); do
    has_seeder "$name" && { printf '%s' "$name"; return 0; }
  done
  # Fallback: any running container that has the seeder in it.
  for name in $(docker ps --format '{{.Names}}'); do
    has_seeder "$name" && { printf '%s' "$name"; return 0; }
  done
  return 1
}

CONTAINER="${BACKEND_CONTAINER:-}"

if [ -n "$CONTAINER" ]; then
  docker ps --format '{{.Names}}' | grep -qx "$CONTAINER" \
    || die "container '$CONTAINER' is not running. Check: docker ps"
  has_seeder "$CONTAINER" \
    || die "container '$CONTAINER' has no $SEED_PATH — is it really the backend?"
else
  echo "Looking for the backend container..."
  CONTAINER="$(find_backend)" || die "$(cat <<'MSG'
no running container contains dist/seed-blog.js.

Two likely reasons:
  1. The stack is not running yet.       Check with: docker ps
  2. The image predates the seeder.      Redeploy so the current commit is built.

If you know the container name, pass it explicitly:
  BACKEND_CONTAINER=<name> ./scripts/seed-blog.sh
MSG
)"
fi

echo "Backend container: $CONTAINER"

if [ "$ASSUME_YES" -eq 0 ]; then
  cat <<'MSG'

This loads the blog posts bundled with the repository. Posts that already exist
with the same slug are OVERWRITTEN, including any changes made to them in the
admin panel. Posts you created yourself are left alone.
MSG
  # Without a terminal there is nobody to answer, so require the flag instead of
  # assuming consent — this script is destructive for the slugs it manages.
  [ -t 0 ] || die "not running interactively. Re-run with -y if that is what you want."

  printf '\nContinue? [y/N] '
  read -r reply
  case "$reply" in
    [yY]|[yY][eE][sS]) ;;
    *) echo "Cancelled."; exit 0 ;;
  esac
fi

echo
docker exec "$CONTAINER" node "$SEED_PATH"
echo
echo "Done. Check the result at /blog on your site."
