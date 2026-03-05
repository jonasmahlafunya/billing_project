// ===================================
// NOTIFICATION POPUP SYSTEM
// Shows success/error/warning popups
// ===================================

console.log('🔧 Loading notification popup system...');

// Create notification popup HTML
function createNotificationPopup() {
    if (document.getElementById('notificationPopup')) {
        return; // Already exists
    }

    const popup = document.createElement('div');
    popup.id = 'notificationPopup';
    popup.className = 'notification-popup';
    popup.innerHTML = `
    <div class="notification-content">
      <div class="notification-icon"></div>
      <div class="notification-body">
        <h3 class="notification-title"></h3>
        <p class="notification-message"></p>
      </div>
      <button class="notification-close" onclick="closeNotificationPopup()">×</button>
    </div>
  `;

    document.body.appendChild(popup);
    console.log('✅ Notification popup created');
}

// Show notification popup
window.showNotificationPopup = function (type, title, message, autoClose = true) {
    createNotificationPopup();

    const popup = document.getElementById('notificationPopup');
    const icon = popup.querySelector('.notification-icon');
    const titleEl = popup.querySelector('.notification-title');
    const messageEl = popup.querySelector('.notification-message');

    // Set content
    titleEl.textContent = title;
    messageEl.textContent = message;

    // Set icon based on type
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    icon.textContent = icons[type] || icons.info;

    // Remove all type classes
    popup.classList.remove('success', 'error', 'warning', 'info');

    // Add type class
    popup.classList.add(type);

    // Show popup
    popup.classList.add('show');

    // Auto close after 5 seconds if enabled
    if (autoClose) {
        setTimeout(() => {
            closeNotificationPopup();
        }, 5000);
    }

    console.log(`📢 ${type.toUpperCase()}: ${title} - ${message}`);
};

// Close notification popup
window.closeNotificationPopup = function () {
    const popup = document.getElementById('notificationPopup');
    if (popup) {
        popup.classList.remove('show');
    }
};

// Convenience functions
window.showSuccessPopup = function (message, title = 'Success') {
    showNotificationPopup('success', title, message, true);
};

window.showErrorPopup = function (message, title = 'Error') {
    showNotificationPopup('error', title, message, false); // Don't auto-close errors
};

window.showWarningPopup = function (message, title = 'Warning') {
    showNotificationPopup('warning', title, message, true);
};

window.showInfoPopup = function (message, title = 'Information') {
    showNotificationPopup('info', title, message, true);
};

// Initialize
createNotificationPopup();

console.log('✅ Notification popup system loaded!');
