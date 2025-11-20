# FunaGig Setup Guide

## Quick Start with XAMPP

### Prerequisites
- XAMPP (Apache + MySQL + PHP)
- Modern web browser
- Text editor (VS Code recommended)

### Installation Steps

#### 1. Download and Install XAMPP
1. Download XAMPP from https://www.apachefriends.org/
2. Install XAMPP on your system
3. Start Apache and MySQL services

#### 2. Setup Project
1. Copy the entire `funagig` folder to `C:\xampp\htdocs\` (Windows) or `/Applications/XAMPP/htdocs/` (Mac)
2. Open XAMPP Control Panel
3. Start Apache and MySQL services

#### 3. Database Setup
1. Open phpMyAdmin (http://localhost/phpmyadmin)
2. Create a new database named `funagig`
3. Import the database schema:
   - Click on the `funagig` database
   - Go to "Import" tab
   - Choose file: `database/database.sql`
   - Click "Go" to import

#### 4. Configuration
1. Open `php/config.php`
2. Update database settings if needed:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'funagig');
   define('DB_USER', 'root');
   define('DB_PASS', '');
   ```

#### 5. Start WebSocket Server (Optional but Recommended)
1. Open terminal/command prompt
2. Navigate to `websocket-server` directory
3. Run `npm install` to install dependencies
4. Run `npm run dev` to start the server
5. Server will run on `http://localhost:3001`

#### 6. Access the Application
1. Open your browser
2. Navigate to `http://localhost/funagig`
3. You should see the FunaGig landing page
4. Note: WebSocket features work best when the WebSocket server is running

## Project Structure

```
funagig/
├── css/
│   └── styles.css              # Global styles
├── js/
│   ├── app.js                  # Core JavaScript utilities
│   ├── messaging.js          # Messaging functionality
│   └── dashboard.js           # Dashboard features
├── php/
│   ├── api.php                 # RESTful API endpoints
│   ├── config.php              # Database & configuration
│   └── websocket-emitter.php   # WebSocket event emitter
├── database/
│   └── database.sql            # Complete database schema
├── websocket-server/
│   ├── server.js               # Node.js WebSocket server
│   ├── package.json            # Node.js dependencies
│   └── README.md               # WebSocket documentation
├── uploads/
│   └── profile/                # Profile picture uploads
├── index.html                  # Landing page
├── auth.html                   # Login page
├── signup.html                 # Registration page
├── forgot-password.html        # Password reset request
├── reset-password.html         # Password reset form
├── home-gigs.html              # Public gig browsing
├── student-dashboard.html       # Student dashboard
├── student-profile.html         # Student profile
├── student-messaging.html      # Student messaging
├── student-gigs.html           # Student gig browsing
├── business-dashboard.html     # Business dashboard
├── business-profile.html       # Business profile
├── business-messaging.html     # Business messaging
├── business-post-gig.html      # Post new gig
├── business-posted-gigs.html   # Manage posted gigs
├── business-applicants.html    # Manage applicants
├── README.md                   # Main documentation
├── README-setup.md             # This file
├── README-frontend.md          # Frontend documentation
├── README-backend.md           # Backend documentation
├── ARCHITECTURE.md             # Architecture overview
└── PROJECT-STATUS.md           # Project status
```

## Features Overview

### For Students
- **Browse Gigs**: Search and filter available opportunities
- **Apply to Gigs**: Submit applications with cover letters
- **Track Applications**: Monitor application status
- **Messaging**: Chat with businesses
- **Profile Management**: Update skills, education, portfolio

### For Businesses
- **Post Gigs**: Create job postings with requirements
- **Manage Applications**: Review and respond to applicants
- **Hire Students**: Accept applications and manage projects
- **Analytics**: View performance metrics
- **Messaging**: Communicate with students

### For Visitors
- **Browse Public Gigs**: View available opportunities
- **Learn About Platform**: Information about FunaGig
- **Contact Support**: Get help and support

## User Roles

### Student Account
- Browse and apply to gigs
- Track application status
- Manage profile and skills
- Chat with businesses
- View earnings and ratings

### Business Account
- Post and manage gigs
- Review applications
- Hire and manage students
- View analytics and metrics
- Chat with students

## API Endpoints

### Authentication
- `POST /php/api.php/login` - User login
- `POST /php/api.php/signup` - User registration
- `POST /php/api.php/logout` - User logout

### Dashboard
- `GET /php/api.php/dashboard` - Get dashboard data

### Gigs
- `GET /php/api.php/gigs` - List all gigs
- `POST /php/api.php/gigs` - Create new gig
- `GET /php/api.php/gigs/active` - Get active gigs

### Applications
- `POST /php/api.php/applications` - Apply to gig

### Messaging
- `GET /php/api.php/conversations` - List conversations
- `POST /php/api.php/conversations` - Start conversation
- `GET /php/api.php/messages/{id}` - Get messages
- `POST /php/api.php/messages` - Send message
- `POST /php/api.php/typing` - Set typing indicator

### Notifications
- `GET /php/api.php/notifications` - Get notifications
- `PUT /php/api.php/notifications` - Mark as read

### File Uploads
- `POST /php/api.php/upload` - Upload files (profile, resume, portfolio, attachments)

### Reviews
- `POST /php/api.php/reviews` - Submit review
- `GET /php/api.php/reviews/{user_id}` - Get user reviews

### Password Reset
- `POST /php/api.php/auth/forgot-password` - Request password reset
- `POST /php/api.php/auth/reset-password` - Reset password

## Troubleshooting

### Common Issues

#### Database Connection Error
- Check if MySQL is running in XAMPP
- Verify database credentials in `php/config.php`
- Ensure database `funagig` exists

#### Page Not Loading
- Verify Apache is running
- Check file permissions
- Ensure files are in correct directory

#### API Errors
- Check browser console for JavaScript errors
- Verify PHP error logs
- Test API endpoints directly

### Debug Mode
Enable debug mode in `php/config.php`:
```php
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

## Development

### Adding New Features
1. Update database schema if needed
2. Add API endpoints in `php/api.php`
3. Update frontend JavaScript
4. Test thoroughly

### Styling Changes
1. Modify `css/styles.css`
2. Test responsive design
3. Ensure cross-browser compatibility

### JavaScript Development
1. Use modern ES6+ features
2. Follow modular approach
3. Add error handling
4. Test in multiple browsers

## Production Deployment

### Security Considerations
- Change default passwords
- Enable HTTPS
- Set up proper file permissions
- Configure firewall rules

### Performance Optimization
- Enable PHP opcache
- Use CDN for static assets
- Optimize database queries
- Implement caching

### Backup Strategy
- Regular database backups
- File system backups
- Version control
- Disaster recovery plan

## Support

### Getting Help
- Check documentation files
- Review error logs
- Test with sample data
- Contact development team

### Sample Data
The database includes sample users and gigs for testing. Check the `database.sql` file for sample data and default passwords.

### WebSocket Server
If you want real-time features (instant messaging, typing indicators, real-time notifications):
1. Make sure Node.js is installed
2. Navigate to `websocket-server` directory
3. Run `npm install`
4. Run `npm run dev` (development) or `node server.js` (production)
5. The application will automatically connect to the WebSocket server when available
6. If the WebSocket server is not running, the app will fall back to API polling

### Testing Checklist
- [ ] Database connection works
- [ ] All pages load correctly
- [ ] Authentication works
- [ ] API endpoints respond
- [ ] Messaging system works
- [ ] File uploads work
- [ ] Responsive design works
- [ ] Cross-browser compatibility

## Next Steps

1. **Customization**: Modify colors, logos, and branding
2. **Features**: Add new functionality as needed
3. **Integration**: Connect with payment systems
4. **Scaling**: Optimize for larger user base
5. **Security**: Implement additional security measures

