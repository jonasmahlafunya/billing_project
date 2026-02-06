// ===================================
// PAGINATION UTILITY
// ===================================

/**
 * Pagination state management
 */
const paginationState = {
    companies: { currentPage: 1, rowsPerPage: 10 },
    transactions: { currentPage: 1, rowsPerPage: 10 },
    invoices: { currentPage: 1, rowsPerPage: 10 },
    usage: { currentPage: 1, rowsPerPage: 10 },
    pricing: { currentPage: 1, rowsPerPage: 10 },
    leads: { currentPage: 1, rowsPerPage: 10 },
    activities: { currentPage: 1, rowsPerPage: 10 },
    support: { currentPage: 1, rowsPerPage: 10 },
    marketing: { currentPage: 1, rowsPerPage: 10 },
    runBilling: { currentPage: 1, rowsPerPage: 10 },
    pricedTransactions: { currentPage: 1, rowsPerPage: 10 },
    batches: { currentPage: 1, rowsPerPage: 10 },
    manualBilling: { currentPage: 1, rowsPerPage: 10 },
    exceptions: { currentPage: 1, rowsPerPage: 10 },
    waitingRoom: { currentPage: 1, rowsPerPage: 10 },
    users: { currentPage: 1, rowsPerPage: 10 },
    unauthorizedUsers: { currentPage: 1, rowsPerPage: 10 },
    auditLogs: { currentPage: 1, rowsPerPage: 10 },
    authManualBilling: { currentPage: 1, rowsPerPage: 10 },
    authBatches: { currentPage: 1, rowsPerPage: 10 },
    authRejected: { currentPage: 1, rowsPerPage: 10 },
    companyUsers: { currentPage: 1, rowsPerPage: 10 }
};

/**
 * Get paginated data
 */
function getPaginatedData(data, tableKey) {
    const state = paginationState[tableKey] || { currentPage: 1, rowsPerPage: 10 };
    const startIndex = (state.currentPage - 1) * state.rowsPerPage;
    const endIndex = startIndex + state.rowsPerPage;
    return data.slice(startIndex, endIndex);
}

/**
 * Render pagination controls
 */
function renderPaginationControls(containerId, totalItems, tableKey) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const state = paginationState[tableKey] || { currentPage: 1, rowsPerPage: 10 };
    const totalPages = Math.ceil(totalItems / state.rowsPerPage);

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    const currentPage = state.currentPage;
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    let html = '<div class="pagination-controls">';

    // Previous button
    html += '<button class="pagination-btn' + (currentPage === 1 ? ' disabled' : '') + '" onclick="changePage(\'' + tableKey + '\', ' + (currentPage - 1) + ')" ' + (currentPage === 1 ? 'disabled' : '') + '>';
    html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M15 18l-6-6 6-6"/></svg></button>';

    // First page
    if (startPage > 1) {
        html += '<button class="pagination-btn" onclick="changePage(\'' + tableKey + '\', 1)">1</button>';
        if (startPage > 2) {
            html += '<span class="pagination-ellipsis">...</span>';
        }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        html += '<button class="pagination-btn' + (i === currentPage ? ' active' : '') + '" onclick="changePage(\'' + tableKey + '\', ' + i + ')">' + i + '</button>';
    }

    // Last page
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += '<span class="pagination-ellipsis">...</span>';
        }
        html += '<button class="pagination-btn" onclick="changePage(\'' + tableKey + '\', ' + totalPages + ')">' + totalPages + '</button>';
    }

    // Next button
    html += '<button class="pagination-btn' + (currentPage === totalPages ? ' disabled' : '') + '" onclick="changePage(\'' + tableKey + '\', ' + (currentPage + 1) + ')" ' + (currentPage === totalPages ? 'disabled' : '') + '>';
    html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M9 18l6-6-6-6"/></svg></button>';

    html += '</div>';

    container.innerHTML = html;
}

/**
 * Change page
 */
function changePage(tableKey, newPage) {
    const state = paginationState[tableKey];
    if (!state) return;

    state.currentPage = newPage;

    // Re-render the appropriate table
    switch (tableKey) {
        case 'companies': renderCompanies(); break;
        case 'transactions': renderTransactions(); break;
        case 'invoices': renderInvoices(); break;
        case 'usage': renderUsage(); break;
        case 'pricing': renderPricing(); break;
        case 'leads': renderLeads(); break;
        case 'activities': renderActivities(); break;
        case 'support': renderSupport(); break;
        case 'marketing': renderMarketing(); break;
        case 'runBilling': renderRunBilling(); break;
        case 'pricedTransactions': renderPricedTransactions(); break;
        case 'batches': renderBatches(); break;
        case 'manualBilling': renderManualBilling(); break;
        case 'exceptions': renderExceptions(); break;
        case 'waitingRoom': renderWaitingRoom(); break;
        case 'users': renderUsers(); break;
        case 'unauthorizedUsers': renderUnauthorizedUsers(); break;
        case 'auditLogs': renderAuditLogs(); break;
        case 'authManualBilling': renderAuthManualBilling(); break;
        case 'authBatches': renderAuthBatches(); break;
        case 'authRejected': renderAuthRejected(); break;
        case 'companyUsers': renderCompanyUsers(); break;
    }
}

/**
 * Reset pagination for a table
 */
function resetPagination(tableKey) {
    if (paginationState[tableKey]) {
        paginationState[tableKey].currentPage = 1;
    }
}
