const http = require('http');

const request = (method, url, body = null) => {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const options = {
      method: method,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname + parsedUrl.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ error: err.message });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

async function runTests() {
  console.log("==================================================");
  console.log("🧪 TESTING UCS JALSA LEDGER & FIFO AUDIT TRAIL");
  console.log("==================================================");

  // 1. Get receivers aging / dashboard first
  const dashboard = await request('GET', 'http://localhost:3001/api/credit-customers/receivables/dashboard');
  console.log("Dashboard response status:", dashboard.statusCode);
  if (dashboard.data && dashboard.data.success) {
    console.log("Current Receivables stats:", dashboard.data.stats);
  }

  // 2. Fetch credit customers list
  const customers = await request('GET', 'http://localhost:3001/api/credit-customers');
  console.log("Customers fetch status:", customers.statusCode);
  let testCustomer = null;
  if (Array.isArray(customers.data) && customers.data.length > 0) {
    testCustomer = customers.data.find(c => c.IsActive);
  }
  
  if (!testCustomer) {
    console.log("No active credit customer found, adding one...");
    const addRes = await request('POST', 'http://localhost:3001/api/credit-customers/add', {
      name: "Test Credit Customer",
      phone: "+919876543210",
      email: "testcredit@jalsa.com",
      creditLimit: 5000.00,
      currentBalance: 0.00,
      balance: 0.00,
      isActive: true
    });
    console.log("Add Credit Customer status:", addRes.statusCode);
    if (addRes.data && addRes.data.success) {
      testCustomer = addRes.data.member;
    }
  }

  if (!testCustomer) {
    console.error("❌ Failed to resolve a test credit customer. Aborting tests.");
    return;
  }

  const customerId = testCustomer.MemberId || testCustomer.CustomerId;
  console.log(`Using Customer: ${testCustomer.Name} (ID: ${customerId})`);

  // 3. Inject a mock CREDIT_SALE or transaction into CustomerCreditTransactions
  // Let's directly call the db check to verify if we can do payments.
  // Wait, let's look at the outstanding bills before we do a payment.
  const outstandingBefore = await request('GET', `http://localhost:3001/api/credit-customers/outstanding/${customerId}`);
  console.log("Outstanding bills before collection payment:", outstandingBefore.statusCode, outstandingBefore.data);

  // Since we want to test FIFO allocation, we need some open invoices.
  // If there are no outstanding bills, we will check statement/aging.
  console.log("\n--- Recording a mock collection payment of $100 ---");
  const payRes = await request('POST', 'http://localhost:3001/api/credit-customers/pay', {
    memberId: customerId,
    amount: 100.00,
    payments: [
      { payModeId: 1, payMode: "CASH", amount: 100.00 }
    ],
    remarks: "Mock automated collection test"
  });

  console.log("Payment status:", payRes.statusCode, payRes.data);
  if (payRes.data && payRes.data.success) {
    const paymentTransactionId = payRes.data.paymentTransactionId;
    console.log("✅ Payment recorded successfully. Payment ID:", paymentTransactionId);

    // 4. Fetch allocation details for this payment
    if (paymentTransactionId) {
      console.log("\n--- Fetching allocations for Payment transaction ID ---");
      const allocs = await request('GET', `http://localhost:3001/api/credit-customers/payment-allocations/${paymentTransactionId}`);
      console.log("Allocation mappings status:", allocs.statusCode);
      if (allocs.data && allocs.data.success) {
        console.log("Allocations found:", allocs.data.allocations);
      }
    }
  }

  // 5. Check statement history
  console.log("\n--- Fetching Customer Ledger Statement ---");
  const statement = await request('GET', `http://localhost:3001/api/credit-customers/statement/${customerId}`);
  console.log("Statement status:", statement.statusCode);
  if (statement.data && statement.data.success) {
    console.log("Statement transactions count:", statement.data.transactions.length);
    if (statement.data.transactions.length > 0) {
      console.log("Latest statement row:", statement.data.transactions[statement.data.transactions.length - 1]);
    }
  }

  // 6. Check recent collections endpoint
  console.log("\n--- Fetching Recent Collections across all customers ---");
  const recentColls = await request('GET', `http://localhost:3001/api/credit-customers/receivables/recent-collections`);
  console.log("Recent collections status:", recentColls.statusCode);
  if (recentColls.data && recentColls.data.success) {
    console.log("Recent collections count:", recentColls.data.collections.length);
    if (recentColls.data.collections.length > 0) {
      console.log("Latest collection row:", recentColls.data.collections[0]);
    }
  }
}

runTests();
