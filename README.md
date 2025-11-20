# FunaGig WebSocket Server

This WebSocket server provides real-time communication for the FunaGig application, enabling instant updates for messages, typing indicators, and notifications.

## Features

- Real-time message delivery
- Typing indicators
- Live notifications
- Online/offline status tracking
- Conversation room management

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MySQL database (same as main application)

## Installation

1. Navigate to the `websocket-server` directory:
   ```bash
   cd websocket-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

Update the database connection settings in `server.js` if they differ from the default:

```javascript
const dbPool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',  // Update if needed
    database: 'funagig',
    // ...
});
```

## Running the Server

### Development Mode (with auto-restart):
```bash
npm run dev
```

### Production Mode:
```bash
node server.js
```

The server will start on `http://localhost:3001` by default.

## Integration with PHP Backend

The PHP backend (`php/websocket-emitter.php`) sends events to this server via HTTP POST to `/emit`. The server then broadcasts these events to connected clients via WebSocket.

### Supported Events from PHP:

1. **new_message**: Broadcasts new messages to conversation participants
2. **typing**: Broadcasts typing indicators
3. **new_notification**: Sends notifications to specific users
4. **messages_read**: Updates read status in conversations
5. **notifications_read**: Updates notification read status

## Client-Side Integration

The client-side code (`js/app.js`) includes a `WebSocketClient` utility that:

- Automatically connects when a user logs in
- Authenticates using the session token
- Joins conversation rooms
- Listens for real-time events
- Handles reconnection automatically

## Testing

1. Start the WebSocket server
2. Open the FunaGig application in multiple browser tabs/windows
3. Log in as different users
4. Send messages between users to see real-time updates
5. Check typing indicators and notifications

## Troubleshooting

### Server won't start:
- Check if port 3001 is already in use
- Verify Node.js and npm are installed correctly
- Check database connection settings

### Events not being received:
- Ensure the WebSocket server is running
- Check browser console for connection errors
- Verify the PHP backend can reach the WebSocket server (check `php/websocket-emitter.php`)

### Connection issues:
- Check firewall settings for port 3001
- Verify CORS settings in `server.js` if accessing from different origins
- Check browser console for WebSocket connection errors

## Production Deployment

For production:

1. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name funagig-websocket
   ```

2. Configure reverse proxy (nginx) to forward WebSocket connections:
   ```nginx
   location /socket.io/ {
       proxy_pass http://localhost:3001;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
   }
   ```

3. Update `WEBSOCKET_URL` in `js/app.js` to match your production domain

## Notes

- The server uses polling as a fallback if WebSocket connection fails
- Authentication is handled via session tokens
- The server automatically cleans up inactive connections
- Ping/pong mechanism keeps connections alive
