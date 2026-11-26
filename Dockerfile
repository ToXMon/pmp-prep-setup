FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PMP_BIND=0.0.0.0 PORT=8080 PMP_CONTENT_ROOT=/content
WORKDIR /app
COPY coach_server.py coach_core.py index.html style.css app.mjs sw.js drills.mjs course.mjs coverage.mjs questions-foundations.mjs questions-delivery.mjs study.mjs icon.svg manifest.webmanifest ask.html ask.mjs ./
COPY --from=content /semantic-layer/semantic-index.json /content/semantic-layer/
COPY --from=content /semantic-layer/scripts/query_semantic_index.py /semantic-layer/scripts/sources.py /content/semantic-layer/scripts/
USER 65534:65534
EXPOSE 8080
CMD ["python", "coach_server.py"]
