const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  
  if (req.url === '/index.bundle' || req.url.startsWith('/index.bundle?')) {
    // Serve the JavaScript bundle with correct MIME type
    const bundlePath = path.join(__dirname, 'ios-bundle.js');
    
    if (fs.existsSync(bundlePath)) {
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      const bundle = fs.readFileSync(bundlePath);
      res.writeHead(200);
      res.end(bundle);
      console.log('Served JavaScript bundle');
    } else {
      res.writeHead(404);
      res.end('Bundle not found');
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = 8081;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Bundle server running at http://${HOST}:${PORT}`);
  console.log('Serving JavaScript bundle with correct MIME type');
});