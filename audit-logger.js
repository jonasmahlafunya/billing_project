// ===================================
// AUDIT LOGGING SYSTEM
// Tracks all changes in the application
// ===================================

console.log('🔧 Loading audit logging system...');

// Initialize audit logs in mockData if not exists
if (typeof window !== 'undefined' && typeof mockData !== 'undefined') {
    if (!mockData.auditLogs) {
        mockData.auditLogs = [];
    }
}

// Get current user
function getCurrentUser() {
    if (typeof currentUser !== 'undefined' && currentUser) {
        return `${currentUser.firstName} ${currentUser.lastName}`;
    }
    return 'System User';
}

// Generate audit log ID
function generateAuditId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `AUD-${timestamp}-${random}`;
}

// Log audit event
window.logAuditEvent = function (action, entity, entityId, details, oldValue = null, newValue = null, reason = null) {
    if (typeof mockData === 'undefined') {
        console.warn('mockData not available for audit logging');
        return;
    }

    const auditLog = {
        id: generateAuditId(),
        timestamp: new Date().toISOString(),
        user: getCurrentUser(),
        action: action,
        entity: entity,
        entityId: entityId,
        details: details,
        oldValue: oldValue,
        newValue: newValue,
        reason: reason
    };

    mockData.auditLogs.unshift(auditLog); // Add to beginning

    // Keep only last 1000 logs
    if (mockData.auditLogs.length > 1000) {
        mockData.auditLogs = mockData.auditLogs.slice(0, 1000);
    }

    // Save to localStorage
    if (typeof saveToLocalStorage === 'function') {
        saveToLocalStorage();
    }

    console.log(`📝 Audit log created: ${action} - ${entity} ${entityId}`);

    return auditLog;
};

// Get audit logs
window.getAuditLogs = function () {
    if (typeof mockData !== 'undefined' && mockData.auditLogs) {
        return mockData.auditLogs;
    }
    return [];
};

// Get audit logs for specific entity
window.getAuditLogsByEntity = function (entity, entityId) {
    const logs = getAuditLogs();
    return logs.filter(log => log.entity === entity && log.entityId === entityId);
};

// Get audit logs by action
window.getAuditLogsByAction = function (action) {
    const logs = getAuditLogs();
    return logs.filter(log => log.action === action);
};

// Get audit logs by user
window.getAuditLogsByUser = function (user) {
    const logs = getAuditLogs();
    return logs.filter(log => log.user === user);
};

// Get audit logs by date range
window.getAuditLogsByDateRange = function (startDate, endDate) {
    const logs = getAuditLogs();
    const start = new Date(startDate);
    const end = new Date(endDate);

    return logs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= start && logDate <= end;
    });
};

// Format timestamp for display
function formatAuditTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // Less than 1 minute
    if (diff < 60000) {
        return 'Just now';
    }

    // Less than 1 hour
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }

    // Less than 24 hours
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }

    // Less than 7 days
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }

    // Format as date
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Render audit logs table
window.renderAuditLogs = function () {
    const tbody = document.getElementById('auditLogsTableBody');
    if (!tbody) {
        console.warn('Audit logs table body not found');
        return;
    }

    const logs = getAuditLogs();

    // Get paginated data
    let displayLogs = logs;
    if (typeof getPaginatedData === 'function') {
        displayLogs = getPaginatedData(logs, 'auditLogsTable', 10);
    }

    if (displayLogs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #94a3b8;">No audit logs found</td></tr>';
        return;
    }

    tbody.innerHTML = displayLogs.map(log => `
    <tr>
      <td style="white-space: nowrap;">${formatAuditTimestamp(log.timestamp)}</td>
      <td>${log.user}</td>
      <td><span class="status-indicator status-${log.action.toLowerCase().replace('_', '-')}">${log.action.replace('_', ' ')}</span></td>
      <td>${log.entity} ${log.entityId ? `(${log.entityId})` : ''}</td>
      <td>${log.details}</td>
      <td>${log.reason || '-'}</td>
    </tr>
  `).join('');

    // Render pagination if function exists
    if (typeof renderPaginationControls === 'function') {
        renderPaginationControls('auditLogsTable', 'auditLogsPagination');
    }

    console.log(`Rendered ${displayLogs.length} audit logs`);
};

// Initialize audit logging for existing functions
function initAuditLogging() {
    console.log('🔧 Initializing audit logging integration...');

    // Override updateInvoiceStatus if it exists
    if (typeof window.updateInvoiceStatus !== 'undefined') {
        const originalUpdateInvoiceStatus = window.updateInvoiceStatus;

        window.updateInvoiceStatus = function (invoiceId, newStatus) {
            const invoice = mockData.invoices.find(inv =>
                inv.id === invoiceId || inv.invoiceNumber === invoiceId
            );

            if (invoice) {
                const oldStatus = invoice.status;

                // Call original function
                if (originalUpdateInvoiceStatus) {
                    originalUpdateInvoiceStatus(invoiceId, newStatus);
                } else {
                    invoice.status = newStatus;
                }

                // Log to audit
                logAuditEvent(
                    'STATUS_CHANGE',
                    'Invoice',
                    invoiceId,
                    `Changed invoice status from ${oldStatus} to ${newStatus}`,
                    oldStatus,
                    newStatus
                );
            }
        };
    }

    console.log('✅ Audit logging integration complete');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        setTimeout(initAuditLogging, 2000);
    });
} else {
    setTimeout(initAuditLogging, 2000);
}

console.log('✅ Audit logging system loaded!');
