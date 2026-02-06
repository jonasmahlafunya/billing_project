// Fix invoice/statement headers and consolidate products
function formatInvoiceHeader() {
    const invoiceHeaders = document.querySelectorAll('.invoice-header, .statement-header');

    invoiceHeaders.forEach(header => {
        // Add nice styling
        header.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;

        // Ensure proper structure
        if (!header.querySelector('.header-content')) {
            const content = document.createElement('div');
            content.className = 'header-content';
            content.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h1 style="margin: 0; font-size: 28px;">Invoice</h1>
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">#INV-${Date.now().toString().slice(-6)}</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="margin: 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                        <p style="margin: 5px 0 0 0;"><strong>Due Date:</strong> ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                    </div>
                </div>
            `;
            header.innerHTML = '';
            header.appendChild(content);
        }
    });
}

// Consolidate invoice lines by product
function consolidateInvoiceProducts() {
    const invoiceTables = document.querySelectorAll('.invoice-table, .invoice-items');

    invoiceTables.forEach(table => {
        const rows = table.querySelectorAll('tbody tr');
        const productMap = new Map();

        // Group products
        rows.forEach(row => {
            const productName = row.cells[1]?.textContent.trim() || 'Unknown Product';
            const quantity = parseInt(row.cells[2]?.textContent) || 0;
            const price = parseFloat(row.cells[3]?.textContent.replace(/[^0-9.]/g, '')) || 0;

            if (productMap.has(productName)) {
                const existing = productMap.get(productName);
                existing.quantity += quantity;
                existing.total += quantity * price;
            } else {
                productMap.set(productName, {
                    quantity: quantity,
                    unitPrice: price,
                    total: quantity * price
                });
            }
        });

        // Clear and rebuild table with consolidated products
        const tbody = table.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = '';

            productMap.forEach((details, productName) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${Array.from(productMap.keys()).indexOf(productName) + 1}</td>
                    <td>${productName}</td>
                    <td>${details.quantity}</td>
                    <td>$${details.unitPrice.toFixed(2)}</td>
                    <td>$${details.total.toFixed(2)}</td>
                `;
                tbody.appendChild(row);
            });

            // Add total row
            const totalRow = document.createElement('tr');
            const grandTotal = Array.from(productMap.values()).reduce((sum, item) => sum + item.total, 0);
            totalRow.innerHTML = `
                <td colspan="4" style="text-align: right; font-weight: bold;">Grand Total:</td>
                <td style="font-weight: bold;">$${grandTotal.toFixed(2)}</td>
            `;
            tbody.appendChild(totalRow);
        }
    });
}

// Run on page load
document.addEventListener('DOMContentLoaded', function () {
    formatInvoiceHeader();
    consolidateInvoiceProducts();
});