# FunaGig Backend API Documentation

**Version:** 2.5 | **Last Updated:** 2025-01-27 | **Status:** ✅ Production-Ready

## Overview

The FunaGig backend is built with PHP and MySQL, designed for easy deployment on XAMPP. It provides a RESTful API for the frontend with authentication, data management, and real-time features via WebSocket integration.

---

## 📁 File Structure

```
funagig2.5/
├── api.php                    # Main API router (all RESTful endpoints)
├── config.php                 # Database connection, utilities, configuration
├── config.local.php.example   # Template for local configuration (sensitive data)
├── email.php                  # Email functions (password reset, notifications)
├── websocket-emitter.php      # WebSocket event emitter for real-time features
├── database.sql               # Complete database schema with indexes
│
├── server.js                  # Node.js WebSocket server
├── server.config.js           # WebSocket server configuration
└── package.json               # Node.js dependencies
```

**Note:** All files are in the root directory (flat structure) for easier deployment.

---

## 🏗️ API Architecture

### Core Components

#### Database Class (`config.php`)
- Singleton pattern for database connections
- Prepared statements for security (SQL injection prevention)
- Transaction support
- Error handling and logging
- Connection pooling

#### API Router (`api.php`)
- RESTful endpoint routing
- Request method handling (GET, POST, PUT, DELETE)
- JSON request/response format
- CORS support
- CSRF protection
- Rate limiting
- Input validation and sanitization

#### Response Formatting
- Standardized success/error responses
- Error codes for client-side handling
- Pagination metadata
- Detailed error information (development mode)

---

## 📊 Database Schema

### Core Tables

- **users** - Unified table for students and businesses
  - Supports both user types with role-specific fields
  - Includes profile fields (bio, skills, location, phone, website)
  - Rating and verification system

- **gigs** - Job postings by businesses
  - Status: `'draft'`, `'active'`, `'paused'`, `'completed'`, `'cancelled'`
  - Default status: `'draft'`
  - Supports skills, location, type (one-time, ongoing, contract)

- **applications** - Student applications to gigs
  - Status: `'pending'`, `'accepted'`, `'rejected'`, `'completed'`
  - Includes resume path and application message

- **conversations** - Messaging threads between users
- **messages** - Individual messages with attachments
- **notifications** - System notifications
- **reviews** - Rating and review system
- **interested_gigs** - Interest tracking
- **saved_gigs** - Saved gigs for students
- **sessions** - Database-backed session management

### Supporting Tables

- **password_reset_tokens** - Secure password reset tokens
- **message_attachments** - File attachments in messages
- **user_files** - User portfolio files
- **typing_indicators** - Real-time typing status
- **gig_views** - Gig view analytics
- **analytics_events** - Event tracking (for future use)

### Database Optimizations

✅ **Indexes Added:**
- Single-column indexes on frequently queried fields
- Composite indexes for common query patterns
- Full-text indexes for search functionality
- Foreign key indexes for join operations

---

## 🔌 API Endpoints

### Base URL
```
/api.php
```
**Note:** The frontend auto-detects the API path based on current location.

### Authentication

#### `POST /api.php/login`
User login with email and password.

**Request:**
```json
{
    "email": "user@example.com",
    "password": "password123"
}
```

**Response:**
```json
{
    "success": true,
    "user": {
        "id": 1,
        "name": "John Doe",
        "email": "user@example.com",
        "type": "student"
    },
    "csrf_token": "token-here"
}
```

#### `POST /api.php/signup`
User registration.

**Request:**
```json
{
    "name": "John Doe",
    "email": "user@example.com",
    "password": "password123",
    "type": "student",
    "university": "Example University",
    "major": "Computer Science"
}
```

#### `POST /api.php/logout`
Logout current user (invalidates session).

#### `POST /api.php/auth/forgot-password`
Request password reset (sends email with reset token).

**Request:**
```json
{
    "email": "user@example.com"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Password reset email sent"
}
```

#### `POST /api.php/auth/reset-password`
Reset password with token from email.

**Request:**
```json
{
    "token": "reset-token-from-email",
    "password": "newpassword123"
}
```

#### `GET /api.php/auth/session-status`
Check if PHP session is valid (for WebSocket authentication).

**Response:**
```json
{
    "success": true,
    "valid": true,
    "user_id": 1
}
```

---

### Dashboard

#### `GET /api.php/dashboard`
Get role-specific dashboard statistics and recent activity.

**Response (Student):**
```json
{
    "success": true,
    "stats": {
        "active_tasks": 3,
        "pending_tasks": 2,
        "completed_tasks": 5,
        "total_earned": 2100000,
        "total_tasks": 10,
        "days_active": 45,
        "average_rating": 4.6,
        "total_reviews": 12
    },
    "recent_activity": [
        {
            "type": "application",
            "title": "Application Submitted",
            "message": "Applied to \"Website Development\"",
            "date": "2025-01-27 10:00:00"
        }
    ]
}
```

**Response (Business):**
```json
{
    "success": true,
    "stats": {
        "active_gigs": 2,
        "total_applicants": 15,
        "hired_students": 8,
        "average_rating": 4.7,
        "total_reviews": 24
    },
    "recent_activity": [
        {
            "type": "application",
            "title": "New Application",
            "message": "John Doe applied to \"Website Development\"",
            "date": "2025-01-27 10:00:00"
        }
    ]
}
```

---

### Profile Management

#### `GET /api.php/profile`
Get current user's profile.

**Response:**
```json
{
    "success": true,
    "user": {
        "id": 1,
        "name": "John Doe",
        "email": "user@example.com",
        "type": "student",
        "university": "Example University",
        "major": "Computer Science",
        "bio": "Student profile...",
        "skills": "Web Development, JavaScript",
        "location": "Kampala",
        "phone": "+256 700 123 456",
        "website": "https://example.com",
        "rating": 4.6,
        "total_ratings": 12
    }
}
```

#### `POST /api.php/profile`
Update current user's profile (supports partial updates).

**Request:**
```json
{
    "name": "John Doe Updated",
    "bio": "Updated bio",
    "phone": "+256 700 123 456",
    "website": "https://example.com",
    "skills": "Web Development, JavaScript, React"
}
```

**Validation:**
- Phone: Must match pattern `^\+?[0-9]{10,15}$`
- Website: Must be valid URL format
- All fields are optional (partial updates supported)

---

### Gigs Management

#### `GET /api.php/gigs`
List all active gigs (public access, paginated).

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `search` - Search term (searches title and description)
- `type` - Filter by type: `one-time`, `ongoing`, `contract`
- `location` - Filter by location
- `min_budget` - Minimum budget filter
- `max_budget` - Maximum budget filter

**Response:**
```json
{
    "success": true,
    "gigs": [...],
    "pagination": {
        "page": 1,
        "limit": 20,
        "total": 50,
        "total_pages": 3,
        "has_next": true,
        "has_prev": false
    }
}
```

#### `GET /api.php/gigs/{id}`
Get single gig by ID.

**Access:**
- Public access for active gigs
- Owner access only for drafts
- Returns 404 if not found or access denied

**Response:**
```json
{
    "success": true,
    "gig": {
        "id": 1,
        "title": "Website Development",
        "description": "Need a modern website...",
        "budget": 500000,
        "deadline": "2025-12-31",
        "type": "one-time",
        "status": "active",
        "skills": "HTML, CSS, JavaScript",
        "location": "Remote",
        "business_name": "Tech Solutions Inc.",
        "application_count": 5,
        "interest_count": 12,
        "view_count": 45,
        "created_at": "2025-01-20 10:00:00"
    }
}
```

#### `GET /api.php/gigs/active`
Get user's active gigs (requires authentication).

**Query Parameters:**
- `include_drafts` - Include draft gigs (default: false)
- `status` - Filter by status: `active`, `paused`, `completed`, `cancelled`, `draft`

**Response:**
```json
{
    "success": true,
    "gigs": [
        {
            "id": 1,
            "title": "Website Development",
            "status": "active",
            "applicant_count": 5,
            ...
        }
    ]
}
```

#### `POST /api.php/gigs`
Create new gig (requires authentication, business role).

**Request:**
```json
{
    "title": "Website Development",
    "description": "Need a modern website...",
    "budget": 500000,
    "deadline": "2025-12-31",
    "type": "one-time",
    "skills": "HTML, CSS, JavaScript",
    "location": "Remote",
    "status": "draft"  // Optional: 'draft' or 'active' (default: 'draft')
}
```

**Validation:**
- Title: Required, max 255 characters
- Description: Required
- Budget: Required, must be positive number
- Deadline: Required, must be future date
- Type: Must be `one-time`, `ongoing`, or `contract`
- Status: Must be `draft` or `active`

#### `POST /api.php/gigs/update`
Update existing gig (requires authentication, owner only).

**Request:**
```json
{
    "gig_id": 1,
    "title": "Updated Title",  // Optional - partial updates supported
    "status": "active",         // Optional
    "budget": 600000            // Optional
}
```

**Features:**
- Supports partial updates (only send fields to change)
- Validates ownership before update
- When changing from `draft` to `active`, validates all required fields and deadline
- Validates status enum values

#### `DELETE /api.php/gigs/delete`
Delete gig (requires authentication, owner only).

**Request:**
```json
{
    "gig_id": 1
}
```

---

### Interest Tracking

#### `POST /api.php/gigs/{id}/interest`
Express interest in a gig (requires authentication, student role).

**Response:**
```json
{
    "success": true,
    "message": "Interest expressed successfully"
}
```

#### `DELETE /api.php/gigs/{id}/interest`
Remove interest from a gig (requires authentication, student role).

#### `GET /api.php/interested-gigs`
Get all gigs the current user has expressed interest in (requires authentication, student role).

**Response:**
```json
{
    "success": true,
    "gigs": [
        {
            "id": 1,
            "title": "Website Development",
            "business_name": "Tech Solutions Inc.",
            "budget": 500000,
            "deadline": "2025-12-31",
            "interest_date": "2025-01-27 10:00:00"
        }
    ]
}
```

---

### Applications

#### `GET /api.php/applications`
Get applications (requires authentication).

**Query Parameters:**
- `gig_id` - Filter by gig ID (for businesses)
- `status` - Filter by status: `pending`, `accepted`, `rejected`, `completed`

**Response (Student):**
```json
{
    "success": true,
    "applications": [
        {
            "id": 1,
            "gig_id": 1,
            "gig_title": "Website Development",
            "status": "pending",
            "applied_at": "2025-01-27 10:00:00",
            "message": "I'm interested in this gig..."
        }
    ]
}
```

**Response (Business):**
```json
{
    "success": true,
    "applications": [
        {
            "id": 1,
            "gig_id": 1,
            "gig_title": "Website Development",
            "student_id": 2,
            "student_name": "John Doe",
            "student_email": "john@example.com",
            "status": "pending",
            "applied_at": "2025-01-27 10:00:00",
            "message": "I'm interested in this gig...",
            "resume_path": "uploads/resume/resume.pdf"
        }
    ]
}
```

#### `POST /api.php/applications`
Submit application to a gig (requires authentication, student role).

**Request:**
```json
{
    "gig_id": 1,
    "message": "I'm interested in this opportunity...",
    "resume_path": "uploads/resume/resume.pdf"  // Optional
}
```

#### `PUT /api.php/applications`
Update application status (requires authentication, business role, owner of gig).

**Request:**
```json
{
    "application_id": 1,
    "status": "accepted"  // or "rejected"
}
```

#### `DELETE /api.php/applications`
Withdraw application (requires authentication, student role, owner of application).

**Request:**
```json
{
    "application_id": 1
}
```

---

### Messaging

#### `GET /api.php/conversations`
Get user's conversations (requires authentication, paginated).

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

**Response:**
```json
{
    "success": true,
    "conversations": [
        {
            "id": 1,
            "other_user_id": 2,
            "other_user_name": "John Doe",
            "other_user_email": "john@example.com",
            "last_message": "Hello!",
            "last_message_time": "2025-01-27 10:00:00",
            "unread_count": 2
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 20,
        "total": 5,
        "total_pages": 1,
        "has_next": false,
        "has_prev": false
    }
}
```

#### `POST /api.php/conversations`
Start new conversation (requires authentication).

**Request:**
```json
{
    "user_id": 2  // Other user's ID
}
```

#### `GET /api.php/messages/{conversation_id}`
Get messages for a conversation (requires authentication, participant only).

**Response:**
```json
{
    "success": true,
    "messages": [
        {
            "id": 1,
            "sender_id": 1,
            "sender_name": "Jane Doe",
            "content": "Hello!",
            "is_read": true,
            "created_at": "2025-01-27 10:00:00",
            "attachments": [
                {
                    "id": 1,
                    "file_name": "document.pdf",
                    "file_url": "/uploads/message/document.pdf",
                    "file_type": "pdf",
                    "file_size": 102400
                }
            ]
        }
    ]
}
```

#### `POST /api.php/messages`
Send message (requires authentication, participant only).

**Request:**
```json
{
    "conversation_id": 1,
    "message": "Hello! How are you?"
}
```

**Rate Limiting:** 10 messages per minute per user

#### `POST /api.php/typing`
Set typing indicator (requires authentication).

**Request:**
```json
{
    "conversation_id": 1,
    "is_typing": true
}
```

**Query:**
```
GET /api.php/typing?conversation_id=1
```

**Response:**
```json
{
    "success": true,
    "is_typing": true,
    "user_name": "John Doe"
}
```

---

### Notifications

#### `GET /api.php/notifications`
Get user's notifications (requires authentication, paginated).

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

**Response:**
```json
{
    "success": true,
    "notifications": [
        {
            "id": 1,
            "title": "New Application",
            "message": "John Doe applied to your gig",
            "type": "info",
            "is_read": false,
            "created_at": "2025-01-27 10:00:00"
        }
    ],
    "unread_count": 5,
    "pagination": {
        "page": 1,
        "limit": 20,
        "total": 15,
        "total_pages": 1,
        "has_next": false,
        "has_prev": false
    }
}
```

#### `PUT /api.php/notifications`
Mark notifications as read (requires authentication).

**Request (Mark single):**
```json
{
    "notification_id": 1
}
```

**Request (Mark all):**
```json
{
    "mark_all": true
}
```

---

### File Uploads

#### `POST /api.php/upload`
Upload files (requires authentication).

**Form Data:**
- `file` - The file to upload
- `type` - Upload type: `profile`, `resume`, `portfolio`, `message`
- `message_id` - Required for `message` type

**Supported Types:**
- Images: `jpg`, `jpeg`, `png`, `gif`, `webp`
- Documents: `pdf`, `doc`, `docx`, `txt`

**Security:**
- MIME type validation
- File extension validation
- Filename sanitization
- Size limit: 5MB
- Path traversal prevention

**Response:**
```json
{
    "success": true,
    "file_path": "uploads/profile/image.jpg",
    "file_name": "image.jpg",
    "file_size": 102400
}
```

---

### Reviews

#### `POST /api.php/reviews`
Submit review (requires authentication).

**Request:**
```json
{
    "reviewee_id": 2,
    "application_id": 1,  // Optional
    "rating": 5,
    "comment": "Great work! Very professional."
}
```

**Validation:**
- Rating: Required, must be 1-5
- Reviewee ID: Required
- Cannot review yourself
- One review per application/user pair

#### `GET /api.php/reviews/{user_id}`
Get user's reviews (public access).

**Response:**
```json
{
    "success": true,
    "reviews": [
        {
            "id": 1,
            "reviewer_id": 2,
            "reviewer_name": "John Doe",
            "rating": 5,
            "comment": "Great work!",
            "gig_title": "Website Development",
            "created_at": "2025-01-27 10:00:00"
        }
    ],
    "rating_stats": {
        "average_rating": 4.7,
        "total_reviews": 24,
        "five_star": 15,
        "four_star": 6,
        "three_star": 2,
        "two_star": 1,
        "one_star": 0
    }
}
```

---

### Public Profiles

#### `GET /api.php/users/{id}`
Get public user profile (limited information, no sensitive data).

**Response:**
```json
{
    "success": true,
    "user": {
        "id": 1,
        "name": "John Doe",
        "type": "student",
        "university": "Example University",
        "major": "Computer Science",
        "bio": "Student profile...",
        "skills": "Web Development, JavaScript",
        "location": "Kampala",
        "profile_image": "uploads/profile/image.jpg",
        "rating": 4.6,
        "total_ratings": 12,
        "is_verified": true,
        "completed_gigs_count": 5,
        "created_at": "2024-01-01 00:00:00"
    },
    "portfolio": [...],
    "reviews": [...]
}
```

---

### Contact

#### `POST /api.php/contact`
Submit contact form (public access).

**Request:**
```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "Question about platform",
    "message": "I have a question..."
}
```

**Response:**
```json
{
    "success": true,
    "message": "Contact form submitted successfully"
}
```

---

### Saved Gigs

#### `GET /api.php/saved-gigs`
Get user's saved gigs (requires authentication, student role).

#### `POST /api.php/saved-gigs`
Save a gig (requires authentication, student role).

**Request:**
```json
{
    "gig_id": 1
}
```

#### `DELETE /api.php/saved-gigs?gig_id={id}`
Unsave a gig (requires authentication, student role).

---

### Portfolio

#### `GET /api.php/portfolio`
Get user's portfolio items (requires authentication).

#### `DELETE /api.php/portfolio`
Delete portfolio item (requires authentication, owner only).

**Request:**
```json
{
    "file_id": 1
}
```

---

## 🔒 Security Features

### Authentication & Authorization
- ✅ **Session-based authentication** - Database-backed sessions
- ✅ **Password hashing** - Bcrypt with `PASSWORD_DEFAULT`
- ✅ **Session regeneration** - On login to prevent session fixation
- ✅ **CSRF protection** - Tokens required for all state-changing requests
- ✅ **Rate limiting** - Per-endpoint protection against abuse
- ✅ **Ownership verification** - All operations verify user ownership
- ✅ **Role-based access** - Student/business role checks

### Input Validation
- ✅ **Email validation** - Format checking with `filter_var()`
- ✅ **Phone validation** - Regex pattern: `^\+?[0-9]{10,15}$`
- ✅ **URL validation** - Website URL format checking
- ✅ **Numeric validation** - Budget, IDs, etc.
- ✅ **Enum validation** - Status, type fields
- ✅ **Length validation** - Title max 255 characters
- ✅ **Required field checking** - All required fields validated
- ✅ **Input sanitization** - `htmlspecialchars()` for XSS prevention

### SQL Injection Prevention
- ✅ **Prepared statements** - All database queries use prepared statements
- ✅ **Parameter binding** - All user input bound as parameters
- ✅ **No string concatenation** - SQL queries never concatenate user input

### File Upload Security
- ✅ **MIME type validation** - Uses `finfo_file()` for accurate detection
- ✅ **Extension validation** - Secondary check against allowed extensions
- ✅ **Filename sanitization** - Prevents path traversal and malicious characters
- ✅ **Size limits** - 5MB maximum file size
- ✅ **Directory protection** - `.htaccess` prevents script execution
- ✅ **Type restrictions** - Only allowed file types accepted

### Error Handling
- ✅ **Standardized responses** - Consistent error format
- ✅ **Error codes** - Client-friendly error codes
- ✅ **Generic messages** - No sensitive information leaked
- ✅ **Detailed logging** - Server-side error logging

---

## 📝 Response Formats

### Success Response
```json
{
    "success": true,
    "data": { ... },
    "message": "Operation completed successfully"
}
```

### Error Response (Standardized)
```json
{
    "success": false,
    "error": "Error message",
    "error_code": "VALIDATION_ERROR",  // Optional
    "details": {                        // Optional
        "field": "email",
        "reason": "Invalid email format"
    }
}
```

### Paginated Response
```json
{
    "success": true,
    "data": [...],
    "pagination": {
        "page": 1,
        "limit": 20,
        "total": 100,
        "total_pages": 5,
        "has_next": true,
        "has_prev": false
    }
}
```

---

## ⚙️ Configuration

### Database Settings

**Main Config (`config.php`):**
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'funagig');
define('DB_USER', 'root');
define('DB_PASS', '');
```

**Local Override (`config.local.php`):**
```php
// Override defaults (not committed to Git)
define('DB_HOST', 'production-host');
define('DB_NAME', 'funagig_production');
define('DB_USER', 'funagig_user');
define('DB_PASS', 'secure-password');
```

### Security Settings

```php
define('JWT_SECRET', 'your-secret-key-here');  // ⚠️ Change in production!
define('PASSWORD_HASH_ALGO', PASSWORD_DEFAULT);
```

**⚠️ Critical:** Generate a strong secret for production:
```bash
php -r "echo bin2hex(random_bytes(32));"
```

### File Upload Settings

```php
define('MAX_FILE_SIZE', 5 * 1024 * 1024);  // 5MB
define('UPLOAD_PATH', 'uploads/');
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']);
```

### Email Settings

```php
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USERNAME', 'your-email@gmail.com');
define('SMTP_PASSWORD', 'your-app-password');
define('FROM_EMAIL', 'noreply@funagig.com');
define('FROM_NAME', 'FunaGig');
```

**📖 For complete configuration guide, see [CONFIGURATION_GUIDE.md](CONFIGURATION_GUIDE.md)**

---

## 🚀 Performance Optimizations

### Database
- ✅ **Indexes** - Single-column and composite indexes on frequently queried fields
- ✅ **Prepared statements** - Efficient query execution
- ✅ **Connection pooling** - Reusable database connections
- ✅ **Query optimization** - Efficient joins and WHERE clauses

### API
- ✅ **Pagination** - All list endpoints support pagination
- ✅ **Efficient serialization** - Minimal data transfer
- ✅ **Caching strategies** - Session data caching
- ✅ **Minimal queries** - Optimized database queries

---

## 🧪 Testing

### Manual Testing Checklist
- [x] Authentication (login, signup, logout)
- [x] Password reset flow
- [x] Gig CRUD operations
- [x] Draft functionality
- [x] Application submission and management
- [x] Interest tracking
- [x] Messaging (send, receive, attachments)
- [x] File uploads (all types)
- [x] Profile management
- [x] Reviews and ratings
- [x] Notifications
- [x] Search and filtering
- [x] Pagination
- [x] Error handling

### API Testing Tools
- Postman
- cURL
- Browser DevTools Network tab

---

## 📚 Additional Resources

- **[CONFIGURATION_GUIDE.md](CONFIGURATION_GUIDE.md)** - Complete configuration documentation
- **[README.md](README.md)** - Main project README
- **[README-frontend.md](README-frontend.md)** - Frontend documentation
- **`database.sql`** - Complete database schema

---

## 🔄 Recent Updates (v2.5)

### New Features
- ✅ Draft gig functionality (save and publish later)
- ✅ Interest tracking system
- ✅ Public profile viewing
- ✅ Contact form endpoint
- ✅ Single gig details endpoint
- ✅ Pagination for all list endpoints
- ✅ Recent activity tracking
- ✅ Enhanced dashboard statistics

### Security Improvements
- ✅ Session regeneration on login
- ✅ Enhanced WebSocket security
- ✅ Improved file upload validation
- ✅ Standardized error responses
- ✅ Connection rate limiting

### Performance Improvements
- ✅ Database indexes added
- ✅ Query optimizations
- ✅ Efficient pagination

---

**Version:** 2.5  
**Last Updated:** 2025-01-27  
**Status:** ✅ Production-Ready
