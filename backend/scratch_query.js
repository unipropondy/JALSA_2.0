const { poolPromise } = require("./config/db");

async function run() {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Paymode'
    `);
    console.log("Columns in Paymode:");
    console.log(result.recordset);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

run();
