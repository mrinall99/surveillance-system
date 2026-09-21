/**
 * Node.js Backend Main Entry Point with Phase 2 Threat & Zone API Routing.
 */
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const YAML = require('yaml');

// Load .env variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const authRoutes = require('./routes/auth.routes');
const configRoutes = require('./routes/config.routes');
const zoneRoutes = require('./routes/zone.routes');
const EngineBridge = require('./socket/engine-bridge');

// Load config.yaml
const configPath = path.join(__dirname, '../../config.yaml');
let config = {};
if (fs.existsSync(configPath)) {
    const file = fs.readFileSync(configPath, 'utf8');
    config = YAML.parse(file);
}

const PORT = process.env.PORT || config.server?.port || 5000;
const CLIENT_URL = process.env.CLIENT_URL || config.server?.cors_origin || 'http://localhost:3000';
const ENGINE_WS_URL = `ws://127.0.0.1:${config.server?.engine_ws_port || 8765}`;

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS settings
const io = new Server(server, {
    cors: {
        origin: CLIENT_URL,
        credentials: true
    }
});

// Connect to Python CV Engine via WebSocket
const engineBridge = new EngineBridge(ENGINE_WS_URL, io);
app.set('engineBridge', engineBridge);

// Middleware Setup
app.use(cors({
    origin: CLIENT_URL,
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Mount REST API Routers
app.use('/api/auth', authRoutes);
app.use('/api/config', configRoutes);
app.use('/api/zones', zoneRoutes);

// System Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ONLINE',
        timestamp: new Date().toISOString(),
        service: 'Government-Grade Surveillance System Backend'
    });
});

// Socket.IO Connection Handler
io.on('connection', (socket) => {
    console.log(`⚡ React Client Connected to Socket.IO: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`🔌 React Client Disconnected from Socket.IO: ${socket.id}`);
    });
});

// Start Node.js Server
server.listen(PORT, () => {
    console.log('==================================================');
    console.log(`🟢 SURVEILLANCE BACKEND RUNNING ON http://localhost:${PORT}`);
    console.log(`📡 CORS ALLOWED ORIGIN: ${CLIENT_URL}`);
    console.log('==================================================');
});
