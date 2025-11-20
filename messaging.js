// Messaging functionality for FunaGig
// Handles student/business messaging system

class MessagingSystem {
    constructor() {
        this.currentUser = null;
        this.conversations = [];
        this.activeConversation = null;
        this.init();
    }

    init() {
        this.currentUser = Auth.getUser();
        if (!this.currentUser) {
            console.error('User not authenticated');
            return;
        }
        
        this.loadConversations();
        this.setupEventListeners();
    }

    async loadConversations() {
        try {
            const response = await apiFetch('/conversations', {
                method: 'GET'
            });
            
            this.conversations = response.conversations || [];
            this.renderConversations();
        } catch (error) {
            console.error('Failed to load conversations:', error);
            showNotification('Failed to load conversations', 'error');
        }
    }

    async loadMessages(conversationId) {
        try {
            const response = await apiFetch(`/messages/${conversationId}`, {
                method: 'GET'
            });
            
            this.activeConversation = {
                id: conversationId,
                messages: response.messages || []
            };
            
            this.renderMessages();
        } catch (error) {
            console.error('Failed to load messages:', error);
            showNotification('Failed to load messages', 'error');
        }
    }

    async sendMessage(conversationId, message) {
        try {
            const response = await apiFetch('/messages', {
                method: 'POST',
                body: JSON.stringify({
                    conversation_id: conversationId,
                    message: message,
                    sender_id: this.currentUser.id
                })
            });
            
            if (response.success) {
                this.loadMessages(conversationId);
                this.updateConversationList();
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            showNotification('Failed to send message', 'error');
        }
    }

    renderConversations() {
        const conversationsList = document.getElementById('conversations-list');
        if (!conversationsList) return;

        conversationsList.innerHTML = this.conversations.map(conv => `
            <div class="conversation-item" data-conversation-id="${conv.id}">
                <div class="conversation-avatar">
                    <div class="avatar">${conv.other_user.name.charAt(0)}</div>
                </div>
                <div class="conversation-content">
                    <div class="conversation-name">${conv.other_user.name}</div>
                    <div class="conversation-preview">${conv.last_message || 'No messages yet'}</div>
                </div>
                <div class="conversation-meta">
                    <div class="conversation-time">${UI.formatDate(conv.updated_at)}</div>
                    ${conv.unread_count > 0 ? `<div class="unread-badge">${conv.unread_count}</div>` : ''}
                </div>
            </div>
        `).join('');

        // Add click handlers
        conversationsList.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', () => {
                const conversationId = item.dataset.conversationId;
                this.loadMessages(conversationId);
            });
        });
    }

    renderMessages() {
        const messagesContainer = document.getElementById('messages-container');
        if (!messagesContainer || !this.activeConversation) return;

        messagesContainer.innerHTML = this.activeConversation.messages.map(msg => `
            <div class="message ${msg.sender_id === this.currentUser.id ? 'sent' : 'received'}">
                <div class="message-content">${msg.content}</div>
                <div class="message-time">${UI.formatDate(msg.created_at)}</div>
            </div>
        `).join('');

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    setupEventListeners() {
        const messageForm = document.getElementById('message-form');
        if (messageForm) {
            messageForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const messageInput = document.getElementById('message-input');
                const message = messageInput.value.trim();
                
                if (message && this.activeConversation) {
                    this.sendMessage(this.activeConversation.id, message);
                    messageInput.value = '';
                }
            });
        }
    }

    updateConversationList() {
        this.loadConversations();
    }

    // Start a new conversation
    async startConversation(userId, initialMessage = '') {
        try {
            const response = await apiFetch('/conversations', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: userId,
                    initial_message: initialMessage
                })
            });

            if (response.success) {
                this.loadConversations();
                return response.conversation_id;
            }
        } catch (error) {
            console.error('Failed to start conversation:', error);
            showNotification('Failed to start conversation', 'error');
        }
    }
}

// Initialize messaging system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('messages-container')) {
        new MessagingSystem();
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MessagingSystem;
}

