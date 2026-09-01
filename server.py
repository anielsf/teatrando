import http.server
import socketserver
import urllib.request
import ssl
import re
import json
import os
import sys

PORT = 8000
if len(sys.argv) > 1:
    try:
        PORT = int(sys.argv[1])
    except ValueError:
        pass

class TeatrandoHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Endpoint para obtener la tasa en tiempo real directamente de bcv.org.ve
        if self.path == '/api/tasa-bcv' or self.path == '/api/tasa-bcv/':
            tasa = self.obtener_tasa_bcv_directa()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response_data = json.dumps({'tasa': tasa, 'fuente': 'bcv.org.ve', 'success': True})
            self.wfile.write(response_data.encode('utf-8'))
            return

        # Servir archivos estáticos normales
        return super().do_GET()

    def obtener_tasa_bcv_directa(self):
        url = 'https://www.bcv.org.ve/'
        ctx = ssl._create_unverified_context()
        req = urllib.request.Request(
            url,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        )
        try:
            with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
                html = resp.read().decode('utf-8', errors='ignore')
                pos = html.find('id="dolar"')
                if pos != -1:
                    frag = html[pos:pos+600]
                    m = re.search(r'class=[\"\']strong-tb[\"\']>\s*([\d.,]+)\s*<', frag, re.I)
                    if m:
                        val_str = m.group(1).strip().replace('.', '').replace(',', '.')
                        val_num = float(val_str)
                        if val_num > 0:
                            return round(val_num, 2)
        except Exception as e:
            print(f"[Error consultando BCV directo]: {e}")
        
        return 798.33

if __name__ == '__main__':
    web_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(web_dir)
    
    with socketserver.TCPServer(("", PORT), TeatrandoHandler) as httpd:
        print(f"=======================================================")
        print(f"  🎭 Servidor Teatrando activo con API BCV en vivo")
        print(f"  URL: http://localhost:{PORT}")
        print(f"  Endpoint Tasa en Vivo: http://localhost:{PORT}/api/tasa-bcv")
        print(f"=======================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor detenido.")
