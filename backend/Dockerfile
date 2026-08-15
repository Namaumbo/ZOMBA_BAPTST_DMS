# syntax=docker/dockerfile:1

FROM python:3.13-slim AS base
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

FROM base AS builder
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM base AS runner
ENV FLASK_ENV=production
ENV PORT=5000
ENV WEB_CONCURRENCY=4

RUN apt-get update \
  && apt-get install -y --no-install-recommends libjpeg62-turbo libpng16-16 zlib1g \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 app \
  && useradd --system --uid 1001 --gid app --create-home app

COPY --from=builder /install /usr/local
COPY --chown=app:app . .
COPY --chown=app:app entrypoint.sh /entrypoint.sh

RUN mkdir -p uploads \
  && chown -R app:app uploads \
  && chmod +x /entrypoint.sh

USER app
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:5000/api/v1/health')" || exit 1

ENTRYPOINT ["/entrypoint.sh"]
