/**
 * Entry point for OnePanel/Passenger
 * Dùng dynamic import để load ESM module từ CommonJS context
 */

// Dynamic import ESM module
(async () => {
  try {
    await import('./dist/server.js');
    console.log('✅ Server loaded via Passenger');
  } catch (error) {
    console.error('❌ Failed to load server:', error);
    
    // Fallback: Hiển thị lỗi cho debug
    const http = require('http');
    const server = http.createServer((req, res) => {
      res.writeHead(500, {'Content-Type': 'text/plain'});
      res.end('Server Error:\n' + error.message + '\n\nStack:\n' + error.stack);
    });
    server.listen();
  }
})();
