#!/bin/bash

# .env 파일 불러오기
if [ -f /app/.env ]; then
    source /app/.env
fi


echo "$(date) - callme.sh 시작- $CURRENT_DOMAIN"

# curl 결과와 상태코드 모두 저장
response=$(curl -s -w "\nHTTP_STATUS_CODE:%{http_code}\n" -X GET "$CURRENT_DOMAIN")
echo "$response"

echo "$(date) - callme.sh 종료"