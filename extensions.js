
// ===================================
// EXTENSIONS & NEW FEATURES
// ===================================

// ===================================
// AUTHORIZATIONS
// ===================================

function renderAuthorizations() {
    const manualTab = document.getElementById('auth-manual-billing-tab');
    const batchesTab = document.getElementById('auth-batches-tab');

    // Render Manual Billing Authorization
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
        <td>${mb.date}</td>
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

    // Render Batches Authorization
    const batchesTbody = document.getElementById('authBatchesTableBody');
    // Relaxed filter: Just check if not authorized or status is Pending/Processing
    const pendingBatches = mockData.batches.filter(b => !b.authorized);

    if (pendingBatches.length === 0) {
        batchesTbody.innerHTML = '<tr><td colspan="6" class="text-center">No pending batches</td></tr>';
    } else {
        batchesTbody.innerHTML = pendingBatches.map(b => `
      <tr>
        <td>${b.id}</td>
        <td>${b.date}</td>
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

    updateAuthBadge();
}

function approveManualBilling(id) {
    const billing = mockData.manualBilling.find(mb => mb.id === id);
    if (billing) {
        billing.authorized = true;
        billing.status = 'Approved';
        billing.authorizedBy = currentUser.firstName + ' ' + currentUser.lastName;
        billing.authorizedDate = new Date().toISOString().split('T')[0];

        showNotification(`Manual billing ${id} approved`, 'success');
        renderAuthorizations();
        logActivity(`Approved manual billing ${id}`, currentUser);
    }
}

function rejectManualBilling(id) {
    const billing = mockData.manualBilling.find(mb => mb.id === id);
    if (billing) {
        billing.status = 'Rejected';
        showNotification(`Manual billing ${id} rejected`, 'warning');
        renderAuthorizations();
        logActivity(`Rejected manual billing ${id}`, currentUser);
    }
}

function approveBatch(id) {
    const batch = mockData.batches.find(b => b.id === id);
    if (batch) {
        batch.authorized = true;
        batch.status = 'Processed';
        batch.authorizedBy = currentUser.firstName + ' ' + currentUser.lastName;
        batch.authorizedDate = new Date().toISOString().split('T')[0];

        // Generate Transactions
        if (batch.records > 0) {
            const newTx = {
                id: mockData.transactions.length + 1,
                company: batch.company,
                product: batch.product || 'Product A', // Fallback if missing
                date: batch.date || new Date().toISOString().split('T')[0],
                count: batch.records,
                input: batch.description,
                output: 'Batch Processed',
                username: batch.createdBy || 'Unknown',
                firstName: 'Batch',
                surname: 'System'
            };
            mockData.transactions.push(newTx);
            saveToLocalStorage(); // Save transactions

            // Sync User to Company Users
            // Extract First/Last from createdBy name
            const [fName, ...lNameParts] = (batch.createdBy || 'Unknown User').split(' ');
            const lName = lNameParts.join(' ');

            const userExists = mockData.companyUsers.find(u =>
                u.companyId === batch.company && // Assuming company name stored in company field, or we match by name
                u.email === `${fName.toLowerCase()}@${batch.company.toLowerCase().replace(/\s/g, '')}.com` // Synthetic match key
            );

            // Safer check: mockData.companyUsers might use company Name or ID. 
            // Let's assume companyUsers uses 'company' property for name or 'companyId'.
            // Based on app.js: companyUsers has { companyId, userId, role, ... } or similar.
            // Let's look at a generic add if not exists by name match.

            // Actually, let's just check if we have this user for this company by name
            const existingUser = mockData.companyUsers.find(u =>
                u.firstName === fName &&
                u.lastName === lName &&
                u.company === batch.company
            );

            if (!existingUser) {
                mockData.companyUsers.push({
                    id: mockData.companyUsers.length + 1,
                    company: batch.company,
                    firstName: fName,
                    lastName: lName,
                    email: `${fName.toLowerCase()}@${batch.company.replace(/\s/g, '').toLowerCase()}.com`,
                    role: 'User',
                    status: 'Active',
                    lastActive: new Date().toISOString().split('T')[0]
                });
                saveToLocalStorage();
            }
        }

        showNotification(`Batch ${id} approved and ${batch.records} transactions generated`, 'success');
        renderAuthorizations();
        logActivity(`Approved batch ${id}`, currentUser);

        // Refresh Transactions/Usage if needed (though we are likely on Authorizations page)
    }
}

function rejectBatch(id) {
    const batch = mockData.batches.find(b => b.id === id);
    if (batch) {
        batch.status = 'Rejected';
        showNotification(`Batch ${id} rejected`, 'warning');
        renderAuthorizations();
        logActivity(`Rejected batch ${id}`, currentUser);
    }
}

function updateAuthBadge() {
    const pendingBilling = mockData.manualBilling.filter(mb => !mb.authorized && mb.status === 'Pending').length;
    const pendingBatches = mockData.batches.filter(b => !b.authorized && b.status !== 'Processed').length;
    const total = pendingBilling + pendingBatches;

    const badge = document.getElementById('authBadge');
    if (badge) {
        badge.textContent = total;
        badge.style.display = total > 0 ? 'inline-flex' : 'none';
    }

    const navItem = document.getElementById('authorizationsNav');
    if (navItem) {
        if (currentUser && currentUser.role === 'Admin') {
            navItem.classList.remove('hidden');
        } else {
            navItem.classList.add('hidden');
        }
    }
}

function initAuthTabs() {
    const tabs = document.querySelectorAll('#authorizations-page .tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            document.querySelectorAll('#authorizations-page .tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`auth-${tabName}-tab`).classList.add('active');
        });
    });
}

// ===================================
// EXCEPTIONS
// ===================================

function renderExceptions() {
    const tbody = document.getElementById('exceptionsTableBody');
    const exceptions = detectExceptions();

    if (exceptions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No exceptions found</td></tr>';
    } else {
        tbody.innerHTML = exceptions.map(ex => `
      <tr>
        <td>${ex.company}</td>
        <td>${ex.product}</td>
        <td>${ex.transactions}</td>
        <td><span class="badge badge-danger">${ex.reason}</span></td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="resolveException('${ex.company}', '${ex.product}')">Add Pricing</button>
        </td>
      </tr>
    `).join('');
    }
}

function detectExceptions() {
    const exceptions = [];
    mockData.transactions.forEach(t => {
        const pricing = mockData.pricing.find(p =>
            p.companyName === t.company &&
            p.productName === t.product &&
            p.status === 'Active'
        );

        if (!pricing) {
            const exists = exceptions.find(e => e.company === t.company && e.product === t.product);
            if (!exists) {
                exceptions.push({
                    company: t.company,
                    product: t.product,
                    transactions: t.count,
                    reason: 'Missing Pricing'
                });
            }
        }
    });
    return exceptions;
}

function resolveException(company, product) {
    showNotification(`Please add pricing for ${company} - ${product} in the Pricing page`, 'info');
    navigateToPage('pricing');
}

window.refreshExceptions = function () {
    renderExceptions();
    showNotification('Exceptions list refreshed', 'success');
};

// ===================================
// WAITING ROOM
// ===================================

function renderWaitingRoom() {
    const tbody = document.getElementById('waitingRoomTableBody');
    const unauthorizedUsers = mockData.users.filter(u => !u.authorized);

    if (unauthorizedUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No users in waiting room</td></tr>';
    } else {
        tbody.innerHTML = unauthorizedUsers.map(u => `
      <tr>
        <td>${u.firstName} ${u.lastName}</td>
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td>${u.createdDate || 'N/A'}</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-primary btn-sm" onclick="approveUser('${u.email}')">Approve</button>
            <button class="btn btn-secondary btn-sm" onclick="rejectUser('${u.email}')">Reject</button>
          </div>
        </td>
      </tr>
    `).join('');
    }
    updateWaitingRoomBadge();
}

function approveUser(email) {
    const user = mockData.users.find(u => u.email === email);
    if (user) {
        user.authorized = true;
        showNotification(`User ${user.firstName} approved`, 'success');
        renderWaitingRoom();
        updateWaitingRoomBadge();
        logActivity(`Approved user ${user.firstName} ${user.lastName}`, currentUser);
    }
}

function rejectUser(email) {
    const index = mockData.users.findIndex(u => u.email === email);
    if (index !== -1) {
        const user = mockData.users[index];
        mockData.users.splice(index, 1);
        showNotification(`User ${user.firstName} rejected and removed`, 'warning');
        renderWaitingRoom();
        updateWaitingRoomBadge();
        logActivity(`Rejected user ${user.firstName} ${user.lastName}`, currentUser);
    }
}

function updateWaitingRoomBadge() {
    const count = mockData.users.filter(u => !u.authorized).length;
    const badge = document.getElementById('waitingRoomBadge');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
}

// ===================================
// ACTIVITY FEED
// ===================================

// activityLog is defined in app.js

function logActivity(action, userObj) {
    const user = userObj ? `${userObj.firstName} ${userObj.lastName}` : 'System';
    activityLog.unshift({
        user: user,
        action: action,
        time: 'Just now',
        type: 'info'
    });
    if (activityLog.length > 10) activityLog.pop();
    renderActivityFeed();
}

function renderActivityFeed() {
    const feed = document.getElementById('activityFeed');
    if (!feed) return;

    feed.innerHTML = activityLog.map(item => `
    <div class="activity-item">
      <div class="activity-icon ${item.type || 'info'}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      </div>
      <div class="activity-content">
        <p class="activity-text"><strong>${item.user}</strong> ${item.action}</p>
        <span class="activity-time">${item.time}</span>
      </div>
    </div>
  `).join('');
}

function initActivityFeed() {
    const clearBtn = document.getElementById('clearActivityBtn');
    if (clearBtn) {
        clearBtn.onclick = () => {
            activityLog.length = 0;
            renderActivityFeed();
        };
    }
    renderActivityFeed();
}

// ===================================
// OVERRIDES & UPDATES
// ===================================

// Updated initInvoiceModal
function initInvoiceModal() {
    const modal = document.getElementById('invoiceModal');
    const close = document.getElementById('closeInvoiceModal');
    const closeX = modal.querySelector('.close-modal');
    const closeBtn = document.getElementById('closeInvoiceBtn');

    const closeModal = () => modal.classList.remove('show');
    if (close) close.onclick = closeModal;
    if (closeX) closeX.onclick = closeModal;
    if (closeBtn) closeBtn.onclick = closeModal;

    window.onclick = (e) => {
        if (e.target === modal) closeModal();
    };

    // Delegate click for "View" buttons in invoices table
    document.getElementById('invoicesTableBody').addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-primary') && e.target.textContent === 'View') {
            const row = e.target.closest('tr');
            const companyName = row.cells[0].textContent;
            const invoice = mockData.invoices.find(inv => inv.company === companyName);

            if (invoice) {
                // Populate modal
                document.getElementById('invoiceNumber').textContent = `INV-${String(invoice.id).padStart(3, '0')}`;
                document.getElementById('invoiceDate').textContent = '2025-01-31';
                document.getElementById('invoiceDueDate').textContent = invoice.dueDate;
                document.getElementById('invoiceClientName').textContent = invoice.company;

                const company = mockData.companies.find(c => c.name === invoice.company);
                document.getElementById('invoiceClientAddress').textContent = company ? company.address : 'Address not found';
                document.getElementById('invoiceClientTaxId').textContent = company ? `Tax ID: ${company.taxId}` : 'Tax ID: -';

                const tbody = document.getElementById('invoiceLineItems');
                const transactions = mockData.transactions.filter(t => t.company === invoice.company);

                if (transactions.length > 0) {
                    tbody.innerHTML = transactions.map(t => `
            <tr>
              <td style="text-align: left; padding: 12px; border-bottom: 1px solid #eee;">${t.product}</td>
              <td style="text-align: center; padding: 12px; border-bottom: 1px solid #eee;">${t.count}</td>
              <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee;">R${(invoice.unitPrice).toFixed(2)}</td>
              <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee;">R${(t.count * invoice.unitPrice).toFixed(2)}</td>
            </tr>
           `).join('');
                } else {
                    tbody.innerHTML = `
            <tr>
              <td style="text-align: left; padding: 12px; border-bottom: 1px solid #eee;">Consolidated Services</td>
              <td style="text-align: center; padding: 12px; border-bottom: 1px solid #eee;">${invoice.transactions}</td>
              <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee;">R${invoice.unitPrice.toFixed(2)}</td>
              <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee;">R${invoice.totalPrice.toFixed(2)}</td>
            </tr>
           `;
                }

                document.getElementById('invoiceSubtotal').textContent = `R${invoice.totalPrice.toFixed(2)}`;
                document.getElementById('invoiceDiscount').textContent = `R${invoice.discount.toFixed(2)}`;
                document.getElementById('invoicePaid').textContent = `R${invoice.paidAmount.toFixed(2)}`;
                document.getElementById('invoiceOutstanding').textContent = `R${invoice.outstanding.toFixed(2)}`;

                modal.classList.add('show');
            }
        }
    });
}

// Updated initStatementModal
function initStatementModal() {
    const modal = document.getElementById('statementModal');
    const close = document.getElementById('closeStatementModal');
    const closeX = modal.querySelector('.close-modal');
    const cancelBtn = document.getElementById('cancelStatementBtn');
    const generateBtn = document.getElementById('generateStatementBtn');

    const resetModal = () => {
        document.getElementById('statementPreview').classList.add('hidden');
        document.getElementById('downloadStatementPDF').classList.add('hidden');
        document.getElementById('generateStatementBtn').classList.remove('hidden');
        modal.classList.remove('show');
    };

    if (close) close.onclick = resetModal;
    if (closeX) closeX.onclick = resetModal;
    if (cancelBtn) cancelBtn.onclick = resetModal;

    if (generateBtn) {
        generateBtn.onclick = () => {
            const period = document.querySelector('input[name="statementPeriod"]:checked').value;
            const preview = document.getElementById('statementPreview');
            const tbody = document.getElementById('statementInvoices');

            const companyName = modal.getAttribute('data-company');

            document.getElementById('statementCompanyName').textContent = companyName || 'Company Name';
            document.getElementById('statementPeriod').textContent = `Period: ${period === 'current' ? 'January 2025' : 'Last 3 Months'}`;

            const invoices = mockData.invoices.filter(inv => inv.company === companyName);

            if (invoices.length > 0) {
                tbody.innerHTML = invoices.map(inv => `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">INV-${String(inv.id).padStart(3, '0')}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">2025-01-31</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${inv.dueDate}</td>
            <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee;">R${inv.totalPrice.toFixed(2)}</td>
            <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee;">R${inv.paidAmount.toFixed(2)}</td>
            <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee;">R${inv.outstanding.toFixed(2)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${inv.status}</td>
          </tr>
        `).join('');

                const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalPrice, 0);
                const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
                const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.outstanding, 0);

                document.getElementById('statementTotalInvoiced').textContent = `R${totalInvoiced.toFixed(2)}`;
                document.getElementById('statementTotalPaid').textContent = `R${totalPaid.toFixed(2)}`;
                document.getElementById('statementTotalOutstanding').textContent = `R${totalOutstanding.toFixed(2)}`;

            } else {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center">No invoices found for this period</td></tr>';
            }

            preview.classList.remove('hidden');
            document.getElementById('downloadStatementPDF').classList.remove('hidden');
            generateBtn.classList.add('hidden');
        };
    }

    window.onclick = (e) => {
        if (e.target === modal) resetModal();
    };
}

// Updated renderInvoices to handle Statements tab
// We need to override the one in app.js
// Since we are appending, we can just re-assign the function if it was a variable, 
// but it's a function declaration. 
// However, we can overwrite it by assigning it to window.renderInvoices if it was global,
// or just redefining it if we are in the same scope.
// But wait, function declarations are hoisted. The LAST one wins? No, the first one?
// Actually, if we have two function declarations with the same name, the last one wins in the same scope.
// So appending should work!

function renderInvoices() {
    const tbody = document.getElementById('invoicesTableBody');
    const filteredInvoices = getFilteredInvoices();

    if (currentTab === 'statements') {
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
        // Standard invoice view
        tbody.innerHTML = filteredInvoices.map(inv => `
      <tr>
        <td><a href="#" class="table-link">${inv.company}</a></td>
        <td>${inv.transactions}</td>
        <td>R${inv.unitPrice.toFixed(2)}</td>
        <td>R${inv.totalPrice.toFixed(2)}</td>
        <td>${inv.dueDate}</td>
        <td>R${inv.paidAmount.toFixed(2)}</td>
        <td>${inv.discount.toFixed(2)}</td>
        <td>R${inv.outstanding.toFixed(2)}</td>
        <td>
          <select class="status-dropdown ${inv.status.toLowerCase()}" onchange="updateInvoiceStatus(${inv.id}, this.value)">
            <option value="Unpaid" ${inv.status === 'Unpaid' ? 'selected' : ''}>Unpaid ▼</option>
            <option value="Paid" ${inv.status === 'Paid' ? 'selected' : ''}>Paid</option>
          </select>
        </td>
        <td><button class="btn btn-primary" onclick="window.viewInvoice(${inv.id})">View</button></td>
        <td>${inv.billingMonth}</td>
      </tr>
    `).join('');

        // Attach listener for viewing invoice if not using global
        // Actually using onchange="updateInvoiceStatus" is easier if we define it globally
    }
}

// Global overrides for Invoice actions - Moved out of renderInvoices to ensure availability
window.updateInvoiceStatus = function (id, newStatus) {
    console.log('Update Status Triggered:', id, newStatus);
    const inv = mockData.invoices.find(i => i.id === id);
    if (inv) {
        inv.status = newStatus;
        saveToLocalStorage(); // Ensure this is the global function
        console.log('Saved to LocalStorage. MockData status:', inv.status);

        // Re-render only if we are on the page (to update UI)
        if (typeof renderInvoices === 'function' && document.getElementById('invoicesTableBody')) {
            renderInvoices();
        }
        showNotification(`Invoice ${id} marked as ${newStatus}`, 'success');

        // Also update dashboard if needed
        if (typeof renderDashboard === 'function') {
            renderDashboard();
        }
    } else {
        console.error('Invoice not found:', id);
    }
};

window.viewInvoice = function (id) {
    const invoice = mockData.invoices.find(i => i.id === id);
    if (invoice) {
        const modal = document.getElementById('invoiceModal');
        // Populate modal with invoice data
        document.getElementById('invoiceNumber').textContent = `INV-${String(invoice.id).padStart(3, '0')}`;
        document.getElementById('invoiceDate').textContent = '2025-01-31';
        document.getElementById('invoiceDueDate').textContent = invoice.dueDate;
        document.getElementById('invoiceClientName').textContent = invoice.company;

        const company = mockData.companies.find(c => c.name === invoice.company);
        document.getElementById('invoiceClientAddress').textContent = company ? company.address : 'Address not found';
        document.getElementById('invoiceClientTaxId').textContent = company ? `Tax ID: ${company.taxId}` : 'Tax ID: -';

        const tbody = document.getElementById('invoiceLineItems');
        const transactions = mockData.transactions.filter(t => t.company === invoice.company);

        if (transactions.length > 0) {
            tbody.innerHTML = transactions.map(t => `
            <tr>
              <td style="text-align: left; padding: 12px; border-bottom: 1px solid #eee;">${t.product}</td>
              <td style="text-align: center; padding: 12px; border-bottom: 1px solid #eee;">${t.count}</td>
              <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee;">R${(invoice.unitPrice).toFixed(2)}</td>
              <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee;">R${(t.count * invoice.unitPrice).toFixed(2)}</td>
            </tr>
           `).join('');
        } else {
            tbody.innerHTML = `
            <tr>
              <td style="text-align: left; padding: 12px; border-bottom: 1px solid #eee;">Services</td>
              <td style="text-align: center; padding: 12px; border-bottom: 1px solid #eee;">${invoice.transactions}</td>
              <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee;">R${invoice.unitPrice.toFixed(2)}</td>
              <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee;">R${invoice.totalPrice.toFixed(2)}</td>
            </tr>`;
        }

        document.getElementById('invoiceSubtotal').textContent = `R${invoice.totalPrice.toFixed(2)}`;
        document.getElementById('invoiceDiscount').textContent = `R${invoice.discount.toFixed(2)}`;
        document.getElementById('invoicePaid').textContent = `R${invoice.paidAmount.toFixed(2)}`;
        document.getElementById('invoiceOutstanding').textContent = `R${invoice.outstanding.toFixed(2)}`;

        if (modal) modal.classList.add('show');
    }
};

// ===================================
// INITIALIZATION OF NEW FEATURES
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize New Features
    initAuthTabs();
    initActivityFeed();
    updateAuthBadge();
    updateWaitingRoomBadge();

    // Re-initialize modals with new logic
    // We need to call these again to attach the new event listeners
    // and override the old ones (though old listeners might still exist, 
    // but since we replaced the HTML of the modals, the old listeners on modal elements are gone!
    // Wait, we replaced the HTML of the modals in index.html.
    // So the old init functions in app.js (which run on DOMContentLoaded) will try to attach listeners.
    // Our new init functions (also running on DOMContentLoaded) will also try.
    // Since we are appending this code, both DOMContentLoaded listeners will run.
    // The old one runs first, then this one.
    // This one will attach NEW listeners.
    // This should be fine as long as we don't have conflicting listeners.

    initInvoiceModal();
    initStatementModal();
});
