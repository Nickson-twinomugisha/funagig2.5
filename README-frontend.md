# FunaGig Frontend Documentation

## Overview
The FunaGig frontend is built with vanilla HTML, CSS, and JavaScript, designed for easy deployment on XAMPP. It features a responsive, Fiverr-inspired design with role-based access for students and businesses.

## File Structure
```
funagig/
├── css/
│   └── styles.css              # Global styles (responsive, modern UI)
├── js/
│   ├── app.js                  # Core utilities (Auth, API, WebSocket, etc.)
│   ├── messaging.js            # Messaging functionality
│   └── dashboard.js            # Dashboard-specific features
├── index.html                  # Landing page
├── auth.html                   # Login (unified for student/business)
├── signup.html                 # Signup (unified with role selector)
├── forgot-password.html        # Password reset request
├── reset-password.html         # Password reset form
├── home-gigs.html              # Visitor gig browse
├── student-dashboard.html       # Student dashboard
├── student-profile.html         # Student profile management
├── student-messaging.html       # Student messaging interface
├── student-gigs.html            # Student gig browsing and applications
├── business-dashboard.html      # Business dashboard
├── business-profile.html        # Business profile management
├── business-messaging.html     # Business messaging interface
├── business-post-gig.html      # Post new gig form
├── business-posted-gigs.html   # Manage posted gigs
└── business-applicants.html     # Manage applicants
```

## Key Features

### Responsive Design
- Mobile-first approach
- Fiverr-inspired modern UI
- Consistent color scheme and typography
- Grid-based layouts with CSS Grid and Flexbox

### Role-Based Access
- **Students**: Browse gigs, apply, track applications, manage profile
- **Businesses**: Post gigs, manage applications, hire students, analytics
- **Visitors**: Browse public gigs, learn about platform

### Navigation
- Consistent header across all pages
- Role-specific sidebar navigation for authenticated users
- Breadcrumb navigation for complex workflows

## CSS Architecture

### Global Styles (`css/styles.css`)
- CSS Custom Properties for consistent theming
- Utility classes for spacing, colors, and layout
- Component-based styling (buttons, cards, forms)
- Responsive breakpoints

### Key CSS Classes
```css
/* Layout */
.container          # Main content wrapper
.app-layout        # Dashboard layout with sidebar
.section           # Content sections
.grid-2, .grid-3, .grid-4  # Grid layouts

/* Components */
.btn               # Primary buttons
.btn.secondary     # Secondary buttons
.btn.ghost         # Ghost buttons
.card              # Content cards
.form              # Form styling

/* Utilities */
.mt-20, .mb-10     # Spacing utilities
.flex, .items-center  # Flexbox utilities
.text-right        # Text alignment
```

## JavaScript Architecture

### Core Module (`js/app.js`)
- **API Integration**: Centralized API calls with error handling and retry logic
- **Authentication**: User session management with role-based access
- **WebSocket Client**: Real-time WebSocket connection management
- **Storage**: LocalStorage utilities
- **Validation**: Form validation helpers
- **UI Utilities**: Toast notifications, loading states, empty states, modals
- **CSRF Protection**: Client-side CSRF token management
- **Rate Limiting**: Client-side rate limit handling
- **File Upload**: File upload utility with progress tracking
- **URL State Management**: Sync UI state with URL parameters
- **Error Recovery**: User-friendly error handling with retry options
- **Pagination**: Client-side pagination utility
- **Sorting**: Client-side sorting utility
- **Debouncing**: Search input debouncing
- **Keyboard Shortcuts**: Global keyboard shortcuts (Ctrl+K for search, etc.)

### Messaging Module (`js/messaging.js`)
- Real-time messaging functionality (WebSocket + polling fallback)
- Conversation management
- Message search within conversations
- Typing indicators
- Message attachments
- Unread message indicators

### Dashboard Module (`js/dashboard.js`)
- Dynamic stats loading
- Notification system integration
- Quick actions
- Recent activity display

## Page-Specific Features

### Landing Page (`index.html`)
- Hero section with call-to-action
- Feature highlights
- About section
- How it works
- Contact form
- FAQ section

### Authentication (`auth.html`, `signup.html`)
- Unified login/signup forms
- Role selection
- Form validation
- Social login options (placeholder)

### Student Pages
- **Dashboard**: Stats, recent activity, quick actions, notifications
- **Profile**: Skills, education, portfolio upload, reviews display
- **Gigs**: Browse, filter, search, sort, apply to gigs, track applications
- **Messaging**: Chat with businesses, file attachments, message search

### Business Pages
- **Dashboard**: Analytics, active gigs, applicants, notifications
- **Profile**: Company info, industry, location, reviews display
- **Post Gig**: Create new gigs with full form validation
- **Posted Gigs**: Manage existing gigs (edit, delete, search, filter, sort)
- **Applicants**: Review and manage applicants (accept, reject, search, filter)
- **Messaging**: Chat with students, file attachments, message search

## API Integration

### Endpoints Used
```javascript
// Authentication
POST /php/api.php/login
POST /php/api.php/signup
POST /php/api.php/logout

// Dashboard
GET /php/api.php/dashboard

// Gigs
GET /php/api.php/gigs
POST /php/api.php/gigs
GET /php/api.php/gigs/active

// Applications
POST /php/api.php/applications

// Messaging
GET /php/api.php/conversations
POST /php/api.php/conversations
GET /php/api.php/messages/{id}
POST /php/api.php/messages
POST /php/api.php/typing

// Notifications
GET /php/api.php/notifications
PUT /php/api.php/notifications

// File Uploads
POST /php/api.php/upload

// Reviews
POST /php/api.php/reviews
GET /php/api.php/reviews/{user_id}

// Password Reset
POST /php/api.php/auth/forgot-password
POST /php/api.php/auth/reset-password
```

### Error Handling
- Global error handling in `app.js`
- User-friendly error messages
- Network error fallbacks
- Loading states

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ features with fallbacks
- CSS Grid and Flexbox support
- LocalStorage for session management

## Performance Optimizations
- Minified CSS and JS in production
- Lazy loading for images
- Efficient DOM manipulation
- Cached API responses

## Development Guidelines

### Adding New Pages
1. Create HTML file in root directory
2. Include `css/styles.css` and `js/app.js`
3. Add page-specific JS if needed
4. Update navigation links
5. Test responsive design

### Styling Guidelines
- Use CSS custom properties for colors
- Follow BEM methodology for complex components
- Mobile-first responsive design
- Consistent spacing using utility classes

### JavaScript Guidelines
- Use modern ES6+ features
- Modular approach with separate files
- Error handling for all API calls
- Consistent naming conventions

