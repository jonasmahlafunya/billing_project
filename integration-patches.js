// ===================================
// INTEGRATION PATCHES
// Connects new features with existing code
// ===================================

// Patch 1: Override viewInvoice function to use new loadInvoiceData
// ===================================

(function () {
    // Store original viewInvoice if it exists
    const originalViewInvoice = window.viewInvoice;

    // Override with new implementation
    window.viewInvoice = function (invoiceId) {
        if (typeof loadInvoiceData === 'function') {
            loadInvoiceData(invoiceId);
        } else if (originalViewInvoice) {
            originalViewInvoice(invoiceId);
        } else {
            console.error('No invoice viewing function available');
        }
    };
})();

// Patch 2: Add pagination to Companies table
// ===================================

(function () {
    const originalRenderCompanies = window.renderCompanies;

    if (originalRenderCompanies) {
        window.renderCompanies = function () {
            // Call original function
            originalRenderCompanies();

            // Add pagination if function exists
            if (typeof renderPaginationControls === 'function' && typeof mockData !== 'undefined') {
                const filteredCompanies = getFilteredCompanies ? getFilteredCompanies() : mockData.companies;

                // Add pagination container if it doesn't exist
                const table = document.getElementById('companiesTable');
                if (table && !document.getElementById('companiesPagination')) {
                    const paginationDiv = document.createElement('div');
                    paginationDiv.id = 'companiesPagination';
                    table.parentNode.insertBefore(paginationDiv, table.nextSibling);
                }

                renderPaginationControls('companiesPagination', filteredCompanies.length, 'companies');
            }
        };
    }
})();

// Patch 3: Add pagination to Transactions table
// ===================================

(function () {
    const originalRenderTransactions = window.renderTransactions;

    if (originalRenderTransactions) {
        window.renderTransactions = function () {
            originalRenderTransactions();

            if (typeof renderPaginationControls === 'function' && typeof mockData !== 'undefined') {
                const filteredTransactions = getFilteredTransactions ? getFilteredTransactions() : mockData.transactions;

                const table = document.getElementById('transactionsTable');
                if (table && !document.getElementById('transactionsPagination')) {
                    const paginationDiv = document.createElement('div');
                    paginationDiv.id = 'transactionsPagination';
                    table.parentNode.insertBefore(paginationDiv, table.nextSibling);
                }

                renderPaginationControls('transactionsPagination', filteredTransactions.length, 'transactions');
            }
        };
    }
})();

// Patch 4: Add pagination to Invoices table
// ===================================

(function () {
    const originalRenderInvoices = window.renderInvoices;

    if (originalRenderInvoices) {
        window.renderInvoices = function () {
            originalRenderInvoices();

            if (typeof renderPaginationControls === 'function' && typeof mockData !== 'undefined') {
                const filteredInvoices = getFilteredInvoices ? getFilteredInvoices() : mockData.invoices;

                const table = document.getElementById('invoicesTable');
                if (table && !document.getElementById('invoicesPagination')) {
                    const paginationDiv = document.createElement('div');
                    paginationDiv.id = 'invoicesPagination';
                    table.parentNode.insertBefore(paginationDiv, table.nextSibling);
                }

                renderPaginationControls('invoicesPagination', filteredInvoices.length, 'invoices');
            }
        };
    }
})();

// Patch 5: Add pagination to Usage table
// ===================================

(function () {
    const originalRenderUsage = window.renderUsage;

    if (originalRenderUsage) {
        window.renderUsage = function () {
            originalRenderUsage();

            if (typeof renderPaginationControls === 'function' && typeof mockData !== 'undefined') {
                const table = document.getElementById('usageTable');
                if (table && !document.getElementById('usagePagination')) {
                    const paginationDiv = document.createElement('div');
                    paginationDiv.id = 'usagePagination';
                    table.parentNode.insertBefore(paginationDiv, table.nextSibling);
                }

                renderPaginationControls('usagePagination', mockData.usage.length, 'usage');
            }
        };
    }
})();

// Patch 6: Add pagination to Pricing table
// ===================================

(function () {
    const originalRenderPricing = window.renderPricing;

    if (originalRenderPricing) {
        window.renderPricing = function () {
            originalRenderPricing();

            if (typeof renderPaginationControls === 'function' && typeof mockData !== 'undefined') {
                const filteredPricing = getFilteredPricing ? getFilteredPricing() : mockData.pricing;

                const table = document.getElementById('pricingTable');
                if (table && !document.getElementById('pricingPagination')) {
                    const paginationDiv = document.createElement('div');
                    paginationDiv.id = 'pricingPagination';
                    table.parentNode.insertBefore(paginationDiv, table.nextSibling);
                }

                renderPaginationControls('pricingPagination', filteredPricing.length, 'pricing');
            }
        };
    }
})();

// Patch 7: Add pagination to Leads table
// ===================================

(function () {
    const originalRenderLeads = window.renderLeads;

    if (originalRenderLeads) {
        window.renderLeads = function () {
            originalRenderLeads();

            if (typeof renderPaginationControls === 'function' && typeof mockData !== 'undefined') {
                const filteredLeads = getFilteredLeads ? getFilteredLeads() : mockData.leads;

                const table = document.getElementById('leadsTable');
                if (table && !document.getElementById('leadsPagination')) {
                    const paginationDiv = document.createElement('div');
                    paginationDiv.id = 'leadsPagination';
                    table.parentNode.insertBefore(paginationDiv, table.nextSibling);
                }

                renderPaginationControls('leadsPagination', filteredLeads.length, 'leads');
            }
        };
    }
})();

// Patch 8: Hook into Run Billing button
// ===================================

document.addEventListener('DOMContentLoaded', function () {
    // Find Run Billing button
    const runBillingBtn = document.querySelector('#runBillingBtn, button[onclick*="runBilling"]');

    if (runBillingBtn && typeof runBillingConsolidated === 'function') {
        runBillingBtn.onclick = function (e) {
            e.preventDefault();
            runBillingConsolidated();
        };
    }
});

// Patch 9: Initialize Authorization Tabs on page load
// ===================================

document.addEventListener('DOMContentLoaded', function () {
    if (typeof initAuthorizationTabs === 'function') {
        setTimeout(initAuthorizationTabs, 500);
    }
});

// Patch 10: Add invoice status change listener
// ===================================

document.addEventListener('DOMContentLoaded', function () {
    // Listen for changes on invoice status dropdowns
    document.addEventListener('change', function (e) {
        if (e.target.name === 'status' || e.target.classList.contains('invoice-status')) {
            const row = e.target.closest('tr');
            if (row) {
                const invoiceId = row.dataset.invoiceId || row.querySelector('[data-invoice-id]')?.dataset.invoiceId;
                if (invoiceId && typeof updateInvoiceStatus === 'function') {
                    updateInvoiceStatus(invoiceId, e.target.value);
                }
            }
        }
    });
});

// Patch 11: Ensure mockData is available globally
// ===================================

if (typeof window !== 'undefined' && !window.mockData) {
    // Try to get mockData from localStorage
    try {
        const stored = localStorage.getItem('billingData');
        if (stored) {
            window.mockData = JSON.parse(stored);
        }
    } catch (e) {
        console.log('Could not load mockData from localStorage');
    }
}

// Patch 12: Add helper to close invoice modal
// ===================================

document.addEventListener('DOMContentLoaded', function () {
    const closeBtn = document.getElementById('closeInvoiceModal');
    if (closeBtn) {
        closeBtn.onclick = function () {
            document.getElementById('invoiceModal').style.display = 'none';
        };
    }
});

console.log('✅ Integration patches loaded successfully');
