// document-utils-fixed.js - Patched version
// Replace your current document-utils.js with this

console.log('Loading patched document-utils.js');

/**
 * SAFE: Populate billing company info
 * Checks if elements exist before manipulating
 */
function populateBillingCompanyInfo() {
    console.log('Populating billing company info (safe version)...');

    // Define all possible element IDs
    const elementIds = [
        'billingCompanyName',
        'billingCompanyAddress',
        'billingCompanyEmail',
        'billingCompanyPhone',
        'billingCompanyReg',
        'billingCompanyTax',
        'billingCompanyContact'
    ];

    // Company data
    const companyData = {
        billingCompanyName: 'Acme Corporation',
        billingCompanyAddress: '123 Main St, Sandton, Johannesburg',
        billingCompanyEmail: 'billing@acme.com',
        billingCompanyPhone: '+27 11 123 4567',
        billingCompanyReg: '2020/123456/07',
        billingCompanyTax: '9012345678',
        billingCompanyContact: 'John Smith'
    };

    let populatedCount = 0;

    // Populate each element if it exists
    elementIds.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element && companyData[elementId]) {
            element.textContent = companyData[elementId];
            populatedCount++;
        }
    });

    console.log(`Populated ${populatedCount} billing info elements`);

    // If no elements were found, log a warning
    if (populatedCount === 0) {
        console.warn('No billing company info elements found on this page');
    }
}

/**
 * SAFE: Populate dashboard metrics
 */
function populateDashboardMetrics() {
    const metrics = {
        totalRevenue: 'R 45,000.00',
        collectionRate: '92.5%',
        totalCompanies: '12',
        invoicesThisMonth: '8'
    };

    Object.keys(metrics).forEach(metricId => {
        const element = document.getElementById(metricId);
        if (element) {
            element.textContent = metrics[metricId];
        }
    });
}

/**
 * SAFE: Update element text
 */
function safeUpdateElement(elementId, text) {
    try {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
            return true;
        }
        return false;
    } catch (error) {
        console.error(`Error updating element ${elementId}:`, error);
        return false;
    }
}

/**
 * SAFE: Initialize document utilities
 */
function initDocumentUtils() {
    console.log('Initializing document utilities...');

    // Only run functions if we're on the right page
    const path = window.location.pathname;

    if (path.includes('index.html') || path === '/' || path.includes('dashboard')) {
        // Wait a bit for DOM to be fully ready
        setTimeout(() => {
            populateBillingCompanyInfo();
            populateDashboardMetrics();
        }, 500);
    }

    // Add safe utility to window
    window.safeUpdateElement = safeUpdateElement;
}

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDocumentUtils);
} else {
    initDocumentUtils();
}

// Export functions
window.populateBillingCompanyInfo = populateBillingCompanyInfo;
window.populateDashboardMetrics = populateDashboardMetrics;
window.initDocumentUtils = initDocumentUtils;