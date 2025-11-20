-- =====================================================
-- FunaGig Database Schema
-- Complete database structure with all enhancements
-- Compatible with MySQL/MariaDB for XAMPP deployment
-- =====================================================

-- Create database
CREATE DATABASE IF NOT EXISTS funagig;
USE funagig;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table (unified for students and businesses)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NOT NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255) NULL,
    type ENUM('student', 'business') NOT NULL,
    university VARCHAR(255) NULL,
    major VARCHAR(255) NULL,
    industry VARCHAR(255) NULL,
    profile_image VARCHAR(500) NULL,
    bio TEXT NULL,
    skills TEXT NULL,
    location VARCHAR(255) NULL,
    phone VARCHAR(20) NULL,
    website VARCHAR(255) NULL,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_ratings INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Gigs table (jobs/projects posted by businesses)
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
    view_count INT DEFAULT 0,
    application_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Applications table (student applications to gigs)
CREATE TABLE applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    gig_id INT NOT NULL,
    message TEXT NULL,
    resume_path VARCHAR(500) NULL,
    status ENUM('pending', 'accepted', 'rejected', 'completed') DEFAULT 'pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    rating INT NULL,
    review TEXT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (gig_id) REFERENCES gigs(id) ON DELETE CASCADE,
    UNIQUE KEY unique_application (user_id, gig_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Conversations table (messaging between users)
CREATE TABLE conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    last_message_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_conversation (user1_id, user2_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Messages table (individual messages in conversations)
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    content TEXT NOT NULL,
    original_content TEXT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Notifications table (system notifications)
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Saved gigs table (students can save gigs for later)
CREATE TABLE saved_gigs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    gig_id INT NOT NULL,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (gig_id) REFERENCES gigs(id) ON DELETE CASCADE,
    UNIQUE KEY unique_saved_gig (user_id, gig_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Skills table (for skill management)
CREATE TABLE skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User skills table (many-to-many relationship)
CREATE TABLE user_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    skill_id INT NOT NULL,
    proficiency ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'intermediate',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_skill (user_id, skill_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Reviews table (ratings and reviews)
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reviewer_id INT NOT NULL,
    reviewee_id INT NOT NULL,
    application_id INT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL,
    UNIQUE KEY unique_review (reviewer_id, reviewee_id, application_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Categories table (for gig categorization)
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NULL,
    parent_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Gig categories table (many-to-many relationship)
CREATE TABLE gig_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gig_id INT NOT NULL,
    category_id INT NOT NULL,
    FOREIGN KEY (gig_id) REFERENCES gigs(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_gig_category (gig_id, category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- ENHANCEMENT TABLES
-- =====================================================

-- File Upload Support
-- Message attachments table
CREATE TABLE message_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id INT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    INDEX idx_message_id (message_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User files table (portfolio, certificates, etc.)
CREATE TABLE user_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INT NOT NULL,
    file_category ENUM('portfolio', 'certificate', 'other') DEFAULT 'portfolio',
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Gig attachments table (for gig files)
CREATE TABLE gig_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gig_id INT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gig_id) REFERENCES gigs(id) ON DELETE CASCADE,
    INDEX idx_gig_id (gig_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Password Reset Functionality
CREATE TABLE password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Email Verification
CREATE TABLE email_verification_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Message Enhancements
-- Typing indicators table (for real-time messaging)
CREATE TABLE typing_indicators (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    user_id INT NOT NULL,
    is_typing BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_typing (conversation_id, user_id),
    INDEX idx_conversation_id (conversation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Two-Factor Authentication
CREATE TABLE two_factor_backup_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    code VARCHAR(10) NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_code (user_id, code),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Analytics & Monitoring (Optional)
CREATE TABLE analytics_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_data JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_event_type (event_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE page_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    page_path VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_page_path (page_path),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Interest Tracking (Optional)
CREATE TABLE interested_gigs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    gig_id INT NOT NULL,
    interested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (gig_id) REFERENCES gigs(id) ON DELETE CASCADE,
    UNIQUE KEY unique_interested (user_id, gig_id),
    INDEX idx_user_id (user_id),
    INDEX idx_gig_id (gig_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE gig_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gig_id INT NOT NULL,
    user_id INT NULL,
    ip_address VARCHAR(45) NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gig_id) REFERENCES gigs(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_gig_id (gig_id),
    INDEX idx_user_id (user_id),
    INDEX idx_viewed_at (viewed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Session Management (Optional)
CREATE TABLE sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id INT NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(type);
CREATE INDEX idx_gigs_user_id ON gigs(user_id);
CREATE INDEX idx_gigs_status ON gigs(status);
CREATE INDEX idx_gigs_created_at ON gigs(created_at);
CREATE INDEX idx_gigs_deadline ON gigs(deadline);
-- Composite index for common query pattern: active gigs sorted by date
CREATE INDEX idx_gigs_status_created_at ON gigs(status, created_at);
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_gig_id ON applications(gig_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_applied_at ON applications(applied_at);
-- Composite index for common query pattern: applications for a gig sorted by date
CREATE INDEX idx_applications_gig_status_applied ON applications(gig_id, status, applied_at);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
-- Composite index for common query pattern: messages in conversation sorted by time
CREATE INDEX idx_messages_conv_created ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_is_read ON messages(is_read);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
-- Composite index for common query pattern: user notifications filtered by read status and sorted by date
CREATE INDEX idx_notifications_user_read_created ON notifications(user_id, is_read, created_at);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at);
CREATE INDEX idx_saved_gigs_saved_at ON saved_gigs(saved_at);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);
CREATE INDEX idx_password_reset_created_at ON password_reset_tokens(created_at);

-- FULLTEXT index for message search (MySQL 5.6+ or MariaDB 10.0+)
-- Note: If FULLTEXT is not supported, comment out this line
-- This must be created after the table is created, so using ALTER TABLE
ALTER TABLE messages ADD FULLTEXT INDEX idx_content_fulltext (content);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

CREATE VIEW active_gigs AS
SELECT g.*, u.name as business_name, u.industry, u.location as business_location
FROM gigs g
JOIN users u ON g.user_id = u.id
WHERE g.status = 'active';

CREATE VIEW application_details AS
SELECT a.*, g.title as gig_title, g.budget, u1.name as student_name, u2.name as business_name
FROM applications a
JOIN gigs g ON a.gig_id = g.id
JOIN users u1 ON a.user_id = u1.id
JOIN users u2 ON g.user_id = u2.id;

CREATE VIEW conversation_summary AS
SELECT c.*, 
       u1.name as user1_name, 
       u2.name as user2_name,
       (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
       (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time
FROM conversations c
JOIN users u1 ON c.user1_id = u1.id
JOIN users u2 ON c.user2_id = u2.id;

-- =====================================================
-- SAMPLE DATA
-- =====================================================

INSERT INTO users (name, email, password, type, university, major, industry, bio, skills, location) VALUES
('Amanya Peter', 'john@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'Makerere University', 'Computer Science', NULL, 'Passionate developer with 3 years experience', 'JavaScript,Python,React', 'Kampala, Uganda'),
('Sarah Mwangi', 'sarah@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'business', NULL, NULL, 'Technology', 'Tech startup focused on digital solutions', 'Leadership,Management,Strategy', 'Nairobi, Kenya'),
('Alex Kiprotich', 'alex@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'University of Nairobi', 'Business Administration', NULL, 'Business student with marketing expertise', 'Marketing,Social Media,Content Writing', 'Nairobi, Kenya'),
('Tech Solutions Inc.', 'info@techsolutions.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'business', NULL, NULL, 'Technology', 'Leading technology consulting firm', 'Software Development,Consulting,IT Services', 'Kampala, Uganda');

INSERT INTO skills (name, category) VALUES
('JavaScript', 'Programming'),
('Python', 'Programming'),
('React', 'Frontend'),
('Node.js', 'Backend'),
('PHP', 'Programming'),
('MySQL', 'Database'),
('HTML/CSS', 'Frontend'),
('Marketing', 'Business'),
('Content Writing', 'Writing'),
('Graphic Design', 'Design'),
('Social Media Management', 'Marketing'),
('Data Analysis', 'Analytics');

INSERT INTO categories (name, description) VALUES
('Web Development', 'Website and web application development'),
('Mobile Development', 'Mobile app development for iOS and Android'),
('Design', 'Graphic design, UI/UX design'),
('Writing', 'Content writing, copywriting, technical writing'),
('Marketing', 'Digital marketing, social media marketing'),
('Data Analysis', 'Data analysis, business intelligence'),
('Consulting', 'Business consulting and advisory services');

INSERT INTO gigs (user_id, title, description, budget, deadline, skills, location, type) VALUES
(2, 'Website Development', 'Need a modern website for our startup. Must be responsive and SEO-friendly.', 500000.00, '2024-12-31', 'HTML/CSS,JavaScript,React', 'Remote', 'one-time'),
(4, 'Social Media Management', 'Manage our social media accounts and create engaging content.', 200000.00, '2024-12-15', 'Social Media Management,Content Writing', 'Remote', 'ongoing'),
(2, 'Mobile App Development', 'Develop a cross-platform mobile app for our business.', 1500000.00, '2025-01-31', 'React Native,JavaScript,Node.js', 'Remote', 'contract'),
(4, 'Data Analysis Project', 'Analyze customer data and provide insights for business growth.', 300000.00, '2024-12-20', 'Data Analysis,Python,Excel', 'On-site', 'one-time');

-- =====================================================
-- NOTES
-- =====================================================
-- 
-- 1. This is a complete database schema with all enhancements
-- 2. FULLTEXT index requires MySQL 5.6+ or MariaDB 10.0+
--    If not supported, comment out the FULLTEXT index line
-- 3. JSON data type requires MySQL 5.7+ or MariaDB 10.2+
--    For older versions, change JSON to TEXT and parse in application
-- 4. Create 'uploads' directory in project root with proper permissions:
--    mkdir uploads && chmod 755 uploads
--    Create subdirectories: 
--    - uploads/profiles (for profile pictures)
--    - uploads/resumes (for resume/CV files)
--    - uploads/messages (for message attachments)
--    - uploads/portfolio (for portfolio files)
--    - uploads/gigs (for gig attachments)
-- 5. Default password for all sample users: 'password'
-- 6. All timestamps are in UTC - adjust in application if needed
--
-- =====================================================
