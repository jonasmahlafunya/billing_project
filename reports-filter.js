// ===================================
// REPORTS DATE FILTER
// Replace month filter with date range
// ===================================

console.log('🔧 Loading reports date filter...');

function initReportsDateFilter() {
    console.log('🔧 Initializing reports date filter...');

    // Get filter elements
    const startDateInput = document.getElementById('reportsStartDate');
    const endDateInput = document.getElementById('reportsEndDate');
    const applyFilterBtn = document.getElementById('applyReportsFilter');
    const clearFilterBtn = document.getElementById('clearReportsFilter');

    if (!startDateInput || !endDateInput) {
        console.warn('Date filter inputs not found');
        return;
    }

    // Apply filter
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', function () {
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;

            if (!startDate || !endDate) {
                if (typeof showNotification === 'function') {
                    showNotification('Please select both start and end dates', 'warning');
                }
                return;
            }

            console.log(`Filtering invoices from ${startDate} to ${endDate}`);
            filterInvoicesByDateRange(startDate, endDate);
        });
    }

    // Clear filter
    if (clearFilterBtn) {
        clearFilterBtn.addEventListener('click', function () {
            startDateInput.value = '';
            endDateInput.value = '';

            console.log('Clearing date filter');

            // Re-render invoices without filter
            if (typeof renderInvoices === 'function') {
                renderInvoices();
            }

            if (typeof showNotification === 'function') {
                showNotification('Filter cleared', 'success');
            }
        });
    }

    console.log('✅ Reports date filter initialized!');
}

function filterInvoicesByDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!window.mockData || !window.mockData.invoices) {
        console.error('mockData not available');
        return;
    }

    // Store original invoices if not already stored
    if (!window.originalInvoices) {
        window.originalInvoices = [...window.mockData.invoices];
    }

    // Filter invoices by date range
    const filtered = window.originalInvoices.filter(invoice => {
        // Parse invoice date (handle different formats)
        let invoiceDate;

        if (invoice.dateIssued) {
            invoiceDate = new Date(invoice.dateIssued);
        } else if (invoice.date) {
            invoiceDate = new Date(invoice.date);
        } else if (invoice.dueDate) {
            // Parse DD/MM/YYYY format
            const parts = invoice.dueDate.split('/');
            if (parts.length === 3) {
                invoiceDate = new Date(parts[2], parts[1] - 1, parts[0]);
            } else {
                invoiceDate = new Date(invoice.dueDate);
            }
        } else {
            return false;
        }

        return invoiceDate >= start && invoiceDate <= end;
    });

    console.log(`Filtered ${filtered.length} invoices out of ${window.originalInvoices.length}`);

    // Temporarily replace invoices with filtered ones
    window.mockData.invoices = filtered;

    // Re-render invoices
    if (typeof renderInvoices === 'function') {
        renderInvoices();
    }

    if (typeof showNotification === 'function') {
        showNotification(`Showing ${filtered.length} invoices`, 'success');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        setTimeout(initReportsDateFilter, 1000);
    });
} else {
    setTimeout(initReportsDateFilter, 1000);
}

console.log('✅ Reports date filter loaded!');
