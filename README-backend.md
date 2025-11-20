# FunaGig Backend Documentation

## Overview
The FunaGig backend is built with PHP and MySQL, designed for easy deployment on XAMPP. It provides a RESTful API for the frontend with authentication, data management, and real-time features.

## File Structure
```
php/
├── api.php                 # Main API router (RESTful endpoints)
├── config.php              # DB connection (mysqli) and utilities
└── websocket-emitter.php   # WebSocket event emitter for real-time features

database/
└── database.sql            # Complete database schema

websocket-server/
├── server.js               # Node.js WebSocket server
├── package.json            # Node.js dependencies
└── README.md               # WebSocket server documentation
```

## API Architecture

### Core Components

#### Database Class (`config.php`)
- Singleton pattern for database connections
- Prepared statements for security
- Transaction support
- Error handling and logging

#### API Router (`api.php`)
- RESTful endpoint routing
- Request method handling
- JSON request/response format
- CORS support

### Database Schema

#### Core Tables
- **users**: Unified table for students and businesses
- **gigs**: Job postings by businesses
- **applications**: Student applications to gigs
- **conversations**: Messaging threads
- **messages**: Individual messages
- **notifications**: System notifications

#### Supporting Tables
- **skills**: Available skills catalog
- **user_skills**: User-skill relationships
- **reviews**: Rating and review system
- **categories**: Gig categorization
- **gig_categories**: Gig-category relationships
- **saved_gigs**: Student saved gigs
- **interested_gigs**: Student interested gigs
- **notifications**: System notifications
- **password_reset_tokens**: Password reset tokens
- **email_verification_tokens**: Email verification tokens
- **two_factor_backup_codes**: 2FA backup codes
- **message_attachments**: Message file attachments
- **user_files**: User portfolio files
- **gig_attachments**: Gig file attachments
- **typing_indicators**: Real-time typing status
- **sessions**: User session management
- **analytics_events**: Analytics tracking
- **page_views**: Page view tracking
- **gig_views**: Gig view tracking

## API Endpoints

### Authentication
```
POST /php/api.php/login
POST /php/api.php/signup
POST /php/api.php/logout
```

### Dashboard
```
GET /php/api.php/dashboard
```
Returns role-specific statistics and data.

### Profile Management
```
GET /php/api.php/profile
POST /php/api.php/profile
```

### Gigs Management
```
GET /php/api.php/gigs          # List all active gigs
POST /php/api.php/gigs         # Create new gig
GET /php/api.php/gigs/active   # Get user's active gigs
PUT /php/api.php/gigs/update   # Update gig
DELETE /php/api.php/gigs/delete # Delete gig
```

### Applications
```
GET /php/api.php/applications            # Get applications (student or business)
POST /php/api.php/applications           # Apply to a gig
POST /php/api.php/applicants/accept      # Accept applicant
POST /php/api.php/applicants/reject      # Reject applicant
```

### Messaging
```
GET /php/api.php/conversations           # List conversations
POST /php/api.php/conversations          # Start new conversation
GET /php/api.php/messages/{id}           # Get messages for conversation
POST /php/api.php/messages              # Send message
POST /php/api.php/typing                # Set typing indicator
```

### Notifications
```
GET /php/api.php/notifications          # Get notifications
PUT /php/api.php/notifications         # Mark notifications as read
```

### File Uploads
```
POST /php/api.php/upload                # Upload files (profile, resume, portfolio, attachments)
```

### Reviews
```
POST /php/api.php/reviews               # Submit review
GET /php/api.php/reviews/{user_id}      # Get user reviews
```

### Password Reset
```
POST /php/api.php/auth/forgot-password  # Request password reset
POST /php/api.php/auth/reset-password   # Reset password
```

### Saved Gigs
```
GET /php/api.php/saved-gigs            # Get saved gigs
POST /php/api.php/saved-gigs            # Save gig
DELETE /php/api.php/saved-gigs          # Unsave gig
```

### Portfolio
```
GET /php/api.php/portfolio              # Get portfolio items
DELETE /php/api.php/portfolio           # Delete portfolio item
```

## Security Features

### Authentication
- Session-based authentication
- Password hashing with PHP's `password_hash()` (bcrypt)
- Input sanitization and validation
- SQL injection prevention with prepared statements
- CSRF token protection
- Rate limiting on authentication endpoints
- Password reset with secure tokens

### Data Validation
- Email format validation
- Required field checking
- Input sanitization with `htmlspecialchars()`
- Password strength requirements

### CORS Support
- Cross-origin request handling
- Preflight request support
- Configurable allowed origins

### CSRF Protection
- Token generation and validation
- Automatic token injection in forms
- Token refresh on authentication
- Protection on all state-changing requests

### Rate Limiting
- Per-endpoint rate limiting configuration
- User ID-based rate limiting for authenticated requests
- IP-based rate limiting for unauthenticated requests
- Rate limit headers in responses (X-RateLimit-*)
- User-friendly error messages with retry-after information

## Database Design

### User Management
```sql
-- Unified users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    type ENUM('student', 'business') NOT NULL,
    -- Student fields
    university VARCHAR(255) NULL,
    major VARCHAR(255) NULL,
    -- Business fields
    industry VARCHAR(255) NULL,
    -- Common fields
    bio TEXT NULL,
    skills TEXT NULL,
    location VARCHAR(255) NULL,
    rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Gigs System
```sql
CREATE TABLE gigs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    budget DECIMAL(10,2) NOT NULL,
    deadline DATE NOT NULL,
    skills TEXT NULL,
    location VARCHAR(255) NULL,
    type ENUM('one-time', 'ongoing', 'contract') DEFAULT 'one-time',
    status ENUM('active', 'paused', 'completed', 'cancelled') DEFAULT 'active',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Messaging System
```sql
CREATE TABLE conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Response Format

### Success Response
```json
{
    "success": true,
    "data": { ... },
    "message": "Operation completed successfully"
}
```

### Error Response
```json
{
    "success": false,
    "error": "Error message",
    "code": 400
}
```

## Configuration

### Database Settings (`config.php`)
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'funagig');
define('DB_USER', 'root');
define('DB_PASS', '');
```

### Security Settings
```php
define('JWT_SECRET', 'your-secret-key-here');
define('PASSWORD_HASH_ALGO', PASSWORD_DEFAULT);
```

### File Upload Settings
```php
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
define('UPLOAD_PATH', 'uploads/');
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'pdf']);
```

## Error Handling

### Database Errors
- Connection error logging
- Query error handling
- Transaction rollback on failure

### API Errors
- HTTP status codes
- JSON error responses
- Input validation errors
- Authentication errors

## Performance Optimizations

### Database
- Indexed columns for common queries
- Prepared statements for security
- Connection pooling
- Query optimization

### API
- Efficient data serialization
- Minimal database queries
- Caching strategies
- Response compression

## Development Guidelines

### Adding New Endpoints
1. Add route to `api.php` switch statement
2. Create handler function
3. Implement validation
4. Add database operations
5. Test with frontend

### Database Changes
1. Update schema in `database.sql`
2. Add migration scripts if needed
3. Update API endpoints
4. Test with sample data

### WebSocket Integration
1. PHP backend emits events via `WebSocketEmitter`
2. Node.js server receives events via HTTP POST `/emit`
3. Node.js server broadcasts to connected clients
4. See `ARCHITECTURE.md` for detailed information

### Security Considerations
- Always use prepared statements
- Validate all inputs
- Sanitize output data
- Implement rate limiting
- Log security events

## Testing

### API Testing
- Use Postman or similar tools
- Test all endpoints
- Verify error handling
- Check response formats

### Database Testing
- Test with sample data
- Verify constraints
- Check performance
- Test edge cases

## Deployment

### XAMPP Setup
1. Place files in `htdocs/funagig/`
2. Import database schema
3. Update configuration
4. Test all endpoints

### Production Considerations
- Change default passwords
- Enable error logging
- Configure SSL
- Set up backups
- Monitor performance

