// WebSocket server for FunaGig real-time features
// Uses Socket.io for real-time communication
// Run with: node server.js

const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const mysql = require('mysql2/promise');

// Database connection pool
const dbPool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'funagig',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Store active users and their socket IDs
const activeUsers = new Map(); // userId -> socketId
const socketToUser = new Map(); // socketId -> userId

// HTTP endpoint to receive events from PHP
app.use(express.json());
app.post('/emit', (req, res) => {
    try {
        const { event, data } = req.body;
        
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
    console.log('New client connected:', socket.id);

    // Handle authentication
    socket.on('authenticate', async (data) => {
        try {
            const { userId, sessionToken } = data;
            
            // Require both userId and sessionToken
            if (!userId || !sessionToken) {
                socket.emit('authentication_error', { message: 'User ID and session token required' });
                return;
            }

            // Validate session token against database
            try {
                const [sessionRows] = await dbPool.execute(
                    'SELECT user_id, expires_at FROM sessions WHERE id = ? AND user_id = ? AND expires_at > NOW()',
                    [sessionToken, userId]
                );
                
                if (sessionRows.length === 0) {
                    socket.emit('authentication_error', { message: 'Invalid or expired session' });
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
                socket.emit('authentication_error', { message: 'Session validation failed' });
                return;
            }
            
            // Verify user exists in database
            try {
                const [userRows] = await dbPool.execute(
                    'SELECT id FROM users WHERE id = ?',
                    [userId]
                );
                
                if (userRows.length === 0) {
                    socket.emit('authentication_error', { message: 'User not found' });
                    return;
                }
            } catch (dbError) {
                console.error('User validation error:', dbError);
                socket.emit('authentication_error', { message: 'User validation failed' });
                return;
            }

            // Store user mapping
            activeUsers.set(userId, socket.id);
            socketToUser.set(socket.id, userId);
            socket.userId = userId;

            // Join user's personal room
            socket.join(`user:${userId}`);

            console.log(`User ${userId} authenticated on socket ${socket.id}`);

            // Notify user of successful authentication
            socket.emit('authenticated', { userId });

            // Notify user's contacts that they're online
            socket.broadcast.emit('user_online', { userId });
        } catch (error) {
            console.error('Authentication error:', error);
            socket.emit('authentication_error', { message: 'Authentication failed' });
        }
    });

    // Handle joining a conversation room
    socket.on('join_conversation', async (data) => {
        try {
            const { conversationId } = data;
            const userId = socket.userId;

            if (!conversationId || !userId) {
                return;
            }

            // Verify user is part of conversation
            const [rows] = await dbPool.execute(
                'SELECT id FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
                [conversationId, userId, userId]
            );

            if (rows.length > 0) {
                socket.join(`conversation:${conversationId}`);
                console.log(`User ${userId} joined conversation ${conversationId}`);
            }
        } catch (error) {
            console.error('Error joining conversation:', error);
        }
    });

    // Handle leaving a conversation room
    socket.on('leave_conversation', (data) => {
        const { conversationId } = data;
        if (conversationId) {
            socket.leave(`conversation:${conversationId}`);
        }
    });

    // Handle new message (from client)
    socket.on('new_message', async (data) => {
        try {
            const { conversationId, messageId, senderId, content } = data;
            const userId = socket.userId;

            if (!conversationId || userId !== senderId) {
                return;
            }

            // Get conversation participants
            const [conversation] = await dbPool.execute(
                'SELECT user1_id, user2_id FROM conversations WHERE id = ?',
                [conversationId]
            );

            if (conversation.length === 0) {
                return;
            }

            const { user1_id, user2_id } = conversation[0];
            const recipientId = user1_id === userId ? user2_id : user1_id;

            // Broadcast message to conversation room (excluding sender)
            socket.to(`conversation:${conversationId}`).emit('message_received', {
                conversationId,
                messageId,
                senderId,
                content,
                timestamp: new Date().toISOString()
            });

            // Also send to recipient's personal room for notification
            io.to(`user:${recipientId}`).emit('new_message_notification', {
                conversationId,
                messageId,
                senderId,
                content
            });

            console.log(`Message ${messageId} broadcast to conversation ${conversationId}`);
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

server.listen(3001, () => {
    console.log('WebSocket server running on port 3001');
});
