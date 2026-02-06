/* ===================================
   APP.JS CODE PATCHES
   Copy these code snippets into app.js at the specified locations
   =================================== */

// ============================================
// FIX 1: Invoice Status → Dashboard Sync
// Location: Search for "window.updateInvoiceStatus"
// Replace the ENTIRE function with this:
// ============================================

window.updateInvoiceStatus = function (id, newStatus) {
    console.log('Update Status Triggered:', id, newStatus);
    const inv = mockData.invoices.find(i => i.id === id);
    if (inv) {
        inv.status = newStatus;

        // Update paid amount and outstanding based on status
        if (newStatus === 'Paid') {
            inv.paidAmount = inv.totalPrice - inv.discount;
            inv.outstanding = 0;
        } else {
            inv.paidAmount = 0;
            inv.outstanding = inv.totalPrice - inv.discount;
        }

        saveToLocalStorage();
        console.log('Saved to LocalStorage. MockData status:', inv.status);

        // Re-render invoices table if visible
        if (typeof renderInvoices === 'function' && document.getElementById('invoicesTableBody')) {
            renderInvoices();
        }
        showNotification(`Invoice ${id} marked as ${newStatus}`, 'success');

        // CRITICAL FIX: Update dashboard immediately if it's the current page
        if (currentPage === 'dashboard' && typeof renderDashboard === 'function') {
            renderDashboard();
        }
    } else {
        console.error('Invoice not found:', id);
    }
};


// ============================================
// FIX 2: Dashboard Date Filter
// Location: Inside renderDashboard() function, at the VERY BEGINNING
// Add this code RIGHT AFTER: console.log('renderDashboard called, currentPage:', currentPage);
// ============================================

// === DATE FILTER LOGIC - START ===
const startDateInput = document.getElementById('dashboardStartDate');
const endDateInput = document.getElementById('dashboardEndDate');
let filteredInvoices = mockData.invoices || [];

// Apply start date filter
if (startDateInput && startDateInput.value) {
    const startDate = new Date(startDateInput.value);
    filteredInvoices = filteredInvoices.filter(inv => {
        if (!inv.dueDate) return true;
        // Parse DD/MM/YYYY format
        const parts = inv.dueDate.split('/');
        if (parts.length !== 3) return true;
        const invDate = new Date(parts[2], parts[1] - 1, parts[0]);
        return invDate >= startDate;
    });
}

// Apply end date filter
if (endDateInput && endDateInput.value) {
    const endDate = new Date(endDateInput.value);
    filteredInvoices = filteredInvoices.filter(inv => {
        if (!inv.dueDate) return true;
        const parts = inv.dueDate.split('/');
        if (parts.length !== 3) return true;
        const invDate = new Date(parts[2], parts[1] - 1, parts[0]);
        return invDate <= endDate;
    });
}
// === DATE FILTER LOGIC - END ===

// THEN: Replace ALL occurrences of "mockData.invoices" with "filteredInvoices" 
// in the renderDashboard function ONLY


// ============================================
// FIX 2 CONTINUED: Add clear filter function
// Location: Add this function near the end of app.js
// ============================================

// Clear Dashboard Date Filter
window.clearDashboardDateFilter = function () {
    const startDateInput = document.getElementById('dashboardStartDate');
    const endDateInput = document.getElementById('dashboardEndDate');
    if (startDateInput) startDateInput.value = '';
    if (endDateInput) endDateInput.value = '';
    if (typeof renderDashboard === 'function') {
        renderDashboard();
    }
};


// ============================================
// FIX 3: Create Company Form - Update form handler
// Location: Inside initCompanyModal() function, in the form.onsubmit handler
// Replace the newCompany object creation with this:
// ============================================

const newCompany = {
    id: `C-${String(mockData.companies.length + 2).padStart(3, '0')}`,
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


// ============================================
// FIX 4: Company Users Data Consistency
// Location: Inside viewCompanyDetails() function
// Find the section that renders company users
// Replace the user fetching and rendering logic with this:
// ============================================

// Get users directly assigned to company
const assignedUsers = mockData.companyUsers.filter(u => u.companyId === company.id);

// Get users from transactions for this company
const transactionUsers = [];
if (mockData.transactions) {
    const companyTransactions = mockData.transactions.filter(t =>
        t.company === company.name || t.companyId === company.id
    );

    companyTransactions.forEach(t => {
        // Extract username, firstName, surname from transaction
        const username = t.username || t.user || '';
        const firstName = t.firstName || (t.user ? t.user.split(' ')[0] : '') || '';
        const surname = t.surname || t.lastName || (t.user ? t.user.split(' ').slice(1).join(' ') : '') || '';

        // Check if already exists
        const exists = assignedUsers.find(u => u.username === username) ||
            transactionUsers.find(u => u.username === username);

        if (!exists && username) {
            transactionUsers.push({
                username: username,
                firstName: firstName,
                surname: surname,
                position: 'Transaction User',
                lastLogin: t.date || 'N/A',
                password: '••••••••',
                companyId: company.id
            });
        }
    });
}

const allUsers = [...assignedUsers, ...transactionUsers];

if (allUsers.length > 0) {
    usersTableBody.innerHTML = allUsers.map(u => `
    <tr>
      <td>${u.username || '-'}</td>
      <td>${u.firstName || '-'}</td>
      <td>${u.surname || '-'}</td>
      <td>${u.position || '-'}</td>
      <td>${u.lastLogin || '-'}</td>
      <td>${u.password || '••••••••'}</td>
    </tr>
  `).join('');
} else {
    usersTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No users found for this company</td></tr>';
}


// ============================================
// FIX 5 & 6: Authorization Fixes
// Location: Inside renderAuthorizations() function
// Replace the Manual Billing and Batches sections with these:
// ============================================

// MANUAL BILLING SECTION - Replace with this EXACT filter:
const mbTbody = document.getElementById('authManualBillingTableBody');
const pendingBilling = mockData.manualBilling.filter(mb => !mb.authorized && mb.status === 'Pending');

if (pendingBilling.length === 0) {
    mbTbody.innerHTML = '<tr><td colspan="7" class="text-center">No pending authorizations</td></tr>';
} else {
    mbTbody.innerHTML = pendingBilling.map(mb => `
    <tr>
      <td>${mb.id}</td>
      <td>${mb.company}</td>
      <td>${mb.description}</td>
      <td>R${mb.amount.toFixed(2)}</td>
      <td>${formatDate(mb.date)}</td>
      <td>${mb.createdBy || 'Unknown'}</td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-primary btn-sm" onclick="approveManualBilling('${mb.id}')">Approve</button>
          <button class="btn btn-secondary btn-sm" onclick="rejectManualBilling('${mb.id}')">Reject</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// BATCHES SECTION - Replace with this EXACT filter:
const batchesTbody = document.getElementById('authBatchesTableBody');
const pendingBatches = mockData.batches.filter(b =>
    !b.authorized && b.status !== 'Processed' && b.status !== 'Rejected'
);

if (pendingBatches.length === 0) {
    batchesTbody.innerHTML = '<tr><td colspan="6" class="text-center">No pending batches</td></tr>';
} else {
    batchesTbody.innerHTML = pendingBatches.map(b => `
    <tr>
      <td>${b.id}</td>
      <td>${formatDate(b.date)}</td>
      <td>${b.description}</td>
      <td>${b.records}</td>
      <td>${b.createdBy || 'Unknown'}</td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-primary btn-sm" onclick="approveBatch('${b.id}')">Approve</button>
          <button class="btn btn-secondary btn-sm" onclick="rejectBatch('${b.id}')">Reject</button>
        </div>
      </td>
    </tr>
  `).join('');
}


// ============================================
// FIX 6 CONTINUED: Batch Creation Fix
// Location: Inside initBatchLogger() or wherever batches are created
// In the form.onsubmit handler, ensure newBatch object looks like this:
// ============================================

const newBatch = {
    id: `B-${String(mockData.batches.length + 1).padStart(3, '0')}`,
    company: formData.get('company'),
    product: formData.get('product') || 'Product A',
    description: formData.get('description'),
    records: parseInt(formData.get('records')) || 0,
    date: formData.get('date'),
    status: 'Processing',  // NOT 'Processed' - must be 'Processing' for authorization
    authorized: false,      // CRITICAL - must be false
    createdBy: currentUser.firstName + ' ' + currentUser.lastName
};


// ============================================
// END OF APP.JS PATCHES
// ============================================

/* IMPORTANT NOTES:
 * 1. Make sure to replace mockData.invoices with filteredInvoices in renderDashboard
 * 2. The authorization filters are CRITICAL - use exact filter logic provided
 * 3. Batch status must be 'Processing' not 'Processed' when created
 * 4. Test each fix individually before moving to the next
 */