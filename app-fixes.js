// ===================================
// CRITICAL FIXES FOR BILLING SYSTEM
// ===================================

// ===================================
// FIX 1: RUN BILLING - CORRECTED LOGIC
// ===================================

function initRunBilling() {
    const dateFromInput = document.getElementById('billingDateFrom');
    const dateToInput = document.getElementById('billingDateTo');
    const scheduleBtn = document.getElementById('scheduleRunBtn');
    const confirmBtn = document.getElementById('confirmSendAllBtn');
    const tableBody = document.getElementById('runBillingTableBody');
    const summary = document.getElementById('billingRunSummary');

    let generatedInvoices = [];

    if (scheduleBtn && dateFromInput && dateToInput) {
        scheduleBtn.onclick = () => {
            const dateFrom = dateFromInput.value;
            const dateTo = dateToInput.value;

            // Validation
            if (!dateFrom || !dateTo) {
                ActionFeedback.showError('Please select both From and To dates');
                return;
            }

            if (new Date(dateFrom) > new Date(dateTo)) {
                ActionFeedback.showError('From date cannot be after To date');
                return;
            }

            // Show loading
            ActionFeedback.showLoading(scheduleBtn, 'Analyzing...');

            // Simulate async operation
            setTimeout(() => {
                try {
                    // 1. Check for Exceptions
                    const hasExceptions = mockData.manualBilling.some(mb => mb.status === 'Rejected') ||
                        mockData.batches.some(b => b.status === 'Rejected');

                    if (hasExceptions) {
                        ActionFeedback.hideLoading(scheduleBtn);
                        ActionFeedback.showError('There are outstanding exceptions (Rejected items). Please resolve all exceptions before running billing.');
                        return;
                    }

                    // 2. FIXED: Generate preview from TRANSACTIONS, not just priced transactions
                    generatedInvoices = [];
                    const activeCompanies = mockData.companies.filter(c => c.active);

                    console.log('Active companies:', activeCompanies.length);
                    console.log('Date range:', dateFrom, 'to', dateTo);

                    activeCompanies.forEach(company => {
                        // FIXED: Filter transactions by company and date range
                        const companyTransactions = mockData.transactions.filter(t => {
                            if (t.company !== company.name) return false;

                            // Parse the date - handle both formats
                            let txDate;
                            if (t.date.includes('/')) {
                                // DD/MM/YYYY format
                                const [day, month, year] = t.date.split('/');
                                txDate = new Date(`${year}-${month}-${day}`);
                            } else {
                                // ISO format
                                txDate = new Date(t.date);
                            }

                            const fromDate = new Date(dateFrom);
                            const toDate = new Date(dateTo);

                            return txDate >= fromDate && txDate <= toDate;
                        });

                        console.log(`Company: ${company.name}, Transactions found: ${companyTransactions.length}`);

                        if (companyTransactions.length > 0) {
                            // Calculate total from transactions
                            let totalAmount = 0;
                            const productBreakdown = {};

                            companyTransactions.forEach(t => {
                                // Find pricing for this product
                                const pricing = mockData.pricing.find(p =>
                                    p.companyName === company.name &&
                                    p.productName === t.product &&
                                    p.status === 'Active'
                                );

                                const unitPrice = pricing ? pricing.price : 10; // Default price
                                const transactionTotal = (t.count || 1) * unitPrice;
                                totalAmount += transactionTotal;

                                if (!productBreakdown[t.product]) {
                                    productBreakdown[t.product] = {
                                        count: 0,
                                        amount: 0,
                                        unitPrice: unitPrice
                                    };
                                }
                                productBreakdown[t.product].count += (t.count || 1);
                                productBreakdown[t.product].amount += transactionTotal;
                            });

                            generatedInvoices.push({
                                company: company.name,
                                product: Object.keys(productBreakdown).join(', '),
                                period: `${dateFrom} to ${dateTo}`,
                                amount: totalAmount,
                                status: 'Ready',
                                transactions: companyTransactions,
                                breakdown: productBreakdown
                            });
                        }
                    });

                    console.log('Generated invoices:', generatedInvoices.length);

                    renderBillingPreview();

                    ActionFeedback.hideLoading(scheduleBtn);

                    if (generatedInvoices.length > 0) {
                        confirmBtn.disabled = false;
                        ActionFeedback.showSuccess(`Generated preview for ${generatedInvoices.length} invoice(s) based on ${generatedInvoices.reduce((sum, inv) => sum + inv.transactions.length, 0)} transaction(s)`);
                    } else {
                        confirmBtn.disabled = true;
                        ActionFeedback.showError('No transactions found for the selected period. Please verify the date range and ensure there are transactions recorded.');
                    }
                } catch (error) {
                    console.error('Billing generation error:', error);
                    ActionFeedback.hideLoading(scheduleBtn);
                    ActionFeedback.showError('An error occurred while generating billing: ' + error.message);
                }
            }, 500);
        };
    }

    function renderBillingPreview() {
        if (!tableBody) return;

        if (generatedInvoices.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No invoices to generate. Select dates and click "Schedule Run".</td></tr>';
            if (summary) summary.textContent = '0 Invoices | Total: R 0.00';
            return;
        }

        let total = 0;
        tableBody.innerHTML = generatedInvoices.map((inv, index) => {
            total += parseFloat(inv.amount);
            return `
        <tr>
          <td>${inv.company}</td>
          <td>${inv.product}</td>
          <td>${inv.period}</td>
          <td>R ${parseFloat(inv.amount).toFixed(2)}</td>
          <td><span class="badge badge-info">${inv.status}</span></td>
          <td>
            <div style="display: flex; gap: 4px;">
              <button class="btn btn-sm btn-secondary" onclick="viewPreviewDocument('Invoice', ${index})">Invoice</button>
              <button class="btn btn-sm btn-secondary" onclick="viewPreviewDocument('Usage', ${index})">Usage</button>
              <button class="btn btn-sm btn-secondary" onclick="viewPreviewDocument('Statement', ${index})">Statement</button>
            </div>
          </td>
        </tr>
      `;
        }).join('');

        if (summary) {
            summary.textContent = `${generatedInvoices.length} Invoice(s) | Total: R ${total.toFixed(2)}`;
        }
    }

    // Preview documents
    window.viewPreviewDocument = function (type, index) {
        const inv = generatedInvoices[index];
        if (!inv) return;

        if (type === 'Invoice') {
            const modal = document.getElementById('invoiceModal');
            if (!modal) return;

            document.getElementById('invoiceNumber').textContent = 'PREVIEW';
            document.getElementById('invoiceDate').textContent = new Date().toISOString().split('T')[0];
            document.getElementById('invoiceDueDate').textContent = inv.period;
            document.getElementById('invoiceClientName').textContent = inv.company;
            document.getElementById('invoiceClientAddress').textContent = 'Address on file';

            const tbody = document.getElementById('invoiceLineItems');
            const breakdown = Object.entries(inv.breakdown).map(([product, data]) => `
        <tr>
          <td style="text-align: left;">${product}</td>
          <td style="text-align: center;">${data.count}</td>
          <td style="text-align: right;">R${data.unitPrice.toFixed(2)}</td>
          <td style="text-align: right;">R${data.amount.toFixed(2)}</td>
        </tr>
      `).join('');

            tbody.innerHTML = breakdown;

            document.getElementById('invoiceSubtotal').textContent = `R${inv.amount.toFixed(2)}`;
            document.getElementById('invoiceOutstanding').textContent = `R${inv.amount.toFixed(2)}`;
            document.getElementById('invoicePaid').textContent = 'R0.00';

            modal.classList.add('show');

        } else if (type === 'Usage') {
            const modal = document.getElementById('invoiceModal');
            document.getElementById('invoiceNumber').textContent = 'USAGE REPORT';
            document.getElementById('invoiceClientName').textContent = inv.company;

            const tbody = document.getElementById('invoiceLineItems');
            const transList = inv.transactions.map(t => {
                const pricing = mockData.pricing.find(p =>
                    p.companyName === inv.company &&
                    p.productName === t.product &&
                    p.status === 'Active'
                );
                const unitPrice = pricing ? pricing.price : 10;

                return `
          <tr>
            <td style="text-align: left;">${t.date} - ${t.product}</td>
            <td style="text-align: center;">${t.count || 1}</td>
            <td style="text-align: right;">R${unitPrice.toFixed(2)}</td>
            <td style="text-align: right;">R${((t.count || 1) * unitPrice).toFixed(2)}</td>
          </tr>
        `;
            }).join('');

            tbody.innerHTML = transList;

            document.getElementById('invoiceSubtotal').textContent = `R${inv.amount.toFixed(2)}`;
            document.getElementById('invoiceOutstanding').textContent = `R${inv.amount.toFixed(2)}`;

            modal.classList.add('show');

        } else if (type === 'Statement') {
            const modal = document.getElementById('statementModal');
            if (modal) {
                document.getElementById('statementCompanyName').textContent = inv.company;
                document.getElementById('statementPeriod').textContent = inv.period;
                document.getElementById('statementTotalInvoiced').textContent = `R${inv.amount.toFixed(2)}`;
                document.getElementById('statementTotalOutstanding').textContent = `R${inv.amount.toFixed(2)}`;

                const tbody = document.getElementById('statementInvoices');
                tbody.innerHTML = `
          <tr>
            <td>PREVIEW</td>
            <td>${new Date().toISOString().split('T')[0]}</td>
            <td>-</td>
            <td style="text-align: right;">R${inv.amount.toFixed(2)}</td>
            <td style="text-align: right;">R0.00</td>
            <td style="text-align: right;">R${inv.amount.toFixed(2)}</td>
            <td>Generated</td>
          </tr>
        `;
                modal.classList.add('show');
            }
        }
    };

    if (confirmBtn) {
        confirmBtn.onclick = () => {
            if (generatedInvoices.length === 0) return;

            if (!confirm(`Are you sure you want to generate and send ${generatedInvoices.length} invoice(s)?`)) {
                return;
            }

            ActionFeedback.showLoading(confirmBtn, 'Generating...');
            const progress = ActionFeedback.showProgress('Generating invoices...');

            setTimeout(() => {
                try {
                    generatedInvoices.forEach((inv, index) => {
                        const billingMonth = new Date(dateFromInput.value).toLocaleString('default', { month: 'long', year: 'numeric' });
                        const newInvoice = {
                            id: mockData.invoices.length + 1,
                            company: inv.company,
                            transactions: inv.transactions.length,
                            unitPrice: inv.amount / inv.transactions.length,
                            totalPrice: inv.amount,
                            paidAmount: 0,
                            discount: 0,
                            outstanding: inv.amount,
                            status: 'Unpaid',
                            dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
                            billingMonth: billingMonth,
                            items: inv.transactions
                        };

                        mockData.invoices.push(newInvoice);
                    });

                    saveToLocalStorage();

                    ActionFeedback.hideProgress();
                    ActionFeedback.hideLoading(confirmBtn);
                    ActionFeedback.showSuccess(`Successfully generated ${generatedInvoices.length} invoice(s)!`);

                    // Reset
                    generatedInvoices = [];
                    renderBillingPreview();
                    confirmBtn.disabled = true;
                    dateFromInput.value = '';
                    dateToInput.value = '';

                    // Refresh other views
                    if (typeof renderInvoices === 'function') renderInvoices();
                    if (typeof renderDashboard === 'function') renderDashboard();

                } catch (error) {
                    console.error('Invoice generation error:', error);
                    ActionFeedback.hideProgress();
                    ActionFeedback.hideLoading(confirmBtn);
                    ActionFeedback.showError('Failed to generate invoices: ' + error.message);
                }
            }, 1000);
        };
    }
}

// ===================================
// FIX 2: ENHANCED FORM VALIDATION
// ===================================

// Company Form Validation
function initCompanyFormValidation() {
    const form = document.getElementById('createCompanyForm');
    if (!form) return;

    const validationRules = {
        companyName: {
            required: true,
            minLength: 2,
            maxLength: 100
        },
        address: {
            required: true,
            minLength: 5
        },
        contactPerson: {
            required: true,
            minLength: 2
        },
        email: {
            required: true,
            email: true
        }
    };

    // Initialize real-time validation
    FormValidator.initRealtimeValidation(form, validationRules);

    // Validate on submit
    const originalSubmit = form.onsubmit;
    form.onsubmit = function (e) {
        e.preventDefault();

        FormValidator.clearValidationSummary(form);

        const validation = FormValidator.validateForm(form, validationRules);

        if (!validation.isValid) {
            FormValidator.showValidationSummary(form, validation.errors);
            return false;
        }

        // Call original submit handler
        if (originalSubmit) {
            originalSubmit.call(form, e);
        }
    };
}

// Pricing Form Validation
function initPricingFormValidation() {
    const form = document.getElementById('addPriceForm');
    if (!form) return;

    const validationRules = {
        company: {
            required: true
        },
        product: {
            required: true
        },
        rangeFrom: {
            required: true,
            positiveNumber: true,
            min: 0
        },
        rangeTo: {
            required: true,
            positiveNumber: true,
            min: 1
        },
        price: {
            required: true,
            positiveNumber: true,
            min: 0.01
        }
    };

    FormValidator.initRealtimeValidation(form, validationRules);

    const originalSubmit = form.onsubmit;
    form.onsubmit = function (e) {
        e.preventDefault();

        FormValidator.clearValidationSummary(form);

        const validation = FormValidator.validateForm(form, validationRules);

        if (!validation.isValid) {
            FormValidator.showValidationSummary(form, validation.errors);
            return false;
        }

        // Additional validation: rangeTo must be greater than rangeFrom
        const rangeFrom = parseFloat(form.elements['rangeFrom'].value);
        const rangeTo = parseFloat(form.elements['rangeTo'].value);

        if (rangeTo <= rangeFrom) {
            FormValidator.showFieldError(form.elements['rangeTo'], 'Range To must be greater than Range From');
            FormValidator.showValidationSummary(form, {
                rangeTo: ['Range To must be greater than Range From']
            });
            return false;
        }

        if (originalSubmit) {
            originalSubmit.call(form, e);
        }
    };
}

// Lead Form Validation
function initLeadFormValidation() {
    const form = document.getElementById('createLeadForm');
    if (!form) return;

    const validationRules = {
        firstName: {
            required: true,
            minLength: 2
        },
        lastName: {
            required: true,
            minLength: 2
        },
        company: {
            required: true,
            minLength: 2
        },
        email: {
            required: true,
            email: true
        },
        phone: {
            phone: true  // Optional but must be valid if provided
        }
    };

    FormValidator.initRealtimeValidation(form, validationRules);
}

// Manual Billing Form Validation
function initManualBillingFormValidation() {
    const form = document.getElementById('manualBillingForm');
    if (!form) return;

    const validationRules = {
        company: {
            required: true
        },
        description: {
            required: true,
            minLength: 3
        },
        amount: {
            required: true,
            positiveNumber: true,
            min: 0.01
        },
        date: {
            required: true,
            date: true
        }
    };

    FormValidator.initRealtimeValidation(form, validationRules);

    const originalSubmit = form.onsubmit;
    form.onsubmit = function (e) {
        e.preventDefault();

        FormValidator.clearValidationSummary(form);

        const validation = FormValidator.validateForm(form, validationRules);

        if (!validation.isValid) {
            FormValidator.showValidationSummary(form, validation.errors);
            return false;
        }

        if (originalSubmit) {
            originalSubmit.call(form, e);
        }
    };
}

// ===================================
// FIX 3: CREATE COMPANY BUTTON VISIBILITY
// ===================================

// This is handled in CSS by removing the display: none rule

// ===================================
// INITIALIZATION
// ===================================

// Override/extend the existing DOMContentLoaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('Initializing billing system fixes...');

    // Wait for other initializations, then apply fixes
    setTimeout(() => {
        // Initialize form validations
        initCompanyFormValidation();
        initPricingFormValidation();
        initLeadFormValidation();
        initManualBillingFormValidation();

        // Ensure Create Company button is visible
        const createCompanyBtn = document.getElementById('createCompanyBtn');
        if (createCompanyBtn) {
            createCompanyBtn.style.display = 'inline-flex';
            console.log('Create Company button is now visible');
        }

        console.log('Billing system fixes applied successfully');
    }, 100);
});