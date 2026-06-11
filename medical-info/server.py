import os, sys
from http.server import HTTPServer, SimpleHTTPRequestHandler

os.chdir(os.path.dirname(os.path.abspath(__file__)))

class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *args): pass

HTTPServer(('', 3457), Handler).serve_forever()
