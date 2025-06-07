const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const flaskTarget = 'http://localhost:5000'; 
const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Proxy tới Flask backend
app.use('/yolo', createProxyMiddleware({ target: 'http://localhost:5000', changeOrigin: true }));
app.use('/video_feed', createProxyMiddleware({ target: 'http://localhost:5000', changeOrigin: true }));
app.use('/audio_feed', createProxyMiddleware({ target: 'http://localhost:5000', changeOrigin: true }));
app.use('/hls', createProxyMiddleware({ target: 'http://localhost:5000', changeOrigin: true }));

// Dữ liệu GPS
let gpsData = { latitude: 10.7769, longitude: 106.7009 };
setInterval(() => {
  gpsData.latitude += (Math.random() - 0.5) * 0.001;
  gpsData.longitude += (Math.random() - 0.5) * 0.001;
}, 5000);

// Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/realtime', (req, res) => res.sendFile(path.join(__dirname, 'public', 'realtime.html')));
app.get('/review', (req, res) => res.sendFile(path.join(__dirname, 'public', 'review.html')));
app.get('/gps', (req, res) => res.json(gpsData));

// Khởi động server
app.listen(port, 'localhost', () => {
  console.log(`Web server running at http://localhost:${port}`);
});
