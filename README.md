# FunaGig v2.5 - Student-Business Gig Marketplace

**Status:** ✅ Production-Ready | **Version:** 2.5 | **Last Updated:** 2025-01-27

FunaGig is a **gig marketplace platform** connecting students with businesses for short-term work opportunities. Similar to Fiverr but focused on the student-business relationship, it enables students to find gigs and businesses to hire talented students.

---

## 🎯 Project Status

### ✅ Completed Features

#### Core Functionality
- ✅ **User Authentication** - Login, signup, password reset with email support
- ✅ **Role-Based Access** - Separate interfaces for students and businesses
- ✅ **Gig Management** - Post, edit, delete, draft, and publish gigs
- ✅ **Application System** - Students can apply to gigs, businesses can manage applications
- ✅ **Real-Time Messaging** - WebSocket-based chat with typing indicators
- ✅ **Notifications** - Real-time notifications for applications, messages, and updates
- ✅ **Reviews & Ratings** - Students and businesses can rate each other
- ✅ **Profile Management** - Complete profile editing for both user types
- ✅ **File Uploads** - Profile images, resumes, portfolio items, message attachments
- ✅ **Interest Tracking** - Students can express interest in gigs
- ✅ **Draft System** - Businesses can save and publish gig drafts

#### Security Features
- ✅ **CSRF Protection** - All state-changing requests protected
- ✅ **Input Validation** - Server-side and client-side validation
- ✅ **XSS Protection** - HTML escaping throughout
- ✅ **SQL Injection Prevention** - Prepared statements everywhere
- ✅ **File Upload Security** - MIME type validation, filename sanitization
- ✅ **Session Management** - Database-backed sessions with expiration
- ✅ **Rate Limiting** - Protection against abuse
- ✅ **Authorization Checks** - Ownership verification for all operations
- ✅ **Password Security** - Bcrypt hashing, secure reset flow
- ✅ **WebSocket Security** - Session validation, connection rate limiting

#### Technical Features
- ✅ **Pagination** - Efficient data loading for large datasets
- ✅ **Search & Filtering** - Real-time search across gigs, conversations, messages
- ✅ **Error Handling** - Standardized error responses with retry mechanisms
- ✅ **API Auto-Detection** - Frontend automatically detects API path
- ✅ **Configuration Management** - Secure local configuration files
- ✅ **Database Optimizations** - Indexes for improved query performance
- ✅ **Responsive Design** - Mobile-first, works on all devices

---

## 📁 Project Structure

```
funagig2.5/
├── api.php                    # Main PHP API router (all endpoints)
├── config.php                 # Database and app configuration
├── config.local.php.example   # Template for local config (not committed)
├── email.php                  # Email functions (password reset, notifications)
├── websocket-emitter.php      # WebSocket event emitter
├── server.js                  # Node.js WebSocket server
├── server.config.js           # WebSocket server configuration
├── database.sql               # Complete database schema with indexes
│
├── app.js                     # Core frontend utilities (API, Auth, WebSocket, etc.)
├── messaging.js               # Messaging functionality
├── dashboard.js               # Dashboard features
├── styles.css                 # Global styles (responsive, modern UI)
│
├── index.html                 # Landing page with contact form
├── auth.html                  # Login page
├── signup.html                # Signup page
├── forgot-password.html       # Password reset request
├── reset-password.html        # Password reset form
│
├── student-dashboard.html     # Student dashboard (real data)
├── student-profile.html       # Student profile management
├── student-gigs.html          # Browse gigs, apply, track applications
├── student-messaging.html     # Student messaging interface
│
├── business-dashboard.html    # Business dashboard (real data)
├── business-profile.html      # Business profile management
├── business-post-gig.html     # Post new gig (with draft support)
├── business-posted-gigs.html  # Manage posted gigs (with drafts)
├── business-applicants.html   # Manage applicants
├── business-messaging.html   # Business messaging interface
│
├── home-gigs.html             # Public gig browsing
│
├── uploads/                   # File uploads directory (protected)
│   ├── .htaccess              # Security rules for uploads
│   ├── profile/               # Profile images
│   ├── resume/                # Resume files
│   ├── portfolio/             # Portfolio items
│   └── message/               # Message attachments
│
├── README.md                  # This file (main project README)
├── README-backend.md          # Backend API documentation
├── README-frontend.md         # Frontend documentation
├── CONFIGURATION_GUIDE.md     # Complete configuration guide
└── .gitignore                 # Git ignore rules
```

---

## 🚀 Quick Start

### Prerequisites
- **XAMPP** (or similar) with PHP 7.4+ and MySQL 5.7+
- **Node.js** v14+ (for WebSocket server)
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

### Installation Steps

1. **Clone or download the project**
   ```bash
   cd C:\xampp\htdocs\funagig
   ```

2. **Set up the database**
   ```bash
   # Create database
   mysql -u root -p
   CREATE DATABASE funagig CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   exit
   
   # Import schema
   mysql -u root -p funagig < database.sql
   ```

3. **Configure the application**
   ```bash
   # Copy configuration template
   cp config.local.php.example config.local.php
   
   # Edit config.local.php with your database credentials
   # (Optional: Update email settings for password reset)
   ```

4. **Set up WebSocket server** (optional, for real-time features)
   ```bash
   # Install Node.js dependencies
   npm install
   
   # Configure WebSocket server (optional)
   # Edit server.config.js with your database credentials
   
   # Start WebSocket server
   node server.js
   ```

5. **Set up uploads directory**
   ```bash
   mkdir uploads
   mkdir uploads/profile uploads/resume uploads/portfolio uploads/message
   # Permissions are handled automatically
   ```

6. **Access the application**
   - Open browser: `http://localhost/funagig`
   - Default test accounts are in `database.sql`

---

## 🔧 Configuration

### Required Configuration

1. **Database** - Update in `config.local.php`:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'funagig');
   define('DB_USER', 'root');
   define('DB_PASS', 'your-password');
   ```

2. **JWT Secret** - Generate and set in `config.local.php`:
   ```bash
   php -r "echo bin2hex(random_bytes(32));"
   ```
   ```php
   define('JWT_SECRET', 'your-generated-secret-here');
   ```

3. **WebSocket Server** - Update `server.config.js`:
   ```javascript
   database: {
       host: 'localhost',
       user: 'root',
       password: 'your-password',
       database: 'funagig'
   }
   ```

### Optional Configuration

- **Email Settings** - For password reset emails (see `CONFIGURATION_GUIDE.md`)
- **CORS Settings** - For WebSocket server (production only)
- **File Upload Limits** - Adjust in `config.php`

**📖 For detailed configuration, see [CONFIGURATION_GUIDE.md](CONFIGURATION_GUIDE.md)**

---

## 🎨 Features Overview

### For Students
- ✅ Browse and search gigs with filters
- ✅ Apply to gigs with custom messages and resumes
- ✅ Track application status (pending, accepted, rejected, completed)
- ✅ Express interest in gigs
- ✅ Save favorite gigs
- ✅ Real-time messaging with businesses
- ✅ View and manage profile
- ✅ Upload portfolio items
- ✅ View ratings and reviews
- ✅ Receive notifications for applications and messages

### For Businesses
- ✅ Post gigs with full details (title, description, budget, deadline, skills)
- ✅ Save gigs as drafts and publish later
- ✅ Manage posted gigs (edit, pause, complete, delete)
- ✅ Review and manage applicants (accept, reject, search, filter)
- ✅ Real-time messaging with students
- ✅ View student profiles from conversations
- ✅ View analytics and statistics
- ✅ Manage company profile
- ✅ View ratings and reviews
- ✅ Receive notifications for applications and messages

### Shared Features
- ✅ Real-time messaging with typing indicators
- ✅ File attachments in messages
- ✅ Message search within conversations
- ✅ Notification system
- ✅ Reviews and ratings
- ✅ Profile management
- ✅ Password reset via email
- ✅ Session management

---

## 🔌 API Endpoints

### Authentication
- `POST /api.php/login` - User login
- `POST /api.php/signup` - User registration
- `POST /api.php/logout` - User logout
- `POST /api.php/auth/forgot-password` - Request password reset
- `POST /api.php/auth/reset-password` - Reset password with token
- `GET /api.php/auth/session-status` - Check session validity

### Gigs
- `GET /api.php/gigs` - List active gigs (paginated)
- `GET /api.php/gigs/{id}` - Get single gig details
- `GET /api.php/gigs/active` - Get user's active gigs (supports `include_drafts=true`)
- `GET /api.php/interested-gigs` - Get student's interested gigs
- `POST /api.php/gigs` - Create new gig (supports `status='draft'`)
- `POST /api.php/gigs/update` - Update gig (supports partial updates)
- `DELETE /api.php/gigs/delete` - Delete gig
- `POST /api.php/gigs/{id}/interest` - Express interest in gig
- `DELETE /api.php/gigs/{id}/interest` - Remove interest

### Applications
- `GET /api.php/applications` - Get user's applications
- `GET /api.php/applications?gig_id={id}` - Get applications for a gig
- `POST /api.php/applications` - Submit application
- `PUT /api.php/applications` - Update application status
- `DELETE /api.php/applications` - Withdraw application

### Messaging
- `GET /api.php/conversations` - Get user's conversations
- `POST /api.php/conversations` - Create new conversation
- `GET /api.php/messages/{conversation_id}` - Get messages
- `POST /api.php/messages` - Send message
- `POST /api.php/typing` - Send typing indicator

### Profile
- `GET /api.php/profile` - Get current user profile
- `POST /api.php/profile` - Update profile
- `GET /api.php/users/{id}` - Get public user profile

### Notifications
- `GET /api.php/notifications` - Get notifications (paginated)
- `PUT /api.php/notifications` - Mark notifications as read

### Reviews
- `POST /api.php/reviews` - Submit review
- `GET /api.php/reviews/{user_id}` - Get user's reviews

### File Uploads
- `POST /api.php/upload` - Upload file (profile, resume, portfolio, message attachment)

### Contact
- `POST /api.php/contact` - Submit contact form

### Dashboard
- `GET /api.php/dashboard` - Get dashboard statistics and recent activity

**📖 For complete API documentation, see [README-backend.md](README-backend.md)**

---

## 🔐 Security Features

### Implemented Security Measures
- ✅ **CSRF Protection** - All POST/PUT/DELETE requests require CSRF tokens
- ✅ **SQL Injection Prevention** - All queries use prepared statements
- ✅ **XSS Protection** - HTML escaping for all user input
- ✅ **File Upload Security** - MIME type validation, filename sanitization, `.htaccess` protection
- ✅ **Session Security** - Database-backed sessions, regeneration on login
- ✅ **Password Security** - Bcrypt hashing, secure reset flow
- ✅ **Rate Limiting** - Protection against brute force and abuse
- ✅ **Authorization Checks** - Ownership verification for all operations
- ✅ **Input Validation** - Server-side and client-side validation
- ✅ **WebSocket Security** - Session validation, connection rate limiting, IP whitelisting
- ✅ **Error Handling** - Generic error messages, detailed logging server-side

### Production Security Checklist
- [ ] Change `JWT_SECRET` in `config.local.php`
- [ ] Set WebSocket CORS to production domain (not `*`)
- [ ] Enable HTTPS/SSL
- [ ] Configure production database credentials
- [ ] Set up email (SMTP) for password reset
- [ ] Review file permissions
- [ ] Enable error logging (disable error display)
- [ ] Set up firewall rules
- [ ] Configure backup strategy

---

## 🗄️ Database

### Schema Overview
- **26 tables** with proper relationships and indexes
- **UTF8MB4** character set for full Unicode support
- **Foreign keys** with CASCADE deletes
- **Indexes** optimized for common queries
- **ENUM types** for status fields (includes 'draft' for gigs)

### Key Tables
- `users` - Unified table for students and businesses
- `gigs` - Job postings (supports draft status)
- `applications` - Student applications
- `conversations` - Messaging threads
- `messages` - Individual messages
- `notifications` - System notifications
- `reviews` - Ratings and reviews
- `interested_gigs` - Interest tracking
- `sessions` - Session management

**📖 For complete schema, see `database.sql`**

---

## 🌐 WebSocket Server

### Features
- Real-time message delivery
- Typing indicators
- Live notifications
- Online/offline status tracking
- Conversation room management
- Session-based authentication

### Running the Server
```bash
# Development
node server.js

# Production (with PM2)
pm2 start server.js --name funagig-websocket
```

### Configuration
- Uses `server.config.js` or environment variables
- Supports CORS configuration
- Database connection pooling
- Production security checks

**📖 For WebSocket documentation, see `server.js` comments**

---

## 📚 Documentation

- **[README-backend.md](README-backend.md)** - Complete backend API documentation
- **[README-frontend.md](README-frontend.md)** - Frontend architecture and features
- **[CONFIGURATION_GUIDE.md](CONFIGURATION_GUIDE.md)** - Comprehensive configuration guide

---

## 🧪 Testing

### Manual Testing Checklist
- [x] User registration and login
- [x] Password reset flow
- [x] Gig posting (including drafts)
- [x] Gig browsing and filtering
- [x] Application submission
- [x] Application management
- [x] Real-time messaging
- [x] File uploads
- [x] Profile management
- [x] Reviews and ratings
- [x] Interest tracking
- [x] Notifications
- [x] Search functionality

---

## 🚀 Deployment

### Production Deployment Steps

1. **Database Setup**
   - Create production database
   - Import `database.sql`
   - Create dedicated database user with limited privileges

2. **Configuration**
   - Copy `config.local.php.example` to `config.local.php`
   - Update all sensitive values (database, JWT secret, email)
   - Update `APP_URL` to production domain
   - Configure `server.config.js` for WebSocket server

3. **File Permissions**
   ```bash
   chmod 755 uploads/
   chmod 644 uploads/.htaccess
   chmod 600 config.local.php
   chmod 600 server.config.js
   ```

4. **WebSocket Server**
   - Set up as system service (PM2 or systemd)
   - Configure reverse proxy (nginx) for WebSocket connections
   - Update CORS settings to production domain

5. **Security**
   - Enable HTTPS/SSL
   - Configure `.htaccess` for security headers
   - Set up firewall rules
   - Enable error logging (disable error display)

6. **Monitoring**
   - Set up error logging
   - Configure application monitoring
   - Set up database backups

**📖 For detailed deployment guide, see [CONFIGURATION_GUIDE.md](CONFIGURATION_GUIDE.md)**

---

## 🐛 Known Issues & Limitations

### Current Limitations
- Email functionality uses PHP `mail()` - configure SMTP for production
- WebSocket server requires Node.js running separately
- Some analytics tables exist but not fully implemented
- No admin dashboard (can be added)

### Browser Compatibility
- Modern browsers only (Chrome, Firefox, Safari, Edge)
- Requires ES6+ support
- Requires CSS Grid and Flexbox support

---

## 📝 Recent Updates (v2.5)

### Major Improvements
- ✅ Replaced all mock data with real database queries
- ✅ Implemented draft gig functionality
- ✅ Added interest tracking feature
- ✅ Enhanced WebSocket security
- ✅ Improved error handling and validation
- ✅ Added comprehensive configuration management
- ✅ Optimized database with indexes
- ✅ Standardized API error responses
- ✅ Added pagination to key endpoints
- ✅ Enhanced file upload security
- ✅ Improved session management

### Bug Fixes
- ✅ Fixed path issues after file reorganization
- ✅ Fixed script loading order in auth.html
- ✅ Fixed draft publishing validation
- ✅ Fixed interested gigs display
- ✅ Fixed WebSocket notification spam
- ✅ Fixed profile editing functionality

---

## 🤝 Contributing

This is a private project. For issues or questions, please contact the development team.

---

## 📄 License

Private project - All rights reserved

---

## 📞 Support

For setup issues or questions:
1. Check [CONFIGURATION_GUIDE.md](CONFIGURATION_GUIDE.md)
2. Review error logs
3. Check browser console for frontend errors
4. Check PHP error log for backend errors
5. Check WebSocket server console output

---

**Version:** 2.5  
**Last Updated:** 2025-01-27  
**Status:** ✅ Production-Ready
