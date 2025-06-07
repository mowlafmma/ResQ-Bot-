const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const port = 3000;
// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Proxy tới Flask backend
const BACKEND = process.env.BACKEND_URL || 'http://localhost:5000' ;
app.use('/yolo', createProxyMiddleware({target:BACKEND, changeOrigin: true }));
app.use('/video_feed', createProxyMiddleware({target:BACKEND, changeOrigin: true }));
app.use('/audio_feed', createProxyMiddleware({target:BACKEND, changeOrigin: true }));
app.use('/hls', createProxyMiddleware({target:BACKEND, changeOrigin: true }));

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
app.listen(port, () => {
  console.log(`Web server running at http://localhost:${port}`);
});
