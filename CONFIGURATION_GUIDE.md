# FunaGig Configuration Guide

This guide covers all configuration options for the FunaGig application, including PHP backend, Node.js WebSocket server, and environment-specific settings.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [PHP Backend Configuration](#php-backend-configuration)
3. [Node.js WebSocket Server Configuration](#nodejs-websocket-server-configuration)
4. [Database Configuration](#database-configuration)
5. [Security Configuration](#security-configuration)
6. [File Upload Configuration](#file-upload-configuration)
7. [Email Configuration](#email-configuration)
8. [Environment-Specific Settings](#environment-specific-settings)
9. [Production Deployment](#production-deployment)

---

## Quick Start

### Initial Setup

1. **Copy configuration templates:**
   ```bash
   cp config.local.php.example config.local.php
   cp server.config.js.example server.config.js  # If using WebSocket server
   ```

2. **Update sensitive values** in `config.local.php` and `server.config.js`

3. **Configure database** in `config.php` or `config.local.php`

4. **Start services:**
   - PHP backend: Already running if using XAMPP/Apache
   - WebSocket server: `node server.js`

---

## PHP Backend Configuration

### Main Configuration File: `config.php`

The main configuration file contains default settings. For production, override sensitive values in `config.local.php`.

#### Database Settings

```php
define('DB_HOST', 'localhost');      // Database host
define('DB_NAME', 'funagig');        // Database name
define('DB_USER', 'root');           // Database username
define('DB_PASS', '');               // Database password (empty for XAMPP default)
```

**Production Recommendation:** Store these in `config.local.php` (not committed to Git).

#### Application Settings

```php
define('APP_NAME', 'FunaGig');
define('APP_VERSION', '1.4');
define('APP_URL', 'http://localhost/funagig');  // Base URL of your application
```

**Important:** Update `APP_URL` for production:
- Development: `http://localhost/funagig`
- Production: `https://yourdomain.com` or `https://yourdomain.com/funagig`

#### Security Settings

```php
define('JWT_SECRET', 'your-secret-key-here-change-in-production');
define('PASSWORD_HASH_ALGO', PASSWORD_DEFAULT);  // Uses bcrypt
```

**Critical:** Change `JWT_SECRET` to a strong, random string in production. Generate one using:
```bash
php -r "echo bin2hex(random_bytes(32));"
```

#### File Upload Settings

```php
define('MAX_FILE_SIZE', 5 * 1024 * 1024);  // 5MB maximum file size
define('UPLOAD_PATH', 'uploads/');          // Relative path to uploads directory
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']);
```

**Notes:**
- `MAX_FILE_SIZE` should match or be less than PHP's `upload_max_filesize` and `post_max_size` in `php.ini`
- `UPLOAD_PATH` is relative to the `api.php` file location
- Ensure the `uploads/` directory exists and is writable

#### Email Settings

```php
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USERNAME', 'your-email@gmail.com');
define('SMTP_PASSWORD', 'your-app-password');
define('FROM_EMAIL', 'noreply@funagig.com');
define('FROM_NAME', 'FunaGig');
```

**Gmail Setup:**
1. Enable 2-factor authentication
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the App Password (not your regular password) in `SMTP_PASSWORD`

**Other Email Providers:**
- **Outlook/Hotmail:** `smtp-mail.outlook.com`, port 587
- **SendGrid:** `smtp.sendgrid.net`, port 587, use API key as password
- **Mailgun:** `smtp.mailgun.org`, port 587

---

## Local Configuration: `config.local.php`

**Purpose:** Store sensitive configuration that should NOT be committed to Git.

**Setup:**
1. Copy `config.local.php.example` to `config.local.php`
2. Uncomment and update values as needed
3. Ensure `config.local.php` is in `.gitignore`

**Example:**
```php
<?php
// Local configuration - DO NOT COMMIT THIS FILE

// Override database settings
define('DB_HOST', 'localhost');
define('DB_NAME', 'funagig_production');
define('DB_USER', 'funagig_user');
define('DB_PASS', 'your-secure-password-here');

// Override security settings
define('JWT_SECRET', 'your-production-secret-key-here');

// Override email settings
define('SMTP_USERNAME', 'your-production-email@gmail.com');
define('SMTP_PASSWORD', 'your-app-password-here');
```

**Benefits:**
- Keeps sensitive data out of version control
- Allows different settings per environment
- Easy to share example configuration without exposing secrets

---

## Node.js WebSocket Server Configuration

### Configuration File: `server.config.js`

The WebSocket server can be configured via `server.config.js` or environment variables.

#### Database Configuration

```javascript
database: {
    host: 'localhost',
    user: 'root',
    password: '',  // Set your database password here
    database: 'funagig',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}
```

**Note:** These should match your PHP `config.php` database settings.

#### CORS Configuration

```javascript
cors: {
    origin: "*",  // ⚠️ CHANGE THIS in production
    methods: ["GET", "POST"]
}
```

**Development:**
- `origin: "*"` - Allows all origins (convenient for development)

**Production:**
- `origin: ['https://yourdomain.com', 'https://www.yourdomain.com']` - Specific allowed origins
- Or use `CORS_ORIGIN` environment variable

#### Server Port

```javascript
port: 3001
```

**Change if needed:** Update if port 3001 is already in use.

#### Session Settings

```javascript
session: {
    expirationHours: 24  // Session expiration time in hours
}
```

### Environment Variables

You can override configuration using environment variables:

```bash
# Database
export DB_HOST=localhost
export DB_USER=root
export DB_PASSWORD=yourpassword
export DB_NAME=funagig

# CORS
export CORS_ORIGIN=https://yourdomain.com

# Server
export WS_PORT=3001
```

**Priority:** Environment variables override `server.config.js` values.

---

## Database Configuration

### Initial Setup

1. **Create database:**
   ```sql
   CREATE DATABASE funagig CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Import schema:**
   ```bash
   mysql -u root -p funagig < database.sql
   ```

3. **Verify tables:**
   ```sql
   SHOW TABLES;
   ```

### Connection Settings

**XAMPP Default:**
- Host: `localhost`
- User: `root`
- Password: (empty)
- Port: `3306`

**Production:**
- Use a dedicated database user with limited privileges
- Enable SSL connections if available
- Use strong passwords

### Database User Permissions

**Recommended Production User:**
```sql
CREATE USER 'funagig_user'@'localhost' IDENTIFIED BY 'strong-password-here';
GRANT SELECT, INSERT, UPDATE, DELETE ON funagig.* TO 'funagig_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## Security Configuration

### Session Security

**Session Regeneration:**
- Enabled automatically on login (prevents session fixation)
- Sessions expire after 24 hours of inactivity

**Session Storage:**
- File-based sessions (default)
- Database-backed sessions (for WebSocket validation)

### CSRF Protection

- CSRF tokens are automatically generated and validated
- Tokens are refreshed on login
- Required for all state-changing requests (POST, PUT, DELETE)

### Rate Limiting

Configured per endpoint in `api.php`:
- Login: 5 attempts per 15 minutes per IP
- Signup: 3 attempts per hour per IP
- Gigs: 10 operations per minute per user

### File Upload Security

**Protections:**
- MIME type validation
- File extension validation
- Filename sanitization
- Size limits
- `.htaccess` prevents script execution in uploads directory

**Upload Directory:**
- Located at `uploads/`
- Protected by `.htaccess` (prevents directory listing and script execution)

---

## File Upload Configuration

### PHP Settings (`php.ini`)

Ensure these settings are appropriate:

```ini
upload_max_filesize = 5M
post_max_size = 5M
max_file_uploads = 20
```

**To check current settings:**
```php
<?php
phpinfo();
// Look for upload_max_filesize and post_max_size
```

### Upload Types

The system supports different upload types:
- `profile` - Profile images
- `resume` - Resume files
- `portfolio` - Portfolio items
- `attachment` - Message attachments

Each type is stored in `uploads/{type}/` subdirectory.

### Allowed File Types

Currently allowed:
- Images: `jpg`, `jpeg`, `png`
- Documents: `pdf`, `doc`, `docx`

**To add more types:**
1. Update `ALLOWED_EXTENSIONS` in `config.php`
2. Update MIME type validation in `api.php` `handleUpload()` function

---

## Email Configuration

### SMTP Settings

**Gmail (Recommended for Development):**
```
Host: smtp.gmail.com
Port: 587
Security: TLS
Authentication: Required
```

**Steps:**
1. Enable 2FA on your Google account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use App Password (not regular password) in configuration

### Email Functions

The system uses PHP's `mail()` function with SMTP configuration.

**Current Email Features:**
- Password reset emails
- Notification emails (if implemented)

**Testing:**
```php
// Test email sending
mail('test@example.com', 'Test', 'This is a test email');
```

---

## Environment-Specific Settings

### Development

**PHP (`config.php`):**
```php
define('APP_URL', 'http://localhost/funagig');
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
```

**WebSocket (`server.config.js`):**
```javascript
cors: { origin: "*" }  // Allow all origins
```

### Staging

**PHP:**
```php
define('APP_URL', 'https://staging.yourdomain.com');
// Use staging database credentials
```

**WebSocket:**
```javascript
cors: { origin: ['https://staging.yourdomain.com'] }
```

### Production

**PHP (`config.local.php`):**
```php
define('APP_URL', 'https://yourdomain.com');
// Use production database credentials
// Use strong JWT_SECRET
// Use production email credentials
```

**WebSocket:**
```javascript
cors: { origin: ['https://yourdomain.com', 'https://www.yourdomain.com'] }
```

**Environment Variables:**
```bash
export NODE_ENV=production
export CORS_ORIGIN=https://yourdomain.com
```

---

## Production Deployment

### Checklist

- [ ] Update `APP_URL` to production domain
- [ ] Change `JWT_SECRET` to strong random string
- [ ] Use production database credentials
- [ ] Configure production email (SMTP)
- [ ] Set WebSocket CORS to production domain
- [ ] Enable HTTPS/SSL
- [ ] Configure `.htaccess` for security
- [ ] Set proper file permissions
- [ ] Enable error logging (disable error display)
- [ ] Set up database backups
- [ ] Configure firewall rules
- [ ] Set up monitoring

### File Permissions

```bash
# Uploads directory
chmod 755 uploads/
chmod 644 uploads/.htaccess

# PHP files
chmod 644 *.php

# Configuration files
chmod 600 config.local.php  # Restrict access
chmod 600 server.config.js  # Restrict access
```

### PHP Settings for Production

**`php.ini` recommendations:**
```ini
display_errors = Off
log_errors = On
error_log = /path/to/php_errors.log
expose_php = Off
session.cookie_httponly = On
session.cookie_secure = On  # If using HTTPS
```

### Apache/Nginx Configuration

**Apache (`.htaccess` in root):**
```apache
# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Security headers
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "SAMEORIGIN"
Header set X-XSS-Protection "1; mode=block"
```

---

## Troubleshooting

### Database Connection Issues

**Error:** "Connection failed"
- Check database credentials
- Verify database exists
- Check MySQL service is running
- Verify user has proper permissions

### File Upload Issues

**Error:** "File too large"
- Check `MAX_FILE_SIZE` in `config.php`
- Check `upload_max_filesize` in `php.ini`
- Check `post_max_size` in `php.ini`

**Error:** "Failed to save uploaded file"
- Check `uploads/` directory exists
- Verify directory is writable: `chmod 755 uploads/`
- Check disk space

### WebSocket Connection Issues

**Error:** "Connection refused"
- Verify WebSocket server is running: `node server.js`
- Check port 3001 is not blocked by firewall
- Verify CORS settings match your frontend domain

**Error:** "CORS error"
- Update `cors.origin` in `server.config.js`
- Or set `CORS_ORIGIN` environment variable
- Ensure production doesn't use `origin: "*"`

### Email Issues

**Error:** "Failed to send email"
- Verify SMTP credentials
- Check firewall allows SMTP port (587)
- For Gmail, ensure App Password is used (not regular password)
- Check spam folder

---

## Additional Resources

- **Backend API Documentation:** See `README-backend.md`
- **WebSocket Documentation:** See `server.js` comments
- **Database Schema:** See `database.sql`
- **Security Best Practices:** See `PROJECT_REVIEW_REPORT.md`

---

## Support

For issues or questions:
1. Check this configuration guide
2. Review error logs
3. Check PHP error log: `php_errors.log`
4. Check WebSocket server console output
5. Review database connection logs

---

**Last Updated:** 2025-01-XX  
**Version:** 1.4

