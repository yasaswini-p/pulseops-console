#!/bin/bash
# PulseOps Console — end-to-end smoke test of the deployed system (one Express server)
# Run from the project root:  bash scripts/smoke-test.sh

BASE="${BASE:-http://localhost:4000}"
J='Content-Type: application/json'
OUT="docs/smoke-test.txt"
PASS=0; FAIL=0
: > "$OUT"

check() {  # $1 description  $2 expected  $3 actual
  if [ "$2" == "$3" ]; then result="PASS"; PASS=$((PASS+1)); else result="FAIL (expected $2, got $3)"; FAIL=$((FAIL+1)); fi
  printf "%-52s %s\n" "$1" "$result" | tee -a "$OUT"
}
code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }
json() { node -pe "JSON.parse(require('fs').readFileSync(0,'utf8'))$1" 2>/dev/null; }

echo "PulseOps Console smoke test — $(date)" | tee -a "$OUT"
echo "------------------------------------------------------------------------" | tee -a "$OUT"

check "1. API health check"                         200 "$(code $BASE/api/health)"
check "2. Manager dashboard served at /"            200 "$(code $BASE/)"
check "3. Operator console served at /console/"     200 "$(code $BASE/console/)"
check "4. Angular deep link /console/incidents"     200 "$(code $BASE/console/incidents)"
check "5. Unknown API route returns 404"            404 "$(code $BASE/api/does-not-exist)"
check "6. API request without login rejected"       401 "$(code $BASE/api/incidents)"

OP=$(curl -s -X POST $BASE/api/auth/login -H "$J" -d '{"username":"kavya","password":"Operator@123"}' | json .token)
MG=$(curl -s -X POST $BASE/api/auth/login -H "$J" -d '{"username":"meera","password":"Manager@123"}' | json .token)
check "7. Operator login issues a token"            yes "$([ ${#OP} -gt 20 ] && echo yes || echo no)"
check "8. Manager login issues a token"             yes "$([ ${#MG} -gt 20 ] && echo yes || echo no)"

ID=$(curl -s -X POST $BASE/api/incidents -H "Authorization: Bearer $OP" -H "$J" \
     -d '{"title":"Smoke test incident","priority":"P4","team":"APP"}' | json .incidentId)
check "9. Operator creates an incident"             yes "$(echo "$ID" | grep -q '^INC-' && echo yes || echo no)"
check "10. Operator takes ownership"                200 "$(code -X POST $BASE/api/incidents/$ID/assign -H "Authorization: Bearer $OP")"
check "11. Second take rejected (conflict)"         409 "$(code -X POST $BASE/api/incidents/$ID/assign -H "Authorization: Bearer $OP")"
check "12. Operator adds a work note"               201 "$(code -X POST $BASE/api/incidents/$ID/notes -H "Authorization: Bearer $OP" -H "$J" -d '{"text":"Smoke test note"}')"
check "13. Manager sees the operator's change"      IN_PROGRESS "$(curl -s $BASE/api/incidents/$ID -H "Authorization: Bearer $MG" | json .status)"
check "14. Operator blocked from analytics"         403 "$(code $BASE/api/analytics/summary -H "Authorization: Bearer $OP")"
check "15. Manager reads analytics"                 200 "$(code $BASE/api/analytics/summary -H "Authorization: Bearer $MG")"
check "16. Manager blocked from creating incidents" 403 "$(code -X POST $BASE/api/incidents -H "Authorization: Bearer $MG" -H "$J" -d '{"title":"x","priority":"P4","team":"APP"}')"
check "17. Operator resolves the incident"          200 "$(code -X POST $BASE/api/incidents/$ID/resolve -H "Authorization: Bearer $OP" -H "$J" -d '{"resolution":"Smoke test complete"}')"

echo "------------------------------------------------------------------------" | tee -a "$OUT"
echo "Result: $PASS passed, $FAIL failed  (incident used: $ID)" | tee -a "$OUT"