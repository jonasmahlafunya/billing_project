
// ===================================
// PHASE 6: REFINEMENTS & EXTENSIONS
// ===================================

// ===================================
// INVOICE ENHANCEMENTS
// ===================================

// Override renderInvoices to handle status changes and tab logic
function renderInvoices() {
    const tbody = document.getElementById('invoicesTableBody');
    const filteredInvoices = getFilteredInvoices();

    if (currentTab === 'statements') {
        // Statement View Logic (Existing)
        const companies = mockData.companies;
        tbody.innerHTML = companies.map(c => `
      <tr>
        <td><a href="#" class="table-link">${c.name}</a></td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td><span class="badge badge-success">Active</span></td>
        <td><button class="btn btn-primary view-statement-btn" data-company="${c.name}">View Statement</button></td>
        <td>-</td>
      </tr>
    `).join('');

        document.querySelectorAll('.view-statement-btn').forEach(btn => {
            btn.onclick = () => {
                const company = btn.getAttribute('data-company');
                const modal = document.getElementById('statementModal');
                modal.setAttribute('data-company', company);
                modal.classList.add('show');
            };
        });

    } else {
        // Invoice View Logic (Updated)
        // Filter by tab status (Paid/Unpaid)
        const statusFilter = currentTab === 'paid' ? 'Paid' : 'Unpaid';
        const invoicesToShow = filteredInvoices.filter(inv => inv.status === statusFilter);

        if (invoicesToShow.length === 0) {
            tbody.innerHTML = `<tr><td colspan="11" class="text-center">No ${statusFilter.toLowerCase()} invoices found</td></tr>`;
            return;
        }

        tbody.innerHTML = invoicesToShow.map(inv => `
      <tr>
        <td><a href="#" class="table-link">${inv.company}</a></td>
        <td>${inv.transactions}</td>
        <td>R${inv.unitPrice.toFixed(2)}</td>
        <td>R${inv.totalPrice.toFixed(2)}</td>
        <td>${formatDate(inv.dueDate)}</td>
        <td>R${inv.paidAmount.toFixed(2)}</td>
        <td>${inv.discount.toFixed(2)}</td>
        <td>R${inv.outstanding.toFixed(2)}</td>
        <td>
          <select class="status-dropdown ${inv.status.toLowerCase()}" onchange="updateInvoiceStatus(${inv.id}, this.value)">
            <option value="Unpaid" ${inv.status === 'Unpaid' ? 'selected' : ''}>Unpaid ▼</option>
            <option value="Paid" ${inv.status === 'Paid' ? 'selected' : ''}>Paid</option>
          </select>
        </td>
        <td><button class="btn btn-primary view-invoice-btn" data-id="${inv.id}">View</button></td>
        <td>${inv.billingMonth}</td>
      </tr>
    `).join('');

        // Attach View Listeners
        document.querySelectorAll('.view-invoice-btn').forEach(btn => {
            btn.onclick = () => {
                const id = parseInt(btn.getAttribute('data-id'));
                openInvoiceModal(id);
            };
        });
    }
}

function updateInvoiceStatus(id, newStatus) {
    const invoice = mockData.invoices.find(inv => inv.id === id);
    if (invoice) {
        invoice.status = newStatus;

        if (newStatus === 'Paid') {
            invoice.paidAmount = invoice.totalPrice;
            invoice.outstanding = 0;
            showNotification(`Invoice ${id} marked as Paid`, 'success');
        } else {
            invoice.paidAmount = 0;
            invoice.outstanding = invoice.totalPrice;
            showNotification(`Invoice ${id} marked as Unpaid`, 'warning');
        }

        renderInvoices(); // Re-render to move to correct tab
    }
}

function openInvoiceModal(id) {
    const invoice = mockData.invoices.find(inv => inv.id === id);
    if (!invoice) return;

    const modal = document.getElementById('invoiceModal');
    const company = mockData.companies.find(c => c.name === invoice.company);

    // Populate Header
    document.getElementById('invoiceNumber').textContent = `INV-${String(invoice.id).padStart(3, '0')}`;
    document.getElementById('invoiceDate').textContent = formatDate('2025-01-31');
    document.getElementById('invoiceDueDate').textContent = formatDate(invoice.dueDate);

    // Status Badge
    const badgeContainer = document.getElementById('invoiceStatusBadge');
    badgeContainer.innerHTML = `<span class="status-badge-large ${invoice.status === 'Paid' ? 'status-paid' : 'status-unpaid'}">${invoice.status}</span>`;

    // Client Info
    document.getElementById('invoiceClientName').textContent = invoice.company;
    document.getElementById('invoiceClientAddress').textContent = company ? company.address : 'Address not found';
    document.getElementById('invoiceClientTaxId').textContent = company ? `Tax ID: ${company.taxId || '-'}` : 'Tax ID: -';

    // Line Items (Linked to Priced Transactions)
    const tbody = document.getElementById('invoiceLineItems');
    // Try to find priced transactions for this company
    const pricedItems = mockData.pricedTransactions.filter(pt => pt.company === invoice.company);

    if (pricedItems.length > 0) {
        tbody.innerHTML = pricedItems.map(item => `
      <tr>
        <td style="text-align: left; padding: 12px; border-bottom: 1px solid #eee;">${item.product} (${item.rangeFrom}-${item.rangeTo})</td>
        <td style="text-align: center; padding: 12px; border-bottom: 1px solid #eee;">${item.transactions}</td>
        <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee;">R${item.unitPrice.toFixed(2)}</td>
        <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee;">R${item.totalPrice.toFixed(2)}</td>
      </tr>
     `).join('');
    } else {
        // Fallback to generic if no priced transactions found
        tbody.innerHTML = `
      <tr>
        <td style="text-align: left; padding: 12px; border-bottom: 1px solid #eee;">Consolidated Services</td>
        <td style="text-align: center; padding: 12px; border-bottom: 1px solid #eee;">${invoice.transactions}</td>
        <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee;">R${invoice.unitPrice.toFixed(2)}</td>
        <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee;">R${invoice.totalPrice.toFixed(2)}</td>
      </tr>
     `;
    }

    // Totals & Discount Editing
    document.getElementById('invoiceSubtotal').textContent = `R${invoice.totalPrice.toFixed(2)}`;

    const discountSpan = document.getElementById('invoiceDiscount');
    const discountInput = document.getElementById('invoiceDiscountInput');
    const editBtn = document.getElementById('editDiscountBtn');

    discountSpan.textContent = `R${invoice.discount.toFixed(2)}`;
    discountInput.value = invoice.discount;

    // Reset edit state
    discountSpan.classList.remove('hidden');
    discountInput.classList.add('hidden');

    // Admin only edit
    if (currentUser && currentUser.role === 'Admin') {
        editBtn.classList.remove('hidden');
        editBtn.onclick = () => {
            discountSpan.classList.add('hidden');
            discountInput.classList.remove('hidden');
            discountInput.focus();
        };

        discountInput.onblur = () => {
            const newDiscount = parseFloat(discountInput.value) || 0;
            invoice.discount = newDiscount;
            invoice.outstanding = invoice.totalPrice - newDiscount - invoice.paidAmount;

            discountSpan.textContent = `R${newDiscount.toFixed(2)}`;
            document.getElementById('invoiceOutstanding').textContent = `R${invoice.outstanding.toFixed(2)}`;

            discountSpan.classList.remove('hidden');
            discountInput.classList.add('hidden');

            renderInvoices(); // Update table
        };
    } else {
        editBtn.classList.add('hidden');
    }

    document.getElementById('invoicePaid').textContent = `R${invoice.paidAmount.toFixed(2)}`;
    document.getElementById('invoiceOutstanding').textContent = `R${invoice.outstanding.toFixed(2)}`;

    modal.classList.add('show');
}

// Helper for date formatting
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// ===================================
// SEARCH FUNCTIONALITY
// ===================================

function initSearch() {
    // Manual Billing Search
    const mbSearch = document.getElementById('manualBillingSearch');
    if (mbSearch) {
        mbSearch.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#manualBillingTableBody tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(term) ? '' : 'none';
            });
        });
    }

    // Batch Logger Search
    const blSearch = document.getElementById('batchLoggerSearch');
    if (blSearch) {
        blSearch.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#batchTableBody tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(term) ? '' : 'none';
            });
        });
    }
}

// ===================================
// AUTHORIZATION & REJECTIONS
// ===================================

function renderAuthorizations() {
    const manualTab = document.getElementById('auth-manual-billing-tab');
    const batchesTab = document.getElementById('auth-batches-tab');
    const rejectedTab = document.getElementById('auth-rejected-tab');

    // Determine active tab
    let activeTab = 'manual-billing';
    if (batchesTab && batchesTab.classList.contains('active')) activeTab = 'batches';
    if (rejectedTab && rejectedTab.classList.contains('active')) activeTab = 'rejected';

    // Render Manual Billing Authorization
    const mbTbody = document.getElementById('authManualBillingTableBody');
    const pendingBilling = mockData.manualBilling.filter(mb => !mb.authorized && mb.status === 'Pending');

    mbTbody.innerHTML = pendingBilling.length === 0
        ? '<tr><td colspan="7" class="text-center">No pending authorizations</td></tr>'
        : pendingBilling.map(mb => `
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

    // Render Batches Authorization
    const batchesTbody = document.getElementById('authBatchesTableBody');
    const pendingBatches = mockData.batches.filter(b => !b.authorized && b.status !== 'Processed' && b.status !== 'Rejected');

    batchesTbody.innerHTML = pendingBatches.length === 0
        ? '<tr><td colspan="6" class="text-center">No pending batches</td></tr>'
        : pendingBatches.map(b => `
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

    // Render Rejected Items
    const rejectedTbody = document.getElementById('authRejectedTableBody');
    const rejectedBilling = mockData.manualBilling.filter(mb => mb.status === 'Rejected');
    const rejectedBatches = mockData.batches.filter(b => b.status === 'Rejected');

    const allRejected = [
        ...rejectedBilling.map(i => ({ ...i, type: 'Manual Billing', reason: 'Admin Rejected' })),
        ...rejectedBatches.map(i => ({ ...i, type: 'Batch', reason: 'Admin Rejected' }))
    ];

    rejectedTbody.innerHTML = allRejected.length === 0
        ? '<tr><td colspan="6" class="text-center">No rejected items</td></tr>'
        : allRejected.map(item => `
      <tr>
        <td>${item.type}</td>
        <td>${item.id}</td>
        <td>${item.description}</td>
        <td>${formatDate(new Date().toISOString())}</td> <!-- Mock rejection date -->
        <td><span class="badge badge-rejected">${item.reason}</span></td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="reconsiderItem('${item.id}', '${item.type}')">Reconsider</button>
        </td>
      </tr>
    `).join('');

    updateAuthBadge();
}

function reconsiderItem(id, type) {
    if (type === 'Manual Billing') {
        const item = mockData.manualBilling.find(i => i.id === id);
        if (item) {
            item.status = 'Pending';
            showNotification(`Manual Billing ${id} moved back to Pending`, 'success');
        }
    } else {
        const item = mockData.batches.find(i => i.id === id);
        if (item) {
            item.status = 'Processing'; // Or whatever initial status
            showNotification(`Batch ${id} moved back to Pending`, 'success');
        }
    }
    renderAuthorizations();
}

// ===================================
// PRICING MODAL
// ===================================

function initPricingModal() {
    const modal = document.getElementById('addPriceModal');
    const close = modal.querySelector('.close-modal');
    const cancel = document.getElementById('cancelAddPrice');
    const form = document.getElementById('addPriceForm');
    const companySelect = document.getElementById('priceCompany');

    const closeModal = () => modal.classList.remove('show');
    close.onclick = closeModal;
    cancel.onclick = closeModal;

    window.onclick = (e) => {
        if (e.target === modal) closeModal();
    };

    form.onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(form);

        const newPrice = {
            id: mockData.pricing.length + 1,
            companyName: formData.get('company'),
            productName: formData.get('product'),
            rangeFrom: parseInt(formData.get('rangeFrom')),
            rangeTo: parseInt(formData.get('rangeTo')),
            price: parseFloat(formData.get('price')),
            validFor: formData.get('validFor'),
            status: 'Active'
        };

        mockData.pricing.push(newPrice);

        // Also add to priced transactions for consistency
        mockData.pricedTransactions.push({
            company: newPrice.companyName,
            product: newPrice.productName,
            transactions: 0,
            rangeFrom: newPrice.rangeFrom,
            rangeTo: newPrice.rangeTo,
            unitPrice: newPrice.price,
            totalPrice: 0
        });

        renderPricing();
        closeModal();
        showNotification('Pricing configuration added successfully', 'success');
    };
}

// Override resolveException to open modal
function resolveException(company, product) {
    const modal = document.getElementById('addPriceModal');
    const form = document.getElementById('addPriceForm');
    const companySelect = document.getElementById('priceCompany');

    // Populate companies
    companySelect.innerHTML = mockData.companies.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

    // Pre-fill
    companySelect.value = company;
    document.getElementById('priceProduct').value = product;

    modal.classList.add('show');
}

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    // Init new features
    initSearch();
    initPricingModal();

    // Re-bind auth tabs to include new rejected tab
    const authTabs = document.querySelectorAll('#authorizations-page .tab');
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            document.querySelectorAll('#authorizations-page .tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`auth-${tabName}-tab`).classList.add('active');

            renderAuthorizations(); // Re-render to ensure correct data
        });
    });
});
