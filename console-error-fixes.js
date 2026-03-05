// ===================================
// CONSOLE ERROR FIXES
// Fixes common JavaScript errors
// ===================================

// Fix 1: Ensure mockData is available globally
// ===================================
// NOTE: mockData is declared in app.js, so we don't initialize it here
// This prevents "Identifier 'mockData' has already been declared" error

// if (typeof window !== 'undefined') {
//     // Initialize mockData if not exists
//     if (!window.mockData) {
//         window.mockData = {
//             companies: [],
//             transactions: [],
//             manualBilling: [],
//             batches: [],
//             usage: [],
//             pricing: [],
//             pricedTransactions: [],
//             leads: [],
//             activities: [],
//             supportTickets: [],
//             campaigns: [],
//             users: [],
//             auditLogs: [],
//             exceptions: [],
//             notifications: [],
//             waitingRoom: [],
//             invoices: [],
//             companyUsers: []
//         };
//
//         // Try to load from localStorage
//         try {
//             const stored = localStorage.getItem('billingData');
//             if (stored) {
//                 const parsed = JSON.parse(stored);
//                 window.mockData = parsed;
//             }
//         } catch (e) {
//             console.log('No stored data found, using empty mockData');
//         }
//     }
// }


// Fix 2: Safe function wrappers
// ===================================

// Safe getFilteredCompanies
if (typeof window !== 'undefined' && !window.getFilteredCompanies) {
    window.getFilteredCompanies = function () {
        if (typeof mockData !== 'undefined' && mockData.companies) {
            return mockData.companies;
        }
        return [];
    };
}

// Safe getFilteredTransactions
if (typeof window !== 'undefined' && !window.getFilteredTransactions) {
    window.getFilteredTransactions = function () {
        if (typeof mockData !== 'undefined' && mockData.transactions) {
            return mockData.transactions;
        }
        return [];
    };
}

// Safe getFilteredInvoices
if (typeof window !== 'undefined' && !window.getFilteredInvoices) {
    window.getFilteredInvoices = function () {
        if (typeof mockData !== 'undefined' && mockData.invoices) {
            return mockData.invoices;
        }
        return [];
    };
}

// Safe getFilteredPricing
if (typeof window !== 'undefined' && !window.getFilteredPricing) {
    window.getFilteredPricing = function () {
        if (typeof mockData !== 'undefined' && mockData.pricing) {
            return mockData.pricing;
        }
        return [];
    };
}

// Safe getFilteredLeads
if (typeof window !== 'undefined' && !window.getFilteredLeads) {
    window.getFilteredLeads = function () {
        if (typeof mockData !== 'undefined' && mockData.leads) {
            return mockData.leads;
        }
        return [];
    };
}

// Fix 3: Safe saveToLocalStorage
// ===================================

if (typeof window !== 'undefined' && !window.saveToLocalStorage) {
    window.saveToLocalStorage = function () {
        try {
            if (typeof mockData !== 'undefined') {
                localStorage.setItem('billingData', JSON.stringify(mockData));
            }
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
    };
}

// Fix 4: Safe showNotification
// ===================================

if (typeof window !== 'undefined' && !window.showNotification) {
    window.showNotification = function (message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);

        // Try to show toast if function exists
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        }
    };
}

// Fix 5: Safe currentPage variable
// ===================================

if (typeof window !== 'undefined' && typeof window.currentPage === 'undefined') {
    window.currentPage = 'dashboard';
}

// Fix 6: Ensure render functions exist
// ===================================

const safeRenderFunctions = [
    'renderDashboard',
    'renderCompanies',
    'renderTransactions',
    'renderInvoices',
    'renderUsage',
    'renderPricing',
    'renderLeads',
    'renderActivities',
    'renderSupport',
    'renderMarketing',
    'renderRunBilling',
    'renderPricedTransactions',
    'renderBatches',
    'renderManualBilling',
    'renderExceptions',
    'renderWaitingRoom',
    'renderUsers',
    'renderUnauthorizedUsers',
    'renderAuditLogs',
    'renderCompanyUsers'
];

safeRenderFunctions.forEach(funcName => {
    if (typeof window !== 'undefined' && typeof window[funcName] === 'undefined') {
        window[funcName] = function () {
            console.log(`${funcName} called but not yet implemented`);
        };
    }
});

// Fix 7: Safe pagination function calls
// ===================================

// Wrap changePage to handle errors
if (typeof window !== 'undefined' && typeof window.changePage !== 'undefined') {
    const originalChangePage = window.changePage;

    window.changePage = function (tableKey, newPage) {
        try {
            originalChangePage(tableKey, newPage);
        } catch (e) {
            console.error(`Error changing page for ${tableKey}:`, e);
        }
    };
}

// Fix 8: Prevent duplicate pagination containers
// ===================================

if (typeof window !== 'undefined') {
    window.ensurePaginationContainer = function (containerId, tableElement) {
        let container = document.getElementById(containerId);

        if (!container && tableElement) {
            container = document.createElement('div');
            container.id = containerId;

            // Insert after table's parent (usually a card or section)
            const parent = tableElement.parentNode;
            if (parent.nextSibling) {
                parent.parentNode.insertBefore(container, parent.nextSibling);
            } else {
                parent.parentNode.appendChild(container);
            }
        }

        return container;
    };
}

// Fix 9: Handle missing invoice modal elements
// ===================================

document.addEventListener('DOMContentLoaded', function () {
    const requiredElements = [
        'invoiceModal',
        'invoiceNumber',
        'invoiceDate',
        'invoiceDueDate',
        'invoiceTerms',
        'invoiceStatusBadge',
        'invoiceStatusText',
        'invoiceClientName',
        'invoiceClientContact',
        'invoiceClientEmail',
        'invoiceClientPhone',
        'invoiceClientTaxId',
        'invoiceClientAddress',
        'invoiceLineItems',
        'invoiceSubtotal',
        'invoiceDiscount',
        'invoiceTotal',
        'invoicePaid',
        'invoiceOutstanding'
    ];

    const missing = [];
    requiredElements.forEach(id => {
        if (!document.getElementById(id)) {
            missing.push(id);
        }
    });

    if (missing.length > 0) {
        console.warn('Missing invoice modal elements:', missing);
    }
});

// Fix 10: Safe authorization tab initialization
// ===================================

if (typeof window !== 'undefined' && typeof window.initAuthorizationTabs !== 'undefined') {
    const originalInitAuthTabs = window.initAuthorizationTabs;

    window.initAuthorizationTabs = function () {
        try {
            // Check if tabs exist
            const tabs = document.querySelectorAll('.auth-tab');
            if (tabs.length === 0) {
                console.log('No authorization tabs found in DOM');
                return;
            }

            originalInitAuthTabs();
        } catch (e) {
            console.error('Error initializing authorization tabs:', e);
        }
    };
}

// Fix 11: Safe invoice data loading
// ===================================

if (typeof window !== 'undefined' && typeof window.loadInvoiceData !== 'undefined') {
    const originalLoadInvoiceData = window.loadInvoiceData;

    window.loadInvoiceData = function (invoiceId) {
        try {
            // Check if invoice modal exists
            const modal = document.getElementById('invoiceModal');
            if (!modal) {
                console.error('Invoice modal not found in DOM');
                return;
            }

            originalLoadInvoiceData(invoiceId);
        } catch (e) {
            console.error('Error loading invoice data:', e);
            // Show error to user
            if (typeof showNotification === 'function') {
                showNotification('Error loading invoice', 'error');
            }
        }
    };
}

// Fix 12: Prevent errors from missing Chart.js
// ===================================

if (typeof window !== 'undefined' && typeof window.Chart === 'undefined') {
    console.warn('Chart.js not loaded - charts will not render');

    // Create dummy Chart object to prevent errors
    window.Chart = function () {
        console.log('Chart.js not available');
        return {
            destroy: function () { },
            update: function () { }
        };
    };
}

// Fix 13: Safe table body access
// ===================================

if (typeof window !== 'undefined') {
    window.safeGetTableBody = function (tableId) {
        const table = document.getElementById(tableId);
        if (!table) {
            console.warn(`Table not found: ${tableId}`);
            return null;
        }

        let tbody = table.querySelector('tbody');
        if (!tbody) {
            console.warn(`Table body not found for: ${tableId}`);
            // Create tbody if missing
            tbody = document.createElement('tbody');
            tbody.id = tableId + 'Body';
            table.appendChild(tbody);
        }

        return tbody;
    };
}

// Fix 14: Catch-all error handler
// ===================================

window.addEventListener('error', function (e) {
    console.error('Global error caught:', e.message, e.filename, e.lineno);
    // Don't prevent default - let errors show in console
});

window.addEventListener('unhandledrejection', function (e) {
    console.error('Unhandled promise rejection:', e.reason);
});

// Fix 15: Log successful loading
// ===================================

console.log('✅ Console error fixes loaded successfully');

// Export for debugging
if (typeof window !== 'undefined') {
    window.debugInfo = function () {
        console.log('=== Debug Information ===');
        console.log('mockData available:', typeof mockData !== 'undefined');
        console.log('mockData companies:', mockData?.companies?.length || 0);
        console.log('currentPage:', currentPage);
        console.log('Functions available:', {
            loadInvoiceData: typeof loadInvoiceData !== 'undefined',
            renderCompanies: typeof renderCompanies !== 'undefined',
            getPaginatedData: typeof getPaginatedData !== 'undefined',
            renderPaginationControls: typeof renderPaginationControls !== 'undefined'
        });
    };
}
