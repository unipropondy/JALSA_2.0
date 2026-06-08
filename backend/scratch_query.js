const { poolPromise } = require("./config/db");

async function checkDbTime() {
  try {
    const pool = await poolPromise;
    console.log("Connected to MSSQL.");
    
    const res = await pool.request().query(`
      SELECT GETDATE() AS dbTime, GETUTCDATE() as utcTime
    `);
    
    console.log("=== DB Times ===");
    console.log(res.recordset[0]);
    console.log("System Local JS Time:", new Date().toString());
    console.log("System UTC JS Time:", new Date().toUTCString());

  } catch (err) {
    console.error("Query failed:", err);
  } finally {
    process.exit(0);
  }
}

checkDbTime();
