#!/usr/bin/env python3
"""ERIS SLUG static + REST server."""
from __future__ import annotations

import json
import mimetypes
import os
import random
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
SAVES = ROOT / "saves"
SAVES.mkdir(exist_ok=True)
os.chdir(ROOT)

ORACLE = [
    {"quote": "Convence um homem de uma mentira e ele a defenderá pelo resto da vida.", "ref": "Principia Discordia"},
    {"quote": "Todo homem, mulher e criança neste planeta é um Papa Discordiano.", "ref": "Principia Discordia · 00004"},
    {"quote": "Greyface ensinou que ordem é verdadeira e caos é falso. Greyface é um palhaço triste.", "ref": "Curse of Greyface"},
    {"quote": "Cinco toneladas de linho.", "ref": "The Law of Fives"},
    {"quote": "Kallisti — para a mais bela.", "ref": "A Maçã Dourada"},
    {"quote": "Fnord.", "ref": "Illuminatus!"},
    {"quote": "Não há deusa além de Eris, e Ela é a sua Deusa.", "ref": "Principia Discordia"},
    {"quote": "A pineal não é uma glândula. É uma janela.", "ref": "Hagbard Celine"},
    {"quote": "A hot dog é o sacramento de sexta-feira.", "ref": "Hot Dog Day"},
    {"quote": "23. Sempre 23.", "ref": "Law of Fives"},
    {"quote": "Se o telefone tocar, não atenda. É a Discórdia cobrando o aluguel.", "ref": "Oráculo de Eris"},
    {"quote": "O Sagrado Chao une Hodge e Podge. Não escolha um lado: morde a maçã.", "ref": "Malaclypse the Younger"},
]


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print("[eris]", self.address_string(), fmt % args)

    def _json(self, obj, code=200):
        data = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(data)

    def _read(self):
        n = int(self.headers.get("Content-Length") or 0)
        if n <= 0:
            return {}
        return json.loads(self.rfile.read(n).decode("utf-8") or "{}")

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/oracle":
            return self._json(random.choice(ORACLE))
        if path == "/api/load":
            fp = SAVES / "slot1.json"
            if fp.exists():
                return self._json(json.loads(fp.read_text()))
            return self._json({})
        if path == "/api/leaderboard":
            fp = SAVES / "scores.json"
            scores = json.loads(fp.read_text()) if fp.exists() else []
            return self._json(sorted(scores, key=lambda s: -s.get("score", 0))[:23])
        if path == "/api/health":
            return self._json({"ok": True, "game": "ERIS SLUG", "law": 5})
        return super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        body = self._read()
        if path == "/api/save":
            (SAVES / "slot1.json").write_text(json.dumps(body, indent=2))
            return self._json({"ok": True})
        if path == "/api/score":
            fp = SAVES / "scores.json"
            scores = json.loads(fp.read_text()) if fp.exists() else []
            scores.append({"name": body.get("name", "ERIS"), "score": int(body.get("score") or 0)})
            fp.write_text(json.dumps(scores[-100:]))
            return self._json({"ok": True})
        return self._json({"error": "unknown"}, 404)


def main():
    port = int(os.environ.get("PORT", "8000"))
    httpd = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print(f"ERIS SLUG  ·  http://localhost:{port}  ·  Hail Eris")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nKallisti.")


if __name__ == "__main__":
    main()
