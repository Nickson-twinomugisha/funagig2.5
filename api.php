<?php
// Main API router for FunaGig
// Handles all API endpoints for gigs, applicants, messages, etc.

require_once 'config.php';
require_once 'websocket-emitter.php';
require_once 'email.php';

// Session is started in config.php

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/funagig/php/api.php', '', $path);

// Route the request
switch ($path) {
    case '/login':
        handleLogin();
        break;
    case '/signup':
        handleSignup();
        break;
    case '/logout':
        handleLogout();
        break;
    case '/dashboard':
        handleDashboard();
        break;
    case '/profile':
        handleProfile();
        break;
    case '/gigs':
        handleGigs();
        break;
    case '/gigs/active':
        handleActiveGigs();
        break;
    case '/applications':
        handleApplications();
        break;
    case '/conversations':
        handleConversations();
        break;
    case '/messages':
        handleMessages();
        break;
    // For the missing business pages
    case '/gigs/update':
        handleUpdateGig();
        break;
    case '/gigs/delete':
        handleDeleteGig();
        break;
    case '/applicants':
        handleGetApplicants();
        break;
    case '/applicants/accept':
        handleAcceptApplicant();
        break;
    case '/applicants/reject':
        handleRejectApplicant();
        break;
    case '/saved-gigs':
        handleSavedGigs();
        break;
    case '/notifications':
        handleNotifications();
        break;
    case '/reviews':
        handleReviews();
        break;
    case '/upload':
        handleUpload();
        break;
    case '/portfolio':
        handlePortfolio();
        break;
    case '/auth/forgot-password':
        handleForgotPassword();
        break;
    case '/auth/reset-password':
        handleResetPassword();
        break;
    case '/csrf-token':
        handleCSRFToken();
        break;
    case '/typing':
        handleTyping();
        break;
    default:
        if (strpos($path, '/messages/') === 0) {
            $conversationId = substr($path, 10);
            // Validate conversationId is numeric
            if (!is_numeric($conversationId) || $conversationId <= 0) {
                sendError('Invalid conversation ID', 400);
                return;
            }
            handleMessagesByConversation((int)$conversationId);
        } elseif (strpos($path, '/reviews/') === 0) {
            $userId = substr($path, 9);
            // Validate userId is numeric
            if (!is_numeric($userId) || $userId <= 0) {
                sendError('Invalid user ID', 400);
                return;
            }
            handleReviewsByUser((int)$userId);
        } else {
            sendError('Endpoint not found', 404);
        }
        break;
}

// Authentication handlers
function handleLogin() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendError('Method not allowed', 405);
    }
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Rate limiting with enhanced configuration
        $rateLimit = getRateLimitInfo('login');
        if (!$rateLimit['allowed']) {
            $retryAfter = $rateLimit['retryAfter'];
            $minutes = ceil($retryAfter / 60);
            sendError("Too many login attempts. Please try again in {$minutes} minute(s).", 429);
        }
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            sendError('Invalid JSON data');
        }
        
        $email = sanitizeInput($input['email'] ?? '');
        $password = $input['password'] ?? '';
        
        if (empty($email) || empty($password)) {
            sendError('Email and password are required');
        }
        
        if (!validateEmail($email)) {
            sendError('Invalid email format');
        }
        
        $db = Database::getInstance();
        $user = $db->fetchOne(
            "SELECT id, name, email, password, type, university, major, industry FROM users WHERE email = ?",
            [$email]
        );
        
        if (!$user || !verifyPassword($password, $user['password'])) {
            sendError('Invalid credentials');
        }
        
        // Set session
        $_SESSION['user_id'] = $user['id'];
        unset($user['password']);
        
        // Generate a new CSRF token for the new session
        generateCSRFToken();
        
        sendResponse([
            'success' => true,
            'user' => $user,
            'userType' => $user['type'],
            'csrf_token' => $_SESSION['csrf_token'] // Include token in response for immediate use
        ]);
        
    } catch (Exception $e) {
        error_log("Login error: " . $e->getMessage());
        sendError('An error occurred during login. Please try again.');
    }
}

function handleSignup() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendError('Method not allowed', 405);
    }
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Rate limiting with enhanced configuration
        $rateLimit = getRateLimitInfo('signup');
        if (!$rateLimit['allowed']) {
            $retryAfter = $rateLimit['retryAfter'];
            $minutes = ceil($retryAfter / 60);
            sendError("Too many signup attempts. Please try again in {$minutes} minute(s).", 429);
        }
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            sendError('Invalid JSON data');
        }
        
        $role = sanitizeInput($input['role'] ?? '');
        $name = sanitizeInput($input['name'] ?? '');
        $email = sanitizeInput($input['email'] ?? '');
        $password = $input['password'] ?? '';
        $confirmPassword = $input['confirmPassword'] ?? '';
        
        // Validation
        if (empty($role) || empty($name) || empty($email) || empty($password)) {
            sendError('All fields are required');
        }
        
        if (!in_array($role, ['student', 'business'])) {
            sendError('Invalid role');
        }
        
        if (!validateEmail($email)) {
            sendError('Invalid email format');
        }
        
        if ($password !== $confirmPassword) {
            sendError('Passwords do not match');
        }
        
        if (strlen($password) < 6) {
            sendError('Password must be at least 6 characters');
        }
        
        // Additional validation for role-specific fields
        if ($role === 'student') {
            if (empty($input['university']) || empty($input['major'])) {
                sendError('University and major are required for students');
            }
        } else if ($role === 'business') {
            if (empty($input['industry'])) {
                sendError('Industry is required for businesses');
            }
        }
        
        // Check if email already exists
        $db = Database::getInstance();
        $existingUser = $db->fetchOne("SELECT id FROM users WHERE email = ?", [$email]);
        
        if ($existingUser) {
            sendError('Email already registered');
        }
        
        // Create user
        $hashedPassword = hashPassword($password);
        $userId = $db->insert(
            "INSERT INTO users (name, email, password, type, university, major, industry, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
            [
                $name,
                $email,
                $hashedPassword,
                $role,
                $input['university'] ?? null,
                $input['major'] ?? null,
                $input['industry'] ?? null
            ]
        );
        
        if (!$userId) {
            sendError('Failed to create account');
        }
        
        // Set session for new user
        $_SESSION['user_id'] = $userId;
        
        // Generate a new CSRF token for the new session
        generateCSRFToken();
        
        sendResponse([
            'success' => true,
            'message' => 'Account created successfully',
            'csrf_token' => $_SESSION['csrf_token'] // Include token in response
        ]);
        
    } catch (Exception $e) {
        error_log("Signup error: " . $e->getMessage());
        sendError('An error occurred during signup. Please try again.');
    }
}

function handleLogout() {
    session_destroy();
    sendResponse(['success' => true]);
}

// Dashboard handler
function handleDashboard() {
    requireAuth();
    
    $user = getCurrentUser();
    $db = Database::getInstance();
    
    if ($user['type'] === 'student') {
        $stats = getStudentStats($db, $user['id']);
    } else {
        $stats = getBusinessStats($db, $user['id']);
    }
    
    sendResponse([
        'success' => true,
        'stats' => $stats
    ]);
}

function getStudentStats($db, $userId) {
    $stats = [];
    
    // Active applications
    $stats['active_tasks'] = $db->fetchOne(
        "SELECT COUNT(*) as count FROM applications WHERE user_id = ? AND status = 'accepted'",
        [$userId]
    )['count'];
    
    // Pending applications
    $stats['pending_tasks'] = $db->fetchOne(
        "SELECT COUNT(*) as count FROM applications WHERE user_id = ? AND status = 'pending'",
        [$userId]
    )['count'];
    
    // Completed tasks
    $stats['completed_tasks'] = $db->fetchOne(
        "SELECT COUNT(*) as count FROM applications WHERE user_id = ? AND status = 'completed'",
        [$userId]
    )['count'];
    
    // Total earned
    $stats['total_earned'] = $db->fetchOne(
        "SELECT COALESCE(SUM(g.budget), 0) as total FROM applications a 
         JOIN gigs g ON a.gig_id = g.id 
         WHERE a.user_id = ? AND a.status = 'completed'",
        [$userId]
    )['total'];
    
    return $stats;
}

function getBusinessStats($db, $userId) {
    $stats = [];
    
    // Active gigs
    $stats['active_gigs'] = $db->fetchOne(
        "SELECT COUNT(*) as count FROM gigs WHERE user_id = ? AND status = 'active'",
        [$userId]
    )['count'];
    
    // Total applicants
    $stats['total_applicants'] = $db->fetchOne(
        "SELECT COUNT(*) as count FROM applications a 
         JOIN gigs g ON a.gig_id = g.id 
         WHERE g.user_id = ?",
        [$userId]
    )['count'];
    
    // Hired students
    $stats['hired_students'] = $db->fetchOne(
        "SELECT COUNT(*) as count FROM applications a 
         JOIN gigs g ON a.gig_id = g.id 
         WHERE g.user_id = ? AND a.status = 'accepted'",
        [$userId]
    )['count'];
    
    return $stats;
}

// Profile handler
function handleProfile() {
    requireAuth();
    requireCSRF(); // Require CSRF for POST/PUT requests
    
    // Rate limiting for profile updates (POST only)
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $rateLimit = getRateLimitInfo('profile');
        if (!$rateLimit['allowed']) {
            $retryAfter = $rateLimit['retryAfter'];
            $minutes = ceil($retryAfter / 60);
            sendError("Too many profile updates. Please try again in {$minutes} minute(s).", 429);
        }
    }
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $user = getCurrentUser();
        sendResponse(['success' => true, 'user' => $user]);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $userId = $_SESSION['user_id'];
        
        $db = Database::getInstance();
        
        // Build update query dynamically based on provided fields
        $updateFields = [];
        $updateValues = [];
        
        if (isset($input['name'])) {
            $updateFields[] = 'name = ?';
            $updateValues[] = sanitizeInput($input['name']);
        }
        
        if (isset($input['university'])) {
            $updateFields[] = 'university = ?';
            $updateValues[] = sanitizeInput($input['university']);
        }
        
        if (isset($input['major'])) {
            $updateFields[] = 'major = ?';
            $updateValues[] = sanitizeInput($input['major']);
        }
        
        if (isset($input['industry'])) {
            $updateFields[] = 'industry = ?';
            $updateValues[] = sanitizeInput($input['industry']);
        }
        
        if (isset($input['location'])) {
            $updateFields[] = 'location = ?';
            $updateValues[] = sanitizeInput($input['location']);
        }
        
        if (isset($input['phone'])) {
            $phone = sanitizeInput($input['phone']);
            // Validate phone number format (allows + prefix and 10-15 digits)
            if (!empty($phone) && !preg_match('/^\+?[0-9]{10,15}$/', $phone)) {
                sendError('Invalid phone number format');
                return;
            }
            $updateFields[] = 'phone = ?';
            $updateValues[] = $phone;
        }
        
        if (isset($input['website'])) {
            $website = sanitizeInput($input['website']);
            // Validate website URL format
            if (!empty($website) && !filter_var($website, FILTER_VALIDATE_URL)) {
                sendError('Invalid website URL');
                return;
            }
            $updateFields[] = 'website = ?';
            $updateValues[] = $website;
        }
        
        if (isset($input['bio'])) {
            $updateFields[] = 'bio = ?';
            $updateValues[] = sanitizeInput($input['bio']);
        }
        
        if (isset($input['skills'])) {
            $updateFields[] = 'skills = ?';
            $updateValues[] = sanitizeInput($input['skills']);
        }
        
        if (empty($updateFields)) {
            sendError('No fields to update');
            return;
        }
        
        $updateValues[] = $userId;
        
        $sql = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?";
        $db->update($sql, $updateValues);
        
        sendResponse(['success' => true, 'message' => 'Profile updated']);
    }
}

// Gigs handlers
function handleGigs() {
    requireAuth();
    requireCSRF(); // Require CSRF for POST/PUT/DELETE requests
    
    // Rate limiting for gig operations (POST only)
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $rateLimit = getRateLimitInfo('gigs');
        if (!$rateLimit['allowed']) {
            $retryAfter = $rateLimit['retryAfter'];
            $minutes = ceil($retryAfter / 60);
            sendError("Too many gig operations. Please try again in {$minutes} minute(s).", 429);
        }
    }
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $db = Database::getInstance();
        $gigs = $db->fetchAll(
            "SELECT g.*, u.name as business_name FROM gigs g 
             JOIN users u ON g.user_id = u.id 
             WHERE g.status = 'active' 
             ORDER BY g.created_at DESC"
        );
        
        sendResponse(['success' => true, 'gigs' => $gigs]);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                sendError('Invalid JSON data');
            }
            
            $userId = $_SESSION['user_id'];
            
            // Validate required fields
            $requiredFields = ['title', 'description', 'budget', 'deadline'];
            foreach ($requiredFields as $field) {
                if (empty($input[$field])) {
                    sendError("Field '$field' is required");
                }
            }
            
            // Validate budget is numeric and positive
            if (!is_numeric($input['budget']) || $input['budget'] <= 0) {
                sendError('Budget must be a positive number');
            }
            
            // Validate deadline is in the future
            if (strtotime($input['deadline']) <= time()) {
                sendError('Deadline must be in the future');
            }
            
            $db = Database::getInstance();
            $gigId = $db->insert(
                "INSERT INTO gigs (user_id, title, description, budget, deadline, skills, location, type, status, created_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())",
                [
                    $userId,
                    sanitizeInput($input['title'] ?? ''),
                    sanitizeInput($input['description'] ?? ''),
                    $input['budget'] ?? 0,
                    $input['deadline'] ?? '',
                    sanitizeInput($input['skills'] ?? ''),
                    sanitizeInput($input['location'] ?? ''),
                    sanitizeInput($input['type'] ?? '')
                ]
            );
            
            if (!$gigId) {
                sendError('Failed to create gig');
            }
            
            sendResponse(['success' => true, 'gig_id' => $gigId]);
            
        } catch (Exception $e) {
            error_log("Gig creation error: " . $e->getMessage());
            sendError('An error occurred while creating the gig. Please try again.');
        }
    }
}

function handleActiveGigs() {
    requireAuth();
    
    $user = getCurrentUser();
    $db = Database::getInstance();
    
    if ($user['type'] === 'business') {
        $gigs = $db->fetchAll(
            "SELECT g.*, 
             (SELECT COUNT(*) FROM applications WHERE gig_id = g.id) as applicant_count,
             (SELECT COUNT(*) FROM applications WHERE gig_id = g.id AND status = 'accepted') as hired_count
             FROM gigs g 
             WHERE g.user_id = ? AND g.status = 'active' 
             ORDER BY g.created_at DESC",
            [$user['id']]
        );
    } else {
        $gigs = $db->fetchAll(
            "SELECT g.*, u.name as business_name FROM gigs g 
             JOIN users u ON g.user_id = u.id 
             WHERE g.status = 'active' 
             ORDER BY g.created_at DESC"
        );
    }
    
    sendResponse(['success' => true, 'gigs' => $gigs]);
}

// Applications handler
function handleApplications() {
    requireAuth();
    requireCSRF(); // Require CSRF for POST requests
    
    // Rate limiting for application submissions (POST only)
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $rateLimit = getRateLimitInfo('applications');
        if (!$rateLimit['allowed']) {
            $retryAfter = $rateLimit['retryAfter'];
            $minutes = ceil($retryAfter / 60);
            sendError("Too many application submissions. Please try again in {$minutes} minute(s).", 429);
        }
    }
    
    $userId = $_SESSION['user_id'];
    $user = getCurrentUser();
    $db = Database::getInstance();
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get status filter from query string
        $status = $_GET['status'] ?? null;
        
        if ($user['type'] === 'student') {
            // Student viewing their own applications
            $sql = "SELECT a.*, g.title as gig_title, g.budget, u.name as business_name 
                    FROM applications a 
                    JOIN gigs g ON a.gig_id = g.id 
                    JOIN users u ON g.user_id = u.id 
                    WHERE a.user_id = ?";
            $params = [$userId];
            
            if ($status) {
                $sql .= " AND a.status = ?";
                $params[] = $status;
            }
            
            $sql .= " ORDER BY a.applied_at DESC";
            
            $applications = $db->fetchAll($sql, $params);
            
            // Add full URL to resume_path if it exists
            foreach ($applications as &$app) {
                if (!empty($app['resume_path'])) {
                    // If it's not already a full URL, make it one
                    if (!preg_match('/^https?:\/\//', $app['resume_path'])) {
                        $app['resume_url'] = APP_URL . '/' . $app['resume_path'];
                    } else {
                        $app['resume_url'] = $app['resume_path'];
                    }
                }
            }
            unset($app); // Break reference
            
            sendResponse(['success' => true, 'applications' => $applications]);
        } else {
            // Business viewing applications for their gigs
            $gigId = $_GET['gig_id'] ?? null;
            
            $sql = "SELECT a.*, g.title as gig_title, u.name as student_name, 
                    u.university, u.major, u.skills
                    FROM applications a
                    JOIN gigs g ON a.gig_id = g.id
                    JOIN users u ON a.user_id = u.id
                    WHERE g.user_id = ?";
            $params = [$userId];
            
            if ($gigId) {
                $sql .= " AND g.id = ?";
                $params[] = $gigId;
            }
            
            if ($status) {
                $sql .= " AND a.status = ?";
                $params[] = $status;
            }
            
            $sql .= " ORDER BY a.applied_at DESC";
            
            $applications = $db->fetchAll($sql, $params);
            sendResponse(['success' => true, 'applications' => $applications]);
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Check if already applied
        $existing = $db->fetchOne(
            "SELECT id FROM applications WHERE user_id = ? AND gig_id = ?",
            [$userId, $input['gig_id']]
        );
        
        if ($existing) {
            sendError('Already applied to this gig');
        }
        
        // Handle resume_path if provided
        $resumePath = sanitizeInput($input['resume_path'] ?? null);
        
        $applicationId = $db->insert(
            "INSERT INTO applications (user_id, gig_id, message, resume_path, status, applied_at) 
             VALUES (?, ?, ?, ?, 'pending', NOW())",
            [
                $userId,
                $input['gig_id'],
                sanitizeInput($input['message'] ?? ''),
                $resumePath
            ]
        );
        
        // Get gig owner to notify
        $gig = $db->fetchOne("SELECT user_id, title FROM gigs WHERE id = ?", [$input['gig_id']]);
        if ($gig) {
            $student = getCurrentUser();
            createNotification(
                $gig['user_id'],
                'New Application',
                $student['name'] . ' applied to your gig: ' . $gig['title'],
                'info'
            );
        }
        
        sendResponse(['success' => true, 'application_id' => $applicationId]);
    } else {
        sendError('Method not allowed', 405);
    }
}

// Messaging handlers
function handleConversations() {
    requireAuth();
    requireCSRF(); // Require CSRF for POST requests
    
    $userId = $_SESSION['user_id'];
    $db = Database::getInstance();
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $conversations = $db->fetchAll(
            "SELECT c.*, 
             CASE 
                 WHEN c.user1_id = ? THEN u2.id 
                 ELSE u1.id 
             END as other_user_id,
             CASE 
                 WHEN c.user1_id = ? THEN u2.name 
                 ELSE u1.name 
             END as other_user_name,
             CASE 
                 WHEN c.user1_id = ? THEN u2.email 
                 ELSE u1.email 
             END as other_user_email,
             CASE 
                 WHEN c.user1_id = ? THEN u2.university 
                 ELSE u1.university 
             END as other_user_university,
             CASE 
                 WHEN c.user1_id = ? THEN u2.major 
                 ELSE u1.major 
             END as other_user_major,
             (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
             (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
             (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = FALSE) as unread_count
             FROM conversations c
             JOIN users u1 ON c.user1_id = u1.id
             JOIN users u2 ON c.user2_id = u2.id
             WHERE c.user1_id = ? OR c.user2_id = ?
             ORDER BY COALESCE(last_message_time, c.created_at) DESC, c.created_at DESC",
            [$userId, $userId, $userId, $userId, $userId, $userId, $userId, $userId]
        );
        
        sendResponse(['success' => true, 'conversations' => $conversations]);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $conversationId = $db->insert(
            "INSERT INTO conversations (user1_id, user2_id, created_at) VALUES (?, ?, NOW())",
            [$userId, $input['user_id']]
        );
        
        sendResponse(['success' => true, 'conversation_id' => $conversationId]);
    }
}

function handleMessages() {
    requireAuth();
    requireCSRF(); // Require CSRF for POST requests
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Rate limiting for messages
        $rateLimit = getRateLimitInfo('messages');
        if (!$rateLimit['allowed']) {
            $retryAfter = $rateLimit['retryAfter'];
            sendError("Too many messages sent. Please wait {$retryAfter} second(s) before sending another message.", 429);
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        $userId = $_SESSION['user_id'];
        
        $db = Database::getInstance();
        
        // Get conversation to find recipient
        $conversation = $db->fetchOne(
            "SELECT user1_id, user2_id FROM conversations WHERE id = ?",
            [$input['conversation_id']]
        );
        
        $messageId = $db->insert(
            "INSERT INTO messages (conversation_id, sender_id, content, created_at) VALUES (?, ?, ?, NOW())",
            [
                $input['conversation_id'],
                $userId,
                sanitizeInput($input['message'])
            ]
        );
        
        // Notify recipient
        if ($conversation && $messageId) {
            $recipientId = $conversation['user1_id'] == $userId ? $conversation['user2_id'] : $conversation['user1_id'];
            $sender = getCurrentUser();
            createNotification(
                $recipientId,
                'New Message',
                $sender['name'] . ' sent you a message',
                'info'
            );
            
            // Emit WebSocket event for real-time message update
            WebSocketEmitter::emitNewMessage(
                $input['conversation_id'],
                $messageId,
                $userId,
                sanitizeInput($input['message'])
            );
        }
        
        sendResponse(['success' => true, 'message_id' => $messageId]);
    }
}

function handleMessagesByConversation($conversationId) {
    requireAuth();
    // Note: GET requests don't require CSRF, but this function also does a state change (mark as read)
    // We'll allow this without CSRF since it's a side effect of viewing messages
    // For security, you could require CSRF for the mark-as-read operation, but that would complicate the UX
    
    $userId = $_SESSION['user_id'];
    $db = Database::getInstance();
    
    // Mark messages as read when loading conversation
    // This is a state change but happens on GET, so we allow it without CSRF
    // In production, you might want to make this a separate POST endpoint
    $affected = $db->update(
        "UPDATE messages SET is_read = TRUE 
         WHERE conversation_id = ? AND sender_id != ? AND is_read = FALSE",
        [$conversationId, $userId]
    );
    
    // Emit WebSocket event for messages read
    if ($affected > 0) {
        WebSocketEmitter::emit('messages_read', [
            'conversationId' => $conversationId,
            'readerId' => $userId
        ]);
    }
    
    $messages = $db->fetchAll(
        "SELECT m.*, u.name as sender_name FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE m.conversation_id = ?
         ORDER BY m.created_at ASC",
        [$conversationId]
    );
    
    // Fetch attachments for each message
    foreach ($messages as &$message) {
        $attachments = $db->fetchAll(
            "SELECT id, file_path, file_name, file_type, file_size, created_at
             FROM message_attachments
             WHERE message_id = ?
             ORDER BY created_at ASC",
            [$message['id']]
        );
        
        // Add full URL to each attachment
        foreach ($attachments as &$attachment) {
            $attachment['file_url'] = APP_URL . '/' . $attachment['file_path'];
        }
        
        $message['attachments'] = $attachments;
    }
    unset($message); // Break reference
    
    sendResponse(['success' => true, 'messages' => $messages]);
}
//Extra stuff am not so sure about
function handleUpdateGig() {
    requireAuth();
    requireCSRF(); // Require CSRF for PUT requests
    
    // Rate limiting for gig updates
    $rateLimit = getRateLimitInfo('gigs');
    if (!$rateLimit['allowed']) {
        $retryAfter = $rateLimit['retryAfter'];
        $minutes = ceil($retryAfter / 60);
        sendError("Too many gig operations. Please try again in {$minutes} minute(s).", 429);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $gigId = $input['gig_id'];
    $userId = $_SESSION['user_id'];
    
    // Validate required fields
    if (empty($input['title']) || empty($input['description']) || empty($input['budget']) || empty($input['deadline'])) {
        sendError('All required fields must be filled');
        return;
    }
    
    // Validate status enum
    $validStatuses = ['active', 'paused', 'completed', 'cancelled'];
    if (isset($input['status']) && !in_array($input['status'], $validStatuses)) {
        sendError('Invalid status value');
        return;
    }
    
    // Validate type enum
    $validTypes = ['one-time', 'ongoing', 'contract'];
    if (isset($input['type']) && !in_array($input['type'], $validTypes)) {
        sendError('Invalid gig type');
        return;
    }
    
    // Validate budget
    if (isset($input['budget']) && (!is_numeric($input['budget']) || $input['budget'] < 0)) {
        sendError('Budget must be a positive number');
        return;
    }
    
    // Validate text lengths
    if (isset($input['title']) && strlen($input['title']) > 255) {
        sendError('Title must be 255 characters or less');
        return;
    }
    
    $db = Database::getInstance();
    
    // Verify gig ownership before updating
    $gig = $db->fetchOne("SELECT user_id FROM gigs WHERE id = ?", [$gigId]);
    if (!$gig) {
        sendError('Gig not found', 404);
        return;
    }
    if ($gig['user_id'] != $userId) {
        sendError('Gig not found or access denied', 403);
        return;
    }
    
    $affected = $db->update(
        "UPDATE gigs SET title=?, description=?, budget=?, deadline=?, status=?, type=?, skills=?, location=? 
         WHERE id=? AND user_id=?",
        [
            sanitizeInput($input['title']),
            sanitizeInput($input['description']),
            $input['budget'],
            $input['deadline'],
            $input['status'] ?? 'active',
            sanitizeInput($input['type'] ?? 'one-time'),
            sanitizeInput($input['skills'] ?? ''),
            sanitizeInput($input['location'] ?? 'Remote'),
            $gigId,
            $userId
        ]
    );
    
    sendResponse(['success' => $affected > 0]);
}

function handleDeleteGig() {
    requireAuth();
    requireCSRF(); // Require CSRF for DELETE requests
    
    // Rate limiting for gig deletions
    $rateLimit = getRateLimitInfo('gigs');
    if (!$rateLimit['allowed']) {
        $retryAfter = $rateLimit['retryAfter'];
        $minutes = ceil($retryAfter / 60);
        sendError("Too many gig operations. Please try again in {$minutes} minute(s).", 429);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $gigId = $input['gig_id'];
    $userId = $_SESSION['user_id'];
    
    $db = Database::getInstance();
    
    // Verify gig ownership before deleting
    $gig = $db->fetchOne("SELECT user_id FROM gigs WHERE id = ?", [$gigId]);
    if (!$gig) {
        sendError('Gig not found', 404);
        return;
    }
    if ($gig['user_id'] != $userId) {
        sendError('Gig not found or access denied', 403);
        return;
    }
    
    $affected = $db->delete(
        "DELETE FROM gigs WHERE id=? AND user_id=?",
        [$gigId, $userId]
    );
    
    sendResponse(['success' => $affected > 0]);
}

function handleGetApplicants() {
    requireAuth();
    $userId = $_SESSION['user_id'];
    $gigId = $_GET['gig_id'] ?? null;
    
    $db = Database::getInstance();
    
    // Verify gig ownership when gigId is provided
    if ($gigId) {
        // Validate gigId is numeric
        if (!is_numeric($gigId) || $gigId <= 0) {
            sendError('Invalid gig ID', 400);
            return;
        }
        
        $gig = $db->fetchOne("SELECT user_id FROM gigs WHERE id = ?", [$gigId]);
        if (!$gig) {
            sendError('Gig not found', 404);
            return;
        }
        if ($gig['user_id'] != $userId) {
            sendError('Gig not found or access denied', 403);
            return;
        }
    }
    
    $sql = "SELECT a.*, g.title as gig_title, u.name as student_name, 
            u.university, u.major, u.skills
            FROM applications a
            JOIN gigs g ON a.gig_id = g.id
            JOIN users u ON a.user_id = u.id
            WHERE g.user_id = ?";
    
    $params = [$userId];
    if ($gigId) {
        $sql .= " AND g.id = ?";
        $params[] = $gigId;
    }
    
    $applicants = $db->fetchAll($sql, $params);
    sendResponse(['success' => true, 'applicants' => $applicants]);
}

function handleAcceptApplicant() {
    requireAuth();
    requireCSRF(); // Require CSRF for POST requests
    
    // Rate limiting for applicant actions
    $rateLimit = getRateLimitInfo('applications');
    if (!$rateLimit['allowed']) {
        $retryAfter = $rateLimit['retryAfter'];
        $minutes = ceil($retryAfter / 60);
        sendError("Too many application operations. Please try again in {$minutes} minute(s).", 429);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $applicationId = $input['application_id'];
    
    $db = Database::getInstance();
    
    // Get application details before updating
    $application = $db->fetchOne(
        "SELECT a.user_id, a.gig_id, g.title as gig_title FROM applications a 
         JOIN gigs g ON a.gig_id = g.id 
         WHERE a.id = ?",
        [$applicationId]
    );
    
    $affected = $db->update(
        "UPDATE applications SET status='accepted', responded_at=NOW() 
         WHERE id=?",
        [$applicationId]
    );
    
    // Notify student
    if ($affected > 0 && $application) {
        createNotification(
            $application['user_id'],
            'Application Accepted! 🎉',
            'Your application for "' . $application['gig_title'] . '" has been accepted!',
            'success'
        );
    }
    
    sendResponse(['success' => $affected > 0]);
}

function handleRejectApplicant() {
    requireAuth();
    requireCSRF(); // Require CSRF for POST requests
    
    // Rate limiting for applicant actions
    $rateLimit = getRateLimitInfo('applications');
    if (!$rateLimit['allowed']) {
        $retryAfter = $rateLimit['retryAfter'];
        $minutes = ceil($retryAfter / 60);
        sendError("Too many application operations. Please try again in {$minutes} minute(s).", 429);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $applicationId = $input['application_id'];
    
    $db = Database::getInstance();
    
    // Get application details before updating
    $application = $db->fetchOne(
        "SELECT a.user_id, a.gig_id, g.title as gig_title FROM applications a 
         JOIN gigs g ON a.gig_id = g.id 
         WHERE a.id = ?",
        [$applicationId]
    );
    
    $affected = $db->update(
        "UPDATE applications SET status='rejected', responded_at=NOW() 
         WHERE id=?",
        [$applicationId]
    );
    
    // Notify student
    if ($affected > 0 && $application) {
        createNotification(
            $application['user_id'],
            'Application Update',
            'Your application for "' . $application['gig_title'] . '" was not selected at this time.',
            'info'
        );
    }
    
    sendResponse(['success' => $affected > 0]);
}

// Saved gigs handler
function handleSavedGigs() {
    requireAuth();
    requireCSRF(); // Require CSRF for POST/DELETE requests
    
    $userId = $_SESSION['user_id'];
    $db = Database::getInstance();
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get saved gigs for the user
        $savedGigs = $db->fetchAll(
            "SELECT g.*, sg.saved_at, u.name as business_name
             FROM saved_gigs sg
             JOIN gigs g ON sg.gig_id = g.id
             JOIN users u ON g.user_id = u.id
             WHERE sg.user_id = ? AND g.status = 'active'
             ORDER BY sg.saved_at DESC",
            [$userId]
        );
        
        sendResponse(['success' => true, 'saved_gigs' => $savedGigs]);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Save a gig
        $input = json_decode(file_get_contents('php://input'), true);
        $gigId = $input['gig_id'] ?? null;
        
        if (!$gigId) {
            sendError('Gig ID is required');
            return;
        }
        
        // Check if already saved
        $existing = $db->fetchOne(
            "SELECT id FROM saved_gigs WHERE user_id = ? AND gig_id = ?",
            [$userId, $gigId]
        );
        
        if ($existing) {
            sendError('Gig is already saved');
            return;
        }
        
        $savedId = $db->insert(
            "INSERT INTO saved_gigs (user_id, gig_id, saved_at) VALUES (?, ?, NOW())",
            [$userId, $gigId]
        );
        
        sendResponse(['success' => true, 'saved_id' => $savedId]);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        // Unsave a gig - can use query parameter or request body
        $gigId = $_GET['gig_id'] ?? null;
        
        if (!$gigId) {
            // Try to get from request body
            $input = json_decode(file_get_contents('php://input'), true);
            $gigId = $input['gig_id'] ?? null;
        }
        
        if (!$gigId) {
            sendError('Gig ID is required');
            return;
        }
        
        $affected = $db->delete(
            "DELETE FROM saved_gigs WHERE user_id = ? AND gig_id = ?",
            [$userId, $gigId]
        );
        
        sendResponse(['success' => $affected > 0]);
    } else {
        sendError('Method not allowed', 405);
    }
}

// Notifications handler
function handleNotifications() {
    requireAuth();
    requireCSRF(); // Require CSRF for PUT requests
    
    $userId = $_SESSION['user_id'];
    $db = Database::getInstance();
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get all notifications for user
        $isRead = $_GET['is_read'] ?? null;
        
        $sql = "SELECT * FROM notifications WHERE user_id = ?";
        $params = [$userId];
        
        if ($isRead !== null) {
            $sql .= " AND is_read = ?";
            $params[] = $isRead === 'true' ? 1 : 0;
        }
        
        $sql .= " ORDER BY created_at DESC LIMIT 50";
        
        $notifications = $db->fetchAll($sql, $params);
        
        // Get unread count
        $unreadCount = $db->fetchOne(
            "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE",
            [$userId]
        )['count'];
        
        sendResponse([
            'success' => true,
            'notifications' => $notifications,
            'unread_count' => $unreadCount
        ]);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        // Mark notification(s) as read
        $input = json_decode(file_get_contents('php://input'), true);
        $notificationId = $input['notification_id'] ?? null;
        $markAll = $input['mark_all'] ?? false;
        
        if ($markAll) {
            // Mark all as read
            $affected = $db->update(
                "UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE",
                [$userId]
            );
        } elseif ($notificationId) {
            // Mark specific notification as read
            $affected = $db->update(
                "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?",
                [$notificationId, $userId]
            );
        } else {
            sendError('Notification ID or mark_all is required');
            return;
        }
        
        // Emit WebSocket event for notifications read
        if ($affected > 0) {
            WebSocketEmitter::emit('notifications_read', [
                'userId' => $userId,
                'notificationId' => $notificationId,
                'markAll' => $markAll
            ]);
        }
        
        sendResponse(['success' => $affected > 0]);
    } else {
        sendError('Method not allowed', 405);
    }
}

// Helper function to create a notification
function createNotification($userId, $title, $message, $type = 'info') {
    $db = Database::getInstance();
    $notificationId = $db->insert(
        "INSERT INTO notifications (user_id, title, message, type, created_at) VALUES (?, ?, ?, ?, NOW())",
        [$userId, sanitizeInput($title), sanitizeInput($message), $type]
    );
    
    // Emit WebSocket event for real-time notification
    if ($notificationId) {
        WebSocketEmitter::emitNotification($userId, [
            'id' => $notificationId,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'is_read' => false,
            'created_at' => date('Y-m-d H:i:s')
        ]);
    }
    
    return $notificationId;
}

// Reviews handler
function handleReviews() {
    requireAuth();
    requireCSRF(); // Require CSRF for POST requests
    
    $db = Database::getInstance();
    $userId = $_SESSION['user_id'];
    
    // Rate limiting for review submissions
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $rateLimit = getRateLimitInfo('reviews');
        if (!$rateLimit['allowed']) {
            $retryAfter = $rateLimit['retryAfter'];
            $minutes = ceil($retryAfter / 60);
            sendError("Too many review submissions. Please try again in {$minutes} minute(s).", 429);
        }
        // Submit a review
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            sendError('Invalid JSON data');
            return;
        }
        
        $revieweeId = $input['reviewee_id'] ?? null;
        $applicationId = $input['application_id'] ?? null;
        $rating = $input['rating'] ?? null;
        $comment = sanitizeInput($input['comment'] ?? '');
        
        // Validation
        if (!$revieweeId || !$rating) {
            sendError('Reviewee ID and rating are required');
            return;
        }
        
        if (!is_numeric($rating) || $rating < 1 || $rating > 5) {
            sendError('Rating must be between 1 and 5');
            return;
        }
        
        // Cannot review yourself
        if ($revieweeId == $userId) {
            sendError('You cannot review yourself');
            return;
        }
        
        // Check if application exists and user has permission to review
        if ($applicationId) {
            $application = $db->fetchOne(
                "SELECT a.user_id, a.gig_id, a.status, g.user_id as business_id 
                 FROM applications a 
                 JOIN gigs g ON a.gig_id = g.id 
                 WHERE a.id = ?",
                [$applicationId]
            );
            
            if (!$application) {
                sendError('Application not found');
                return;
            }
            
            // Verify user has permission to review (must be part of the application)
            $isStudent = $application['user_id'] == $userId;
            $isBusiness = $application['business_id'] == $userId;
            
            if (!$isStudent && !$isBusiness) {
                sendError('You do not have permission to review this application');
                return;
            }
            
            // Verify application is completed
            if ($application['status'] !== 'completed') {
                sendError('You can only review completed applications');
                return;
            }
            
            // Determine reviewee based on reviewer
            if ($isStudent) {
                // Student reviewing business
                $actualRevieweeId = $application['business_id'];
            } else {
                // Business reviewing student
                $actualRevieweeId = $application['user_id'];
            }
            
            // Verify reviewee matches
            if ($actualRevieweeId != $revieweeId) {
                sendError('Invalid reviewee for this application');
                return;
            }
        } else {
            // Review without application (general review)
            // Verify reviewee exists
            $reviewee = $db->fetchOne("SELECT id FROM users WHERE id = ?", [$revieweeId]);
            if (!$reviewee) {
                sendError('Reviewee not found');
                return;
            }
        }
        
        // Check if review already exists for this application or user pair
        if ($applicationId) {
            $existingReview = $db->fetchOne(
                "SELECT id FROM reviews WHERE reviewer_id = ? AND reviewee_id = ? AND application_id = ?",
                [$userId, $revieweeId, $applicationId]
            );
        } else {
            $existingReview = $db->fetchOne(
                "SELECT id FROM reviews WHERE reviewer_id = ? AND reviewee_id = ? AND application_id IS NULL",
                [$userId, $revieweeId]
            );
        }
        
        if ($existingReview) {
            sendError('You have already reviewed this user');
            return;
        }
        
        // Insert review
        $reviewId = $db->insert(
            "INSERT INTO reviews (reviewer_id, reviewee_id, application_id, rating, comment, created_at) 
             VALUES (?, ?, ?, ?, ?, NOW())",
            [$userId, $revieweeId, $applicationId, $rating, $comment]
        );
        
        if (!$reviewId) {
            sendError('Failed to submit review');
            return;
        }
        
        // Update user's rating
        updateUserRating($db, $revieweeId);
        
        // Notify reviewee
        $reviewer = $db->fetchOne("SELECT name FROM users WHERE id = ?", [$userId]);
        createNotification(
            $revieweeId,
            'New Review',
            $reviewer['name'] . ' left you a ' . $rating . '-star review.',
            'success'
        );
        
        sendResponse([
            'success' => true,
            'review_id' => $reviewId,
            'message' => 'Review submitted successfully'
        ]);
        
    } else {
        sendError('Method not allowed', 405);
    }
}

// Get reviews for a specific user
function handleReviewsByUser($userId) {
    requireAuth();
    
    if (!is_numeric($userId)) {
        sendError('Invalid user ID');
        return;
    }
    
    $db = Database::getInstance();
    
    // Get user's reviews
    $reviews = $db->fetchAll(
        "SELECT r.*, 
                reviewer.name as reviewer_name, 
                reviewer.profile_image as reviewer_image,
                a.id as application_id,
                g.title as gig_title
         FROM reviews r
         JOIN users reviewer ON r.reviewer_id = reviewer.id
         LEFT JOIN applications a ON r.application_id = a.id
         LEFT JOIN gigs g ON a.gig_id = g.id
         WHERE r.reviewee_id = ?
         ORDER BY r.created_at DESC",
        [$userId]
    );
    
    // Get average rating
    $ratingStats = $db->fetchOne(
        "SELECT 
            AVG(rating) as average_rating,
            COUNT(*) as total_reviews,
            SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
            SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
            SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
            SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
            SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
         FROM reviews
         WHERE reviewee_id = ?",
        [$userId]
    );
    
    sendResponse([
        'success' => true,
        'reviews' => $reviews,
        'rating_stats' => [
            'average_rating' => round($ratingStats['average_rating'] ?? 0, 2),
            'total_reviews' => (int)$ratingStats['total_reviews'],
            'five_star' => (int)$ratingStats['five_star'],
            'four_star' => (int)$ratingStats['four_star'],
            'three_star' => (int)$ratingStats['three_star'],
            'two_star' => (int)$ratingStats['two_star'],
            'one_star' => (int)$ratingStats['one_star']
        ]
    ]);
}

// Helper function to update user's rating
function updateUserRating($db, $userId) {
    $stats = $db->fetchOne(
        "SELECT AVG(rating) as avg_rating, COUNT(*) as total 
         FROM reviews 
         WHERE reviewee_id = ?",
        [$userId]
    );
    
    if ($stats) {
        $db->update(
            "UPDATE users SET rating = ?, total_ratings = ? WHERE id = ?",
            [
                round($stats['avg_rating'], 2),
                (int)$stats['total'],
                $userId
            ]
        );
    }
}

// File upload handler
function handleUpload() {
    requireAuth();
    requireCSRF(); // Require CSRF for POST requests
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendError('Method not allowed', 405);
        return;
    }
    
    $userId = $_SESSION['user_id'];
    $db = Database::getInstance();
    
    // Get upload type (profile, resume, portfolio, message, gig)
    $uploadType = sanitizeInput($_POST['upload_type'] ?? '');
    $applicationId = isset($_POST['application_id']) ? (int)$_POST['application_id'] : null;
    $messageId = isset($_POST['message_id']) ? (int)$_POST['message_id'] : null;
    $gigId = isset($_POST['gig_id']) ? (int)$_POST['gig_id'] : null;
    
    // Validate upload type
    $allowedTypes = ['profile', 'resume', 'portfolio', 'message', 'gig'];
    if (!in_array($uploadType, $allowedTypes)) {
        sendError('Invalid upload type');
        return;
    }
    
    // Check if file was uploaded
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        $errorMsg = 'No file uploaded or upload error';
        if (isset($_FILES['file']['error'])) {
            switch ($_FILES['file']['error']) {
                case UPLOAD_ERR_INI_SIZE:
                case UPLOAD_ERR_FORM_SIZE:
                    $errorMsg = 'File size exceeds limit';
                    break;
                case UPLOAD_ERR_PARTIAL:
                    $errorMsg = 'File upload was incomplete';
                    break;
                case UPLOAD_ERR_NO_FILE:
                    $errorMsg = 'No file was uploaded';
                    break;
                default:
                    $errorMsg = 'Upload error occurred';
            }
        }
        sendError($errorMsg);
        return;
    }
    
    $file = $_FILES['file'];
    $fileName = $file['name'];
    $fileTmpName = $file['tmp_name'];
    $fileSize = $file['size'];
    $fileError = $file['error'];
    
    // Sanitize filename to prevent path traversal and other security issues
    // Remove any directory separators, null bytes, and other dangerous characters
    $fileName = basename($fileName); // Remove any path components
    $fileName = preg_replace('/[^a-zA-Z0-9._-]/', '_', $fileName); // Replace invalid characters with underscore
    $fileName = preg_replace('/_{2,}/', '_', $fileName); // Replace multiple underscores with single
    $fileName = trim($fileName, '._-'); // Remove leading/trailing dots, underscores, hyphens
    
    // Validate file size
    if ($fileSize > MAX_FILE_SIZE) {
        sendError('File size exceeds maximum allowed size of ' . (MAX_FILE_SIZE / 1024 / 1024) . 'MB');
        return;
    }
    
    // Get file extension
    $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    
    // Validate file extension based on upload type
    $allowedExtensions = ALLOWED_EXTENSIONS;
    if ($uploadType === 'profile') {
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
    } elseif ($uploadType === 'resume') {
        $allowedExtensions = ['pdf', 'doc', 'docx'];
    } elseif ($uploadType === 'portfolio') {
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'];
    } elseif ($uploadType === 'message') {
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'txt'];
    } elseif ($uploadType === 'gig') {
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'];
    }
    
    if (!in_array($fileExt, $allowedExtensions)) {
        sendError('File type not allowed. Allowed types: ' . implode(', ', $allowedExtensions));
        return;
    }
    
    // Validate MIME type using finfo_file() to verify actual file type (not just extension)
    if (!function_exists('finfo_open')) {
        // Fallback if finfo extension is not available
        error_log('Warning: finfo extension not available. MIME type validation skipped.');
    } else {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $fileTmpName);
        finfo_close($finfo);
        
        // Define allowed MIME types for each upload type
        $allowedMimeTypes = [
            'profile' => ['image/jpeg', 'image/png', 'image/gif'],
            'resume' => ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            'portfolio' => ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            'message' => ['image/jpeg', 'image/png', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            'gig' => ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        ];
        
        if (!isset($allowedMimeTypes[$uploadType]) || !in_array($mimeType, $allowedMimeTypes[$uploadType])) {
            sendError('Invalid file type. MIME type mismatch. Detected: ' . $mimeType);
            return;
        }
        
        // Validate extension matches MIME type (secondary check)
        $extensionMimeMap = [
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'pdf' => 'application/pdf',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'txt' => 'text/plain'
        ];
        
        $expectedMimeType = $extensionMimeMap[$fileExt] ?? null;
        if ($expectedMimeType && $expectedMimeType !== $mimeType) {
            sendError('File extension does not match file type. Expected: ' . $expectedMimeType . ', Detected: ' . $mimeType);
            return;
        }
    }
    
    // Create upload directory if it doesn't exist
    $uploadDir = __DIR__ . '/../' . UPLOAD_PATH;
    $typeDir = $uploadDir . $uploadType . '/';
    
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    if (!is_dir($typeDir)) {
        mkdir($typeDir, 0755, true);
    }
    
    // Generate unique filename (sanitized)
    // Ensure extension is safe (already validated, but double-check)
    $safeExt = preg_replace('/[^a-zA-Z0-9]/', '', $fileExt);
    $newFileName = uniqid('', true) . '_' . time() . '.' . $safeExt;
    $filePath = $typeDir . $newFileName;
    $relativePath = UPLOAD_PATH . $uploadType . '/' . $newFileName;
    
    // Move uploaded file
    if (!move_uploaded_file($fileTmpName, $filePath)) {
        sendError('Failed to save uploaded file');
        return;
    }
    
    // Save file info to database based on upload type
    try {
        if ($uploadType === 'profile') {
            // Update user profile image
            $db->update(
                "UPDATE users SET profile_image = ? WHERE id = ?",
                [$relativePath, $userId]
            );
            
            sendResponse([
                'success' => true,
                'file_path' => $relativePath,
                'file_url' => APP_URL . '/' . $relativePath,
                'message' => 'Profile picture updated successfully'
            ]);
            
        } elseif ($uploadType === 'resume') {
            // Save resume for application
            // Allow resume upload with either application_id (for existing) or gig_id (for new application)
            $applicationId = sanitizeInput($_POST['application_id'] ?? null);
            $gigId = sanitizeInput($_POST['gig_id'] ?? null);
            
            if ($applicationId) {
                // Update existing application
                // Verify application belongs to user
                $application = $db->fetchOne(
                    "SELECT id FROM applications WHERE id = ? AND user_id = ?",
                    [$applicationId, $userId]
                );
                
                if (!$application) {
                    unlink($filePath);
                    sendError('Application not found or access denied');
                    return;
                }
                
                // Update application with resume path
                $db->update(
                    "UPDATE applications SET resume_path = ? WHERE id = ?",
                    [$relativePath, $applicationId]
                );
            } elseif ($gigId) {
                // For new application - just save the file path
                // The application will be created with this resume_path
                // No database update needed here, just return the path
            } else {
                unlink($filePath);
                sendError('Either application_id or gig_id is required for resume upload');
                return;
            }
            
            sendResponse([
                'success' => true,
                'file_path' => $relativePath,
                'file_url' => APP_URL . '/' . $relativePath,
                'message' => 'Resume uploaded successfully'
            ]);
            
        } elseif ($uploadType === 'portfolio') {
            // Save to user_files table
            $fileCategory = sanitizeInput($_POST['category'] ?? 'portfolio');
            $description = sanitizeInput($_POST['description'] ?? '');
            
            $fileId = $db->insert(
                "INSERT INTO user_files (user_id, file_path, file_name, file_type, file_size, file_category, description, created_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
                [$userId, $relativePath, $fileName, $fileExt, $fileSize, $fileCategory, $description]
            );
            
            sendResponse([
                'success' => true,
                'file_id' => $fileId,
                'file_path' => $relativePath,
                'file_url' => APP_URL . '/' . $relativePath,
                'message' => 'Portfolio file uploaded successfully'
            ]);
            
        } elseif ($uploadType === 'message') {
            // Save to message_attachments table
            // Allow message_id to be provided via POST (for attaching to existing message)
            // Or we can attach during message creation flow
            $messageId = sanitizeInput($_POST['message_id'] ?? null);
            
            if (!$messageId) {
                unlink($filePath);
                sendError('Message ID is required for message attachment');
                return;
            }
            
            // Verify message belongs to user's conversation (user must be sender)
            $message = $db->fetchOne(
                "SELECT m.id, m.sender_id, c.user1_id, c.user2_id 
                 FROM messages m 
                 JOIN conversations c ON m.conversation_id = c.id 
                 WHERE m.id = ? AND (c.user1_id = ? OR c.user2_id = ?)",
                [$messageId, $userId, $userId]
            );
            
            if (!$message || $message['sender_id'] != $userId) {
                unlink($filePath);
                sendError('Message not found or access denied');
                return;
            }
            
            $attachmentId = $db->insert(
                "INSERT INTO message_attachments (message_id, file_path, file_name, file_type, file_size, created_at) 
                 VALUES (?, ?, ?, ?, ?, NOW())",
                [$messageId, $relativePath, $fileName, $fileExt, $fileSize]
            );
            
            sendResponse([
                'success' => true,
                'attachment_id' => $attachmentId,
                'file_path' => $relativePath,
                'file_url' => APP_URL . '/' . $relativePath,
                'file_name' => $fileName,
                'file_type' => $fileExt,
                'file_size' => $fileSize,
                'message' => 'File attached successfully'
            ]);
            
        } elseif ($uploadType === 'gig') {
            // Save to gig_attachments table
            if (!$gigId) {
                unlink($filePath);
                sendError('Gig ID is required for gig attachment');
                return;
            }
            
            // Verify gig belongs to user
            $gig = $db->fetchOne(
                "SELECT id FROM gigs WHERE id = ? AND user_id = ?",
                [$gigId, $userId]
            );
            
            if (!$gig) {
                unlink($filePath);
                sendError('Gig not found or access denied');
                return;
            }
            
            $attachmentId = $db->insert(
                "INSERT INTO gig_attachments (gig_id, file_path, file_name, file_type, file_size, created_at) 
                 VALUES (?, ?, ?, ?, ?, NOW())",
                [$gigId, $relativePath, $fileName, $fileExt, $fileSize]
            );
            
            sendResponse([
                'success' => true,
                'attachment_id' => $attachmentId,
                'file_path' => $relativePath,
                'file_url' => APP_URL . '/' . $relativePath,
                'message' => 'Gig attachment uploaded successfully'
            ]);
        }
        
    } catch (Exception $e) {
        // Delete file if database operation fails
        if (file_exists($filePath)) {
            unlink($filePath);
        }
        error_log("Upload error: " . $e->getMessage());
        sendError('Failed to save file information: ' . $e->getMessage());
    }
}

function handlePortfolio() {
    requireAuth();
    requireCSRF(); // Require CSRF for DELETE requests
    
    $userId = $_SESSION['user_id'];
    $db = Database::getInstance();
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get portfolio files for current user
        $targetUserId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : $userId;
        
        // Only allow viewing own portfolio or public profiles (in future, add privacy settings)
        $portfolioFiles = $db->fetchAll(
            "SELECT id, file_path, file_name, file_type, file_size, file_category, description, created_at
             FROM user_files
             WHERE user_id = ? AND file_category = 'portfolio'
             ORDER BY created_at DESC",
            [$targetUserId]
        );
        
        // Add full URL to each file
        foreach ($portfolioFiles as &$file) {
            $file['file_url'] = APP_URL . '/' . $file['file_path'];
        }
        unset($file); // Break reference
        
        sendResponse([
            'success' => true,
            'files' => $portfolioFiles
        ]);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        // Delete portfolio file
        $input = json_decode(file_get_contents('php://input'), true);
        $fileId = isset($input['file_id']) ? (int)$input['file_id'] : null;
        
        if (!$fileId) {
            sendError('File ID is required');
            return;
        }
        
        // Verify file belongs to user
        $file = $db->fetchOne(
            "SELECT id, file_path FROM user_files WHERE id = ? AND user_id = ?",
            [$fileId, $userId]
        );
        
        if (!$file) {
            sendError('File not found or access denied');
            return;
        }
        
        // Delete file from filesystem
        $filePath = __DIR__ . '/../' . $file['file_path'];
        if (file_exists($filePath)) {
            unlink($filePath);
        }
        
        // Delete from database
        $db->delete("DELETE FROM user_files WHERE id = ?", [$fileId]);
        
        sendResponse([
            'success' => true,
            'message' => 'Portfolio file deleted successfully'
        ]);
    }
}

function handleForgotPassword() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendError('Method not allowed', 405);
    }
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            sendError('Invalid JSON data');
        }
        
        $email = sanitizeInput($input['email'] ?? '');
        
        if (empty($email)) {
            sendError('Email is required');
        }
        
        if (!validateEmail($email)) {
            sendError('Invalid email format');
        }
        
        // Rate limiting for forgot password requests
        $rateLimit = getRateLimitInfo('forgot-password');
        if (!$rateLimit['allowed']) {
            $retryAfter = $rateLimit['retryAfter'];
            $hours = ceil($retryAfter / 3600);
            sendError("Too many password reset requests. Please try again in {$hours} hour(s).", 429);
        }
        
        $db = Database::getInstance();
        
        // Check if user exists
        $user = $db->fetchOne("SELECT id, email, name FROM users WHERE email = ?", [$email]);
        
        // Don't reveal if email exists or not (security best practice)
        // But for development, we'll return success anyway
        if ($user) {
            // Generate reset token
            $token = generateToken(32);
            $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour')); // Token expires in 1 hour
            
            // Invalidate any existing tokens for this user
            $db->update(
                "UPDATE password_reset_tokens SET used = TRUE WHERE user_id = ? AND used = FALSE",
                [$user['id']]
            );
            
            // Insert new token
            $db->insert(
                "INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at) VALUES (?, ?, ?, NOW())",
                [$user['id'], $token, $expiresAt]
            );
            
            // Send email with reset link
            $resetLink = APP_URL . '/reset-password.html?token=' . $token;
            sendPasswordResetEmail($user['email'], $user['name'], $resetLink);
        }
        
        // Always return success (don't reveal if email exists)
        // Token is no longer returned in response for security
        sendResponse([
            'success' => true,
            'message' => 'If an account with that email exists, a password reset link has been sent.'
        ]);
        
    } catch (Exception $e) {
        error_log("Forgot password error: " . $e->getMessage());
        sendError('An error occurred. Please try again.');
    }
}

function handleResetPassword() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendError('Method not allowed', 405);
    }
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            sendError('Invalid JSON data');
        }
        
        // Rate limiting for password reset
        $rateLimit = getRateLimitInfo('reset-password');
        if (!$rateLimit['allowed']) {
            $retryAfter = $rateLimit['retryAfter'];
            $hours = ceil($retryAfter / 3600);
            sendError("Too many password reset attempts. Please try again in {$hours} hour(s).", 429);
        }
        
        $token = sanitizeInput($input['token'] ?? '');
        $newPassword = $input['password'] ?? '';
        $confirmPassword = $input['confirmPassword'] ?? '';
        
        if (empty($token)) {
            sendError('Reset token is required');
        }
        
        if (empty($newPassword)) {
            sendError('Password is required');
        }
        
        if ($newPassword !== $confirmPassword) {
            sendError('Passwords do not match');
        }
        
        if (strlen($newPassword) < 6) {
            sendError('Password must be at least 6 characters');
        }
        
        $db = Database::getInstance();
        
        // Find valid token
        $resetToken = $db->fetchOne(
            "SELECT prt.*, u.id as user_id 
             FROM password_reset_tokens prt
             JOIN users u ON prt.user_id = u.id
             WHERE prt.token = ? AND prt.used = FALSE AND prt.expires_at > NOW()",
            [$token]
        );
        
        if (!$resetToken) {
            sendError('Invalid or expired reset token');
        }
        
        // Update password
        $hashedPassword = hashPassword($newPassword);
        $db->update(
            "UPDATE users SET password = ? WHERE id = ?",
            [$hashedPassword, $resetToken['user_id']]
        );
        
        // Mark token as used
        $db->update(
            "UPDATE password_reset_tokens SET used = TRUE WHERE id = ?",
            [$resetToken['id']]
        );
        
        sendResponse([
            'success' => true,
            'message' => 'Password has been reset successfully. You can now login with your new password.'
        ]);
        
    } catch (Exception $e) {
        error_log("Reset password error: " . $e->getMessage());
        sendError('An error occurred. Please try again.');
    }
}

// CSRF Token handler
function handleCSRFToken() {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        sendError('Method not allowed', 405);
        return;
    }
    
    // Generate and return CSRF token
    $token = generateCSRFToken();
    sendResponse(['success' => true, 'csrf_token' => $token]);
}

// Require CSRF token validation for state-changing requests
function requireCSRF() {
    // Skip CSRF for GET and OPTIONS requests
    if ($_SERVER['REQUEST_METHOD'] === 'GET' || $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        return;
    }
    
    // Skip CSRF for login and signup (they have their own security measures)
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if (strpos($path, '/login') !== false || strpos($path, '/signup') !== false) {
        return;
    }
    
    // Skip CSRF for forgot-password and reset-password (they use their own tokens)
    if (strpos($path, '/auth/forgot-password') !== false || strpos($path, '/auth/reset-password') !== false) {
        return;
    }
    
    // Get token from header (preferred method)
    $token = null;
    
    // Check X-CSRF-Token header (case-insensitive)
    // Try getallheaders() first (Apache), then fallback to $_SERVER
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        if ($headers) {
            foreach ($headers as $name => $value) {
                if (strtolower($name) === 'x-csrf-token') {
                    $token = $value;
                    break;
                }
            }
        }
    }
    
    // Fallback to $_SERVER if getallheaders() not available or header not found
    if (!$token && isset($_SERVER['HTTP_X_CSRF_TOKEN'])) {
        $token = $_SERVER['HTTP_X_CSRF_TOKEN'];
    }
    
    if (!$token || !validateCSRFToken($token)) {
        sendError('Invalid CSRF token. Please refresh the page and try again.', 403);
        exit;
    }
}

// Typing indicators handler
function handleTyping() {
    requireAuth();
    
    $userId = $_SESSION['user_id'];
    $db = Database::getInstance();
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Set typing status
        requireCSRF();
        
        $input = json_decode(file_get_contents('php://input'), true);
        $conversationId = (int)($input['conversation_id'] ?? 0);
        $isTyping = isset($input['is_typing']) ? (bool)$input['is_typing'] : false;
        
        if (!$conversationId) {
            sendError('Conversation ID is required');
        }
        
        // Verify user is part of this conversation
        $conversation = $db->fetchOne(
            "SELECT id FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)",
            [$conversationId, $userId, $userId]
        );
        
        if (!$conversation) {
            sendError('Conversation not found');
        }
        
        // Insert or update typing indicator
        $db->query(
            "INSERT INTO typing_indicators (conversation_id, user_id, is_typing, updated_at) 
             VALUES (?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE is_typing = ?, updated_at = NOW()",
            [$conversationId, $userId, $isTyping ? 1 : 0, $isTyping ? 1 : 0]
        );
        
        sendResponse(['success' => true]);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get typing status for a conversation
        $conversationId = (int)($_GET['conversation_id'] ?? 0);
        
        if (!$conversationId) {
            sendError('Conversation ID is required');
        }
        
        // Verify user is part of conversation
        $conversation = $db->fetchOne(
            "SELECT id, user1_id, user2_id FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)",
            [$conversationId, $userId, $userId]
        );
        
        if (!$conversation) {
            sendError('Conversation not found');
        }
        
        // Get typing status for the other user (not current user)
        $otherUserId = $conversation['user1_id'] == $userId ? $conversation['user2_id'] : $conversation['user1_id'];
        
        $typingIndicator = $db->fetchOne(
            "SELECT ti.*, u.name as user_name 
             FROM typing_indicators ti
             JOIN users u ON ti.user_id = u.id
             WHERE ti.conversation_id = ? AND ti.user_id = ? AND ti.is_typing = TRUE
             AND ti.updated_at > DATE_SUB(NOW(), INTERVAL 3 SECOND)",
            [$conversationId, $otherUserId]
        );
        
        if ($typingIndicator) {
            sendResponse([
                'success' => true,
                'is_typing' => true,
                'user_name' => $typingIndicator['user_name']
            ]);
        } else {
            sendResponse([
                'success' => true,
                'is_typing' => false
            ]);
        }
    } else {
        sendError('Method not allowed', 405);
    }
}
?>

