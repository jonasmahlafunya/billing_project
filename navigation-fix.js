// ===================================
// DIRECT NAVIGATION FIX
// Forces sidebar navigation to work
// ===================================

console.log('🔧 Loading DIRECT navigation fix...');

// Override changePage function to ensure it works
window.changePage = function (page) {
    console.log(`🔧 changePage called with: ${page}`);

    // Hide all pages
    const allPages = document.querySelectorAll('.page-container');
    console.log(`Found ${allPages.length} page containers`);

    allPages.forEach(el => {
        el.classList.add('hidden');
        el.style.display = 'none';
    });

    // Show selected page
    const pageElement = document.getElementById(`${page}-page`);

    if (pageElement) {
        console.log(`✅ Showing page: ${page}`);
        pageElement.classList.remove('hidden');
        pageElement.style.display = 'block';

        // Update current page
        if (typeof window !== 'undefined') {
            window.currentPage = page;
        }

        // Update page title
        const titleMap = {
            'dashboard': 'Dashboard',
            'companies': 'Companies',
            'transactions': 'Transactions',
            'reports': 'Reports',
            'batch-logger': 'Batch Logger',
            'manual-billing': 'Manual Billing',
            'exceptions': 'Exceptions',
            'waiting-room': 'Waiting Room',
            'settings': 'Settings',
            'usage': 'Usage',
            'pricing': 'Pricing',
            'priced-transactions': 'Priced Transactions',
            'leads': 'Lead Management',
            'activities': 'Activity Tracking',
            'support': 'Support Tickets',
            'marketing': 'Marketing Automation',
            'run-billing': 'Run Billing',
            'authorizations': 'Authorizations'
        };

        const titleEl = document.getElementById('currentPageTitle');
        if (titleEl) {
            titleEl.textContent = titleMap[page] || 'Billing Management';
        }

        // Call render function if it exists
        const renderFunctions = {
            'dashboard': 'renderDashboard',
            'companies': 'renderCompanies',
            'transactions': 'renderTransactions',
            'reports': 'renderInvoices',
            'usage': 'renderUsage',
            'pricing': 'renderPricing',
            'priced-transactions': 'renderPricedTransactions',
            'settings': 'renderSettings',
            'manual-billing': 'renderManualBilling',
            'batch-logger': 'renderBatchLogger',
            'authorizations': 'renderAuthorizations',
            'exceptions': 'renderExceptions',
            'waiting-room': 'renderWaitingRoom',
            'leads': 'renderLeads',
            'activities': 'renderAllActivities',
            'support': 'renderSupport',
            'marketing': 'renderCampaigns',
            'run-billing': 'renderRunBilling'
        };

        const renderFuncName = renderFunctions[page];
        if (renderFuncName && typeof window[renderFuncName] === 'function') {
            console.log(`Calling render function: ${renderFuncName}`);
            try {
                window[renderFuncName]();
            } catch (e) {
                console.error(`Error calling ${renderFuncName}:`, e);
            }
        }
    } else {
        console.error(`❌ Page element not found: ${page}-page`);
    }
};

// Initialize navigation with direct event listeners
function initDirectNavigation() {
    console.log('🔧 Initializing DIRECT navigation...');

    const navItems = document.querySelectorAll('.nav-item');

    if (navItems.length === 0) {
        console.warn('No navigation items found');
        return;
    }

    console.log(`Found ${navItems.length} navigation items`);

    navItems.forEach((item, index) => {
        const page = item.getAttribute('data-page');
        console.log(`Setting up nav item ${index}: ${page}`);

        // Remove href to prevent default behavior
        item.removeAttribute('href');
        item.style.cursor = 'pointer';

        // Remove all existing event listeners by cloning
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);

        // Add click handler
        newItem.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            console.log(`🔧 Navigation clicked: ${page}`);

            // Remove active from all
            document.querySelectorAll('.nav-item').forEach(nav => {
                nav.classList.remove('active');
            });

            // Add active to this
            this.classList.add('active');

            // Change page
            changePage(page);
        });
    });

    console.log('✅ DIRECT navigation initialized!');
}

// Initialize immediately if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        setTimeout(initDirectNavigation, 1000);
    });
} else {
    setTimeout(initDirectNavigation, 1000);
}

// Export for manual use
window.reinitializeDirectNavigation = initDirectNavigation;

console.log('✅ DIRECT navigation fix loaded!');
console.log('💡 To manually reinitialize: reinitializeDirectNavigation()');
