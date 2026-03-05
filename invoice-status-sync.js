// ===================================
// INVOICE STATUS SYNC
// Auto-move invoices between tabs when status changes
// ===================================

console.log('🔧 Loading invoice status sync...');

// Store original updateInvoiceStatus if it exists
const originalUpdateInvoiceStatus = window.updateInvoiceStatus;

// Override or create updateInvoiceStatus function
window.updateInvoiceStatus = function (invoiceId, newStatus) {
    console.log(`🔧 Invoice status changing: ${invoiceId} → ${newStatus}`);

    // Find the invoice
    const invoice = mockData.invoices.find(inv =>
        inv.id === invoiceId || inv.invoiceNumber === invoiceId
    );

    if (!invoice) {
        console.error('Invoice not found:', invoiceId);
        return;
    }

    // Store old status
    const oldStatus = invoice.status;

    // Update status
    invoice.status = newStatus;

    // Save to localStorage
    if (typeof saveToLocalStorage === 'function') {
        saveToLocalStorage();
    }

    console.log(`✅ Invoice status updated: ${oldStatus} → ${newStatus}`);

    // If on Reports page, refresh the current tab
    if (window.currentPage === 'reports') {
        console.log('Refreshing Reports page...');

        // Determine which tab is active
        const activeTab = document.querySelector('[data-tab].active');
        const currentTab = activeTab ? activeTab.getAttribute('data-tab') : 'unpaid';

        // Re-render invoices
        if (typeof renderInvoices === 'function') {
            renderInvoices();
        }

        // Show notification
        if (typeof showNotification === 'function') {
            showNotification(`Invoice moved to ${newStatus} tab`, 'success');
        }
    }

    // If on Dashboard, refresh it
    if (window.currentPage === 'dashboard') {
        if (typeof renderDashboard === 'function') {
            renderDashboard();
        }
    }

    // Call original function if it existed
    if (originalUpdateInvoiceStatus && originalUpdateInvoiceStatus !== window.updateInvoiceStatus) {
        try {
            originalUpdateInvoiceStatus(invoiceId, newStatus);
        } catch (e) {
            console.error('Error calling original updateInvoiceStatus:', e);
        }
    }
};

// Listen for invoice status changes from modal
function initInvoiceStatusListener() {
    // Find invoice status select in modal
    const statusSelect = document.getElementById('invoiceStatusSelect');

    if (statusSelect) {
        statusSelect.addEventListener('change', function () {
            const newStatus = this.value;
            const invoiceNumber = document.getElementById('invoiceNumber');

            if (invoiceNumber) {
                const invoiceId = invoiceNumber.textContent;
                console.log(`Status changed in modal: ${invoiceId} → ${newStatus}`);

                // Update invoice status
                updateInvoiceStatus(invoiceId, newStatus);

                // Close modal after a brief delay
                setTimeout(() => {
                    const modal = document.getElementById('invoiceModal');
                    if (modal) {
                        modal.style.display = 'none';
                    }
                }, 500);
            }
        });

        console.log('✅ Invoice status listener attached to modal');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        setTimeout(initInvoiceStatusListener, 1000);
    });
} else {
    setTimeout(initInvoiceStatusListener, 1000);
}

console.log('✅ Invoice status sync loaded!');
