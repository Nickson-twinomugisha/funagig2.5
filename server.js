// WebSocket server for FunaGig real-time features
// Uses Socket.io for real-time communication
// Run with: node server.js

const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load configuration from server.config.js (if exists)
let config = {
    database: {
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'funagig',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    },
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    port: 3001,
    session: {
        expirationHours: 24
    }
};

// Try to load config file, fall back to defaults if not found
const configPath = path.join(__dirname, 'server.config.js');
if (fs.existsSync(configPath)) {
    try {
        const loadedConfig = require(configPath);
        config = { ...config, ...loadedConfig };
        console.log('Configuration loaded from server.config.js');
    } catch (error) {
        console.warn('Failed to load server.config.js, using defaults:', error.message);
    }
} else {
    console.warn('server.config.js not found, using default configuration');
    console.warn('For production, create server.config.js or use environment variables (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, CORS_ORIGIN, WS_PORT)');
}

const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS configuration
// In production, ensure config.cors.origin is set to specific domain(s), not "*"
const io = new Server(server, {
    cors: config.cors
});

// Security: Validate CORS configuration
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
    if (config.cors.origin === "*" || config.cors.origin === "*") {
        console.error('❌ ERROR: CORS cannot be "*" in production mode!');
        console.error('❌ Set CORS_ORIGIN environment variable or update server.config.js');
        console.error('❌ Example: CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com');
        process.exit(1); // Exit if insecure configuration in production
    }
    console.log('✅ Production mode: CORS restricted to:', config.cors.origin);
} else {
    if (config.cors.origin === "*") {
        console.warn('⚠️  WARNING: CORS is set to "*" (development mode)');
        console.warn('⚠️  For production, set CORS_ORIGIN environment variable or update server.config.js');
    }
}

// Database connection pool
const dbPool = mysql.createPool(config.database);

// Store active users and their socket IDs
const activeUsers = new Map(); // userId -> socketId
const socketToUser = new Map(); // socketId -> userId

// Security: Connection tracking for rate limiting
const connectionAttempts = new Map(); // socketId -> { count, firstAttempt }
const AUTH_TIMEOUT = 30000; // 30 seconds to authenticate
const MAX_CONNECTIONS_PER_IP = 10; // Max connections per IP address
const MAX_AUTH_ATTEMPTS = 3; // Max authentication attempts per connection

// Track connections by IP for rate limiting
const connectionsByIP = new Map(); // ip -> count

// HTTP endpoint to receive events from PHP
app.use(express.json());

// Security: Add basic authentication or IP whitelist for /emit endpoint
// In production, this should only accept requests from localhost or your PHP server
const validateEmitRequest = (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // In production, only allow localhost (PHP server should be on same machine)
    if (isProduction) {
        const allowedIPs = ['127.0.0.1', '::1', 'localhost'];
        if (!allowedIPs.includes(clientIP) && !clientIP.startsWith('127.') && !clientIP.startsWith('::ffff:127.')) {
            console.warn(`Blocked /emit request from unauthorized IP: ${clientIP}`);
            return res.status(403).json({ error: 'Forbidden' });
        }
    }
    
    next();
};

app.post('/emit', validateEmitRequest, (req, res) => {
    try {
        // Security: Validate request body
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({ error: 'Invalid request body' });
        }
        
        const { event, data } = req.body;
        
        // Security: Validate event type
        const allowedEvents = ['new_message', 'typing', 'new_notification', 'messages_read', 'notifications_read'];
        if (!event || !allowedEvents.includes(event)) {
            console.warn(`Invalid event type: ${event}`);
            return res.status(400).json({ error: 'Invalid event type' });
        }
        
        // Security: Validate data exists
        if (!data || typeof data !== 'object') {
            return res.status(400).json({ error: 'Invalid event data' });
        }
        
        if (event === 'new_message') {
            // Broadcast message to conversation room
            io.to(`conversation:${data.conversationId}`).emit('message_received', data);
            
            // Get conversation to find recipient
            dbPool.execute(
                'SELECT user1_id, user2_id FROM conversations WHERE id = ?',
                [data.conversationId]
            ).then(([rows]) => {
                if (rows.length > 0) {
                    const { user1_id, user2_id } = rows[0];
                    const recipientId = user1_id === data.senderId ? user2_id : user1_id;
                    
                    // Send notification to recipient's personal room
                    io.to(`user:${recipientId}`).emit('new_message_notification', data);
                }
            }).catch(err => console.error('Error getting conversation:', err));
        } else if (event === 'typing') {
            // Broadcast typing indicator to conversation room
            io.to(`conversation:${data.conversationId}`).emit('user_typing', {
                conversationId: data.conversationId,
                userId: data.userId,
                isTyping: data.isTyping,
                userName: data.userName
            });
        } else if (event === 'new_notification') {
            // Send notification to specific user
            io.to(`user:${data.userId}`).emit('notification_received', data.notification);
        } else if (event === 'messages_read') {
            // Broadcast messages read event to conversation room
            io.to(`conversation:${data.conversationId}`).emit('messages_read', {
                conversationId: data.conversationId,
                readerId: data.readerId
            });
        } else if (event === 'notifications_read') {
            // Notify user that notifications were marked as read
            io.to(`user:${data.userId}`).emit('notifications_read', {
                userId: data.userId,
                notificationId: data.notificationId,
                markAll: data.markAll
            });
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error handling emit:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Handle new connections
io.on('connection', (socket) => {
    const clientIP = socket.handshake.address || socket.request.connection.remoteAddress;
    console.log(`New client connected: ${socket.id} from ${clientIP}`);
    
    // Security: Rate limiting - check connections per IP
    const ipConnections = connectionsByIP.get(clientIP) || 0;
    if (ipConnections >= MAX_CONNECTIONS_PER_IP) {
        console.warn(`Rate limit: Too many connections from IP ${clientIP}`);
        socket.emit('error', { message: 'Too many connections from this IP' });
        socket.disconnect(true);
        return;
    }
    connectionsByIP.set(clientIP, ipConnections + 1);
    
    // Security: Set authentication timeout - disconnect if not authenticated within time limit
    const authTimeout = setTimeout(() => {
        if (!socket.userId) {
            console.warn(`Authentication timeout for socket ${socket.id}`);
            socket.emit('authentication_error', { message: 'Authentication timeout' });
            socket.disconnect(true);
        }
    }, AUTH_TIMEOUT);
    
    // Track connection attempts for this socket
    connectionAttempts.set(socket.id, { count: 0, firstAttempt: Date.now() });
    
    // Clean up on disconnect
    socket.on('disconnect', () => {
        const ipCount = connectionsByIP.get(clientIP) || 0;
        if (ipCount > 0) {
            connectionsByIP.set(clientIP, ipCount - 1);
        }
        connectionAttempts.delete(socket.id);
        clearTimeout(authTimeout);
    });

    // Handle authentication
    socket.on('authenticate', async (data) => {
        try {
            // Security: Input validation
            if (!data || typeof data !== 'object') {
                socket.emit('authentication_error', { message: 'Invalid authentication data' });
                return;
            }
            
            const { userId, sessionToken } = data;
            
            // Security: Validate input types and format
            if (!userId || !sessionToken) {
                socket.emit('authentication_error', { message: 'User ID and session token required' });
                return;
            }
            
            // Security: Validate userId is numeric
            const userIdNum = parseInt(userId);
            if (isNaN(userIdNum) || userIdNum <= 0) {
                socket.emit('authentication_error', { message: 'Invalid user ID format' });
                return;
            }
            
            // Security: Validate sessionToken format (should be string, reasonable length)
            if (typeof sessionToken !== 'string' || sessionToken.length < 10 || sessionToken.length > 128) {
                socket.emit('authentication_error', { message: 'Invalid session token format' });
                return;
            }
            
            // Security: Rate limiting - check authentication attempts
            const attempts = connectionAttempts.get(socket.id);
            if (attempts && attempts.count >= MAX_AUTH_ATTEMPTS) {
                console.warn(`Too many auth attempts from socket ${socket.id}`);
                socket.emit('authentication_error', { message: 'Too many authentication attempts' });
                socket.disconnect(true);
                return;
            }
            
            // Increment attempt counter
            if (attempts) {
                attempts.count++;
            }

            // Validate session token against database
            try {
                const [sessionRows] = await dbPool.execute(
                    'SELECT user_id, expires_at FROM sessions WHERE id = ? AND user_id = ? AND expires_at > NOW()',
                    [sessionToken, userIdNum]
                );
                
                if (sessionRows.length === 0) {
                    socket.emit('authentication_error', { message: 'Authentication failed' });
                    return;
                }
                
                // Update last activity
                await dbPool.execute(
                    'UPDATE sessions SET last_activity = NOW() WHERE id = ?',
                    [sessionToken]
                );
            } catch (dbError) {
                console.error('Session validation error:', dbError);
                // If sessions table doesn't exist, we can't validate - reject connection for security
                // Don't leak database errors to client
                socket.emit('authentication_error', { message: 'Authentication failed' });
                return;
            }
            
            // Verify user exists in database
            try {
                const [userRows] = await dbPool.execute(
                    'SELECT id FROM users WHERE id = ?',
                    [userIdNum]
                );
                
                if (userRows.length === 0) {
                    socket.emit('authentication_error', { message: 'Authentication failed' });
                    return;
                }
            } catch (dbError) {
                console.error('User validation error:', dbError);
                // Don't leak database errors to client
                socket.emit('authentication_error', { message: 'Authentication failed' });
                return;
            }

            // Store user mapping
            activeUsers.set(userIdNum, socket.id);
            socketToUser.set(socket.id, userIdNum);
            socket.userId = userIdNum;
            
            // Clear authentication timeout on success
            clearTimeout(authTimeout);
            
            // Clear connection attempts tracking
            connectionAttempts.delete(socket.id);

            // Join user's personal room
            socket.join(`user:${userIdNum}`);

            console.log(`User ${userIdNum} authenticated on socket ${socket.id}`);

            // Notify user of successful authentication
            socket.emit('authenticated', { userId: userIdNum });

            // Notify user's contacts that they're online
            socket.broadcast.emit('user_online', { userId: userIdNum });
        } catch (error) {
            console.error('Authentication error:', error);
            socket.emit('authentication_error', { message: 'Authentication failed' });
        }
    });

    // Handle joining a conversation room
    socket.on('join_conversation', async (data) => {
        // Security: Require authentication
        if (!socket.userId) {
            socket.emit('error', { message: 'Authentication required' });
            return;
        }
        
        try {
            // Security: Input validation
            if (!data || typeof data !== 'object') {
                socket.emit('error', { message: 'Invalid request data' });
                return;
            }
            
            const { conversationId } = data;
            const userId = socket.userId;

            // Security: Validate conversationId
            if (!conversationId) {
                socket.emit('error', { message: 'Conversation ID required' });
                return;
            }
            
            const convIdNum = parseInt(conversationId);
            if (isNaN(convIdNum) || convIdNum <= 0) {
                socket.emit('error', { message: 'Invalid conversation ID' });
                return;
            }

            // Verify user is part of conversation
            const [rows] = await dbPool.execute(
                'SELECT id FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
                [convIdNum, userId, userId]
            );

            if (rows.length > 0) {
                socket.join(`conversation:${convIdNum}`);
                console.log(`User ${userId} joined conversation ${convIdNum}`);
            } else {
                socket.emit('error', { message: 'Access denied to conversation' });
            }
        } catch (error) {
            console.error('Error joining conversation:', error);
        }
    });

    // Handle leaving a conversation room
    socket.on('leave_conversation', (data) => {
        // Security: Require authentication
        if (!socket.userId) {
            return;
        }
        
        if (!data || typeof data !== 'object') {
            return;
        }
        
        const { conversationId } = data;
        
        if (!conversationId) {
            return;
        }
        
        const convIdNum = parseInt(conversationId);
        if (isNaN(convIdNum) || convIdNum <= 0) {
            return;
        }
        
        socket.leave(`conversation:${convIdNum}`);
    });

    // Handle new message (from client)
    socket.on('new_message', async (data) => {
        // Security: Require authentication
        if (!socket.userId) {
            socket.emit('error', { message: 'Authentication required' });
            return;
        }
        
        try {
            // Security: Input validation
            if (!data || typeof data !== 'object') {
                socket.emit('error', { message: 'Invalid message data' });
                return;
            }
            
            const { conversationId, messageId, senderId, content } = data;
            const userId = socket.userId;

            // Security: Validate required fields
            if (!conversationId || !senderId || !content) {
                socket.emit('error', { message: 'Missing required fields' });
                return;
            }
            
            // Security: Validate sender matches authenticated user
            const senderIdNum = parseInt(senderId);
            if (userId !== senderIdNum) {
                socket.emit('error', { message: 'Sender ID mismatch' });
                return;
            }
            
            // Security: Validate conversationId
            const convIdNum = parseInt(conversationId);
            if (isNaN(convIdNum) || convIdNum <= 0) {
                socket.emit('error', { message: 'Invalid conversation ID' });
                return;
            }
            
            // Security: Validate content length
            if (typeof content !== 'string' || content.length === 0 || content.length > 10000) {
                socket.emit('error', { message: 'Invalid message content' });
                return;
            }

            // Get conversation participants and verify user is part of conversation
            const [conversationRows] = await dbPool.execute(
                'SELECT user1_id, user2_id FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
                [convIdNum, userId, userId]
            );

            if (conversationRows.length === 0) {
                socket.emit('error', { message: 'Access denied to conversation' });
                return;
            }

            const { user1_id, user2_id } = conversationRows[0];
            const recipientId = user1_id === userId ? user2_id : user1_id;

            // Broadcast message to conversation room (excluding sender)
            socket.to(`conversation:${convIdNum}`).emit('message_received', {
                conversationId: convIdNum,
                messageId,
                senderId: userId,
                content,
                timestamp: new Date().toISOString()
            });

            // Also send to recipient's personal room for notification
            io.to(`user:${recipientId}`).emit('new_message_notification', {
                conversationId: convIdNum,
                messageId,
                senderId: userId,
                content
            });

            console.log(`Message ${messageId} broadcast to conversation ${convIdNum}`);
        } catch (error) {
            console.error('Error handling new message:', error);
        }
    });

    // Handle typing indicator
    socket.on('typing', async (data) => {
        try {
            const { conversationId, isTyping } = data;
            const userId = socket.userId;

            if (!conversationId || !userId) {
                return;
            }

            // Broadcast typing status to conversation room (excluding sender)
            socket.to(`conversation:${conversationId}`).emit('user_typing', {
                conversationId,
                userId,
                isTyping,
                userName: data.userName // Include user name from client
            });
        } catch (error) {
            console.error('Error handling typing indicator:', error);
        }
    });

    // Handle new notification
    socket.on('new_notification', (data) => {
        try {
            const { userId, notification } = data;

            if (userId) {
                // Send notification to specific user
                io.to(`user:${userId}`).emit('notification_received', notification);
            }
        } catch (error) {
            console.error('Error handling notification:', error);
        }
    });

    // Handle mark messages as read
    socket.on('mark_read', async (data) => {
        try {
            const { conversationId } = data;
            const userId = socket.userId;

            if (!conversationId || !userId) {
                return;
            }

            // Notify other participants that messages were read
            socket.to(`conversation:${conversationId}`).emit('messages_read', {
                conversationId,
                userId
            });
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        const userId = socket.userId;
        
        if (userId) {
            activeUsers.delete(userId);
            socketToUser.delete(socket.id);
            
            // Notify contacts that user is offline
            socket.broadcast.emit('user_offline', { userId });
            
            console.log(`User ${userId} disconnected`);
        }
    });

    // Handle ping/pong for connection health
    socket.on('ping', () => {
        socket.emit('pong');
    });
});

// Periodically clean up inactive connections
setInterval(() => {
    io.sockets.sockets.forEach((socket) => {
        if (!socket.userId) {
            socket.disconnect();
        }
    });
}, 60000); // Every minute

const PORT = config.port;
server.listen(PORT, () => {
    console.log(`WebSocket server running on port ${PORT}`);
    console.log(`CORS origin: ${config.cors.origin}`);
});
