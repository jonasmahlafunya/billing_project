// ===================================
// COMPREHENSIVE FIXES FOR BILLING APP
// ===================================

// Fix 1: Enhanced Invoice Modal with Proper Data Loading
// ===================================

function loadInvoiceData(invoiceId) {
    const invoice = mockData.invoices.find(inv => inv.id === invoiceId || inv.invoiceNumber === invoiceId);

    if (!invoice) {
        console.error('Invoice not found:', invoiceId);
        return;
    }

    // Find company data
    const company = mockData.companies.find(c => c.name === invoice.company || c.companyName === invoice.company);

    // Update invoice header
    document.getElementById('invoiceNumber').textContent = invoice.invoiceNumber || invoice.id;
    document.getElementById('invoiceDate').textContent = formatDate(invoice.dateIssued || invoice.date);
    document.getElementById('invoiceDueDate').textContent = formatDate(invoice.dueDate);
    document.getElementById('invoiceTerms').textContent = invoice.paymentTerms || 'Net 15';

    // Update status badge
    const statusBadge = document.getElementById('invoiceStatusBadge');
    const statusText = document.getElementById('invoiceStatusText');
    if (statusBadge && statusText) {
        statusText.textContent = invoice.status ? invoice.status.toUpperCase() : 'UNPAID';
        statusBadge.className = 'status-indicator status-' + (invoice.status || 'unpaid').toLowerCase();
    }

    // Update client information with actual company data
    if (company) {
        document.getElementById('invoiceClientName').textContent = company.name || company.companyName;
        document.getElementById('invoiceClientContact').textContent = company.contactPerson || company.contact || 'N/A';
        document.getElementById('invoiceClientEmail').textContent = company.email || 'N/A';
        document.getElementById('invoiceClientPhone').textContent = company.phone || 'N/A';
        document.getElementById('invoiceClientTaxId').textContent = company.taxId || 'N/A';
        document.getElementById('invoiceClientAddress').textContent = company.address || 'N/A';
    } else {
        // Fallback to invoice data
        document.getElementById('invoiceClientName').textContent = invoice.company;
        document.getElementById('invoiceClientContact').textContent = 'N/A';
        document.getElementById('invoiceClientEmail').textContent = 'N/A';
        document.getElementById('invoiceClientPhone').textContent = 'N/A';
        document.getElementById('invoiceClientTaxId').textContent = 'N/A';
        document.getElementById('invoiceClientAddress').textContent = 'N/A';
    }

    // Load invoice line items
    loadInvoiceLineItems(invoice);

    // Update totals
    updateInvoiceTotals(invoice);

    // Show modal
    document.getElementById('invoiceModal').style.display = 'block';
}

function loadInvoiceLineItems(invoice) {
    const tbody = document.getElementById('invoiceLineItems');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Get line items from invoice or generate from transactions/manual billing
    let lineItems = invoice.lineItems || [];

    if (lineItems.length === 0) {
        // Generate line items from transactions
        const transactions = mockData.transactions.filter(t =>
            t.company === invoice.company &&
            t.invoiceId === invoice.id
        );

        // Generate line items from manual billing
        const manualBilling = mockData.manualBilling.filter(mb =>
            mb.company === invoice.company &&
            mb.invoiceId === invoice.id
        );

        // Add transaction line items
        transactions.forEach(t => {
            lineItems.push({
                description: `${t.product} - Transaction`,
                quantity: t.quantity || 1,
                unitPrice: t.amount / (t.quantity || 1),
                total: t.amount
            });
        });

        // Add manual billing line items (use their descriptions)
        manualBilling.forEach(mb => {
            lineItems.push({
                description: mb.description || 'Manual Billing Item',
                quantity: mb.quantity || 1,
                unitPrice: mb.amount / (mb.quantity || 1),
                total: mb.amount
            });
        });
    }

    // Render line items
    lineItems.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
      <td>${item.description}</td>
      <td>${item.quantity || 1}</td>
      <td>R ${formatCurrency(item.unitPrice || item.total)}</td>
      <td>R ${formatCurrency(item.total)}</td>
    `;
        tbody.appendChild(row);
    });

    // If no line items, show placeholder
    if (lineItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 24px; color: #94a3b8;">No line items</td></tr>';
    }
}

function updateInvoiceTotals(invoice) {
    const subtotal = invoice.subtotal || invoice.total || 0;
    const discount = invoice.discount || 0;
    const discountedAmount = subtotal - discount;
    const tax = invoice.tax !== undefined ? parseFloat(invoice.tax) : (discountedAmount * 0.15);
    const total = invoice.total !== undefined ? parseFloat(invoice.total) : (discountedAmount + tax);
    const paid = invoice.paid || invoice.paidAmount || 0;
    const outstanding = invoice.outstanding !== undefined ? parseFloat(invoice.outstanding) : (total - paid);

    document.getElementById('invoiceSubtotal').textContent = 'R ' + formatCurrency(subtotal);
    document.getElementById('invoiceDiscount').textContent = 'R ' + formatCurrency(discount);
    if (document.getElementById('invoiceTax')) {
        document.getElementById('invoiceTax').textContent = 'R ' + formatCurrency(tax);
    }
    document.getElementById('invoiceTotal').textContent = 'R ' + formatCurrency(total);
    document.getElementById('invoicePaid').textContent = 'R ' + formatCurrency(paid);
    document.getElementById('invoiceOutstanding').textContent = 'R ' + formatCurrency(outstanding);
}

function formatCurrency(amount) {
    return parseFloat(amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Fix 2: Dashboard Invoice Status Sync
// ===================================

function updateInvoiceStatus(invoiceId, newStatus) {
    const invoice = mockData.invoices.find(inv => inv.id === invoiceId || inv.invoiceNumber === invoiceId);

    if (invoice) {
        invoice.status = newStatus;
        saveToLocalStorage();

        // If on dashboard, refresh it
        if (currentPage === 'dashboard') {
            renderDashboard();
        }

        // Refresh the current page if on reports
        if (currentPage === 'reports') {
            renderInvoices();
        }

        showNotification(`Invoice status updated to ${newStatus}`, 'success');
    }
}

// Hook into status change dropdowns
document.addEventListener('DOMContentLoaded', function () {
    // Find all invoice status dropdowns and add change listeners
    document.addEventListener('change', function (e) {
        if (e.target.classList.contains('invoice-status-select')) {
            const invoiceId = e.target.dataset.invoiceId;
            const newStatus = e.target.value;
            updateInvoiceStatus(invoiceId, newStatus);
        }
    });
});

// Fix 3: Authorization Tab Fixes
// ===================================

function initAuthorizationTabs() {
    const authTabs = document.querySelectorAll('.auth-tab');

    authTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const tabName = this.dataset.tab;

            // Remove active class from all tabs
            authTabs.forEach(t => t.classList.remove('active'));

            // Add active class to clicked tab
            this.classList.add('active');

            // Hide all tab contents
            document.querySelectorAll('.auth-tab-content').forEach(content => {
                content.style.display = 'none';
            });

            // Show selected tab content
            const selectedContent = document.getElementById(tabName + 'Content');
            if (selectedContent) {
                selectedContent.style.display = 'block';
            }

            // Load data for the selected tab
            switch (tabName) {
                case 'authManualBilling':
                    renderAuthManualBilling();
                    break;
                case 'authBatches':
                    renderAuthBatches();
                    break;
                case 'authRejected':
                    renderAuthRejected();
                    break;
            }
        });
    });
}

function renderAuthManualBilling() {
    const tbody = document.getElementById('authManualBillingTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Get pending manual billing items
    const pendingItems = mockData.manualBilling.filter(mb => mb.status === 'Pending' || mb.status === 'pending');

    const paginatedItems = getPaginatedData(pendingItems, 'authManualBilling');

    paginatedItems.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
      <td>${item.company}</td>
      <td>${item.description || 'N/A'}</td>
      <td>R ${formatCurrency(item.amount)}</td>
      <td>${formatDate(item.date)}</td>
      <td>
        <button class="btn btn-sm btn-success" onclick="approveManualBilling('${item.id}')">Approve</button>
        <button class="btn btn-sm btn-danger" onclick="rejectManualBilling('${item.id}')">Reject</button>
      </td>
    `;
        tbody.appendChild(row);
    });

    if (pendingItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 24px; color: #94a3b8;">No pending manual billing items</td></tr>';
    }

    // Render pagination
    renderPaginationControls('authManualBillingPagination', pendingItems.length, 'authManualBilling');
}

function renderAuthBatches() {
    const tbody = document.getElementById('authBatchesTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Get pending batches
    const pendingBatches = mockData.batches.filter(b => b.status === 'Pending' || b.status === 'pending');

    const paginatedBatches = getPaginatedData(pendingBatches, 'authBatches');

    paginatedBatches.forEach(batch => {
        const row = document.createElement('tr');
        row.innerHTML = `
      <td>${batch.batchId || batch.id}</td>
      <td>${batch.company || 'N/A'}</td>
      <td>${batch.itemCount || 0}</td>
      <td>R ${formatCurrency(batch.totalAmount || 0)}</td>
      <td>${formatDate(batch.date)}</td>
      <td>
        <button class="btn btn-sm btn-success" onclick="approveBatch('${batch.id}')">Approve</button>
        <button class="btn btn-sm btn-danger" onclick="rejectBatch('${batch.id}')">Reject</button>
      </td>
    `;
        tbody.appendChild(row);
    });

    if (pendingBatches.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 24px; color: #94a3b8;">No pending batches</td></tr>';
    }

    // Render pagination
    renderPaginationControls('authBatchesPagination', pendingBatches.length, 'authBatches');
}

function approveManualBilling(id) {
    const item = mockData.manualBilling.find(mb => mb.id === id);
    if (item) {
        item.status = 'Approved';
        saveToLocalStorage();
        renderAuthManualBilling();
        showNotification('Manual billing item approved', 'success');
    }
}

function rejectManualBilling(id) {
    const item = mockData.manualBilling.find(mb => mb.id === id);
    if (item) {
        item.status = 'Rejected';
        saveToLocalStorage();
        renderAuthManualBilling();
        renderAuthRejected();
        showNotification('Manual billing item rejected', 'info');
    }
}

function approveBatch(id) {
    const batch = mockData.batches.find(b => b.id === id);
    if (batch) {
        batch.status = 'Approved';
        saveToLocalStorage();
        renderAuthBatches();
        showNotification('Batch approved', 'success');
    }
}

function rejectBatch(id) {
    const batch = mockData.batches.find(b => b.id === id);
    if (batch) {
        batch.status = 'Rejected';
        saveToLocalStorage();
        renderAuthBatches();
        renderAuthRejected();
        showNotification('Batch rejected', 'info');
    }
}

function renderAuthRejected() {
    const tbody = document.getElementById('authRejectedTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Get rejected items
    const rejectedManualBilling = mockData.manualBilling.filter(mb => mb.status === 'Rejected');
    const rejectedBatches = mockData.batches.filter(b => b.status === 'Rejected');

    const allRejected = [
        ...rejectedManualBilling.map(mb => ({ ...mb, type: 'Manual Billing' })),
        ...rejectedBatches.map(b => ({ ...b, type: 'Batch' }))
    ];

    const paginatedItems = getPaginatedData(allRejected, 'authRejected');

    paginatedItems.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
      <td>${item.type}</td>
      <td>${item.company || 'N/A'}</td>
      <td>${item.description || item.batchId || item.id}</td>
      <td>R ${formatCurrency(item.amount || item.totalAmount || 0)}</td>
      <td>${formatDate(item.date)}</td>
    `;
        tbody.appendChild(row);
    });

    if (allRejected.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 24px; color: #94a3b8;">No rejected items</td></tr>';
    }

    // Render pagination
    renderPaginationControls('authRejectedPagination', allRejected.length, 'authRejected');
}

// Fix 4: Billing Consolidation
// ===================================

function generateConsolidatedInvoice(company, dateFrom, dateTo) {
    // Get transactions for period
    const transactions = mockData.transactions.filter(t =>
        t.company === company.name &&
        new Date(t.date) >= new Date(dateFrom) &&
        new Date(t.date) <= new Date(dateTo)
    );

    // Get approved manual billing for period
    const manualBilling = mockData.manualBilling.filter(mb =>
        mb.company === company.name &&
        mb.status === 'Approved' &&
        new Date(mb.date) >= new Date(dateFrom) &&
        new Date(mb.date) <= new Date(dateTo)
    );

    // If no items, return null
    if (transactions.length === 0 && manualBilling.length === 0) {
        return null;
    }

    // Create line items
    const lineItems = [];
    let subtotal = 0;

    // Add transaction line items
    transactions.forEach(t => {
        const amount = parseFloat(t.amount || 0);
        lineItems.push({
            description: `${t.product} - Transaction`,
            quantity: t.quantity || 1,
            unitPrice: amount / (t.quantity || 1),
            total: amount
        });
        subtotal += amount;
    });

    // Add manual billing line items (use their descriptions)
    manualBilling.forEach(mb => {
        const amount = parseFloat(mb.amount || 0);
        lineItems.push({
            description: mb.description || 'Manual Billing Item',
            quantity: mb.quantity || 1,
            unitPrice: amount / (mb.quantity || 1),
            total: amount
        });
        subtotal += amount;
    });

    // Generate invoice ID
    const invoiceNumber = 'INV-' + new Date().getFullYear() + '-' + (mockData.invoices.length + 1).toString().padStart(3, '0');

    const discount = 0;
    const tax = (subtotal - discount) * 0.15;
    const total = (subtotal - discount) + tax;

    // Create consolidated invoice
    const invoice = {
        id: 'inv_' + Date.now(),
        invoiceNumber: invoiceNumber,
        company: company.name,
        dateIssued: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentTerms: 'Net 15',
        lineItems: lineItems,
        subtotal: subtotal,
        discount: discount,
        tax: tax,
        total: total,
        totalPrice: total,
        unitPrice: total,
        paid: 0,
        paidAmount: 0,
        outstanding: total,
        status: 'Unpaid',
        month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        billingMonth: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };

    // Mark transactions and manual billing as invoiced
    transactions.forEach(t => t.invoiceId = invoice.id);
    manualBilling.forEach(mb => mb.invoiceId = invoice.id);

    return invoice;
}

// Override the existing runBilling function
function runBillingConsolidated() {
    const dateFrom = document.getElementById('billingDateFrom').value;
    const dateTo = document.getElementById('billingDateTo').value;

    if (!dateFrom || !dateTo) {
        showNotification('Please select date range', 'error');
        return;
    }

    let invoicesGenerated = 0;

    // Get all companies
    mockData.companies.forEach(company => {
        const invoice = generateConsolidatedInvoice(company, dateFrom, dateTo);

        if (invoice) {
            mockData.invoices.push(invoice);
            invoicesGenerated++;
        }
    });

    saveToLocalStorage();

    if (invoicesGenerated > 0) {
        showNotification(`Generated ${invoicesGenerated} consolidated invoice(s)`, 'success');
        renderInvoices();
    } else {
        showNotification('No transactions or manual billing found for the selected period', 'info');
    }
}

// Initialize all fixes on page load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', function () {
        initAuthorizationTabs();
    });
}

// Export functions for use in other scripts
if (typeof window !== 'undefined') {
    window.loadInvoiceData = loadInvoiceData;
    window.updateInvoiceStatus = updateInvoiceStatus;
    window.renderAuthManualBilling = renderAuthManualBilling;
    window.renderAuthBatches = renderAuthBatches;
    window.renderAuthRejected = renderAuthRejected;
    window.approveManualBilling = approveManualBilling;
    window.rejectManualBilling = rejectManualBilling;
    window.approveBatch = approveBatch;
    window.rejectBatch = rejectBatch;
    window.runBillingConsolidated = runBillingConsolidated;
    window.generateConsolidatedInvoice = generateConsolidatedInvoice;
}
