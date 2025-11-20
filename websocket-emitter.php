<?php
// WebSocket event emitter for FunaGig
// Sends events to the Node.js WebSocket server

class WebSocketEmitter {
    private static $socket = null;
    private static $serverUrl = 'http://localhost:3001';
    
    // Initialize connection to WebSocket server
    private static function connect() {
        if (self::$socket !== null) {
            return self::$socket;
        }
        
        try {
            // Use HTTP client to send events to WebSocket server
            // The Node.js server should have an HTTP endpoint to accept events
            self::$socket = curl_init();
            return self::$socket;
        } catch (Exception $e) {
            error_log('WebSocket emitter connection error: ' . $e->getMessage());
            return null;
        }
    }
    
    // Emit event to WebSocket server
    public static function emit($event, $data) {
        try {
            // Send event via HTTP POST to WebSocket server's HTTP endpoint
            $ch = curl_init(self::$serverUrl . '/emit');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
                'event' => $event,
                'data' => $data
            ]));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json'
            ]);
            curl_setopt($ch, CURLOPT_TIMEOUT, 1); // 1 second timeout, don't block
            
            // Execute asynchronously (fire and forget)
            curl_exec($ch);
            curl_close($ch);
        } catch (Exception $e) {
            // Silently fail - WebSocket events are not critical
            error_log('WebSocket emit error: ' . $e->getMessage());
        }
    }
    
    // Emit new message event
    public static function emitNewMessage($conversationId, $messageId, $senderId, $content) {
        self::emit('new_message', [
            'conversationId' => $conversationId,
            'messageId' => $messageId,
            'senderId' => $senderId,
            'content' => $content
        ]);
    }
    
    // Emit typing indicator event
    public static function emitTyping($conversationId, $userId, $isTyping, $userName = null) {
        self::emit('typing', [
            'conversationId' => $conversationId,
            'userId' => $userId,
            'isTyping' => $isTyping,
            'userName' => $userName
        ]);
    }
    
    // Emit notification event
    public static function emitNotification($userId, $notification) {
        self::emit('new_notification', [
            'userId' => $userId,
            'notification' => $notification
        ]);
    }
}
?>

