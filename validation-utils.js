// ===================================
// FORM VALIDATION UTILITIES
// ===================================

const FormValidator = {
    // Validation rules
    rules: {
        required: (value) => {
            return value !== null && value !== undefined && value.toString().trim() !== '';
        },
        email: (value) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(value);
        },
        phone: (value) => {
            const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
            return !value || phoneRegex.test(value.replace(/\s/g, ''));
        },
        number: (value) => {
            return !isNaN(parseFloat(value)) && isFinite(value);
        },
        positiveNumber: (value) => {
            return !isNaN(parseFloat(value)) && isFinite(value) && parseFloat(value) >= 0;
        },
        minLength: (value, min) => {
            return value.length >= min;
        },
        maxLength: (value, max) => {
            return value.length <= max;
        },
        min: (value, min) => {
            return parseFloat(value) >= min;
        },
        max: (value, max) => {
            return parseFloat(value) <= max;
        },
        date: (value) => {
            const date = new Date(value);
            return date instanceof Date && !isNaN(date);
        },
        url: (value) => {
            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        }
    },

    // Error messages
    messages: {
        required: 'This field is required',
        email: 'Please enter a valid email address',
        phone: 'Please enter a valid phone number',
        number: 'Please enter a valid number',
        positiveNumber: 'Please enter a positive number',
        minLength: (min) => `Must be at least ${min} characters`,
        maxLength: (max) => `Must be no more than ${max} characters`,
        min: (min) => `Must be at least ${min}`,
        max: (max) => `Must be no more than ${max}`,
        date: 'Please enter a valid date',
        url: 'Please enter a valid URL'
    },

    // Validate a single field
    validateField: function (input, rules) {
        const value = input.value;
        const errors = [];

        for (const [ruleName, ruleValue] of Object.entries(rules)) {
            const validator = this.rules[ruleName];
            if (!validator) continue;

            let isValid = false;
            if (typeof ruleValue === 'boolean' && ruleValue) {
                isValid = validator(value);
            } else {
                isValid = validator(value, ruleValue);
            }

            if (!isValid) {
                const message = typeof this.messages[ruleName] === 'function'
                    ? this.messages[ruleName](ruleValue)
                    : this.messages[ruleName];
                errors.push(message);
            }
        }

        return errors;
    },

    // Validate entire form
    validateForm: function (form, validationRules) {
        let isValid = true;
        const allErrors = {};

        for (const [fieldName, rules] of Object.entries(validationRules)) {
            const input = form.elements[fieldName];
            if (!input) continue;

            const errors = this.validateField(input, rules);

            if (errors.length > 0) {
                isValid = false;
                allErrors[fieldName] = errors;
                this.showFieldError(input, errors[0]);
            } else {
                this.clearFieldError(input);
            }
        }

        return { isValid, errors: allErrors };
    },

    // Show error message for a field
    showFieldError: function (input, message) {
        input.classList.add('invalid');
        input.classList.remove('valid');

        // Remove existing error message
        const existingError = input.parentElement.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.innerHTML = `
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
      </svg>
      ${message}
    `;
        input.parentElement.appendChild(errorDiv);
    },

    // Clear error message for a field
    clearFieldError: function (input) {
        input.classList.remove('invalid');
        input.classList.add('valid');

        const errorDiv = input.parentElement.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    },

    // Show form-level validation summary
    showValidationSummary: function (form, errors) {
        let summary = form.querySelector('.validation-summary');

        if (!summary) {
            summary = document.createElement('div');
            summary.className = 'validation-summary';
            form.insertBefore(summary, form.firstChild);
        }

        const errorMessages = Object.values(errors).flat();

        summary.innerHTML = `
      <div class="validation-summary-title">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
        </svg>
        Please correct the following errors:
      </div>
      <ul class="validation-summary-list">
        ${errorMessages.map(msg => `<li>${msg}</li>`).join('')}
      </ul>
    `;

        summary.classList.add('show');

        // Auto-hide after 10 seconds
        setTimeout(() => {
            summary.classList.remove('show');
        }, 10000);
    },

    // Clear validation summary
    clearValidationSummary: function (form) {
        const summary = form.querySelector('.validation-summary');
        if (summary) {
            summary.classList.remove('show');
        }
    },

    // Initialize real-time validation
    initRealtimeValidation: function (form, validationRules) {
        for (const [fieldName, rules] of Object.entries(validationRules)) {
            const input = form.elements[fieldName];
            if (!input) continue;

            // Validate on blur
            input.addEventListener('blur', () => {
                const errors = this.validateField(input, rules);
                if (errors.length > 0) {
                    this.showFieldError(input, errors[0]);
                } else {
                    this.clearFieldError(input);
                }
            });

            // Clear error on input
            input.addEventListener('input', () => {
                if (input.classList.contains('invalid')) {
                    const errors = this.validateField(input, rules);
                    if (errors.length === 0) {
                        this.clearFieldError(input);
                    }
                }
            });
        }
    }
};

// ===================================
// ACTION FEEDBACK SYSTEM
// ===================================

const ActionFeedback = {
    // Show loading state on button
    showLoading: function (button, text = 'Processing...') {
        if (!button) return;

        button.disabled = true;
        button.classList.add('loading');
        button.setAttribute('data-original-text', button.textContent);
        button.textContent = text;
    },

    // Hide loading state
    hideLoading: function (button) {
        if (!button) return;

        button.disabled = false;
        button.classList.remove('loading');
        const originalText = button.getAttribute('data-original-text');
        if (originalText) {
            button.textContent = originalText;
            button.removeAttribute('data-original-text');
        }
    },

    // Show success feedback
    showSuccess: function (message, duration = 3000) {
        const overlay = document.createElement('div');
        overlay.className = 'feedback-overlay show';
        overlay.innerHTML = `
      <div class="feedback-message">
        <div class="feedback-icon success">✓</div>
        <div class="feedback-title">Success!</div>
        <div class="feedback-text">${message}</div>
      </div>
    `;

        document.body.appendChild(overlay);

        setTimeout(() => {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
        }, duration);
    },

    // Show error feedback
    showError: function (message, duration = 4000) {
        const overlay = document.createElement('div');
        overlay.className = 'feedback-overlay show';
        overlay.innerHTML = `
      <div class="feedback-message">
        <div class="feedback-icon error">✕</div>
        <div class="feedback-title">Error</div>
        <div class="feedback-text">${message}</div>
      </div>
    `;

        document.body.appendChild(overlay);

        setTimeout(() => {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
        }, duration);
    },

    // Show progress indicator
    showProgress: function (message) {
        const overlay = document.createElement('div');
        overlay.className = 'feedback-overlay show';
        overlay.id = 'progress-overlay';
        overlay.innerHTML = `
      <div class="feedback-message">
        <div class="feedback-title">${message}</div>
        <div class="progress-bar">
          <div class="progress-bar-fill" style="width: 100%"></div>
        </div>
      </div>
    `;

        document.body.appendChild(overlay);
        return overlay;
    },

    // Hide progress indicator
    hideProgress: function () {
        const overlay = document.getElementById('progress-overlay');
        if (overlay) {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
        }
    },

    // Show action badge (small notification)
    showActionBadge: function (message, type = 'success') {
        const badge = document.createElement('div');
        badge.className = 'action-badge show';

        const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';

        badge.innerHTML = `
      <div class="action-badge-icon">${icon}</div>
      <div class="action-badge-text">${message}</div>
    `;

        document.body.appendChild(badge);

        setTimeout(() => {
            badge.classList.remove('show');
            setTimeout(() => badge.remove(), 300);
        }, 3000);
    }
};

// Make utilities globally available
window.FormValidator = FormValidator;
window.ActionFeedback = ActionFeedback;