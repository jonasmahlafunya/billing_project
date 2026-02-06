// ===================================
// UNIVERSAL TAB NAVIGATION FIX
// Handles ALL tab types in the application
// ===================================

console.log('🔧 Loading universal tab navigation fix...');

// Wait for DOM to be ready
function initializeAllTabs() {
    console.log('🔧 Initializing all tabs...');

    // ===================================
    // 1. REPORTS PAGE TABS (Paid/Unpaid/Statements)
    // ===================================

    const reportsTabs = document.querySelectorAll('#reports-page .tabs .tab');
    reportsTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const tabName = this.getAttribute('data-tab');

            // Remove active from all tabs
            reportsTabs.forEach(t => t.classList.remove('active'));

            // Add active to clicked tab
            this.classList.add('active');

            // Hide all tab contents in reports
            const reportsPage = document.getElementById('reports-page');
            if (reportsPage) {
                const allContents = reportsPage.querySelectorAll('.tab-content');
                allContents.forEach(content => content.style.display = 'none');
            }

            // Show selected content
            if (tabName === 'paid') {
                const paidSection = document.querySelector('#reports-page .tab-content:nth-of-type(1)');
                if (paidSection) paidSection.style.display = 'block';
                if (typeof renderInvoices === 'function') renderInvoices();
            } else if (tabName === 'unpaid') {
                const unpaidSection = document.querySelector('#reports-page .tab-content:nth-of-type(2)');
                if (unpaidSection) unpaidSection.style.display = 'block';
                if (typeof renderInvoices === 'function') renderInvoices();
            } else if (tabName === 'statements') {
                const statementsSection = document.querySelector('#reports-page .tab-content:nth-of-type(3)');
                if (statementsSection) statementsSection.style.display = 'block';
            }

            console.log('✅ Reports tab switched to:', tabName);
        });
    });

    // ===================================
    // 2. SUPPORT PAGE TABS (Unresolved/Resolved)
    // ===================================

    const supportTabs = document.querySelectorAll('[data-support-tab]');
    supportTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const tabName = this.getAttribute('data-support-tab');

            // Remove active from all support tabs
            supportTabs.forEach(t => t.classList.remove('active'));

            // Add active to clicked tab
            this.classList.add('active');

            // Hide all support tab contents
            const supportPage = document.getElementById('support-page');
            if (supportPage) {
                const allContents = supportPage.querySelectorAll('.tab-content');
                allContents.forEach(content => content.style.display = 'none');
            }

            // Show selected content
            if (tabName === 'unresolved') {
                const unresolvedSection = document.querySelector('#support-page .tab-content:nth-of-type(1)');
                if (unresolvedSection) unresolvedSection.style.display = 'block';
            } else if (tabName === 'resolved') {
                const resolvedSection = document.querySelector('#support-page .tab-content:nth-of-type(2)');
                if (resolvedSection) resolvedSection.style.display = 'block';
            }

            console.log('✅ Support tab switched to:', tabName);
        });
    });

    // ===================================
    // 3. AUTHORIZATION PAGE TABS (Manual Billing/Batches/Rejected)
    // ===================================

    const authTabButtons = document.querySelectorAll('#auth-manual-billing-tab, #auth-batches-tab, #auth-rejected-tab');
    authTabButtons.forEach(button => {
        // Remove any existing listeners
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        newButton.addEventListener('click', function () {
            const tabName = this.getAttribute('data-tab');

            console.log('🔧 Authorization tab clicked:', tabName);

            // Remove active from all auth tabs
            authTabButtons.forEach(t => {
                const btn = document.getElementById(t.id);
                if (btn) btn.classList.remove('active');
            });

            // Add active to clicked tab
            this.classList.add('active');

            // Hide all auth tab contents
            document.querySelectorAll('#auth-manual-billing-tab.tab-content, #auth-batches-tab.tab-content, #auth-rejected-tab.tab-content').forEach(content => {
                content.style.display = 'none';
            });

            // Show selected content and render data
            if (tabName === 'manual-billing') {
                const manualContent = document.querySelector('#auth-manual-billing-tab.tab-content');
                if (manualContent) manualContent.style.display = 'block';
                if (typeof renderAuthManualBilling === 'function') {
                    renderAuthManualBilling();
                }
            } else if (tabName === 'batches') {
                const batchesContent = document.querySelector('#auth-batches-tab.tab-content');
                if (batchesContent) batchesContent.style.display = 'block';
                if (typeof renderAuthBatches === 'function') {
                    renderAuthBatches();
                }
            } else if (tabName === 'rejected') {
                const rejectedContent = document.querySelector('#auth-rejected-tab.tab-content');
                if (rejectedContent) rejectedContent.style.display = 'block';
                if (typeof renderAuthRejected === 'function') {
                    renderAuthRejected();
                }
            }

            console.log('✅ Authorization tab switched to:', tabName);
        });
    });

    // ===================================
    // 4. SETTINGS PAGE TABS (Authorized/Unauthorized/Audit Logs)
    // ===================================

    const settingsTabs = document.querySelectorAll('#settings-authorized-tab, #settings-unauthorized-tab, #settings-audit-tab');
    settingsTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const tabName = this.getAttribute('data-tab');

            // Remove active from all settings tabs
            settingsTabs.forEach(t => t.classList.remove('active'));

            // Add active to clicked tab
            this.classList.add('active');

            // Hide all settings tab contents
            document.querySelectorAll('#settings-authorized-content, #settings-unauthorized-content, #settings-audit-content').forEach(content => {
                content.style.display = 'none';
            });

            // Show selected content
            if (tabName === 'authorized') {
                const authorizedContent = document.getElementById('settings-authorized-content');
                if (authorizedContent) authorizedContent.style.display = 'block';
                if (typeof renderUsers === 'function') renderUsers();
            } else if (tabName === 'unauthorized') {
                const unauthorizedContent = document.getElementById('settings-unauthorized-content');
                if (unauthorizedContent) unauthorizedContent.style.display = 'block';
                if (typeof renderUnauthorizedUsers === 'function') renderUnauthorizedUsers();
            } else if (tabName === 'audit-logs') {
                const auditContent = document.getElementById('settings-audit-content');
                if (auditContent) auditContent.style.display = 'block';
                if (typeof renderAuditLogs === 'function') renderAuditLogs();
            }

            console.log('✅ Settings tab switched to:', tabName);
        });
    });

    // ===================================
    // 5. COMPANY DETAILS TABS (Users/Details)
    // ===================================

    // This one already has onclick="switchCompanyTab()" so we'll make sure that function exists
    if (typeof window.switchCompanyTab === 'undefined') {
        window.switchCompanyTab = function (tabName) {
            const companyTabs = document.querySelectorAll('[onclick*="switchCompanyTab"]');

            // Remove active from all
            companyTabs.forEach(t => t.classList.remove('active'));

            // Add active to clicked
            const clickedTab = document.querySelector(`[onclick="switchCompanyTab('${tabName}')"]`);
            if (clickedTab) clickedTab.classList.add('active');

            // Hide all company tab contents
            document.querySelectorAll('#company-users-tab, #company-activities-tab, #company-info-tab').forEach(content => {
                content.style.display = 'none';
            });

            // Show selected
            if (tabName === 'users') {
                const usersTab = document.getElementById('company-users-tab');
                if (usersTab) usersTab.style.display = 'block';
            } else if (tabName === 'activities') {
                const activitiesTab = document.getElementById('company-activities-tab');
                if (activitiesTab) activitiesTab.style.display = 'block';
            } else if (tabName === 'details') {
                const detailsTab = document.getElementById('company-info-tab');
                if (detailsTab) detailsTab.style.display = 'block';
            }

            console.log('✅ Company tab switched to:', tabName);
        };
    }

    // ===================================
    // 6. GENERIC TAB HANDLER (Fallback for any other tabs)
    // ===================================

    const allTabs = document.querySelectorAll('.tab[data-tab]:not([onclick]):not([data-support-tab])');
    allTabs.forEach(tab => {
        // Skip if already handled
        if (tab.hasAttribute('data-tab-initialized')) return;

        tab.setAttribute('data-tab-initialized', 'true');

        tab.addEventListener('click', function () {
            const tabName = this.getAttribute('data-tab');
            const parentContainer = this.closest('.page, .section, .card');

            if (parentContainer) {
                // Remove active from sibling tabs
                const siblingTabs = parentContainer.querySelectorAll('.tab');
                siblingTabs.forEach(t => t.classList.remove('active'));

                // Add active to this tab
                this.classList.add('active');

                // Hide all tab contents in this container
                const tabContents = parentContainer.querySelectorAll('.tab-content');
                tabContents.forEach(content => content.style.display = 'none');

                // Show matching content
                const matchingContent = parentContainer.querySelector(`[data-tab-content="${tabName}"], #${tabName}-content, #${tabName}-tab`);
                if (matchingContent) {
                    matchingContent.style.display = 'block';
                }
            }

            console.log('✅ Generic tab switched to:', tabName);
        });
    });

    console.log('✅ All tabs initialized successfully!');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAllTabs);
} else {
    initializeAllTabs();
}

// Also initialize after a short delay to catch any dynamically added tabs
setTimeout(initializeAllTabs, 1000);

// Export for manual re-initialization if needed
window.reinitializeTabs = initializeAllTabs;

console.log('✅ Universal tab navigation fix loaded!');
console.log('💡 To manually reinitialize tabs, run: reinitializeTabs()');
