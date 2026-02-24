#!/usr/bin/env bash
set -euo pipefail

export TERM=xterm-256color
DEMO_DIR="$(mktemp -d /tmp/effect-v4-audit-demo.XXXXXX)"
mkdir -p "$DEMO_DIR/src"

cat > "$DEMO_DIR/src/legacy-service.ts" <<'TS'
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"

export class LegacyService extends Context.Tag("LegacyService")<
  LegacyService,
  { readonly run: Effect.Effect<string> }
>() {}

export const program = Effect.catchAll(
  Effect.succeed("ok"),
  () => Effect.succeed("fallback")
)
TS

cat > "$DEMO_DIR/src/legacy-fiber.ts" <<'TS'
import * as Effect from "effect/Effect"

export const background = Effect.forkDaemon(Effect.never)
TS

run_cmd() {
  local cmd="$1"
  printf "\n$ %s\n" "$cmd"
  bash -lc "$cmd"
}

printf "effect-v4-audit demo\n"
printf "workspace: %s\n" "$DEMO_DIR"
sleep 1

run_cmd "ls -1 $DEMO_DIR/src"
sleep 0.5

run_cmd "bun run ./src/bin.ts --cwd $DEMO_DIR --color always --format diagnostic"
sleep 1

run_cmd "bun run ./src/bin.ts --cwd $DEMO_DIR --format json | jq '.summary'"
sleep 1

printf "\n$ bun run ./src/bin.ts --cwd %s --fail-on-findings --color always; echo \"exit_code=\\$?\"\n" "$DEMO_DIR"
set +e
bun run ./src/bin.ts --cwd "$DEMO_DIR" --fail-on-findings --color always >/dev/null
STATUS=$?
set -e
printf "exit_code=%s\n" "$STATUS"

sleep 1
printf "\nDemo complete.\n"
