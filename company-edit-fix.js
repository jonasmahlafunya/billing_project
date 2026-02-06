// Company Edit Fixes - Fixed infinite recursion issue
document.addEventListener('DOMContentLoaded', function () {
    // Ensure companies array exists
    if (!window.companies) {
        window.companies = [];
        console.warn('window.companies was undefined, initialized as empty array');
    }

    // Initialize back button
    const backBtn = document.getElementById('backToCompaniesBtn');
    if (backBtn) {
        backBtn.addEventListener('click', function (e) {
            e.preventDefault();
            backToCompaniesList();
        });
    }

    // Initialize tab switching
    const tabs = document.querySelectorAll('#company-details-view .tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const tabName = this.getAttribute('data-tab');
            switchCompanyTab(tabName);
        });
    });

    // Initialize Edit Company functionality
    initializeEditCompany();

    // Enhance the existing viewCompanyDetails function
    enhanceViewCompanyDetails();

    console.log('Company edit fix initialized. Companies array:', window.companies?.length || 0);
});

// Initialize edit company button and form
function initializeEditCompany() {
    const editCompanyBtn = document.getElementById('editCompanyBtn');
    const companyEditForm = document.getElementById('companyEditForm');
    const companyInfoDisplay = document.getElementById('companyInfoDisplay');
    const cancelEditCompany = document.getElementById('cancelEditCompany');

    if (editCompanyBtn && companyEditForm) {
        editCompanyBtn.addEventListener('click', function () {
            // Show edit form, hide display
            companyEditForm.classList.remove('hidden');
            if (companyInfoDisplay) companyInfoDisplay.classList.add('hidden');
            editCompanyBtn.classList.add('hidden');
        });
    }

    if (cancelEditCompany && companyEditForm) {
        cancelEditCompany.addEventListener('click', function () {
            // Hide edit form, show display
            companyEditForm.classList.add('hidden');
            if (companyInfoDisplay) companyInfoDisplay.classList.remove('hidden');
            if (editCompanyBtn) editCompanyBtn.classList.remove('hidden');
        });
    }

    // Handle form submission
    if (companyEditForm) {
        companyEditForm.addEventListener('submit', function (e) {
            e.preventDefault();
            saveCompanyChanges();
        });
    }
}

// Enhance existing viewCompanyDetails function WITHOUT recursion
function enhanceViewCompanyDetails() {
    // Store reference to original function if it exists
    const originalViewCompanyDetails = window.viewCompanyDetails;

    // Create enhanced function that doesn't cause recursion
    window.viewCompanyDetails = function (companyId) {
        console.log('Enhanced viewCompanyDetails called for:', companyId);

        // Call original function if it exists
        if (originalViewCompanyDetails && typeof originalViewCompanyDetails === 'function') {
            originalViewCompanyDetails(companyId);
        } else {
            // Basic implementation if no original function exists
            const companiesList = document.getElementById('companies-list-view');
            const detailsView = document.getElementById('company-details-view');

            if (companiesList && detailsView) {
                detailsView.classList.remove('hidden');
                companiesList.classList.add('hidden');
            }
        }

        // Additional setup (run after original function)
        setTimeout(() => {
            const company = window.companies?.find(c => c.id === companyId);
            if (company) {
                console.log('Found company:', company.name);

                // Update display
                updateCompanyInfoDisplay(company);

                // Populate edit form
                populateCompanyEditForm(company);

                // Ensure proper tab is shown
                switchCompanyTab('details');
            } else {
                console.warn('Company not found with ID:', companyId);
            }
        }, 50); // Small delay to ensure DOM is updated
    };
}

// Back to companies list function
function backToCompaniesList() {
    const companiesList = document.getElementById('companies-list-view');
    const detailsView = document.getElementById('company-details-view');
    if (companiesList && detailsView) {
        detailsView.classList.add('hidden');
        companiesList.classList.remove('hidden');
        switchCompanyTab('users');
    }
}

// Switch company tab function
function switchCompanyTab(tabName) {
    const detailsView = document.getElementById('company-details-view');
    if (!detailsView) return;

    // Update tab buttons
    const tabs = detailsView.querySelectorAll('.tab');
    tabs.forEach(tab => {
        if (tab.getAttribute('data-tab') === tabName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // Show/hide tab content
    const tabContents = detailsView.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        if (content.id === `company-${tabName}-tab`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

// Save company changes function
function saveCompanyChanges() {
    // Check if companies array exists
    if (!window.companies || !Array.isArray(window.companies)) {
        console.error('Companies array is not initialized');
        showToast('Company data not loaded properly', 'error');
        return;
    }

    const companyId = document.getElementById('editCompanyId')?.value;
    if (!companyId) {
        showToast('Company ID not found', 'error');
        return;
    }

    // Get form values
    const companyName = document.getElementById('editCompanyName')?.value;
    const contactPerson = document.getElementById('editCompanyContact')?.value;
    const email = document.getElementById('editCompanyEmail')?.value;

    // Validate required fields
    if (!companyName || !contactPerson || !email) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    // Find the company in your data
    const companyIndex = window.companies.findIndex(c => c.id === companyId);
    if (companyIndex === -1) {
        showToast('Company not found in database', 'error');

        // Try to create a new company entry (fallback)
        console.log('Creating new company entry as fallback');
        const newCompany = {
            id: companyId,
            name: companyName,
            contactPerson: contactPerson,
            email: email,
            phone: document.getElementById('editCompanyPhone')?.value || '',
            registrationNumber: document.getElementById('editCompanyRegNumber')?.value || '',
            taxId: document.getElementById('editCompanyTaxId')?.value || '',
            industry: document.getElementById('editCompanyIndustry')?.value || '',
            foundedDate: document.getElementById('editCompanyFounded')?.value || '',
            address: document.getElementById('editCompanyAddress')?.value || '',
            active: document.getElementById('editCompanyStatus')?.value === 'true',
            type: 'child'
        };

        window.companies.push(newCompany);
        updateCompanyInfoDisplay(newCompany);

        showToast('Company created successfully', 'success');

        // Hide edit form, show display
        document.getElementById('companyEditForm')?.classList.add('hidden');
        document.getElementById('companyInfoDisplay')?.classList.remove('hidden');
        document.getElementById('editCompanyBtn')?.classList.remove('hidden');

        return;
    }

    // Update company data
    const updatedCompany = {
        ...window.companies[companyIndex],
        name: companyName,
        contactPerson: contactPerson,
        email: email,
        phone: document.getElementById('editCompanyPhone')?.value || '',
        registrationNumber: document.getElementById('editCompanyRegNumber')?.value || '',
        taxId: document.getElementById('editCompanyTaxId')?.value || '',
        industry: document.getElementById('editCompanyIndustry')?.value || '',
        foundedDate: document.getElementById('editCompanyFounded')?.value || '',
        address: document.getElementById('editCompanyAddress')?.value || '',
        active: document.getElementById('editCompanyStatus')?.value === 'true'
    };

    // Update in the array
    window.companies[companyIndex] = updatedCompany;

    // Update UI
    updateCompanyInfoDisplay(updatedCompany);

    // Hide edit form, show display
    const editForm = document.getElementById('companyEditForm');
    const infoDisplay = document.getElementById('companyInfoDisplay');
    const editBtn = document.getElementById('editCompanyBtn');

    if (editForm) editForm.classList.add('hidden');
    if (infoDisplay) infoDisplay.classList.remove('hidden');
    if (editBtn) editBtn.classList.remove('hidden');

    // Update companies table if function exists
    if (typeof window.updateCompaniesTable === 'function') {
        window.updateCompaniesTable();
    } else if (typeof updateCompaniesTable === 'function') {
        updateCompaniesTable();
    }

    // Show success message
    showToast('Company updated successfully', 'success');

    // Log activity if function exists
    if (typeof window.logActivity === 'function') {
        window.logActivity({
            type: 'Note',
            date: new Date().toISOString().split('T')[0],
            description: `Updated company details for ${companyName}`,
            outcome: 'Company information updated',
            userId: window.currentUser?.id || 'admin',
            companyId: companyId
        });
    } else if (typeof logActivity === 'function') {
        logActivity({
            type: 'Note',
            date: new Date().toISOString().split('T')[0],
            description: `Updated company details for ${companyName}`,
            outcome: 'Company information updated',
            userId: 'admin',
            companyId: companyId
        });
    }
}

// Update company info display
function updateCompanyInfoDisplay(company) {
    const companyInfoDisplay = document.getElementById('companyInfoDisplay');
    if (!companyInfoDisplay || !company) return;

    // Format the display
    companyInfoDisplay.innerHTML = `
    <div class="info-item">
      <span class="info-label">Company Name</span>
      <span class="info-value">${company.name || 'N/A'}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Contact Person</span>
      <span class="info-value">${company.contactPerson || 'N/A'}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Email</span>
      <span class="info-value">${company.email || 'N/A'}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Phone</span>
      <span class="info-value">${company.phone || 'N/A'}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Registration Number</span>
      <span class="info-value">${company.registrationNumber || 'N/A'}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Tax ID</span>
      <span class="info-value">${company.taxId || 'N/A'}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Industry</span>
      <span class="info-value">${company.industry || 'N/A'}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Founded Date</span>
      <span class="info-value">${company.foundedDate ? new Date(company.foundedDate).toLocaleDateString() : 'N/A'}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Address</span>
      <span class="info-value">${company.address || 'N/A'}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Status</span>
      <span class="info-value ${company.active ? 'text-success' : 'text-danger'}">
        ${company.active ? 'Active' : 'Inactive'}
      </span>
    </div>
  `;

    // Update the title
    const title = document.getElementById('companyDetailsTitle');
    if (title) {
        title.textContent = company.name || 'Company Details';
    }
}

// Function to populate edit form
function populateCompanyEditForm(company) {
    if (!company) return;

    const elements = {
        'editCompanyId': company.id || '',
        'editCompanyName': company.name || '',
        'editCompanyContact': company.contactPerson || '',
        'editCompanyEmail': company.email || '',
        'editCompanyPhone': company.phone || '',
        'editCompanyRegNumber': company.registrationNumber || '',
        'editCompanyTaxId': company.taxId || '',
        'editCompanyIndustry': company.industry || '',
        'editCompanyFounded': company.foundedDate || '',
        'editCompanyAddress': company.address || '',
        'editCompanyStatus': company.active ? 'true' : 'false'
    };

    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.value = elements[id];
        }
    });
}

// Toast notification function (enhanced)
function showToast(message, type = 'info') {
    // Try to use existing showToast function
    if (window.showToast && typeof window.showToast === 'function') {
        window.showToast(message, type);
        return;
    }

    // Fallback toast implementation
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
    <div class="toast-content">
      <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;

    const container = document.getElementById('toastContainer') || document.body;
    container.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

// Simple debugging function
function debugCheck() {
    console.log('=== Company Edit Debug ===');
    console.log('Companies loaded:', window.companies?.length || 0);
    console.log('viewCompanyDetails function:', typeof window.viewCompanyDetails);
    console.log('=======================');
}

// Expose debug function globally
window.debugCheck = debugCheck;