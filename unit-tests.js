// ===================================
// UNIT TESTS FOR BUSINESS LOGIC
// ===================================

function runBusinessLogicTests() {
    console.log('--- RUNNING BUSINESS LOGIC UNIT TESTS ---');
    let passed = 0;
    let failed = 0;

    function assertEqual(actual, expected, testName) {
        // Use a small epsilon for floating point comparison
        if (Math.abs(actual - expected) < 0.01) {
            console.log(`✅ PASS: ${testName}`);
            passed++;
        } else {
            console.error(`❌ FAIL: ${testName} | Expected ${expected} but got ${actual}`);
            failed++;
        }
    }

    // Test Case 1: Standard Tax Calculation
    const subtotal1 = 1000;
    const discount1 = 0;
    const discountedAmount1 = subtotal1 - discount1;
    const tax1 = discountedAmount1 * 0.15;
    const total1 = discountedAmount1 + tax1;
    assertEqual(tax1, 150, "Standard 15% Tax Calculation");
    assertEqual(total1, 1150, "Standard Grand Total Calculation");

    // Test Case 2: Tax with Discount
    const subtotal2 = 2000;
    const discount2 = 500;
    const discountedAmount2 = subtotal2 - discount2;
    const tax2 = discountedAmount2 * 0.15;
    const total2 = discountedAmount2 + tax2;
    assertEqual(tax2, 225, "Tax on Discounted Amount (1500 * 0.15)");
    assertEqual(total2, 1725, "Grand Total with Discount and Tax");

    // Test Case 3: Zero Amount
    const subtotal3 = 0;
    const discount3 = 0;
    const tax3 = (subtotal3 - discount3) * 0.15;
    const total3 = (subtotal3 - discount3) + tax3;
    assertEqual(tax3, 0, "Tax on Zero Amount");
    assertEqual(total3, 0, "Grand Total on Zero Amount");

    console.log(`--- TEST RESULTS: ${passed} Passed, ${failed} Failed ---`);
    if (failed === 0) {
        console.log('All business logic tests passed successfully.');
    }
}

// Ensure tests run when included
document.addEventListener('DOMContentLoaded', function () {
    runBusinessLogicTests();
});
