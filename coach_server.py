"""Serve Ask PMP behind an HTTPS reverse proxy."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import base64
import binascii
import hmac
import json
import mimetypes
import os
from pathlib import Path
import threading
from urllib.parse import urlsplit

from coach_core import load_corpus, answer, Unavailable

HERE = Path(__file__).resolve().parent
ASSETS = frozenset("""index.html style.css app.mjs sw.js drills.mjs course.mjs coverage.mjs
questions-foundations.mjs questions-delivery.mjs study.mjs icon.svg manifest.webmanifest
ask.html ask.mjs""".split())


def handler(config, corpus, reply=answer):
    gate = threading.BoundedSemaphore(1)
    expected = b"pmp:" + config["password"].encode()

    class Handler(BaseHTTPRequestHandler):
        def setup(self):
            super().setup()
            self.connection.settimeout(10)

        def log_message(self, *args):
            pass

        def emit(self, status, data=b"", kind="text/plain; charset=utf-8", headers=()):
            self.send_response(status)
            self.send_header("Content-Type", kind)
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Referrer-Policy", "no-referrer")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Content-Security-Policy", "default-src 'self'; frame-ancestors 'none'; base-uri 'none'")
            for name, value in headers:
                self.send_header(name, value)
            self.end_headers()
            self.wfile.write(data)

        def json(self, status, value):
            self.emit(status, json.dumps(value).encode(), "application/json")

        def allowed(self):
            scheme, _, credentials = self.headers.get("Authorization", "").partition(" ")
            if scheme.lower() != "basic" or len(credentials) > 512:
                return False
            try:
                return hmac.compare_digest(base64.b64decode(credentials, validate=True), expected)
            except (ValueError, binascii.Error):
                return False

        def challenge(self):
            self.emit(401, b"Ask PMP requires a password.", headers=(
                ("WWW-Authenticate", 'Basic realm="Ask PMP", charset="UTF-8"'),
            ))

        def do_GET(self):
            path = urlsplit(self.path).path
            if path == "/healthz":
                return self.emit(200, b"ok")
            if path == "/api/session":
                return self.json(200, {"signedIn": self.allowed()})
            if path == "/ask.html" and not self.allowed():
                return self.challenge()
            asset = "index.html" if path == "/" else path.removeprefix("/")
            if asset not in ASSETS:
                return self.emit(404, b"Not found")
            kind = "text/javascript" if asset.endswith(".mjs") else (
                mimetypes.guess_type(asset)[0] or "application/octet-stream")
            return self.emit(200, (HERE / asset).read_bytes(), kind)

        def do_POST(self):
            if self.path != "/api/ask":
                return self.emit(404)
            if not self.allowed():
                return self.json(401, {"error": "Open Ask PMP and enter your password first."})
            if self.headers.get("Origin") != config["origin"]:
                return self.json(403, {"error": "Request origin not allowed."})
            if self.headers.get_content_type() != "application/json":
                return self.json(415, {"error": "Expected a JSON request."})
            try:
                size = int(self.headers.get("Content-Length", "0"))
                if not 0 < size <= 16000:
                    raise ValueError
                raw = self.rfile.read(size)
                if len(raw) != size:
                    raise ValueError
                data = json.loads(raw)
                mode, question = data["mode"], data["question"]
                if mode not in ("project", "study", "drill", "feedback") or not isinstance(question, str) or not 0 < len(question.strip()) <= 3200:
                    raise ValueError
            except (KeyError, TypeError, ValueError, TimeoutError):
                return self.json(400, {"error": "Enter a question of up to 3,200 characters."})
            if not gate.acquire(blocking=False):
                return self.json(429, {"error": "A coach request is already running."})
            try:
                result = reply(corpus, config["surplus_key"], mode, question.strip())
                result["sources"] = [] if mode == "drill" else [
                    {k: v for k, v in s.items() if k != "passage"} for s in result["sources"]]
                return self.json(200, result)
            except Unavailable as exc:
                return self.json(503, {"error": str(exc)})
            finally:
                gate.release()

    return Handler


if __name__ == "__main__":
    config = {"origin": os.getenv("PMP_ORIGIN", ""), "password": os.getenv("PMP_PASSWORD", ""),
              "surplus_key": os.getenv("SURPLUS_API_KEY", "")}
    base = urlsplit(config["origin"])
    if (not all(config.values()) or len(config["password"]) < 20 or not base.hostname
            or base.path or base.query or base.fragment or base.username or
            (base.scheme != "https" and not (base.scheme == "http" and base.hostname in ("localhost", "127.0.0.1")))):
        raise SystemExit("Set valid Ask PMP environment variables; see docs/ask-pmp-run.md.")
    corpus = load_corpus(os.getenv("PMP_CONTENT_ROOT", str(HERE.parent)))
    ThreadingHTTPServer((os.getenv("PMP_BIND", "127.0.0.1"), int(os.getenv("PORT", "8080"))),
                        handler(config, corpus)).serve_forever()
