#!/bin/bash


# .env 파일로 저장해서 cron이나 sh에서 쓸 수 있도록
echo "CURRENT_DOMAIN=${CURRENT_DOMAIN}" > /app/.env
echo "OWNER_DOMAIN=${OWNER_DOMAIN}" >> /app/.env

# 1. cron 데몬 시작 (백그라운드)
#/usr/sbin/cron

# 2. FastAPI(Uvicorn) 서버 실행 (포그라운드)
/app/.venv/bin/uvicorn main:app --host 0.0.0.0 --port 80
