#!/usr/bin/env python3
"""Static dev server with caching disabled (ES modules otherwise go stale).
Example: scripts/serve.py 5500
"""
import functools
import http.server
import sys
from pathlib import Path


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *args) -> None:
        pass


def main() -> None:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5500
    root = Path(__file__).resolve().parent.parent
    handler = functools.partial(NoCache, directory=str(root))
    http.server.ThreadingHTTPServer(("127.0.0.1", port), handler).serve_forever()


if __name__ == "__main__":
    main()
