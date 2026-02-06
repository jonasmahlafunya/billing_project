// ===================================
// STATUS CHANGE SYSTEM
// Change batch/manual billing status with reason
// ===================================

console.log('🔧 Loading status change system...');

// Current item being changed
let currentStatusChange = {
    type: null,
    itemId: null,
    currentStatus: null
};

// Open status change modal
window.openStatusChangeModal = function (type, itemId, currentStatus) {
    currentStatusChange = { type, itemId, currentStatus };

    const modal = document.getElementById('changeStatusModal');
    if (!modal) {
        console.error('Status change modal not found');
        return;
    }

    // Set modal title
    const title = modal.querySelector('h2');
    if (title) {
        title.textContent = `Change ${type} Status`;
    }

    // Set current status info
    const currentStatusEl = document.getElementById('currentStatusInfo');
    if (currentStatusEl) {
        currentStatusEl.textContent = `Current Status: ${currentStatus}`;
    }

    // Reset form
    const form = document.getElementById('changeStatusForm');
    if (form) {
        form.reset();
    }

    // Set new status options based on current status
    const newStatusSelect = document.getElementById('newStatusSelect');
    if (newStatusSelect) {
        if (currentStatus === 'Rejected') {
            newStatusSelect.innerHTML = '<option value="Approved">Approved</option>';
        } else if (currentStatus === 'Approved') {
            newStatusSelect.innerHTML = '<option value="Rejected">Rejected</option>';
        } else {
            newStatusSelect.innerHTML = `
        <option value="Approved">Approved</option>
        <option value="Rejected">Rejected</option>
      `;
        }
    }

    // Show modal
    modal.style.display = 'block';

    console.log(`Opening status change modal for ${type} ${itemId}`);
};

// Close status change modal
window.closeStatusChangeModal = function () {
    const modal = document.getElementById('changeStatusModal');
    if (modal) {
        modal.style.display = 'none';
    }

    currentStatusChange = { type: null, itemId: null, currentStatus: null };
};

// Handle status change form submission
window.handleStatusChangeSubmit = function (event) {
    event.preventDefault();

    const newStatus = document.getElementById('newStatusSelect').value;
    const reason = document.getElementById('statusChangeReason').value.trim();

    if (!reason) {
        showWarningPopup('Please provide a reason for the status change');
        return;
    }

    const { type, itemId, currentStatus } = currentStatusChange;

    if (!type || !itemId) {
        showErrorPopup('Invalid status change request');
        return;
    }

    // Change status
    changeItemStatus(type, itemId, newStatus, reason);

    // Close modal
    closeStatusChangeModal();
};

// Change item status
function changeItemStatus(type, itemId, newStatus, reason) {
    console.log(`Changing ${type} ${itemId} status to ${newStatus}. Reason: ${reason}`);

    if (type === 'Batch') {
        updateBatchStatus(itemId, newStatus, reason);
    } else if (type === 'Manual Billing') {
        updateManualBillingStatus(itemId, newStatus, reason);
    }
}

// Update batch status
function updateBatchStatus(batchId, newStatus, reason) {
    if (typeof mockData === 'undefined' || !mockData.batches) {
        showErrorPopup('Batch data not available');
        return;
    }

    const batch = mockData.batches.find(b => b.id === batchId || b.batchId === batchId);

    if (!batch) {
        showErrorPopup(`Batch ${batchId} not found`);
        return;
    }

    const oldStatus = batch.status;
    batch.status = newStatus;
    batch.statusChangeReason = reason;
    batch.statusChangedAt = new Date().toISOString();
    batch.statusChangedBy = getCurrentUser();

    // Save to localStorage
    if (typeof saveToLocalStorage === 'function') {
        saveToLocalStorage();
    }

    // Log to audit
    if (typeof logAuditEvent === 'function') {
        logAuditEvent(
            'STATUS_CHANGE',
            'Batch',
            batchId,
            `Changed batch status from ${oldStatus} to ${newStatus}`,
            oldStatus,
            newStatus,
            reason
        );
    }

    // Refresh batch logger page
    if (typeof renderBatchLogger === 'function') {
        renderBatchLogger();
    }

    // Show success notification
    showSuccessPopup(`Batch ${batchId} status changed to ${newStatus}`);

    console.log(`✅ Batch ${batchId} status changed: ${oldStatus} → ${newStatus}`);
}

// Update manual billing status
function updateManualBillingStatus(itemId, newStatus, reason) {
    if (typeof mockData === 'undefined' || !mockData.manualBilling) {
        showErrorPopup('Manual billing data not available');
        return;
    }

    const item = mockData.manualBilling.find(m => m.id === itemId);

    if (!item) {
        showErrorPopup(`Manual billing ${itemId} not found`);
        return;
    }

    const oldStatus = item.status;
    item.status = newStatus;
    item.statusChangeReason = reason;
    item.statusChangedAt = new Date().toISOString();
    item.statusChangedBy = getCurrentUser();

    // Save to localStorage
    if (typeof saveToLocalStorage === 'function') {
        saveToLocalStorage();
    }

    // Log to audit
    if (typeof logAuditEvent === 'function') {
        logAuditEvent(
            'STATUS_CHANGE',
            'Manual Billing',
            itemId,
            `Changed manual billing status from ${oldStatus} to ${newStatus}`,
            oldStatus,
            newStatus,
            reason
        );
    }

    // Refresh manual billing page
    if (typeof renderManualBilling === 'function') {
        renderManualBilling();
    }

    // Show success notification
    showSuccessPopup(`Manual billing ${itemId} status changed to ${newStatus}`);

    console.log(`✅ Manual billing ${itemId} status changed: ${oldStatus} → ${newStatus}`);
}

// Get current user (helper function)
function getCurrentUser() {
    if (typeof currentUser !== 'undefined' && currentUser) {
        return `${currentUser.firstName} ${currentUser.lastName}`;
    }
    return 'System User';
}

// Initialize status change system
function initStatusChangeSystem() {
    // Attach form submit handler
    const form = document.getElementById('changeStatusForm');
    if (form) {
        form.addEventListener('submit', handleStatusChangeSubmit);
        console.log('✅ Status change form handler attached');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        setTimeout(initStatusChangeSystem, 1000);
    });
} else {
    setTimeout(initStatusChangeSystem, 1000);
}

console.log('✅ Status change system loaded!');
