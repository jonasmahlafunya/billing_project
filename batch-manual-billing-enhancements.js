// ===================================
// BATCH & MANUAL BILLING ENHANCEMENTS
// Adds Change Status buttons and integrates pagination
// ===================================

console.log('🔧 Loading batch & manual billing enhancements...');

// Override renderBatchLogger to add Change Status buttons
function enhanceRenderBatchLogger() {
    const originalRenderBatchLogger = window.renderBatchLogger;

    if (!originalRenderBatchLogger) {
        console.warn('renderBatchLogger function not found');
        return;
    }

    window.renderBatchLogger = function () {
        // Get all batches
        const allBatches = mockData.batches || [];

        // Get paginated data
        let displayBatches = allBatches;
        if (typeof getPaginatedData === 'function') {
            displayBatches = getPaginatedData(allBatches, 'batchesTable', 10);
        }

        // Temporarily replace with paginated data
        const originalData = mockData.batches;
        mockData.batches = displayBatches;

        // Call original function
        originalRenderBatchLogger();

        // Restore original data
        mockData.batches = originalData;

        // Add Change Status buttons to rejected batches
        addChangeStatusButtons('batch');

        // Render pagination
        if (typeof renderPaginationControls === 'function') {
            renderPaginationControls('batchesTable', 'batchesPagination');
        }

        console.log(`Rendered ${displayBatches.length} batches with pagination`);
    };
}

// Override renderManualBilling to add Change Status buttons
function enhanceRenderManualBilling() {
    const originalRenderManualBilling = window.renderManualBilling;

    if (!originalRenderManualBilling) {
        console.warn('renderManualBilling function not found');
        return;
    }

    window.renderManualBilling = function () {
        // Get all manual billing items
        const allItems = mockData.manualBilling || [];

        // Get paginated data
        let displayItems = allItems;
        if (typeof getPaginatedData === 'function') {
            displayItems = getPaginatedData(allItems, 'manualBillingTable', 10);
        }

        // Temporarily replace with paginated data
        const originalData = mockData.manualBilling;
        mockData.manualBilling = displayItems;

        // Call original function
        originalRenderManualBilling();

        // Restore original data
        mockData.manualBilling = originalData;

        // Add Change Status buttons to rejected items
        addChangeStatusButtons('manual-billing');

        // Render pagination
        if (typeof renderPaginationControls === 'function') {
            renderPaginationControls('manualBillingTable', 'manualBillingPagination');
        }

        console.log(`Rendered ${displayItems.length} manual billing items with pagination`);
    };
}

// Add Change Status buttons to table rows
function addChangeStatusButtons(type) {
    const tableId = type === 'batch' ? 'batchesTableBody' : 'manualBillingTableBody';
    const tbody = document.getElementById(tableId);

    if (!tbody) {
        console.warn(`Table body not found: ${tableId}`);
        return;
    }

    const rows = tbody.querySelectorAll('tr');

    rows.forEach(row => {
        // Find status cell
        const statusCell = row.querySelector('td:has(.status-indicator), td:nth-child(4)');
        if (!statusCell) return;

        // Check if status is Rejected
        const statusText = statusCell.textContent.trim().toLowerCase();

        if (statusText.includes('rejected')) {
            // Get item ID from row
            const firstCell = row.querySelector('td:first-child');
            const itemId = firstCell ? firstCell.textContent.trim() : null;

            if (!itemId) return;

            // Check if button already exists
            if (row.querySelector('.change-status-btn')) return;

            // Add action cell or find existing one
            let actionCell = row.querySelector('td:last-child');

            // If last cell doesn't have buttons, create new cell
            if (!actionCell.querySelector('button')) {
                actionCell = document.createElement('td');
                row.appendChild(actionCell);
            }

            // Create Change Status button
            const button = document.createElement('button');
            button.className = 'change-status-btn rejected';
            button.textContent = 'Change Status';
            button.onclick = function (e) {
                e.preventDefault();
                e.stopPropagation();

                const entityType = type === 'batch' ? 'Batch' : 'Manual Billing';
                openStatusChangeModal(entityType, itemId, 'Rejected');
            };

            // Add button to cell
            if (actionCell.querySelector('button')) {
                actionCell.appendChild(document.createTextNode(' '));
            }
            actionCell.appendChild(button);
        }
    });

    console.log(`✅ Added Change Status buttons to ${type} table`);
}

// Initialize enhancements
function initBatchManualBillingEnhancements() {
    console.log('🔧 Initializing batch & manual billing enhancements...');

    enhanceRenderBatchLogger();
    enhanceRenderManualBilling();

    console.log('✅ Batch & manual billing enhancements initialized');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        setTimeout(initBatchManualBillingEnhancements, 2000);
    });
} else {
    setTimeout(initBatchManualBillingEnhancements, 2000);
}

console.log('✅ Batch & manual billing enhancements loaded!');
