# FunaGig - Student-Business Gig Platform

A modern web application connecting students with businesses for freelance opportunities. Built with PHP, MySQL, and vanilla JavaScript, featuring real-time messaging, notifications, and a comprehensive gig management system.

## 🚀 Features

### Core Functionality
- ✅ **User Authentication** - Secure login/signup with role-based access (Student/Business)
- ✅ **Dashboard System** - Dynamic dashboards for both students and businesses
- ✅ **Gig Management** - Post, edit, delete, and manage gigs with advanced filtering
- ✅ **Application System** - Apply to gigs, track status, accept/reject applicants
- ✅ **Real-time Messaging** - WebSocket-powered messaging with typing indicators
- ✅ **Notifications** - Real-time notification system with unread badges
- ✅ **Profile Management** - Complete profile editing with photo uploads
- ✅ **Reviews & Ratings** - Rate and review system for completed gigs
- ✅ **File Uploads** - Profile pictures, resumes, portfolio items, message attachments
- ✅ **Password Reset** - Secure token-based password reset functionality

### Advanced Features
- ✅ **WebSocket Integration** - Real-time updates via Node.js WebSocket server
- ✅ **CSRF Protection** - Comprehensive CSRF token system
- ✅ **Rate Limiting** - Enhanced rate limiting with per-endpoint configuration
- ✅ **Advanced Filtering** - Budget range, date range, location, skills, gig type filters
- ✅ **Search Functionality** - Debounced search with message search within conversations
- ✅ **Sort & Pagination** - Client-side sorting and pagination for all lists
- ✅ **URL State Management** - Preserve filters/search in URL for shareable links
- ✅ **Responsive Design** - Mobile-friendly layout with sidebar navigation
- ✅ **Toast Notifications** - Modern notification system with animations
- ✅ **Loading States** - Comprehensive loading indicators and empty states

## 📁 Project Structure

```
funagig/
├── css/
│   └── styles.css              # Global styles (responsive, modern UI)
├── js/
│   ├── app.js                  # Core utilities (Auth, API, WebSocket, etc.)
│   ├── dashboard.js            # Dashboard-specific features
│   └── messaging.js            # Messaging functionality
├── php/
│   ├── api.php                 # RESTful API endpoints
│   ├── config.php              # Database & configuration
│   └── websocket-emitter.php   # WebSocket event emitter
├── database/
│   └── database.sql            # Complete database schema
├── websocket-server/
│   ├── server.js                # Node.js WebSocket server
│   ├── package.json             # Node.js dependencies
│   └── README.md                # WebSocket server documentation
├── uploads/
│   └── profile/                 # Profile picture uploads
│
├── index.html                   # Landing page
├── auth.html                    # Login page
├── signup.html                  # Registration page
├── forgot-password.html         # Password reset request
├── reset-password.html          # Password reset form
├── home-gigs.html               # Public gig browsing
│
├── student-dashboard.html       # Student dashboard
├── student-profile.html         # Student profile management
├── student-messaging.html        # Student messaging
├── student-gigs.html             # Student gig browsing & applications
│
├── business-dashboard.html      # Business dashboard
├── business-profile.html        # Business profile management
├── business-messaging.html      # Business messaging
├── business-post-gig.html       # Post new gig form
├── business-posted-gigs.html   # Manage posted gigs
└── business-applicants.html     # Manage applicants
│
├── README.md                    # This file
├── README-setup.md              # Setup instructions
├── README-frontend.md           # Frontend documentation
├── README-backend.md            # Backend documentation
```

## 🛠️ Technology Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS Grid, Flexbox, Custom Properties
- **Vanilla JavaScript (ES6+)** - No frameworks, pure JavaScript
- **Socket.io Client** - Real-time WebSocket communication

### Backend
- **PHP 7.4+** - Server-side logic
- **MySQL** - Database management
- **Apache** - Web server (via XAMPP)

### Real-time Server
- **Node.js** - WebSocket server runtime
- **Socket.io** - WebSocket library
- **Express** - HTTP server for event receiving

## 🚀 Quick Start

### Prerequisites
- XAMPP (Apache + MySQL + PHP)
- Node.js (v14 or higher) - For WebSocket server
- Modern web browser

### Installation

1. **Setup XAMPP**
   ```bash
   # Download and install XAMPP from https://www.apachefriends.org/
   # Start Apache and MySQL from XAMPP Control Panel
   ```

2. **Clone/Download Project**
   ```bash
   # Place project in: C:\xampp\htdocs\funagig (Windows)
   # Or: /Applications/XAMPP/htdocs/funagig (Mac)
   ```

3. **Database Setup**
   - Open phpMyAdmin: http://localhost/phpmyadmin
   - Create database: `funagig`
   - Import: `database/database.sql`

4. **Configuration**
   - Update `php/config.php` if needed (default settings work for XAMPP)

5. **Start WebSocket Server** (Optional but recommended)
   ```bash
   cd websocket-server
   npm install
   npm run dev
   ```

6. **Access Application**
   - Open: http://localhost/funagig
   - Default test accounts are in the database

## 📚 Documentation

- **[Setup Guide](README-setup.md)** - Detailed installation instructions
- **[Frontend Docs](README-frontend.md)** - Frontend architecture and guidelines
- **[Backend Docs](README-backend.md)** - API documentation and backend structure
- **[WebSocket Server](websocket-server/README.md)** - WebSocket server documentation

## 🔐 Security Features

- ✅ **CSRF Protection** - Token-based CSRF protection
- ✅ **Rate Limiting** - Per-endpoint rate limiting with headers
- ✅ **Password Hashing** - Secure password hashing (bcrypt)
- ✅ **Session Management** - Secure session handling
- ✅ **Input Sanitization** - All inputs sanitized and validated
- ✅ **SQL Injection Prevention** - Prepared statements throughout
- ✅ **XSS Protection** - Output escaping

## 🎨 User Roles

### Student
- Browse and search gigs
- Apply to gigs with resume upload
- Track application status
- Manage profile and portfolio
- Chat with businesses
- View reviews and ratings
- Save favorite gigs

### Business
- Post and manage gigs
- Review and manage applicants
- Accept/reject applications
- Chat with students
- View analytics and metrics
- Manage company profile
- Review and rate students

## 🔌 API Endpoints

### Authentication
- `POST /php/api.php/login` - User login
- `POST /php/api.php/signup` - User registration
- `POST /php/api.php/logout` - User logout
- `POST /php/api.php/auth/forgot-password` - Request password reset
- `POST /php/api.php/auth/reset-password` - Reset password

### Profile
- `GET /php/api.php/profile` - Get user profile
- `POST /php/api.php/profile` - Update profile

### Gigs
- `GET /php/api.php/gigs` - List all gigs
- `POST /php/api.php/gigs` - Create new gig
- `GET /php/api.php/gigs/active` - Get active gigs
- `PUT /php/api.php/gigs/update` - Update gig
- `DELETE /php/api.php/gigs/delete` - Delete gig

### Applications
- `GET /php/api.php/applications` - Get applications
- `POST /php/api.php/applications` - Apply to gig
- `POST /php/api.php/applicants/accept` - Accept applicant
- `POST /php/api.php/applicants/reject` - Reject applicant

### Messaging
- `GET /php/api.php/conversations` - List conversations
- `POST /php/api.php/conversations` - Start conversation
- `GET /php/api.php/messages/{id}` - Get messages
- `POST /php/api.php/messages` - Send message
- `POST /php/api.php/typing` - Set typing status

### Notifications
- `GET /php/api.php/notifications` - Get notifications
- `PUT /php/api.php/notifications` - Mark as read

### File Uploads
- `POST /php/api.php/upload` - Upload files (profile, resume, portfolio, attachments)

### Reviews
- `POST /php/api.php/reviews` - Submit review
- `GET /php/api.php/reviews/{user_id}` - Get user reviews

## Two-Server Architecture

The FunaGig application uses a **two-server architecture** for optimal performance and real-time capabilities:

### 1. PHP/Apache Server (Main Application Server)
- **Port:** 80 (default Apache port)
- **Technology:** PHP 7.4+, Apache, MySQL
- **Purpose:** 
  - Handles all HTTP requests (API endpoints)
  - Manages authentication and sessions
  - Handles file uploads
  - Database write operations
  - Business logic

### 2. Node.js WebSocket Server (Real-time Server)
- **Port:** 3001
- **Technology:** Node.js, Socket.io, MySQL
- **Purpose:**
  - Real-time message delivery
  - Typing indicators
  - Live notifications
  - Online/offline status tracking
  - Broadcasts events to connected clients

## Data Sharing Between Servers

### Shared Database
Both servers connect to the **same MySQL database** (`funagig`):
- **PHP Server:** Uses `mysqli` for database operations
- **Node.js Server:** Uses `mysql2` connection pool
- **Shared Tables:** All application data (users, gigs, messages, notifications, etc.)

### Communication Flow

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Browser   │────────▶│  PHP Server │────────▶│   MySQL     │
│  (Client)   │◀────────│  (Port 80)  │◀────────│  Database   │
└─────────────┘         └─────────────┘         └─────────────┘
     │                         │
     │                         │ HTTP POST
     │                         ▼
     │                  ┌─────────────┐
     │                  │ Node.js WS  │
     │                  │  (Port 3001)│
     │                  └─────────────┘
     │                         │
     │                         │ MySQL
     │                         ▼
     │                  ┌─────────────┐
     │                  │   MySQL     │
     │                  │  Database   │
     │                  └─────────────┘
     │
     │ WebSocket
     │ (Real-time)
     └─────────────────────────┘
```

### 1. PHP → Node.js Communication
- **Method:** HTTP POST requests
- **Endpoint:** `http://localhost:3001/emit`
- **Purpose:** PHP backend notifies Node.js server of events
- **Events:**
  - New messages
  - Typing indicators
  - New notifications
  - Messages read status
  - Notifications read status

**Example:**
```php
// When a message is created in PHP
WebSocketEmitter::emitNewMessage($conversationId, $messageId, $senderId, $content);
// → Sends HTTP POST to Node.js server
// → Node.js broadcasts to connected clients via WebSocket
```

### 2. Node.js → Client Communication
- **Method:** WebSocket (Socket.io)
- **Purpose:** Real-time updates to connected clients
- **Events:**
  - `message_received` - New message in conversation
  - `user_typing` - Typing indicator
  - `notification_received` - New notification
  - `messages_read` - Messages marked as read
  - `user_online` / `user_offline` - User status

### 3. Database Sharing
Both servers read/write to the same database:
- **PHP Server:** Primary writer (creates messages, notifications, etc.)
- **Node.js Server:** Primary reader (queries conversations, users for broadcasting)
- **Consistency:** Both servers see the same data immediately

## Authentication Flow

### Current Implementation
1. **Client Login:**
   - Client sends credentials to PHP server
   - PHP server validates and creates session
   - PHP server returns user data + session token

2. **WebSocket Connection:**
   - Client connects to Node.js server
   - Client sends `authenticate` event with `userId` and `sessionToken`
   - Node.js server stores user mapping (currently accepts userId without validation)

### Security Considerations
⚠️ **Note:** The WebSocket server currently accepts `userId` without validating the session token. For production, you should:
- Validate session tokens against the database
- Check session expiration
- Verify user permissions

## Configuration

### PHP Server Configuration
**File:** `php/config.php`
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'funagig');
define('DB_USER', 'root');
define('DB_PASS', '');
```

### Node.js Server Configuration
**File:** `websocket-server/server.js`
```javascript
const dbPool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'funagig',
    // ...
});
```

### Client Configuration
**File:** `js/app.js`
```javascript
const WEBSOCKET_URL = 'http://localhost:3001';
```

## Running Both Servers

### 1. Start PHP/Apache Server (XAMPP)
```bash
# Start Apache and MySQL from XAMPP Control Panel
# Or via command line:
# Windows: net start Apache2.4
# Windows: net start MySQL
```

### 2. Start Node.js WebSocket Server
```bash
cd websocket-server
npm install
npm run dev  # Development mode
# OR
node server.js  # Production mode
```

## Benefits of Two-Server Architecture

1. **Separation of Concerns:**
   - PHP handles HTTP requests and business logic
   - Node.js handles real-time WebSocket connections

2. **Scalability:**
   - Can scale PHP and Node.js servers independently
   - WebSocket server can handle many concurrent connections

3. **Performance:**
   - WebSocket server doesn't block PHP requests
   - Real-time updates without polling overhead

4. **Reliability:**
   - If WebSocket server is down, PHP server continues to work
   - Clients fall back to API polling automatically

## Data Consistency

Both servers maintain data consistency through:
- **Shared Database:** Single source of truth
- **Immediate Updates:** PHP writes to database, Node.js reads and broadcasts
- **Event-Driven:** PHP notifies Node.js of changes via HTTP POST

## Production Considerations

1. **Session Validation:** Implement proper session token validation in Node.js server
2. **Error Handling:** Add retry logic for PHP → Node.js communication
3. **Load Balancing:** Use a load balancer for multiple Node.js instances
4. **Security:** Use HTTPS/WSS in production
5. **Monitoring:** Add logging and monitoring for both servers
6. **Database Connection Pooling:** Both servers use connection pooling for efficiency

## Troubleshooting

### WebSocket Server Not Receiving Events
- Check if Node.js server is running on port 3001
- Verify PHP can reach `http://localhost:3001/emit`
- Check firewall settings

### Data Not Syncing
- Verify both servers connect to the same database
- Check database credentials in both configurations
- Verify PHP is sending events to Node.js server

### Authentication Issues
- Check session management in PHP
- Verify WebSocket authentication flow
- Check browser console for connection errors


## 🧪 Testing

### Test Accounts
The database includes sample users:
- **Students**: Various test student accounts
- **Businesses**: Various test business accounts
- **Password**: Check database for default passwords

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Dashboard data loading
- [ ] Gig posting and management
- [ ] Application submission and tracking
- [ ] Real-time messaging
- [ ] File uploads (profile, resume, portfolio)
- [ ] Notifications
- [ ] Password reset
- [ ] Reviews and ratings
- [ ] Responsive design on mobile

## 🚧 Development

### Adding New Features
1. Update database schema if needed (`database/database.sql`)
2. Add API endpoints in `php/api.php`
3. Update frontend JavaScript
4. Test thoroughly
5. Update documentation

### Code Style
- **JavaScript**: ES6+ features, modular approach
- **PHP**: PSR-12 style guide
- **CSS**: BEM methodology for complex components

## 📦 Production Deployment

### Security Checklist
- [ ] Change default passwords
- [ ] Enable HTTPS/SSL
- [ ] Configure proper file permissions
- [ ] Set up firewall rules
- [ ] Enable error logging (disable display_errors)
- [ ] Update CSRF secret key
- [ ] Configure rate limiting thresholds

### Performance Optimization
- [ ] Enable PHP opcache
- [ ] Use CDN for static assets
- [ ] Optimize database queries
- [ ] Implement caching strategy
- [ ] Minify CSS/JS for production
- [ ] Enable Gzip compression

### WebSocket Server
- [ ] Use PM2 for process management
- [ ] Configure reverse proxy (nginx)
- [ ] Set up SSL for WSS connections
- [ ] Monitor connection limits

## 📝 License

This project is for educational purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check documentation files
- Review error logs
- Test with sample data
- Check browser console for errors

## 🎯 Project Status

See [PROJECT-STATUS.md](PROJECT-STATUS.md) for detailed feature completion status.

**Current Status**: ~90% Complete
- Core functionality: ✅ Complete
- Enhanced features: ✅ Complete
- Security features: ✅ Complete
- Real-time features: ✅ Complete
- Remaining: Testing suite, performance optimization, mobile-specific features

---

**Built with ❤️ for connecting students and businesses**
