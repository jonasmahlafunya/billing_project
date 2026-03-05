// ===================================
// NUMBERED PAGINATION FOR ALL TABLES
// 10 items per page with page numbers
// ===================================

console.log('🔧 Loading numbered pagination system...');

// Pagination state for all tables
const paginationState = {};

// Initialize pagination for a table
function initTablePagination(tableId, itemsPerPage = 10) {
    if (!paginationState[tableId]) {
        paginationState[tableId] = {
            currentPage: 1,
            itemsPerPage: itemsPerPage,
            totalItems: 0,
            totalPages: 0
        };
    }

    console.log(`Initialized pagination for ${tableId}`);
}

// Get paginated data
function getPaginatedTableData(data, tableId, itemsPerPage = 10) {
    // Check if tableId is a key (legacy) or ID
    if (!tableId.endsWith('Table') && !document.getElementById(tableId)) {
        // It's likely a key like 'pricing', map it
        const tableMap = {
            'companies': 'companiesTable',
            'transactions': 'transactionsTable',
            'invoices': 'invoicesTable',
            'usage': 'usageTable',
            'pricing': 'pricingTable',
            'leads': 'leadsTable',
            'activities': 'activitiesTable',
            'support': 'supportTable',
            'marketing': 'marketingTable',
            'runBilling': 'runBillingTable',
            'pricedTransactions': 'pricedTransactionsTable',
            'batches': 'batchesTable',
            'manualBilling': 'manualBillingTable',
            'exceptions': 'exceptionsTable',
            'waitingRoom': 'waitingRoomTable',
            'users': 'usersTable',
            'auditLogs': 'auditLogsTable',
            'companyUsers': 'companyUsersTable'
        };
        tableId = tableMap[tableId] || tableId + 'Table';
    }

    if (!paginationState[tableId]) {
        initTablePagination(tableId, itemsPerPage);
    }

    const state = paginationState[tableId];
    state.totalItems = data.length;
    state.totalPages = Math.ceil(data.length / itemsPerPage);

    // Ensure current page is valid
    if (state.currentPage > state.totalPages) {
        state.currentPage = state.totalPages || 1;
    }

    const startIndex = (state.currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return data.slice(startIndex, endIndex);
}

// Render pagination controls with page numbers
function renderNumberedPagination(tableId, containerId) {
    // Check for legacy signature: (containerId, totalItems, tableKey)
    if (typeof containerId === 'number' && arguments.length >= 3) {
        const legacyContainerId = tableId; // 1st arg was containerId
        const legacyTableKey = arguments[2]; // 3rd arg was tableKey

        // Map tableKey to tableId
        const tableMap = {
            'companies': 'companiesTable',
            'transactions': 'transactionsTable',
            'invoices': 'invoicesTable',
            'usage': 'usageTable',
            'pricing': 'pricingTable',
            'leads': 'leadsTable',
            'activities': 'activitiesTable',
            'support': 'supportTable',
            'marketing': 'marketingTable',
            'runBilling': 'runBillingTable',
            'pricedTransactions': 'pricedTransactionsTable',
            'batches': 'batchesTable',
            'manualBilling': 'manualBillingTable',
            'exceptions': 'exceptionsTable',
            'waitingRoom': 'waitingRoomTable',
            'users': 'usersTable',
            'auditLogs': 'auditLogsTable',
            'companyUsers': 'companyUsersTable'
        };

        const mappedTableId = tableMap[legacyTableKey] || legacyTableKey + 'Table';
        return renderNumberedPagination(mappedTableId, legacyContainerId);
    }

    const container = document.getElementById(containerId);
    const table = document.getElementById(tableId);

    // Only warn if table exists but container is missing
    if (!container) {
        if (table) {
            console.warn(`Pagination container not found: ${containerId} for table: ${tableId}`);
        }
        return;
    }

    const state = paginationState[tableId];
    if (!state || state.totalPages <= 1) {
        if (container) container.innerHTML = '';
        return;
    }

    const { currentPage, totalPages, totalItems, itemsPerPage } = state;

    // Calculate page numbers to show
    const pageNumbers = getPageNumbers(currentPage, totalPages);

    // Build pagination HTML
    let html = '<div class="pagination-container">';

    // Previous button
    html += `
    <button class="pagination-btn" 
            onclick="changeTablePage('${tableId}', ${currentPage - 1})" 
            ${currentPage === 1 ? 'disabled' : ''}>
      ← Prev
    </button>
  `;

    // Page numbers
    html += '<div class="page-numbers">';

    pageNumbers.forEach(page => {
        if (page === '...') {
            html += '<span class="pagination-ellipsis">...</span>';
        } else {
            html += `
        <button class="page-number ${page === currentPage ? 'active' : ''}" 
                onclick="changeTablePage('${tableId}', ${page})">
          ${page}
        </button>
      `;
        }
    });

    html += '</div>';

    // Next button
    html += `
    <button class="pagination-btn" 
            onclick="changeTablePage('${tableId}', ${currentPage + 1})" 
            ${currentPage === totalPages ? 'disabled' : ''}>
      Next →
    </button>
  `;

    // Info text
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    html += `
    <span class="pagination-info">
      Showing ${startItem}-${endItem} of ${totalItems}
    </span>
  `;

    html += '</div>';

    container.innerHTML = html;
}

// Calculate which page numbers to show
function getPageNumbers(currentPage, totalPages) {
    const pages = [];
    const maxVisible = 7; // Maximum page numbers to show

    if (totalPages <= maxVisible) {
        // Show all pages
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
    } else {
        // Always show first page
        pages.push(1);

        if (currentPage > 3) {
            pages.push('...');
        }

        // Show pages around current page
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (currentPage < totalPages - 2) {
            pages.push('...');
        }

        // Always show last page
        pages.push(totalPages);
    }

    return pages;
}

// Change page
window.changeTablePage = function (tableId, newPage) {
    const state = paginationState[tableId];
    if (!state) return;

    if (newPage < 1 || newPage > state.totalPages) return;

    state.currentPage = newPage;

    console.log(`Changed ${tableId} to page ${newPage}`);

    // Re-render the table based on table type
    const renderFunctions = {
        'companiesTable': 'renderCompanies',
        'transactionsTable': 'renderTransactions',
        'invoicesTable': 'renderInvoices',
        'pricingTable': 'renderPricing',
        'leadsTable': 'renderLeads',
        'activitiesTable': 'renderAllActivities',
        'supportTable': 'renderSupport',
        'usageTable': 'renderUsage',
        'pricedTransactionsTable': 'renderPricedTransactions',
        'batchesTable': 'renderBatchLogger',
        'manualBillingTable': 'renderManualBilling',
        'exceptionsTable': 'renderExceptions',
        'waitingRoomTable': 'renderWaitingRoom',
        'usersTable': 'renderUsers',
        'auditLogsTable': 'renderAuditLogs',
        'companyUsersTable': 'renderCompanyUsers'
    };

    const renderFunc = renderFunctions[tableId];
    if (renderFunc && typeof window[renderFunc] === 'function') {
        window[renderFunc]();
    }

    // Scroll to top of table
    const table = document.getElementById(tableId);
    if (table) {
        table.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

// Override existing pagination functions if they exist
if (typeof window.getPaginatedData !== 'undefined') {
    console.log('Overriding existing pagination with numbered pagination');
}

window.getPaginatedData = getPaginatedTableData;
window.renderPaginationControls = renderNumberedPagination;
window.initPagination = initTablePagination;

// Auto-initialize pagination for all tables
document.addEventListener('DOMContentLoaded', function () {
    const tables = [
        'companiesTable',
        'transactionsTable',
        'invoicesTable',
        'pricingTable',
        'leadsTable',
        'activitiesTable',
        'supportTable',
        'usageTable',
        'pricedTransactionsTable',
        'batchesTable',
        'manualBillingTable',
        'exceptionsTable',
        'waitingRoomTable',
        'usersTable',
        'auditLogsTable',
        'companyUsersTable'
    ];

    tables.forEach(tableId => {
        initTablePagination(tableId, 10);
    });

    console.log('✅ Numbered pagination initialized for all tables');
});

console.log('✅ Numbered pagination system loaded!');
