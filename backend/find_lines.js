const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes', 'sales.js');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('--- References to SettlementHeader in sales.js ---');
lines.forEach((line, index) => {
  if (line.includes('SettlementHeader') || line.includes('SettlementItemDetail')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
process.exit();
