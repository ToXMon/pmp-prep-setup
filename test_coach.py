import io
import json
from pathlib import Path
from threading import Thread
from unittest import TestCase
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from coach_core import answer, load_corpus, model_reply, retrieve, Unavailable
from coach_server import handler, ThreadingHTTPServer


class CoachTests(TestCase):
    @classmethod
    def setUpClass(cls):
        cls.corpus = load_corpus(Path(__file__).resolve().parents[1])

    def test_original_passage(self):
        sources = retrieve(self.corpus, "What should I verify before formally closing a procurement contract?")
        self.assertEqual(sources[0]["session"], 5)
        self.assertIn("deliverables and acceptance criteria", sources[0]["passage"])
        self.assertNotIn("https://", sources[0]["passage"])

    def test_citations_and_drill(self):
        query = "What does earned value mean?"
        def fake(key, messages):
            self.assertTrue(json.loads(messages[1]["content"])["evidence"])
            return '{"answer":"Evidence [E1].","citations":["E1"]}'
        self.assertEqual(answer(self.corpus, "test", "study", query, fake)["sources"][0]["id"], "E1")
        with self.assertRaises(Unavailable):
            answer(self.corpus, "test", "drill", query, fake)
        with self.assertRaises(Unavailable):
            answer(self.corpus, "test", "study", query, lambda *args: '{"answer":"False [E99]","citations":["E99"]}')
        result = answer(self.corpus, "test", "drill", query, lambda *args: '{"answer":"What would you do?","citations":[]}')
        self.assertEqual(result["kind"], "drill")
        self.assertFalse(result["sources"])

    def test_discount_and_retry(self):
        calls, pauses = [], []
        def send(request, timeout):
            self.assertTrue(request.full_url.endswith("/min99/v1/chat/completions"))
            self.assertEqual(json.loads(request.data)["model"], "glm-5.3")
            calls.append(request)
            if len(calls) == 1:
                raise HTTPError(request.full_url, 503, "cooldown", {"Retry-After": "2"},
                                io.BytesIO(b'{"error":{"code":"minimum_discount_supply_cooldown"}}'))
            return io.BytesIO(b'{"choices":[{"message":{"content":"ok"}}]}')
        self.assertEqual(model_reply("test", [], send=send, pause=pauses.append), "ok")
        self.assertEqual(pauses, [2])
        self.assertEqual(len(calls), 2)
        def timeout(*args, **kwargs):
            calls.append(None)
            raise TimeoutError
        with self.assertRaises(Unavailable):
            model_reply("test", [], send=timeout)
        self.assertEqual(len(calls), 3)

    def test_signed_out_and_private_files(self):
        config = dict(origin="https://coach.example", password="x"*40, surplus_key="test")
        def unexpected(*args):
            self.fail("Signed-out call reached inference")
        with ThreadingHTTPServer(("127.0.0.1", 0), handler(config, self.corpus, unexpected)) as server:
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                base = f"http://127.0.0.1:{server.server_port}"
                with urlopen(base + "/api/session") as response:
                    self.assertEqual(json.load(response), {"signedIn": False})
                with self.assertRaises(HTTPError) as saved:
                    urlopen(Request(base + "/api/ask", b'{}', {"Content-Type": "application/json"}))
                self.assertEqual(saved.exception.code, 401)
                with self.assertRaises(HTTPError) as saved:
                    urlopen(base + "/coach_core.py")
                self.assertEqual(saved.exception.code, 404)
                with self.assertRaises(HTTPError) as saved:
                    urlopen(base + "/ask.html")
                with saved.exception as error:
                    self.assertEqual(error.code, 401)
                    self.assertTrue(error.headers["WWW-Authenticate"].startswith("Basic"))
                import base64
                auth = "Basic " + base64.b64encode(("pmp:" + config["password"]).encode()).decode()
                with urlopen(Request(base + "/ask.html", headers={"Authorization": auth})) as response:
                    self.assertIn(b"Project Coach", response.read())
                with self.assertRaises(HTTPError) as saved:
                    urlopen(Request(base + "/api/ask", b'{}', {"Authorization": auth, "Origin": "https://wrong.example"}))
                with saved.exception as error:
                    self.assertEqual(error.code, 403)
            finally:
                server.shutdown()
                thread.join()
