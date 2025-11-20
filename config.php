<?php
// Database configuration for FunaGig
// Simple mysqli connection setup for XAMPP deployment

// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'funagig');
define('DB_USER', 'root');
define('DB_PASS', '');

// Application configuration
define('APP_NAME', 'FunaGig');
define('APP_VERSION', '1.4');
define('APP_URL', 'http://localhost/funagig');

// Security settings
define('JWT_SECRET', 'your-secret-key-here-change-in-production');
define('PASSWORD_HASH_ALGO', PASSWORD_DEFAULT);

// File upload settings
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
define('UPLOAD_PATH', 'uploads/');
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']);

// Email settings (for notifications)
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USERNAME', 'your-email@gmail.com');
define('SMTP_PASSWORD', 'your-app-password');
define('FROM_EMAIL', 'noreply@funagig.com');
define('FROM_NAME', 'FunaGig');

// Database connection class
class Database {
    private static $instance = null;
    private $connection;
    
    private function __construct() {
        try {
            $this->connection = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
            
            if ($this->connection->connect_error) {
                throw new Exception("Connection failed: " . $this->connection->connect_error);
            }
            
            // Set charset to utf8
            $this->connection->set_charset("utf8");
            
        } catch (Exception $e) {
            error_log("Database connection error: " . $e->getMessage());
            throw $e;
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->connection;
    }
    
    public function query($sql, $params = []) {
        $stmt = $this->connection->prepare($sql);
        
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $this->connection->error);
        }
        
        if (!empty($params)) {
            $types = str_repeat('s', count($params));
            $stmt->bind_param($types, ...$params);
        }
        
        $stmt->execute();
        
        if ($stmt->error) {
            throw new Exception("Execute failed: " . $stmt->error);
        }
        
        return $stmt;
    }
    
    public function fetchAll($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        $result = $stmt->get_result();
        return $result->fetch_all(MYSQLI_ASSOC);
    }
    
    public function fetchOne($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        $result = $stmt->get_result();
        return $result->fetch_assoc();
    }
    
    public function insert($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $this->connection->insert_id;
    }
    
    public function update($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->affected_rows;
    }
    
    public function delete($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->affected_rows;
    }
    
    public function beginTransaction() {
        $this->connection->begin_transaction();
    }
    
    public function commit() {
        $this->connection->commit();
    }
    
    public function rollback() {
        $this->connection->rollback();
    }
    
    public function close() {
        if ($this->connection) {
            $this->connection->close();
        }
    }
}

// Utility functions
function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

function generateToken($length = 32) {
    return bin2hex(random_bytes($length));
}

function hashPassword($password) {
    return password_hash($password, PASSWORD_HASH_ALGO);
}

function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

function sendResponse($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function sendError($message, $status = 400) {
    sendResponse(['success' => false, 'error' => $message], $status);
}

// Rate limiting configuration per endpoint
function getRateLimitConfig($endpoint) {
    $configs = [
        // Authentication endpoints
        'login' => ['maxAttempts' => 5, 'timeWindow' => 300], // 5 attempts per 5 minutes
        'signup' => ['maxAttempts' => 3, 'timeWindow' => 300], // 3 attempts per 5 minutes
        'forgot-password' => ['maxAttempts' => 3, 'timeWindow' => 3600], // 3 attempts per hour
        'reset-password' => ['maxAttempts' => 5, 'timeWindow' => 3600], // 5 attempts per hour
        
        // File upload endpoints
        'upload' => ['maxAttempts' => 20, 'timeWindow' => 300], // 20 uploads per 5 minutes
        
        // Messaging endpoints
        'messages' => ['maxAttempts' => 60, 'timeWindow' => 60], // 60 messages per minute
        'conversations' => ['maxAttempts' => 30, 'timeWindow' => 60], // 30 conversations per minute
        
        // Gigs endpoints
        'gigs' => ['maxAttempts' => 20, 'timeWindow' => 300], // 20 gig operations per 5 minutes
        'applications' => ['maxAttempts' => 30, 'timeWindow' => 300], // 30 applications per 5 minutes
        
        // Profile endpoints
        'profile' => ['maxAttempts' => 10, 'timeWindow' => 300], // 10 profile updates per 5 minutes
        
        // Reviews endpoints
        'reviews' => ['maxAttempts' => 10, 'timeWindow' => 300], // 10 reviews per 5 minutes
        
        // Notifications endpoints
        'notifications' => ['maxAttempts' => 30, 'timeWindow' => 60], // 30 requests per minute
        
        // Default rate limit
        'default' => ['maxAttempts' => 100, 'timeWindow' => 60], // 100 requests per minute
    ];
    
    // Check for exact match first
    if (isset($configs[$endpoint])) {
        return $configs[$endpoint];
    }
    
    // Check for partial match (e.g., 'gigs/update' matches 'gigs')
    foreach ($configs as $key => $config) {
        if ($key !== 'default' && strpos($endpoint, $key) !== false) {
            return $config;
        }
    }
    
    // Return default
    return $configs['default'];
}

// Enhanced rate limiting function with headers
function checkRateLimit($identifier, $maxAttempts = 10, $timeWindow = 300, $endpoint = 'default') {
    $key = 'rate_limit_' . md5($identifier);
    $attempts = $_SESSION[$key] ?? [];
    
    // Clean old attempts
    $currentTime = time();
    $attempts = array_filter($attempts, function($timestamp) use ($currentTime, $timeWindow) {
        return ($currentTime - $timestamp) < $timeWindow;
    });
    
    $remainingAttempts = max(0, $maxAttempts - count($attempts));
    $resetTime = $currentTime + $timeWindow;
    
    // Set rate limit headers (always set, even if limit not exceeded)
    header('X-RateLimit-Limit: ' . $maxAttempts);
    header('X-RateLimit-Remaining: ' . $remainingAttempts);
    header('X-RateLimit-Reset: ' . $resetTime);
    
    if (count($attempts) >= $maxAttempts) {
        // Calculate retry after seconds
        $oldestAttempt = min($attempts);
        $retryAfter = max(1, ($oldestAttempt + $timeWindow) - $currentTime);
        header('Retry-After: ' . $retryAfter);
        
        return [
            'allowed' => false,
            'maxAttempts' => $maxAttempts,
            'remainingAttempts' => 0,
            'resetTime' => $resetTime,
            'retryAfter' => $retryAfter
        ];
    }
    
    // Record this attempt
    $attempts[] = $currentTime;
    $_SESSION[$key] = $attempts;
    
    return [
        'allowed' => true,
        'maxAttempts' => $maxAttempts,
        'remainingAttempts' => $remainingAttempts - 1, // Subtract 1 for current request
        'resetTime' => $resetTime
    ];
}

// Helper function to get rate limit info for an endpoint
function getRateLimitInfo($endpoint) {
    $config = getRateLimitConfig($endpoint);
    $identifier = getRateLimitIdentifier($endpoint);
    return checkRateLimit($identifier, $config['maxAttempts'], $config['timeWindow'], $endpoint);
}

// Helper function to get rate limit identifier (IP + endpoint or user ID + endpoint)
function getRateLimitIdentifier($endpoint) {
    $userId = $_SESSION['user_id'] ?? null;
    
    if ($userId) {
        // Use user ID for authenticated requests (more accurate)
        return $endpoint . '_user_' . $userId;
    } else {
        // Use IP address for unauthenticated requests
        $clientIP = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        // Handle proxy headers
        if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            $clientIP = trim($ips[0]);
        }
        return $endpoint . '_ip_' . $clientIP;
    }
}

// CSRF token functions
function generateCSRFToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function validateCSRFToken($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

function requireAuth() {
    if (!isset($_SESSION['user_id'])) {
        sendError('Authentication required', 401);
    }
}

function getCurrentUser() {
    if (!isset($_SESSION['user_id'])) {
        return null;
    }
    
    $db = Database::getInstance();
    return $db->fetchOne(
        "SELECT id, name, email, type, university, major, industry, bio, skills, location, phone, website FROM users WHERE id = ?",
        [$_SESSION['user_id']]
    );
}

// CORS headers for API
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Start session
session_start();

// Error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);
?>

