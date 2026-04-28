#!/usr/bin/env bash
# .cursor/hooks/block-dangerous.sh — blokuj wybrane niebezpieczne komendy powłoki (Cursor beforeShellExecution)
INPUT=$(cat)

resolve_json_tool() {
  if command -v python3 >/dev/null 2>&1; then echo python3
  elif command -v python >/dev/null 2>&1; then echo python
  elif command -v node >/dev/null 2>&1; then echo node
  else echo ""; fi
}

TOOL=$(resolve_json_tool)

if [ -z "$TOOL" ]; then
  echo "cursor hook block-dangerous: brak python3/python/node w PATH — hook wyłączony (allow)" >&2
  echo '{"permission":"allow"}'
  exit 0
fi

if [ "$TOOL" = node ]; then
  export HOOK_INPUT="$INPUT"
  COMMAND=$(node -e "try { console.log(JSON.parse(process.env.HOOK_INPUT || '{}').command ?? '') } catch { console.log('') }")
  unset HOOK_INPUT
else
  COMMAND=$(printf '%s' "$INPUT" | "$TOOL" -c "import sys, json; print(json.load(sys.stdin).get('command') or '')")
fi

if echo "$COMMAND" | grep -qE 'rm\s+-rf|git\s+push\s+--force|DROP\s+TABLE'; then
  if [ "$TOOL" = node ]; then
    node -e "console.log(JSON.stringify({permission:'deny',user_message:'Zablokowano niebezpieczną komendę. Użyj bezpieczniejszej alternatywy.',agent_message:'Dangerous shell pattern blocked.'}))"
  else
    "$TOOL" -c "import json; print(json.dumps({'permission':'deny','user_message':'Zablokowano niebezpieczną komendę. Użyj bezpieczniejszej alternatywy.','agent_message':'Dangerous shell pattern blocked.'}, ensure_ascii=False))"
  fi
  exit 0
fi

echo '{"permission":"allow"}'
exit 0
