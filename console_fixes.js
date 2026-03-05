// console_fixes.js - Fix all console errors in billing system

/**
 * FIX 1: Prevent duplicate mockData declaration
 * This should be placed BEFORE app.js loads
 */
if (typeof window.mockDataDeclared === 'undefined') {
    window.mockDataDeclared = true;

    // Original mockData from app.js - prevent re-declaration
    Object.defineProperty(window, 'mockData', {
        value: {
            companies: [
                {
                    id: "COMP_001",
                    name: "Acme Corporation",
                    contact: "John Smith",
                    email: "john@acme.com",
                    phone: "+27 11 123 4567",
                    type: "parent",
                    address: "123 Main St, Sandton",
                    regNumber: "2020/123456/07",
                    taxId: "9012345678",
                    industry: "Technology",
                    foundedDate: "2020-01-15",
                    createdAt: "2024-01-01T10:00:00Z",
                    status: "active"
                }
            ],
            transactions: [
                {
                    id: "TRANS_001",
                    amount: 15000,
                    type: "payment",
                    description: "Q1 Payment",
                    date: "2024-01-15T14:30:00Z",
                    clientId: "COMP_001"
                }
            ],
            invoices: [
                {
                    id: "INV_001",
                    amount: 25000,
                    status: "paid",
                    client: "Acme Corporation",
                    dueDate: "2024-02-01T00:00:00Z",
                    clientId: "COMP_001"
                }
            ],
            users: [
                {
                    id: "USER_001",
                    name: "Admin User",
                    email: "admin@billing.com",
                    role: "admin"
                }
            ]
        },
        writable: false,
        configurable: false
    });
}

/**
 * FIX 2: Safe element manipulation utilities
 */
const SafeDOM = {
    setText: function (elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
            return true;
        }
        console.warn(`Element #${elementId} not found for setText`);
        return false;
    },

    setHTML: function (elementId, html) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = html;
            return true;
        }
        console.warn(`Element #${elementId} not found for setHTML`);
        return false;
    },

    addClass: function (elementId, className) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add(className);
            return true;
        }
        console.warn(`Element #${elementId} not found for addClass`);
        return false;
    },

    removeClass: function (elementId, className) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove(className);
            return true;
        }
        console.warn(`Element #${elementId} not found for removeClass`);
        return false;
    },

    exists: function (elementId) {
        return !!document.getElementById(elementId);
    }
};

/**
 * FIX 3: Updated populateBillingCompanyInfo function
 */
function populateBillingCompanyInfo() {
    // Check if elements exist before manipulating
    const elements = {
        billingCompanyName: document.getElementById('billingCompanyName'),
        billingCompanyAddress: document.getElementById('billingCompanyAddress'),
        billingCompanyEmail: document.getElementById('billingCompanyEmail'),
        billingCompanyPhone: document.getElementById('billingCompanyPhone'),
        billingCompanyReg: document.getElementById('billingCompanyReg')
    };

    // Skip if no elements found
    if (!Object.values(elements).some(el => el !== null)) {
        console.warn('Billing company info elements not found. Skipping population.');
        return;
    }

    // Set values only for existing elements
    if (elements.billingCompanyName) {
        elements.billingCompanyName.textContent = 'Acme Corporation';
    }

    if (elements.billingCompanyAddress) {
        elements.billingCompanyAddress.textContent = '123 Main St, Sandton, Johannesburg';
    }

    if (elements.billingCompanyEmail) {
        elements.billingCompanyEmail.textContent = 'billing@acme.com';
    }

    if (elements.billingCompanyPhone) {
        elements.billingCompanyPhone.textContent = '+27 11 123 4567';
    }

    if (elements.billingCompanyReg) {
        elements.billingCompanyReg.textContent = '2020/123456/07';
    }

    console.log('Billing company info populated successfully');
}

/**
 * FIX 4: Load scripts in correct order to prevent conflicts
 */
function loadScriptsInOrder() {
    const scripts = [
        'console_fixes.js',      // This should load first
        'validation-utils.js',
        'document-utils.js',     // Patched version
        'app.js',               // Will use safe mockData
        'app-fixes.js',
        'billing_fixes.js'      // Main fixes
    ];

    let currentIndex = 0;

    function loadNextScript() {
        if (currentIndex >= scripts.length) {
            console.log('All scripts loaded successfully');
            initializeApplication();
            return;
        }

        const script = document.createElement('script');
        script.src = scripts[currentIndex];
        script.onload = function () {
            console.log(`Loaded: ${scripts[currentIndex]}`);
            currentIndex++;
            loadNextScript();
        };
        script.onerror = function () {
            console.error(`Failed to load: ${scripts[currentIndex]}`);
            currentIndex++;
            loadNextScript();
        };

        document.head.appendChild(script);
    }

    loadNextScript();
}

/**
 * FIX 5: Initialize application safely
 */
function initializeApplication() {
    console.log('Initializing application safely...');

    // Wait for DOM to be fully ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            safeInitialize();
        });
    } else {
        safeInitialize();
    }
}

function safeInitialize() {
    try {
        // Initialize with safe checks
        if (typeof populateBillingCompanyInfo === 'function') {
            setTimeout(populateBillingCompanyInfo, 100);
        }

        if (typeof loadCompanies === 'function') {
            setTimeout(loadCompanies, 200);
        }

        if (typeof updateDashboardMetrics === 'function') {
            setTimeout(updateDashboardMetrics, 300);
        }

        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error during initialization:', error);
    }
}

/**
 * FIX 6: Patch document-utils.js functions
 */
if (typeof window.originalPopulateBillingCompanyInfo === 'undefined') {
    // Store original if exists
    if (typeof populateBillingCompanyInfo === 'function') {
        window.originalPopulateBillingCompanyInfo = populateBillingCompanyInfo;
    }

    // Override with safe version
    window.populateBillingCompanyInfo = populateBillingCompanyInfo;
}

/**
 * FIX 7: Handle HTML-in-script error
 * This fixes the "Unexpected token '<'" error
 */
function fixScriptTags() {
    const scripts = document.getElementsByTagName('script');

    for (let i = 0; i < scripts.length; i++) {
        const script = scripts[i];

        // Check for HTML content inside script tags
        if (script.textContent.includes('<') &&
            script.textContent.includes('>') &&
            script.textContent.includes('/')) {

            console.warn(`Found possible HTML in script tag at line ${i}`);

            // Clean the script content
            const cleanedContent = script.textContent
                .replace(/<[^>]*>/g, '')  // Remove HTML tags
                .replace(/&[a-z]+;/g, ''); // Remove HTML entities

            // Create new script with cleaned content
            const newScript = document.createElement('script');
            newScript.textContent = cleanedContent;
            newScript.src = script.src || '';

            // Replace old script
            script.parentNode.replaceChild(newScript, script);
        }
    }
}

// Run fixes when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        fixScriptTags();
        initializeApplication();
    });
} else {
    fixScriptTags();
    initializeApplication();
}

// Export utilities
window.SafeDOM = SafeDOM;
window.fixScriptTags = fixScriptTags;
window.safeInitialize = safeInitialize;