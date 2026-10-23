/**
 * PlacementPro - Universal Notification Client
 * Handles real-time notification fetching, unread badges, dropdown toggling,
 * mark-as-read, and mark-all-as-read for students and admins.
 */

(function () {
  'use strict';

  function getToken() {
    return localStorage.getItem('token') || localStorage.getItem('adminToken') || null;
  }

  function formatTimeAgo(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function getIconSvg(type) {
    switch (type) {
      case 'exam':
        return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`;
      case 'drive':
        return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`;
      case 'interview':
        return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
      case 'compiler':
        return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`;
      default:
        return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    }
  }

  class NotificationManager {
    constructor() {
      this.notifications = [];
      this.unreadCount = 0;
      this.isOpen = false;
      this.isLoading = false;
      this.container = null;
      this.bellBtn = null;
      this.badgeEl = null;
      this.dropdownEl = null;
    }

    init() {
      // Find or setup notification bell button
      this.bellBtn = document.getElementById('notificationBtn') || document.querySelector('.notification-btn');
      if (!this.bellBtn) return;

      // Find or wrap container
      this.container = this.bellBtn.closest('.notification-container') || document.getElementById('notificationDropdownContainer');
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.className = 'notification-container';
        this.container.id = 'notificationDropdownContainer';
        this.bellBtn.parentNode.insertBefore(this.container, this.bellBtn);
        this.container.appendChild(this.bellBtn);
      }

      // Ensure proper bell button attributes
      this.bellBtn.id = this.bellBtn.id || 'notificationBtn';
      this.bellBtn.setAttribute('aria-haspopup', 'true');
      this.bellBtn.setAttribute('aria-expanded', 'false');
      this.bellBtn.setAttribute('title', 'Notifications');

      // Setup badge element
      this.badgeEl = this.bellBtn.querySelector('.dot') || this.bellBtn.querySelector('.notification-badge');
      if (!this.badgeEl) {
        this.badgeEl = document.createElement('span');
        this.badgeEl.className = 'dot notification-badge';
        this.badgeEl.id = 'notificationBadge';
        this.badgeEl.style.display = 'none';
        this.bellBtn.appendChild(this.badgeEl);
      } else {
        this.badgeEl.classList.add('notification-badge');
        this.badgeEl.id = this.badgeEl.id || 'notificationBadge';
      }

      // Find or create dropdown panel
      this.dropdownEl = this.container.querySelector('.notification-dropdown') || document.getElementById('notificationDropdown');
      if (!this.dropdownEl) {
        this.dropdownEl = document.createElement('div');
        this.dropdownEl.className = 'notification-dropdown';
        this.dropdownEl.id = 'notificationDropdown';
        this.dropdownEl.setAttribute('role', 'region');
        this.dropdownEl.setAttribute('aria-label', 'Notifications dropdown');
        this.container.appendChild(this.dropdownEl);
      }

      // Attach event listeners
      this.bindEvents();

      // Initial fetch of unread count and notifications
      this.fetchNotifications();
    }

    bindEvents() {
      // Bell click toggle
      this.bellBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleDropdown();
      });

      // Close when clicking outside
      document.addEventListener('click', (e) => {
        if (this.isOpen && this.container && !this.container.contains(e.target)) {
          this.closeDropdown();
        }
      });

      // Close on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.closeDropdown();
        }
      });
    }

    toggleDropdown() {
      if (this.isOpen) {
        this.closeDropdown();
      } else {
        this.openDropdown();
      }
    }

    openDropdown() {
      this.isOpen = true;
      this.dropdownEl.classList.add('active');
      this.bellBtn.setAttribute('aria-expanded', 'true');
      this.render();
      // Refresh notifications on open
      this.fetchNotifications();
    }

    closeDropdown() {
      this.isOpen = false;
      this.dropdownEl.classList.remove('active');
      this.bellBtn.setAttribute('aria-expanded', 'false');
    }

    async fetchNotifications() {
      const token = getToken();
      if (!token) {
        this.updateBadge(0);
        return;
      }

      this.isLoading = true;
      try {
        const response = await fetch('/api/notifications', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 401 || response.status === 403) {
          this.updateBadge(0);
          return;
        }

        const data = await response.json();
        if (data.success) {
          this.notifications = Array.isArray(data.data) ? data.data : [];
          this.unreadCount = typeof data.unreadCount === 'number' ? data.unreadCount : 0;
          this.updateBadge(this.unreadCount);
          if (this.isOpen) {
            this.render();
          }
        }
      } catch (err) {
        console.warn('[Notifications] Could not fetch notifications:', err.message);
      } finally {
        this.isLoading = false;
      }
    }

    updateBadge(count) {
      this.unreadCount = Math.max(0, count);
      if (!this.badgeEl) return;

      if (this.unreadCount > 0) {
        this.badgeEl.textContent = this.unreadCount > 99 ? '99+' : String(this.unreadCount);
        this.badgeEl.style.display = 'flex';
      } else {
        this.badgeEl.textContent = '';
        this.badgeEl.style.display = 'none';
      }
    }

    async markOneAsRead(id, link = null) {
      const token = getToken();
      if (!token) return;

      // Optimistic update
      const item = this.notifications.find((n) => n.id === id);
      if (item && !item.is_read) {
        item.is_read = 1;
        this.updateBadge(this.unreadCount - 1);
        this.render();
      }

      try {
        const response = await fetch(`/api/notifications/${id}/read`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        if (data.success && typeof data.unreadCount === 'number') {
          this.updateBadge(data.unreadCount);
        }
      } catch (err) {
        console.error('[Notifications] Error marking read:', err);
      }

      if (link) {
        this.closeDropdown();
        window.location.href = link;
      }
    }

    async markAllAsRead() {
      const token = getToken();
      if (!token || this.unreadCount === 0) return;

      // Optimistic update
      this.notifications.forEach((n) => (n.is_read = 1));
      this.updateBadge(0);
      this.render();

      try {
        const response = await fetch('/api/notifications/read-all', {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        if (data.success) {
          this.updateBadge(0);
        }
      } catch (err) {
        console.error('[Notifications] Error marking all read:', err);
      }
    }

    render() {
      if (!this.dropdownEl) return;

      const token = getToken();
      if (!token) {
        this.dropdownEl.innerHTML = `
          <div class="notification-header">
            <div class="notification-header-title">Notifications</div>
          </div>
          <div class="notification-empty">
            <div class="notification-empty-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>
            </div>
            <div class="notification-empty-title">Sign in required</div>
            <div class="notification-empty-desc">Please sign in to view your personalized notifications.</div>
          </div>
        `;
        return;
      }

      const unreadCount = this.unreadCount;
      const unreadChip = unreadCount > 0 ? `<span class="notification-unread-chip">${unreadCount} unread</span>` : '';
      const markAllDisabled = unreadCount === 0 ? 'disabled' : '';

      let bodyHtml = '';

      if (this.notifications.length === 0) {
        bodyHtml = `
          <div class="notification-empty">
            <div class="notification-empty-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>
            </div>
            <div class="notification-empty-title">No notifications yet</div>
            <div class="notification-empty-desc">You're all caught up! Updates regarding exams, interviews, and drives will appear here.</div>
          </div>
        `;
      } else {
        const itemsHtml = this.notifications.map((n) => {
          const isUnread = !n.is_read;
          const unreadClass = isUnread ? 'unread' : '';
          const actionBtn = isUnread
            ? `<button class="notification-read-action" data-action="mark-read" data-id="${n.id}" title="Mark as read" aria-label="Mark as read">
                 <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
               </button>`
            : '';

          return `
            <div class="notification-item ${unreadClass}" data-id="${n.id}" data-type="${n.type || 'general'}" data-link="${n.link || ''}">
              <div class="notification-icon-wrap">
                ${getIconSvg(n.type)}
              </div>
              <div class="notification-content">
                <div class="notification-title">
                  <span>${escapeHtml(n.title)}</span>
                  ${actionBtn}
                </div>
                <div class="notification-message">${escapeHtml(n.message)}</div>
                <div class="notification-time">${formatTimeAgo(n.created_at)}</div>
              </div>
            </div>
          `;
        }).join('');

        bodyHtml = `<div class="notification-list">${itemsHtml}</div>`;
      }

      this.dropdownEl.innerHTML = `
        <div class="notification-header">
          <div class="notification-header-title">
            <span>Notifications</span>
            ${unreadChip}
          </div>
          <button class="notification-mark-all-btn" id="notifMarkAllBtn" ${markAllDisabled}>
            Mark all as read
          </button>
        </div>
        ${bodyHtml}
      `;

      // Bind mark-all button
      const markAllBtn = this.dropdownEl.querySelector('#notifMarkAllBtn');
      if (markAllBtn && !markAllBtn.disabled) {
        markAllBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.markAllAsRead();
        });
      }

      // Bind individual notification click and mark-read action
      this.dropdownEl.querySelectorAll('.notification-item').forEach((el) => {
        const id = el.dataset.id;
        const link = el.dataset.link;

        const actionBtn = el.querySelector('[data-action="mark-read"]');
        if (actionBtn) {
          actionBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.markOneAsRead(id, null);
          });
        }

        el.addEventListener('click', (e) => {
          if (e.target.closest('[data-action="mark-read"]')) return;
          this.markOneAsRead(id, link || null);
        });
      });
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initialize on DOM ready
  const manager = new NotificationManager();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => manager.init());
  } else {
    manager.init();
  }

  // Expose instance for debugging/testing
  window.PlacementProNotifications = manager;
})();
