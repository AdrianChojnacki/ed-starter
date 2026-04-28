#!/usr/bin/env bash
# .cursor/hooks/typecheck-after-edit.sh — po Write/Edit uruchamia typecheck i zwraca kontekst przy błędzie (Cursor postToolUse)
MAX_ATTEMPTS=5
COUNTER_FILE="${TMPDIR:-/tmp}/cursor-typecheck-counter-$$"

resolve_json_tool() {
  if command -v python3 >/dev/null 2>&1; then echo python3
  elif command -v python >/dev/null 2>&1; then echo python
  elif command -v node >/dev/null 2>&1; then echo node
  else echo ""; fi
}

TOOL=$(resolve_json_tool)

# Licznik prób - zabezpieczenie przed nieskończoną pętlą
COUNT=0
if [ -f "$COUNTER_FILE" ]; then
  COUNT=$(cat "$COUNTER_FILE")
fi

if [ "$COUNT" -ge "$MAX_ATTEMPTS" ]; then
  rm -f "$COUNTER_FILE"
  echo "{}"
  exit 0
fi

echo $((COUNT + 1)) > "$COUNTER_FILE"

OUTPUT=$(npm run typecheck 2>&1)
EXIT_CODE=$?

if [ "$EXIT_CODE" -eq 0 ]; then
  rm -f "$COUNTER_FILE"
  echo "{}"
  exit 0
fi

TAIL=$(echo "$OUTPUT" | tail -20)
TEXT=$(printf 'TypeScript errors (attempt %s/%s):\n%s' "$((COUNT + 1))" "$MAX_ATTEMPTS" "$TAIL")

if [ -z "$TOOL" ]; then
  echo "cursor hook typecheck-after-edit: brak python3/python/node — nie można zwrócić additional_context" >&2
  echo "{}"
  exit 0
fi

if [ "$TOOL" = node ]; then
  export TYPECHECK_TEXT="$TEXT"
  node -e "console.log(JSON.stringify({additional_context: process.env.TYPECHECK_TEXT ?? ''}))"
  unset TYPECHECK_TEXT
else
  export TYPECHECK_TEXT="$TEXT"
  "$TOOL" -c "import json, os; print(json.dumps({'additional_context': os.environ.get('TYPECHECK_TEXT','')}, ensure_ascii=False))"
  unset TYPECHECK_TEXT
fi
exit 0
