// ===================================
// OFFLINE BOOT SCRIPT
// Seeds a demo admin session and sample data when the app is
// opened locally as a file:// URL (no backend needed).
// ===================================
(function () {
    const isFileProtocol = window.location.protocol === 'file:';
    if (!isFileProtocol) return; // Skip in production/server context

    console.log('[Offline Boot] Injecting demo session for local testing...');

    // Seed a demo admin session so checkAuth() passes
    if (!sessionStorage.getItem('billingUser') && !localStorage.getItem('billingUser')) {
        const demoUser = {
            id: 'USR_DEMO_ADMIN',
            firstName: 'Admin',
            lastName: 'Demo',
            email: 'admin@demo.com',
            role: 'Admin',
            userGroup: 'Admin',
            authorized: true
        };
        sessionStorage.setItem('billingUser', JSON.stringify(demoUser));
        console.log('[Offline Boot] Demo session seeded:', demoUser);
    }

    // Seed demo data into window.__offlineSeedData so loadData() can use it
    // as a fallback instead of fetching data.json
    window.__offlineSeedData = {
        companies: [
            { id: 'CO001', companyId: 'CO001', name: 'Acme Corp', status: 'Active', contact: 'John Doe', email: 'john@acme.com', phone: '+27 11 000 0001', createdDate: '2024-01-10', balance: 15000, currency: 'ZAR' },
            { id: 'CO002', companyId: 'CO002', name: 'TechSoft Ltd', status: 'Active', contact: 'Jane Smith', email: 'jane@techsoft.com', phone: '+27 21 000 0002', createdDate: '2024-02-15', balance: 9500, currency: 'ZAR' },
            { id: 'CO003', companyId: 'CO003', name: 'BuildRight SA', status: 'Inactive', contact: 'Bob Jones', email: 'bob@buildright.co.za', phone: '+27 31 000 0003', createdDate: '2024-03-01', balance: 0, currency: 'ZAR' }
        ],
        transactions: [
            { id: 'TRX001', company: 'Acme Corp', product: 'SMS', count: 1200, date: '2024-03-01', amount: 1200 },
            { id: 'TRX002', company: 'TechSoft Ltd', product: 'Email', count: 3000, date: '2024-03-05', amount: 600 },
            { id: 'TRX003', company: 'Acme Corp', product: 'Email', count: 500, date: '2024-03-10', amount: 100 }
        ],
        invoices: [
            { id: 'INV001', company: 'Acme Corp', amount: 1300, date: '2024-03-15', dueDate: '2024-04-15', status: 'Unpaid' },
            { id: 'INV002', company: 'TechSoft Ltd', amount: 600, date: '2024-03-20', dueDate: '2024-04-20', status: 'Paid' }
        ],
        pricing: [
            { id: 'PRC001', company: 'Acme Corp', product: 'SMS', rate: 1.00, status: 'Active', effectiveDate: '2024-01-01' },
            { id: 'PRC002', company: 'Acme Corp', product: 'Email', rate: 0.20, status: 'Active', effectiveDate: '2024-01-01' },
            { id: 'PRC003', company: 'TechSoft Ltd', product: 'Email', rate: 0.20, status: 'Active', effectiveDate: '2024-02-01' }
        ],
        usage: [
            { id: 'USG001', company: 'Acme Corp', product: 'SMS', units: 1200, date: '2024-03-01', billed: true },
            { id: 'USG002', company: 'TechSoft Ltd', product: 'Email', units: 3000, date: '2024-03-05', billed: true }
        ],
        leads: [
            { id: 'LD001', firstName: 'Alice', lastName: 'Wonder', email: 'alice@example.com', company: 'Example Inc', status: 'New', createdDate: '2024-03-01' },
            { id: 'LD002', firstName: 'Bob', lastName: 'Builder', email: 'bob@b.com', company: 'Build Co', status: 'Contacted', createdDate: '2024-03-05' }
        ],
        campaigns: [
            { id: 1, name: 'March Newsletter', type: 'Email', status: 'Sent', sentTo: 1200, openRate: '45%', clickRate: '12%', createdDate: '2024-03-01' },
            { id: 2, name: 'Q1 Follow-up', type: 'SMS', status: 'Draft', sentTo: 0, openRate: '-', clickRate: '-', createdDate: '2024-03-10' }
        ],
        manualBilling: [
            { id: 'MB001', company: 'Acme Corp', description: 'Setup fee', amount: 500, date: '2024-03-01', status: 'Approved', createdBy: 'Admin Demo', authorizedBy: 'Admin Demo', authorizedDate: '2024-03-02' }
        ],
        batches: [
            { id: 'BCH001', date: '2024-03-01', description: 'March batch upload', status: 'Processed', records: 1200, createdBy: 'Admin Demo', authorizedBy: 'Admin Demo', authorizedDate: '2024-03-02' },
            { id: 'BCH002', date: '2024-03-15', description: 'Mid-month batch', status: 'Pending', records: 450, createdBy: 'Admin Demo', authorizedBy: null, authorizedDate: null }
        ],
        users: [
            { id: 'USR001', firstName: 'Admin', lastName: 'Demo', email: 'admin@demo.com', role: 'Admin', userGroup: 'Admin', authorized: true, createdDate: '2024-01-01', lastLogin: '2024-03-20' },
            { id: 'USR002', firstName: 'Thabo', lastName: 'Manager', email: 'manager@billing.com', role: 'Manager', userGroup: 'Ops', authorized: true, createdDate: '2024-02-01', lastLogin: '2024-03-19' },
            { id: 'USR003', firstName: 'Pending', lastName: 'User', email: 'pending@billing.com', role: 'User', userGroup: 'User', authorized: false, createdDate: '2024-03-18', lastLogin: null }
        ],
        pricedTransactions: [],
        activities: [],
        supportTickets: [],
        auditLogs: [],
        exceptions: [],
        notifications: [],
        waitingRoom: [],
        companyUsers: []
    };

    console.log('[Offline Boot] Demo data seeded. App should load without redirecting to login.');
})();
