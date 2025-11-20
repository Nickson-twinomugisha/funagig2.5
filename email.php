<?php
// Email sending functions for FunaGig
// Uses PHP mail() function for sending emails
// For production, consider using PHPMailer or similar library

require_once 'config.php';

/**
 * Send password reset email to user
 * 
 * @param string $email User's email address
 * @param string $name User's name
 * @param string $resetLink Password reset link with token
 * @return bool True if email was sent successfully, false otherwise
 */
function sendPasswordResetEmail($email, $name, $resetLink) {
    // Get email settings (can be overridden in config.local.php)
    $fromEmail = defined('FROM_EMAIL') ? FROM_EMAIL : 'noreply@funagig.com';
    $fromName = defined('FROM_NAME') ? FROM_NAME : 'FunaGig';
    $smtpUsername = defined('SMTP_USERNAME') ? SMTP_USERNAME : null;
    $smtpPassword = defined('SMTP_PASSWORD') ? SMTP_PASSWORD : null;
    
    // Email subject
    $subject = 'Password Reset Request - ' . $fromName;
    
    // Email body (HTML format)
    $message = "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .warning { color: #d32f2f; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>" . htmlspecialchars($fromName) . "</h1>
            </div>
            <div class='content'>
                <h2>Hello " . htmlspecialchars($name) . ",</h2>
                <p>You requested a password reset for your account. Click the button below to reset your password:</p>
                <p style='text-align: center;'>
                    <a href='" . htmlspecialchars($resetLink) . "' class='button'>Reset Password</a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p style='word-break: break-all; background-color: #fff; padding: 10px; border: 1px solid #ddd;'>" . htmlspecialchars($resetLink) . "</p>
                <p class='warning'>⚠️ This link will expire in 1 hour for security reasons.</p>
                <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
            </div>
            <div class='footer'>
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>&copy; " . date('Y') . " " . htmlspecialchars($fromName) . ". All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    // Email headers
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: " . $fromName . " <" . $fromEmail . ">" . "\r\n";
    $headers .= "Reply-To: " . $fromEmail . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();
    
    // Try to send email
    try {
        $result = mail($email, $subject, $message, $headers);
        
        if (!$result) {
            error_log("Failed to send password reset email to: " . $email);
            return false;
        }
        
        error_log("Password reset email sent successfully to: " . $email);
        return true;
        
    } catch (Exception $e) {
        error_log("Error sending password reset email: " . $e->getMessage());
        return false;
    }
}

/**
 * Send notification email to user
 * 
 * @param string $email User's email address
 * @param string $name User's name
 * @param string $subject Email subject
 * @param string $message Email message (HTML)
 * @return bool True if email was sent successfully, false otherwise
 */
function sendNotificationEmail($email, $name, $subject, $message) {
    $fromEmail = defined('FROM_EMAIL') ? FROM_EMAIL : 'noreply@funagig.com';
    $fromName = defined('FROM_NAME') ? FROM_NAME : 'FunaGig';
    
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: " . $fromName . " <" . $fromEmail . ">" . "\r\n";
    $headers .= "Reply-To: " . $fromEmail . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();
    
    try {
        $result = mail($email, $subject, $message, $headers);
        
        if (!$result) {
            error_log("Failed to send notification email to: " . $email);
            return false;
        }
        
        return true;
        
    } catch (Exception $e) {
        error_log("Error sending notification email: " . $e->getMessage());
        return false;
    }
}

?>

