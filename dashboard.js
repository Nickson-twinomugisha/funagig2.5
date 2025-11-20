// Dashboard-specific functionality for FunaGig
// Handles stats, dynamic loads, and dashboard interactions

class DashboardManager {
    constructor() {
        this.user = null;
        this.stats = {};
        this.init();
    }

    init() {
        this.user = Auth.getUser();
        if (!this.user) {
            console.error('User not authenticated');
            return;
        }

        this.loadDashboardData();
        this.setupEventListeners();
    }

    async loadDashboardData() {
        try {
            const response = await apiFetch('/dashboard', {
                method: 'GET'
            });

            this.stats = response.stats || {};
            this.renderStats();
            this.renderRecentActivity();
            this.renderNotifications();
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            showNotification('Failed to load dashboard data', 'error');
        }
    }

    renderStats() {
        // Update stat elements based on user type
        if (this.user.type === 'student') {
            this.updateStudentStats();
        } else if (this.user.type === 'business') {
            this.updateBusinessStats();
        }
    }

    updateStudentStats() {
        const stats = this.stats;
        
        // Update stat cards
        this.updateStatCard('active-tasks', stats.active_tasks || 0);
        this.updateStatCard('pending-tasks', stats.pending_tasks || 0);
        this.updateStatCard('completed-tasks', stats.completed_tasks || 0);
        this.updateStatCard('average-rating', stats.average_rating || 0);
        this.updateStatCard('total-earned', UI.formatCurrency(stats.total_earned || 0));
        this.updateStatCard('total-tasks', stats.total_tasks || 0);
        this.updateStatCard('days-active', stats.days_active || 0);
    }

    updateBusinessStats() {
        const stats = this.stats;
        
        // Update stat cards
        this.updateStatCard('active-gigs', stats.active_gigs || 0);
        this.updateStatCard('total-applicants', stats.total_applicants || 0);
        this.updateStatCard('hired-students', stats.hired_students || 0);
        this.updateStatCard('avg-rating', stats.avg_rating || 0);
    }

    updateStatCard(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    renderRecentActivity() {
        const activityContainer = document.getElementById('recent-activity');
        if (!activityContainer) return;

        const activities = this.stats.recent_activity || [];
        
        activityContainer.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-description">${activity.description}</div>
                <div class="activity-time">${UI.formatDate(activity.created_at)}</div>
            </div>
        `).join('');
    }

    renderNotifications() {
        const notificationsContainer = document.getElementById('notifications');
        if (!notificationsContainer) return;

        const notifications = this.stats.notifications || [];
        
        notificationsContainer.innerHTML = notifications.map(notification => `
            <div class="notification-item ${notification.read ? 'read' : 'unread'}">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
                <div class="notification-time">${UI.formatDate(notification.created_at)}</div>
            </div>
        `).join('');
    }

    setupEventListeners() {
        // Quick action buttons
        document.querySelectorAll('.quick-action').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Refresh button
        const refreshButton = document.getElementById('refresh-dashboard');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                this.loadDashboardData();
            });
        }
    }

    handleQuickAction(action) {
        switch (action) {
            case 'browse-gigs':
                window.location.href = 'student-gigs.html';
                break;
            case 'post-gig':
                window.location.href = 'business-gigs.html';
                break;
            case 'view-applications':
                window.location.href = 'business-gigs.html#applications';
                break;
            case 'edit-profile':
                window.location.href = this.user.type === 'student' ? 'student-profile.html' : 'business-profile.html';
                break;
            default:
                console.log('Unknown action:', action);
        }
    }

    // Load and display active gigs for business dashboard
    async loadActiveGigs() {
        try {
            const response = await apiFetch('/gigs/active', {
                method: 'GET'
            });

            const gigs = response.gigs || [];
            this.renderActiveGigs(gigs);
        } catch (error) {
            console.error('Failed to load active gigs:', error);
        }
    }

    renderActiveGigs(gigs) {
        const container = document.getElementById('active-gigs-list');
        if (!container) return;

        container.innerHTML = gigs.map(gig => `
            <div class="gig-card">
                <div class="gig-header">
                    <h3>${gig.title}</h3>
                    <span class="gig-status ${gig.status}">${gig.status}</span>
                </div>
                <div class="gig-meta">
                    <span class="gig-budget">${UI.formatCurrency(gig.budget)}</span>
                    <span class="gig-deadline">Due: ${UI.formatDate(gig.deadline)}</span>
                </div>
                <div class="gig-stats">
                    <span class="applicants">${gig.applicant_count} applicants</span>
                    <span class="views">${gig.view_count} views</span>
                </div>
            </div>
        `).join('');
    }

    // Analytics and charts
    renderAnalytics() {
        this.renderPerformanceChart();
        this.renderDemographicsChart();
    }

    renderPerformanceChart() {
        const container = document.getElementById('performance-chart');
        if (!container) return;

        const data = this.stats.performance || {};
        
        // Simple progress bars for now
        container.innerHTML = `
            <div class="analytics-item">
                <div class="metric-label">Application Rate</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${data.application_rate || 0}%"></div>
                </div>
                <div class="metric-value">${data.application_rate || 0}%</div>
            </div>
            <div class="analytics-item">
                <div class="metric-label">Hiring Success</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${data.hiring_success || 0}%"></div>
                </div>
                <div class="metric-value">${data.hiring_success || 0}%</div>
            </div>
        `;
    }

    renderDemographicsChart() {
        const container = document.getElementById('demographics-chart');
        if (!container) return;

        const data = this.stats.demographics || {};
        
        container.innerHTML = Object.entries(data).map(([key, value]) => `
            <div class="demographic-item">
                <span class="demographic-label">${key}</span>
                <div class="demographic-bar">
                    <div class="bar-fill" style="width: ${value}%"></div>
                </div>
                <span class="demographic-value">${value}%</span>
            </div>
        `).join('');
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.dashboard-content') || document.getElementById('dashboard-stats')) {
        new DashboardManager();
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardManager;
}

