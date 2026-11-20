"""Lokale server voor Nopav.es: serveert public/ onder /nopaves/, net als GitHub Pages.

    python3 tools/serve.py [poort=8765]

Daarna: http://localhost:8765/nopaves/  (/ verwijst door naar /nopaves/).
"""
import functools
import http.server
import os
import sys

PUBLIC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public')
PREFIX = '/nopaves'


class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path in ('/', PREFIX):
            self.send_response(301)
            self.send_header('Location', PREFIX + '/')
            self.end_headers()
            return
        super().do_GET()

    def translate_path(self, path):
        if not (path == PREFIX or path.startswith(PREFIX + '/')):
            return os.path.join(PUBLIC, '__bestaat_niet__')
        return super().translate_path(path[len(PREFIX):] or '/')

    def log_message(self, *args):
        pass


if __name__ == '__main__':
    poort = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    handler = functools.partial(Handler, directory=os.path.normpath(PUBLIC))
    with http.server.ThreadingHTTPServer(('', poort), handler) as s:
        print(f'Nopav.es op http://localhost:{poort}{PREFIX}/')
        s.serve_forever()
