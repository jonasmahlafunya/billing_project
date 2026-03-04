// ===================================
// USAGE TABLE PAGINATION OVERRIDE
// Limit to 9 items per page
// ===================================

console.log('🔧 Loading usage table pagination override...');

// Override usage table pagination to show only 9 items
function overrideUsagePagination() {
    const originalGetPaginatedData = window.getPaginatedData;

    if (!originalGetPaginatedData) {
        console.warn('getPaginatedData function not found');
        return;
    }

    window.getPaginatedData = function (data, tableId, itemsPerPage) {
        // For usage table, always use 9 items per page
        if (tableId === 'usageTable') {
            itemsPerPage = 9;
        }

        // Call original function with potentially modified itemsPerPage
        return originalGetPaginatedData(data, tableId, itemsPerPage);
    };

    console.log('✅ Usage table pagination set to 9 items per page');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        setTimeout(overrideUsagePagination, 1000);
    });
} else {
    setTimeout(overrideUsagePagination, 1000);
}

console.log('✅ Usage table pagination override loaded!');
