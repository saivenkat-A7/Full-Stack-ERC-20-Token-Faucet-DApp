const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const distPath = path.join(__dirname, 'dist');
const indexPath = path.join(distPath, 'index.html');

// Check if dist directory exists
if (!fs.existsSync(distPath)) {
  console.error('Error: dist directory not found. Please build the application first.');
  process.exit(1);
}

// Serve static files from dist directory
app.use(express.static(distPath, {
  maxAge: '1d',
  etag: true
}));

// Health check endpoint - must come before catch-all
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Catch-all route - serve index.html for any other request (SPA routing)
app.use((req, res) => {
  res.sendFile(indexPath);
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('=================================');
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`📁 Serving from: ${distPath}`);
  console.log('=================================');
});