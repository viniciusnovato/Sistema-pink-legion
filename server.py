#!/usr/bin/env python3
import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import subprocess

class CustomHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        # Parse the URL
        parsed_path = urlparse(self.path)
        
        # Handle API routes
        if parsed_path.path == '/api/generate-pdf':
            self.handle_api_request('api/generate-pdf.py')
        elif parsed_path.path == '/api/generate_confissao_pdf':
            self.handle_api_request('api/generate_confissao_pdf.py')
        else:
            # Serve static files
            super().do_GET()
    
    def do_POST(self):
        # Parse the URL
        parsed_path = urlparse(self.path)
        
        # Handle API routes
        if parsed_path.path == '/api/generate-pdf':
            self.handle_api_request('api/generate-pdf.py')
        elif parsed_path.path == '/api/generate_confissao_pdf':
            self.handle_api_request('api/generate_confissao_pdf.py')
        else:
            self.send_error(404, "Not Found")
    
    def handle_api_request(self, script_path):
        try:
            # Read the request body
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length) if content_length > 0 else b''
            
            # Set up environment
            env = os.environ.copy()
            env['REQUEST_METHOD'] = self.command
            env['CONTENT_TYPE'] = self.headers.get('Content-Type', '')
            env['CONTENT_LENGTH'] = str(content_length)
            env['QUERY_STRING'] = urlparse(self.path).query
            
            # Execute the Python script
            process = subprocess.Popen(
                [sys.executable, script_path],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                env=env,
                cwd=os.getcwd()
            )
            
            stdout, stderr = process.communicate(input=post_data)
            
            if process.returncode == 0:
                # Parse the CGI output
                output = stdout.decode('utf-8', errors='ignore')
                if '\r\n\r\n' in output:
                    headers, body = output.split('\r\n\r\n', 1)
                elif '\n\n' in output:
                    headers, body = output.split('\n\n', 1)
                else:
                    headers = 'Content-Type: text/plain'
                    body = output
                
                # Send response
                self.send_response(200)
                
                # Parse and send headers
                for header_line in headers.split('\n'):
                    if ':' in header_line:
                        key, value = header_line.split(':', 1)
                        self.send_header(key.strip(), value.strip())
                
                self.end_headers()
                
                # Send body
                if 'Content-Type: application/pdf' in headers:
                    self.wfile.write(body.encode('latin1'))
                else:
                    self.wfile.write(body.encode('utf-8'))
            else:
                # Error occurred
                self.send_error(500, f"Internal Server Error: {stderr.decode()}")
                
        except Exception as e:
            self.send_error(500, f"Internal Server Error: {str(e)}")

def run_server():
    port = int(os.environ.get('PORT', 8000))
    server_address = ('', port)
    httpd = HTTPServer(server_address, CustomHandler)
    print(f"Server running on port {port}")
    httpd.serve_forever()

if __name__ == '__main__':
    run_server()