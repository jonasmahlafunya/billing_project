// ===================================
// PAGINATION INTEGRATION
// Connects numbered pagination to existing render functions
// ===================================

console.log('🔧 Loading pagination integration...');

// Override existing render functions to use numbered pagination
function integrateNumberedPagination() {

    // Store original render functions
    const originalRenderTransactions = window.renderTransactions;
    const originalRenderInvoices = window.renderInvoices;
    const originalRenderCompanies = window.renderCompanies;
    const originalRenderPricing = window.renderPricing;
    const originalRenderUsage = window.renderUsage;
    const originalRenderPricedTransactions = window.renderPricedTransactions;

    // Override renderTransactions
    if (typeof originalRenderTransactions === 'function') {
        window.renderTransactions = function () {
            // Get all transactions
            const allTransactions = mockData.transactions || [];

            // Get paginated data
            const paginatedData = getPaginatedData(allTransactions, 'transactionsTable', 10);

            // Temporarily replace mockData.transactions with paginated data
            const originalData = mockData.transactions;
            mockData.transactions = paginatedData;

            // Call original render function
            originalRenderTransactions();

            // Restore original data
            mockData.transactions = originalData;

            // Render pagination controls
            renderPaginationControls('transactionsTable', 'transactionsPagination');
        };
    }

    // Override renderInvoices
    if (typeof originalRenderInvoices === 'function') {
        window.renderInvoices = function () {
            // Get all invoices
            const allInvoices = mockData.invoices || [];

            // Get paginated data
            const paginatedData = getPaginatedData(allInvoices, 'invoicesTable', 10);

            // Temporarily replace mockData.invoices with paginated data
            const originalData = mockData.invoices;
            mockData.invoices = paginatedData;

            // Call original render function
            originalRenderInvoices();

            // Restore original data
            mockData.invoices = originalData;

            // Render pagination controls
            renderPaginationControls('invoicesTable', 'invoicesPagination');
        };
    }

    // Override renderCompanies
    if (typeof originalRenderCompanies === 'function') {
        window.renderCompanies = function () {
            // Get all companies
            const allCompanies = mockData.companies || [];

            // Get paginated data
            const paginatedData = getPaginatedData(allCompanies, 'companiesTable', 10);

            // Temporarily replace mockData.companies with paginated data
            const originalData = mockData.companies;
            mockData.companies = paginatedData;

            // Call original render function
            originalRenderCompanies();

            // Restore original data
            mockData.companies = originalData;

            // Render pagination controls
            renderPaginationControls('companiesTable', 'companiesPagination');
        };
    }

    // Override renderPricing
    if (typeof originalRenderPricing === 'function') {
        window.renderPricing = function () {
            // Get all pricing
            const allPricing = mockData.pricing || [];

            // Get paginated data
            const paginatedData = getPaginatedData(allPricing, 'pricingTable', 10);

            // Temporarily replace mockData.pricing with paginated data
            const originalData = mockData.pricing;
            mockData.pricing = paginatedData;

            // Call original render function
            originalRenderPricing();

            // Restore original data
            mockData.pricing = originalData;

            // Render pagination controls
            renderPaginationControls('pricingTable', 'pricingPagination');
        };
    }

    // Override renderUsage
    if (typeof originalRenderUsage === 'function') {
        window.renderUsage = function () {
            // Get all usage
            const allUsage = mockData.usage || [];

            // Get paginated data
            const paginatedData = getPaginatedData(allUsage, 'usageTable', 10);

            // Temporarily replace mockData.usage with paginated data
            const originalData = mockData.usage;
            mockData.usage = paginatedData;

            // Call original render function
            originalRenderUsage();

            // Restore original data
            mockData.usage = originalData;

            // Render pagination controls
            renderPaginationControls('usageTable', 'usagePagination');
        };
    }

    // Override renderPricedTransactions
    if (typeof originalRenderPricedTransactions === 'function') {
        window.renderPricedTransactions = function () {
            // Get all priced transactions
            const allPricedTransactions = mockData.pricedTransactions || [];

            // Get paginated data
            const paginatedData = getPaginatedData(allPricedTransactions, 'pricedTransactionsTable', 10);

            // Temporarily replace mockData.pricedTransactions with paginated data
            const originalData = mockData.pricedTransactions;
            mockData.pricedTransactions = paginatedData;

            // Call original render function
            originalRenderPricedTransactions();

            // Restore original data
            mockData.pricedTransactions = originalData;

            // Render pagination controls
            renderPaginationControls('pricedTransactionsTable', 'pricedTransactionsPagination');
        };
    }

    console.log('✅ Pagination integrated with render functions');
}

// Initialize integration when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        setTimeout(integrateNumberedPagination, 1500);
    });
} else {
    setTimeout(integrateNumberedPagination, 1500);
}

console.log('✅ Pagination integration loaded!');
