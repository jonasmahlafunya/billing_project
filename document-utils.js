// Document Utility Functions
const BILLING_COMPANY = {
    name: "Billing System Inc.",
    tagline: "Professional Billing & Financial Management Solutions",
    address: "123 Tech Park, Sandton, Johannesburg, 2196",
    phone: "(011) 123-4567",
    email: "billing@billing-system.co.za",
    website: "www.billing-system.co.za"
};

function getBillingCompanyInitials() {
    return BILLING_COMPANY.name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
}

function populateBillingCompanyInfo(elementPrefix = '') {
    const prefix = elementPrefix ? elementPrefix : '';

    // Set billing company initials
    const initialsElement = document.getElementById(`${prefix}billingCompanyInitials`);
    if (initialsElement) {
        initialsElement.textContent = getBillingCompanyInitials();
    }

    // Set billing company details - with null checks
    const nameElement = document.getElementById(`${prefix}billingCompanyName`);
    if (nameElement) nameElement.textContent = BILLING_COMPANY.name;

    const taglineElement = document.getElementById(`${prefix}billingCompanyTagline`);
    if (taglineElement) taglineElement.textContent = BILLING_COMPANY.tagline;

    const addressElement = document.getElementById(`${prefix}billingCompanyAddress`);
    if (addressElement) addressElement.textContent = BILLING_COMPANY.address;

    const phoneElement = document.getElementById(`${prefix}billingCompanyPhone`);
    if (phoneElement) phoneElement.textContent = BILLING_COMPANY.phone;

    const emailElement = document.getElementById(`${prefix}billingCompanyEmail`);
    if (emailElement) emailElement.textContent = BILLING_COMPANY.email;

    const websiteElement = document.getElementById(`${prefix}billingCompanyWebsite`);
    if (websiteElement) {
        websiteElement.textContent = BILLING_COMPANY.website;
    }
}

function populateClientInvoiceInfo(companyData, invoiceData) {
    if (!companyData) return;

    // Client information
    document.getElementById('invoiceClientName').textContent = companyData.name || companyData.companyName || 'N/A';
    document.getElementById('invoiceClientContact').textContent = companyData.contactPerson || companyData.contact || 'N/A';
    document.getElementById('invoiceClientEmail').textContent = companyData.email || 'N/A';
    document.getElementById('invoiceClientPhone').textContent = companyData.phone || 'N/A';
    document.getElementById('invoiceClientTaxId').textContent = companyData.taxId || companyData.registrationNumber || 'N/A';
    document.getElementById('invoiceClientAddress').textContent = companyData.address || 'N/A';

    // Invoice metadata
    if (invoiceData) {
        document.getElementById('invoiceNumber').textContent = invoiceData.invoiceNumber || invoiceData.id || 'N/A';
        document.getElementById('invoiceDate').textContent = formatDate(invoiceData.date || invoiceData.createdAt);
        document.getElementById('invoiceDueDate').textContent = formatDate(invoiceData.dueDate);
        document.getElementById('invoiceTerms').textContent = invoiceData.terms || 'Net 30';

        // Set status
        updateInvoiceStatusDisplay(invoiceData.status || 'unpaid');

        // Populate line items
        populateInvoiceLineItems(invoiceData.items || []);

        // Calculate and display totals
        calculateInvoiceTotals(invoiceData);
    }
}

function populateStatementInfo(companyData, periodData) {
    if (!companyData) return;

    document.getElementById('statementCompanyName').textContent = companyData.name || companyData.companyName || 'N/A';

    if (periodData) {
        document.getElementById('statementStartDate').textContent = formatDate(periodData.startDate);
        document.getElementById('statementEndDate').textContent = formatDate(periodData.endDate);

        // Calculate summary based on period data
        calculateStatementSummary(periodData);
    }
}

function updateUsageHeader(usageData) {
    if (!usageData) return;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Set period
    document.getElementById('usagePeriod').textContent =
        `Period: ${formatDate(startOfMonth)} - ${formatDate(endOfMonth)}`;

    // Calculate metrics
    if (usageData.entries && Array.isArray(usageData.entries)) {
        const totalUsage = usageData.entries.reduce((sum, entry) => sum + (parseInt(entry.input) || 0), 0);
        const activeUsers = new Set(usageData.entries.map(entry => entry.username)).size;

        document.getElementById('totalUsageValue').textContent = formatNumber(totalUsage);
        document.getElementById('activeUsersValue').textContent = activeUsers;

        // Set refresh time
        document.getElementById('usageDataRefresh').textContent =
            `Data refreshed: ${formatDateTime(now)}`;

        const nextRefresh = new Date(now.getTime() + 30 * 60000);
        document.getElementById('usageNextRefresh').textContent =
            `Next refresh: ${formatTime(nextRefresh)}`;
    }
}

function formatDate(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTime(date) {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}

function updateInvoiceStatusDisplay(status) {
    const badge = document.getElementById('invoiceStatusBadge');
    const text = document.getElementById('invoiceStatusText');
    const select = document.getElementById('invoiceStatusSelect');

    if (!badge || !text) return;

    // Remove all status classes
    badge.classList.remove('status-paid', 'status-unpaid', 'status-pending', 'status-overdue');

    // Add correct status class
    badge.classList.add(`status-${status}`);
    text.textContent = status.toUpperCase();

    // Update dropdown if it exists
    if (select) {
        select.value = status;
    }
}

function populateInvoiceLineItems(items) {
    const tbody = document.getElementById('invoiceLineItems');
    if (!tbody) return;

    tbody.innerHTML = '';

    items.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
      <td>${item.description || 'Service'}</td>
      <td class="text-center">${item.quantity || 1}</td>
      <td class="text-right">R ${(item.unitPrice || 0).toFixed(2)}</td>
      <td class="text-right">R ${(item.total || 0).toFixed(2)}</td>
    `;
        tbody.appendChild(row);
    });
}

function calculateInvoiceTotals(invoiceData) {
    const subtotal = invoiceData.subtotal || invoiceData.total || 0;
    const discount = invoiceData.discount || 0;
    const paid = invoiceData.paid || 0;
    const total = subtotal - discount;
    const outstanding = total - paid;

    document.getElementById('invoiceSubtotal').textContent = `R ${subtotal.toFixed(2)}`;
    document.getElementById('invoiceDiscount').textContent = `R ${discount.toFixed(2)}`;
    document.getElementById('invoiceTotal').textContent = `R ${total.toFixed(2)}`;
    document.getElementById('invoicePaid').textContent = `R ${paid.toFixed(2)}`;
    document.getElementById('invoiceOutstanding').textContent = `R ${outstanding.toFixed(2)}`;
}

function calculateStatementSummary(periodData) {
    // Calculate statement summary based on period data
    const totalInvoiced = periodData.totalInvoiced || 0;
    const totalPaid = periodData.totalPaid || 0;
    const outstanding = totalInvoiced - totalPaid;

    document.getElementById('statementTotalInvoiced').textContent = `R ${totalInvoiced.toFixed(2)}`;
    document.getElementById('statementTotalPaid').textContent = `R ${totalPaid.toFixed(2)}`;
    document.getElementById('statementTotalOutstanding').textContent = `R ${outstanding.toFixed(2)}`;
}

// Initialize billing company info when page loads
document.addEventListener('DOMContentLoaded', function () {
    populateBillingCompanyInfo();
    populateBillingCompanyInfo('statement');
});