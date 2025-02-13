const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const proxyRoutes = require('./routes/proxy');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware to serve static files
app.use(express.static('public'));

// Use proxy routes
app.use('/proxy', proxyRoutes);

// Socket.IO connection
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});