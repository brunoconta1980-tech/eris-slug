#!/usr/bin/env python3
"""Launch ERIS SLUG and open the browser."""
import os
import socket
import sys
import threading
import time
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
os.chdir(ROOT)
sys.path.insert(0, str(ROOT))


def free_port(start=8000):
    for p in range(start, start + 20):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                s.bind(("127.0.0.1", p))
                return p
            except OSError:
                continue
    return start


def main():
    port = free_port()
    os.environ["PORT"] = str(port)
    import server as srv

    t = threading.Thread(target=srv.main, daemon=True)
    t.start()
    url = f"http://localhost:{port}"
    print(f"Abrindo {url}")
    time.sleep(0.4)
    webbrowser.open(url)
    try:
        t.join()
    except KeyboardInterrupt:
        print("\nHail Eris.")


if __name__ == "__main__":
    main()
