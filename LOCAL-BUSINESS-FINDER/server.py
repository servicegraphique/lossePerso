#!/usr/bin/env python3
"""Small, dependency-free static server. Windows launches it through start.bat."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
import threading
import webbrowser

ROOT = Path(__file__).resolve().parent

class LocalHandler(SimpleHTTPRequestHandler):
    def list_directory(self, path):
        self.send_error(404, "Directory listing is disabled")
        return None

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("Cache-Control", "no-cache")
        # No X-Frame-Options: the development preview may be embedded by Arena.
        super().end_headers()

    def do_GET(self):
        path = self.path.split("?", 1)[0].split("#", 1)[0]
        from urllib.parse import unquote
        if any(part.startswith(".") for part in unquote(path).split("/") if part):
            self.send_error(404)
            return
        super().do_GET()

    def log_message(self, fmt, *args):
        if not getattr(self.server, "quiet", False):
            super().log_message(fmt, *args)


def main():
    parser = argparse.ArgumentParser(description="Serveur local de Local Business Finder")
    parser.add_argument("--host", default="127.0.0.1", help="Adresse d'écoute (localhost par défaut)")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--no-browser", action="store_true")
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()
    handler = partial(LocalHandler, directory=str(ROOT))
    try:
        server = ThreadingHTTPServer((args.host, args.port), handler)
    except OSError as error:
        raise SystemExit(f"Le port {args.port} est indisponible. Fermez l'autre instance ou choisissez --port. ({error})")
    server.quiet = args.quiet
    display_host = "localhost" if args.host in ("127.0.0.1", "0.0.0.0") else args.host
    url = f"http://{display_host}:{args.port}"
    print(f"\n LOCAL BUSINESS FINDER\n {url}\n\n Gardez cette fenêtre ouverte pendant l'utilisation.\n Ctrl+C pour arrêter. Aucune donnée personnelle n'est envoyée au serveur.\n", flush=True)
    if not args.no_browser:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServeur arrêté. Vos données restent dans votre navigateur.", flush=True)
    finally:
        server.server_close()

if __name__ == "__main__":
    main()
