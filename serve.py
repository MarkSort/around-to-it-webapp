#!/usr/bin/env python
import http.server
import socketserver

# This is the same as `python3 -m http.server` except it disables clientside caching.

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_my_headers()
        http.server.SimpleHTTPRequestHandler.end_headers(self)

    def send_my_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")


if __name__ == '__main__':
    PORT = 8000

    with socketserver.TCPServer(("0.0.0.0", 8000), MyHTTPRequestHandler) as httpd:
        print("serving at port", PORT)
        httpd.serve_forever()
