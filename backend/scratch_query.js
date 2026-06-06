const { poolPromise } = require("./config/db");

async function checkPaymentDetail() {
  try {
    const pool = await poolPromise;
    console.log("Connected to MSSQL.");
    
    const res = await pool.request().query(`
      SELECT PaymentId, RestaurantBillId, SettlementId, InvoiceId, OrderId, Paymode, Amount, CreatedOn
      FROM PaymentDetail
      WHERE RestaurantBillId = 'B99987EF-7858-46D9-8342-E911B8C3FE06'
    `);
    
    console.log("=== PaymentDetail ===");
    console.log(res.recordset);

    const pmres = await pool.request().query(`
      SELECT Position, PayMode, Description FROM Paymode WHERE Position = 5 OR Position = 6
    `);
    console.log("=== Paymodes ===");
    console.log(pmres.recordset);

  } catch (err) {
    console.error("Query failed:", err);
  } finally {
    process.exit(0);
  }
}

checkPaymentDetail();
