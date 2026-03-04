// ===================================
// PAGE LAYOUT ENHANCEMENTS
// Adds export buttons to bottom right
// ===================================

console.log('🔧 Loading page layout enhancements...');

// Add export button to page footer
function addExportButton(pageId, tableId, filename) {
    const page = document.getElementById(pageId);
    if (!page) {
        console.warn(`Page not found: ${pageId}`);
        return;
    }

    // Check if footer already exists
    let footer = page.querySelector('.page-footer');
    if (!footer) {
        // Create footer
        footer = document.createElement('div');
        footer.className = 'page-footer';

        // Find the card element and add footer after it
        const card = page.querySelector('.card');
        if (card && card.parentNode) {
            card.parentNode.insertBefore(footer, card.nextSibling);
        } else {
            page.appendChild(footer);
        }
    }

    // Check if export button already exists
    if (footer.querySelector('.export-btn')) {
        return;
    }

    // Create export button
    const exportBtn = document.createElement('button');
    exportBtn.className = 'export-btn';
    exportBtn.textContent = 'Export to CSV';
    exportBtn.onclick = function () {
        if (typeof exportTableToCSV === 'function') {
            exportTableToCSV(tableId, filename);
        } else {
            console.error('exportTableToCSV function not found');
        }
    };

    footer.appendChild(exportBtn);
    console.log(`✅ Added export button to ${pageId}`);
}

// Initialize export buttons for all pages
function initExportButtons() {
    console.log('🔧 Initializing export buttons...');

    const pages = [
        { pageId: 'companies-page', tableId: 'companiesTable', filename: 'companies' },
        { pageId: 'transactions-page', tableId: 'transactionsTable', filename: 'transactions' },
        { pageId: 'reports-page', tableId: 'invoicesTable', filename: 'invoices' },
        { pageId: 'batch-logger-page', tableId: 'batchesTable', filename: 'batches' },
        { pageId: 'manual-billing-page', tableId: 'manualBillingTable', filename: 'manual-billing' },
        { pageId: 'usage-page', tableId: 'usageTable', filename: 'usage' },
        { pageId: 'pricing-page', tableId: 'pricingTable', filename: 'pricing' },
        { pageId: 'priced-transactions-page', tableId: 'pricedTransactionsTable', filename: 'priced-transactions' },
        { pageId: 'leads-page', tableId: 'leadsTable', filename: 'leads' },
        { pageId: 'activities-page', tableId: 'activitiesTable', filename: 'activities' },
        { pageId: 'support-page', tableId: 'supportTable', filename: 'support' },
        { pageId: 'exceptions-page', tableId: 'exceptionsTable', filename: 'exceptions' },
        { pageId: 'waiting-room-page', tableId: 'waitingRoomTable', filename: 'waiting-room' },
        { pageId: 'settings-page', tableId: 'usersTable', filename: 'users' }
    ];

    pages.forEach(({ pageId, tableId, filename }) => {
        addExportButton(pageId, tableId, filename);
    });

    console.log('✅ Export buttons initialized');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        setTimeout(initExportButtons, 2000);
    });
} else {
    setTimeout(initExportButtons, 2000);
}

console.log('✅ Page layout enhancements loaded!');
