FROM python:3.11-slim

RUN apt-get update \
    && apt-get install -y tzdata cron curl \
    && ln -snf /usr/share/zoneinfo/Asia/Seoul /etc/localtime \
    && echo "Asia/Seoul" > /etc/timezone

WORKDIR /app

# uv 직접 설치 (공식 pip 패키지 사용)
RUN pip install --no-cache-dir uv

# 1. pip 캐시 최적화를 위해 requirements.txt만 먼저 복사 후 설치
COPY requirements.txt ./
RUN uv pip install --system --no-cache-dir --upgrade pip \
    && uv pip install --system -r requirements.txt\
    && uv sync --no-dev

# 2. 전체 소스 복사 (entrypoint.sh, cron 등 포함)
COPY . /app

# 3. cron 등록
COPY cron /etc/cron.d/cron
RUN chmod 0644 /etc/cron.d/cron && crontab /etc/cron.d/cron

RUN mkdir -p /app/log
RUN touch /app/log/cron.log

# 4. entrypoint.sh 실행권한
RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]