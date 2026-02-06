// CRITICAL FIXES FOR BILLING SYSTEM
// Apply these changes to the respective files

// ============================================
// FIX 1: Invoice Status → Dashboard Sync
// File: app.js (around line 2875)
// Replace the window.updateInvoiceStatus function with:
// ============================================

window.updateInvoiceStatus = function (id, newStatus) {
    console.log('Update Status Triggered:', id, newStatus);
    const inv = mockData.invoices.find(i => i.id === id);
    if (inv) {
        const oldStatus = inv.status;
        inv.status = newStatus;

        // Update paid and outstanding amounts based on status
        if (newStatus === 'Paid') {
            inv.paidAmount = inv.totalPrice - inv.discount;
            inv.outstanding = 0;
        } else if (newStatus === 'Unpaid') {
            inv.paidAmount = 0;
            inv.outstanding = inv.totalPrice - inv.discount;
        }

        saveToLocalStorage();
        console.log(`Invoice ${id} changed from ${oldStatus} to ${newStatus}`);

        // Re-render invoices table if visible
        if (typeof renderInvoices === 'function' && document.getElementById('invoicesTableBody')) {
            renderInvoices();
        }

        showNotification(`Invoice ${id} marked as ${newStatus}`, 'success');

        // CRITICAL: Always update dashboard immediately to reflect changes
        if (typeof renderDashboard === 'function') {
            console.log('Updating dashboard after invoice status change');
            renderDashboard();
        }
    } else {
        console.error('Invoice not found:', id);
    }
};

// ============================================
// FIX 2: Dashboard Date Filter
// File: app.js (in renderDashboard function)
// Add this at the start of renderDashboard():
// ============================================

function renderDashboard() {
    console.log('renderDashboard called, currentPage:', currentPage);

    if (currentPage !== 'dashboard') return;
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded');
        return;
    }

    // --- DATE FILTER LOGIC (NEW) ---
    const startDateInput = document.getElementById('dashboardStartDate');
    const endDateInput = document.getElementById('dashboardEndDate');

    let filteredInvoices = mockData.invoices || [];

    // Apply date filter if dates are selected
    if (startDateInput && endDateInput && startDateInput.value && endDateInput.value) {
        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);

        filteredInvoices = filteredInvoices.filter(inv => {
            // Parse the invoice date (handle DD/MM/YYYY format)
            const parts = inv.dueDate.split('/');
            const invDate = new Date(parts[2], parts[1] - 1, parts[0]);
            return invDate >= startDate && invDate <= endDate;
        });
    }

    // --- Continue with existing dashboard logic but use filteredInvoices ---
    const visibleCompanies = getFilteredCompanies().map(c => c.name);
    const companyFilteredInvoices = filteredInvoices.filter(inv => visibleCompanies.includes(inv.company));

    const totalRevenue = companyFilteredInvoices.reduce((sum, inv) => sum + inv.totalPrice, 0);
    const paidInvoices = companyFilteredInvoices.filter(i => i.status === 'Paid').length;
    const totalInvoices = companyFilteredInvoices.length;
    const collectionRate = totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 0;
    const avgInvoiceValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

    // ... rest of existing renderDashboard code using companyFilteredInvoices
}



// ============================================
// FIX 4: Clear Date Filter Function
// File: app.js (add this global function)
// ============================================

window.clearDashboardDateFilter = function () {
    const startDateInput = document.getElementById('dashboardStartDate');
    const endDateInput = document.getElementById('dashboardEndDate');
    if (startDateInput) startDateInput.value = '';
    if (endDateInput) endDateInput.value = '';
    renderDashboard();
};

// ============================================
// FIX 5: Company Users Data Consistency
// File: app.js (in viewCompanyDetails function, around line 2360)
// Replace the users section with:
// ============================================

function showDetails(company) {
    currentCompany = company;
    title.textContent = company.name;

    // Get assigned users
    const assignedUsers = mockData.companyUsers.filter(u => u.companyId === company.id);

    // Get users from transactions for this company (NEW: Consistency fix)
    const transactionUsers = [];
    if (mockData.transactions) {
        const companyTransactions = mockData.transactions.filter(t =>
            t.company === company.name || t.companyId === company.id
        );

        companyTransactions.forEach(t => {
            // Create consistent user object
            const username = t.username || `${t.firstName || 'user'}.${t.surname || 'user'}`.toLowerCase();
            const firstName = t.firstName || t.user?.split(' ')[0] || 'Unknown';
            const surname = t.surname || t.lastName || t.user?.split(' ')[1] || '';

            // Check if not already in list
            if (!assignedUsers.find(u => u.username === username) &&
                !transactionUsers.find(u => u.username === username)) {
                transactionUsers.push({
                    username: username,
                    firstName: firstName,
                    surname: surname,
                    position: 'Transaction User',
                    lastLogin: t.date || 'N/A',
                    password: '***',
                    companyId: company.id
                });
            }
        });
    }

    const allUsers = [...assignedUsers, ...transactionUsers];

    if (allUsers.length > 0) {
        usersTableBody.innerHTML = allUsers.map(u => `
        <tr>
          <td>${u.username}</td>
          <td>${u.firstName}</td>
          <td>${u.surname}</td>
          <td>${u.position || 'User'}</td>
          <td>${u.lastLogin}</td>
          <td>${u.password}</td>
        </tr>
      `).join('');
    } else {
        usersTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No users found</td></tr>';
    }

    // ... rest of existing showDetails code
}

// ============================================
// FIX 6: Authorization Tabs Fix
// File: app.js OR extensions_phase6.js (renderAuthorizations function)
// Ensure this filter logic for pending items:
// ============================================

function renderAuthorizations() {
    // ... existing code ...

    // Manual Billing - FIXED filter logic
    const pendingBilling = mockData.manualBilling.filter(mb =>
        !mb.authorized && mb.status === 'Pending'
    );

    // Batches - FIXED filter logic  
    const pendingBatches = mockData.batches.filter(b =>
        !b.authorized &&
        b.status !== 'Processed' &&
        b.status !== 'Rejected'
    );

    // ... rest of rendering code ...
}

// ============================================
// FIX 8: Update Create Company Form Handler
// File: app.js (initCompanyModal function)
// Update form submission to include new fields:
// ============================================

form.onsubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    const newCompany = {
        id: mockData.companies.length + 1,
        name: formData.get('companyName'),
        type: formData.get('companyType') === 'parent' ? 'Parent' : 'Child',
        parentId: formData.get('companyType') === 'child' ? formData.get('parentCompany') : null,
        contact: formData.get('contactPerson'),
        email: formData.get('email'),
        phone: formData.get('phone') || '',
        address: formData.get('address'),
        registrationNumber: formData.get('registrationNumber') || '',
        taxId: formData.get('taxId') || '',
        industry: formData.get('industry') || '',
        foundedDate: formData.get('foundedDate') || '',
        salesPerson: formData.get('salesPerson') || '',
        active: true
    };

    mockData.companies.push(newCompany);
    saveToLocalStorage();
    renderCompanies();
    closeModal();
    showNotification(`Company "${newCompany.name}" created successfully!`, 'success');
    renderDashboard();
};

// Fix authorization tab - manual billing and batches
function fixAuthorizationTab() {
    const authTab = document.getElementById('authorization-tab');
    if (!authTab) return;

    // Fix manual billing section
    const manualBilling = authTab.querySelector('.manual-billing');
    if (manualBilling) {
        manualBilling.innerHTML = `
            <div class="billing-section">
                <h3>Manual Billing</h3>
                <div class="billing-form">
                    <div class="form-group">
                        <label>Client:</label>
                        <select id="billing-client">
                            <option value="">Select Client</option>
                            <option value="client1">Client A</option>
                            <option value="client2">Client B</option>
                            <option value="client3">Client C</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Amount:</label>
                        <input type="number" id="billing-amount" placeholder="0.00" step="0.01">
                    </div>
                    <div class="form-group">
                        <label>Description:</label>
                        <textarea id="billing-desc" rows="3"></textarea>
                    </div>
                    <button id="process-billing" class="btn-primary">Process Billing</button>
                </div>
            </div>
        `;

        // Add event listener for process button
        document.getElementById('process-billing')?.addEventListener('click', processManualBilling);
    }

    // Fix batches section
    const batchesSection = authTab.querySelector('.batches-section');
    if (batchesSection) {
        batchesSection.innerHTML = `
            <div class="batches-container">
                <h3>Batches</h3>
                <div class="batch-controls">
                    <button id="create-batch" class="btn-secondary">Create New Batch</button>
                    <button id="process-batch" class="btn-primary">Process Selected</button>
                </div>
                <div class="batch-list">
                    <table class="batch-table">
                        <thead>
                            <tr>
                                <th><input type="checkbox" id="select-all"></th>
                                <th>Batch ID</th>
                                <th>Date Created</th>
                                <th>Items</th>
                                <th>Total Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="batch-table-body">
                            <!-- Batch data will be loaded here -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        loadBatchData();
    }
}

function processManualBilling() {
    const client = document.getElementById('billing-client').value;
    const amount = document.getElementById('billing-amount').value;
    const description = document.getElementById('billing-desc').value;

    if (!client || !amount || !description) {
        alert('Please fill all fields');
        return;
    }

    // Process billing logic
    console.log('Processing billing:', { client, amount, description });
    alert(`Billing processed for $${amount}`);

    // Clear form
    document.getElementById('billing-client').value = '';
    document.getElementById('billing-amount').value = '';
    document.getElementById('billing-desc').value = '';
}

function loadBatchData() {
    const batchData = [
        { id: 'BATCH-001', date: '2024-01-15', items: 12, amount: 1540.75, status: 'Pending' },
        { id: 'BATCH-002', date: '2024-01-14', items: 8, amount: 980.50, status: 'Processed' },
        { id: 'BATCH-003', date: '2024-01-13', items: 15, amount: 2100.00, status: 'Pending' }
    ];

    const tbody = document.getElementById('batch-table-body');
    if (tbody) {
        tbody.innerHTML = '';

        batchData.forEach(batch => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="batch-checkbox"></td>
                <td>${batch.id}</td>
                <td>${batch.date}</td>
                <td>${batch.items}</td>
                <td>$${batch.amount.toFixed(2)}</td>
                <td><span class="status-${batch.status.toLowerCase()}">${batch.status}</span></td>
            `;
            tbody.appendChild(row);
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', fixAuthorizationTab);