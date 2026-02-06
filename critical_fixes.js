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
// FIX 7: Create Company Modal - Wider & More Fields
// File: index.html (createCompanyModal section)
// Replace entire modal with:
// ============================================

<div id="createCompanyModal" class="modal">
    <div class="modal-content" style="max-width: 700px;">
        <span class="close-modal">&times;</span>
        <h2 style="margin-bottom: 24px;">Create Company</h2>
        <form id="createCompanyForm">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Company ID</label>
                    <input type="text" class="form-input" name="companyId" id="companyIdInput" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">Company Name</label>
                    <input type="text" class="form-input" name="companyName" required>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Contact Person</label>
                    <input type="text" class="form-input" name="contactPerson" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Email Address</label>
                    <input type="email" class="form-input" name="email" required>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Phone</label>
                    <input type="tel" class="form-input" name="phone">
                </div>
                <div class="form-group">
                    <label class="form-label">Company Type</label>
                    <select class="form-input" name="companyType" id="companyTypeSelect">
                        <option value="parent">Parent Company</option>
                        <option value="child">Child Company</option>
                    </select>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Address</label>
                <input type="text" class="form-input" name="address" required>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Registration Number</label>
                    <input type="text" class="form-input" name="registrationNumber">
                </div>
                <div class="form-group">
                    <label class="form-label">Tax ID</label>
                    <input type="text" class="form-input" name="taxId">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Industry</label>
                    <input type="text" class="form-input" name="industry">
                </div>
                <div class="form-group">
                    <label class="form-label">Founded Date</label>
                    <input type="date" class="form-input" name="foundedDate">
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Sales Person</label>
                <select class="form-input" name="salesPerson" id="companySalesPersonSelect">
                    <option value="">Select Sales Person</option>
                </select>
            </div>

            <div class="form-group hidden" id="parentCompanyGroup">
                <label class="form-label">Parent Company</label>
                <select class="form-input" name="parentCompany" id="parentCompanySelect">
                </select>
            </div>

            <div class="modal-footer" style="margin-top: 24px;">
                <button type="button" class="btn btn-secondary" id="cancelCreateCompany">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Company</button>
            </div>
        </form>
    </div>
</div>

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

// ============================================
// END OF CRITICAL FIXES
// ============================================