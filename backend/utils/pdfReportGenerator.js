const puppeteer = require('puppeteer');

/**
 * Generates the sales report HTML content
 */
function getHtmlContent(data) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Sales Report - ${data.companyName || 'JALSA'}</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Inter', 'Segoe UI', 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
        background: linear-gradient(135deg, #f5f7fa 0%, #eef2f7 100%);
        padding: 40px 20px;
        color: #1e293b;
      }

      .report-container {
        max-width: 1200px;
        margin: 0 auto;
        background: white;
        border-radius: 32px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        overflow: hidden;
      }

      /* Header Section */
      .header {
        background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
        padding: 40px 48px;
        color: white;
        position: relative;
      }

      .header::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #f59e0b, #ef4444, #8b5cf6, #06b6d4);
      }

      .company-name {
        font-size: 28px;
        font-weight: 700;
        letter-spacing: -0.5px;
        margin-bottom: 8px;
      }

      .company-address {
        font-size: 13px;
        opacity: 0.85;
        margin-bottom: 4px;
      }

      .company-phone {
        font-size: 13px;
        opacity: 0.85;
      }

      .report-title {
        font-size: 20px;
        font-weight: 600;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid rgba(255,255,255,0.2);
      }

      .period {
        font-size: 14px;
        opacity: 0.9;
        margin-top: 8px;
      }

      .printed-on {
        font-size: 12px;
        opacity: 0.7;
        margin-top: 12px;
      }

      /* KPI Cards */
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 20px;
        padding: 40px 48px;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
      }

      .kpi-card {
        background: white;
        padding: 20px;
        border-radius: 20px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        transition: all 0.2s ease;
        border: 1px solid #eef2f6;
      }

      .kpi-label {
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 600;
        color: #64748b;
        margin-bottom: 12px;
      }

      .kpi-value {
        font-size: 32px;
        font-weight: 800;
        color: #0f172a;
        margin-bottom: 8px;
      }

      .kpi-sub {
        font-size: 12px;
        color: #94a3b8;
      }

      /* Section Styles */
      .section {
        padding: 40px 48px;
        border-bottom: 1px solid #eef2f6;
      }

      .section-title {
        font-size: 18px;
        font-weight: 700;
        margin-bottom: 24px;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .section-title::before {
        content: '';
        width: 4px;
        height: 20px;
        background: linear-gradient(135deg, #f59e0b, #ef4444);
        border-radius: 4px;
      }

      /* Payment Grid */
      .payment-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }

      .payment-item {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 16px;
        text-align: center;
        transition: all 0.2s;
      }

      .payment-label {
        font-size: 13px;
        font-weight: 600;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
      }

      .payment-amount {
        font-size: 22px;
        font-weight: 800;
        color: #0f172a;
      }

      /* Tables */
      .data-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
      }

      .data-table th {
        text-align: left;
        padding: 14px 12px;
        background: #f1f5f9;
        font-size: 13px;
        font-weight: 600;
        color: #334155;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .data-table td {
        padding: 12px;
        border-bottom: 1px solid #e2e8f0;
        font-size: 14px;
      }

      .data-table tr:last-child td {
        border-bottom: none;
      }

      .data-table tr:hover td {
        background: #fefce8;
      }

      /* Two Column Layout */
      .two-columns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 32px;
      }

      /* Badge */
      .badge {
        display: inline-block;
        background: #eef2ff;
        color: #4f46e5;
        padding: 4px 10px;
        border-radius: 30px;
        font-size: 11px;
        font-weight: 600;
      }

      /* Footer */
      .footer {
        background: #f8fafc;
        padding: 20px 48px;
        text-align: center;
        font-size: 11px;
        color: #94a3b8;
        border-top: 1px solid #e2e8f0;
      }

      @media print {
        body {
          background: white;
          padding: 0;
        }
        .kpi-card {
          break-inside: avoid;
        }
        .section {
          break-inside: avoid-page;
        }
      }
    </style>
  </head>
  <body>
    <div class="report-container">
      <!-- Header -->
      <div class="header">
        <div class="company-name">${escapeHtml(data.companyName)}</div>
        <div class="company-address">${escapeHtml(data.companyAddress)}</div>
        <div class="company-phone">${escapeHtml(data.companyPhone)}</div>
        <div class="report-title">Sales Performance Report</div>
        <div class="period">📅 Period: ${escapeHtml(data.period)}</div>
        <div class="printed-on">🕒 Printed: ${escapeHtml(data.printedOn)}</div>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Total Sales (Net)</div>
          <div class="kpi-value">$${formatNumber(data.totalSales)}</div>
          <div class="kpi-sub">Volume: $${formatNumber(data.paymentBreakdown?.totalSalesVolume || data.totalSales)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Total Orders</div>
          <div class="kpi-value">${formatNumber(data.totalOrders)}</div>
          <div class="kpi-sub">Avg Check: $${formatNumber(data.keyMetrics?.avgCheck || (data.totalSales / (data.totalOrders || 1)))}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Total Items Sold</div>
          <div class="kpi-value">${formatNumber(data.totalItems)}</div>
          <div class="kpi-sub">Avg Items/Order: ${formatNumber(data.keyMetrics?.avgItems || 0)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Total Collections</div>
          <div class="kpi-value">$${formatNumber(data.totalCollections)}</div>
          <div class="kpi-sub">Credit Collected: $${formatNumber(data.creditPaymentsCollected || 0)}</div>
        </div>
      </div>

      <!-- Payment Breakdown -->
      <div class="section">
        <div class="section-title">💰 Payment Breakdown</div>
        <div class="payment-grid">
          ${renderPaymentCard('Cash', data.paymentBreakdown?.Cash)}
          ${renderPaymentCard('Card', data.paymentBreakdown?.Card)}
          ${renderPaymentCard('NETS', data.paymentBreakdown?.Nets)}
          ${renderPaymentCard('PayNow', data.paymentBreakdown?.PayNow)}
          ${renderPaymentCard('Member', data.paymentBreakdown?.Member)}
          ${renderPaymentCard('Credit', data.paymentBreakdown?.Credit)}
        </div>
        ${data.paymentBreakdown?.CreditOutstanding || data.reconciliation?.creditOutstanding ? `<div class="badge" style="margin-top: 8px;">Outstanding Credit: $${formatNumber(data.paymentBreakdown?.CreditOutstanding || data.reconciliation?.creditOutstanding)}</div>` : ''}
      </div>

      <!-- Order Types & Metrics -->
      <div class="section">
        <div class="two-columns">
          <div>
            <div class="section-title">🍽️ Order Types</div>
            <table class="data-table">
              <tr><th>Type</th><th>Count</th><th>%</th></tr>
              <tr><td>Dine In</td><td>${formatNumber(data.orderTypes?.dineInCount)}</td><td>${formatNumber(data.orderTypes?.dineInPct)}%</td></tr>
              <tr><td>Takeaway</td><td>${formatNumber(data.orderTypes?.takeawayCount)}</td><td>${formatNumber(data.orderTypes?.takeawayPct)}%</td></tr>
            </table>
          </div>
          <div>
            <div class="section-title">📊 Key Metrics</div>
            <table class="data-table">
              <tr><th>Metric</th><th>Value</th></tr>
              <tr><td>Conversion</td><td>${formatNumber(data.keyMetrics?.conversion || 100)}%</td></tr>
              <tr><td>Per Item Avg</td><td>$${formatNumber(data.keyMetrics?.perItem)}</td></tr>
              <tr><td>Void Qty</td><td>${formatNumber(data.voidQty)}</td></tr>
              <tr><td>Void Amount</td><td>$${formatNumber(data.voidAmount)}</td></tr>
            </table>
          </div>
        </div>
      </div>

      <!-- Category Sales Table -->
      <div class="section">
        <div class="section-title">📂 Category Performance</div>
        <table class="data-table">
          <thead>
            <tr><th>Category</th><th>Qty Sold</th><th>Sales (SGD)</th></tr>
          </thead>
          <tbody>
            ${(data.categories || []).map(c => `
              <tr>
                <td>${escapeHtml(c.Category)}</td>
                <td>${formatNumber(c.Qty)}</td>
                <td><strong>$${formatNumber(c.Sales)}</strong></td>
              </tr>
            `).join('')}
            ${(!data.categories || data.categories.length === 0) ? '<tr><td colspan="3" style="text-align:center;">No data available</td></tr>' : ''}
          </tbody>
        </table>
      </div>

      <!-- Top Items -->
      <div class="section">
        <div class="section-title">🔥 Top Selling Items</div>
        <table class="data-table">
          <thead>
            <tr><th>Item</th><th>Category</th><th>Qty</th><th>Sales</th></tr>
          </thead>
          <tbody>
            ${(data.items || []).slice(0, 15).map(i => `
              <tr>
                <td>${escapeHtml(i.Item)}</td>
                <td>${escapeHtml(i.Category)}</td>
                <td>${formatNumber(i.Qty)}</td>
                <td>$${formatNumber(i.Sales)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Artist / Commission Sales -->
      ${data.artistSales && data.artistSales.length ? `
      <div class="section">
        <div class="section-title">🎨 Target Achievements</div>
        <table class="data-table">
          <thead><tr><th>Artist Name</th><th>Target</th><th>Actual Sales</th><th>Achievement %</th></tr></thead>
          <tbody>
            ${data.artistSales.map(a => `
              <tr>
                <td>${escapeHtml(a.Name)}</td>
                <td>$${formatNumber(a.TargetAmount)}</td>
                <td>$${formatNumber(a.ActualSales)}</td>
                <td>${a.TargetAmount > 0 ? formatNumber((a.ActualSales / a.TargetAmount) * 100) : 0}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      <!-- Footer -->
      <div class="footer">
        © ${new Date().getFullYear()} ${escapeHtml(data.companyName)} — Confidential Sales Report
      </div>
    </div>
  </body>
  </html>
  `;
}

// Helper functions
function formatNumber(num) {
  if (num === undefined || num === null) return '0.00';
  const n = typeof num === 'number' ? num : parseFloat(num);
  return isNaN(n) ? '0.00' : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

function renderPaymentCard(label, amount) {
  return `
    <div class="payment-item">
      <div class="payment-label">${label}</div>
      <div class="payment-amount">$${formatNumber(amount)}</div>
    </div>
  `;
}

/**
 * Generates a sales report PDF definition
 */
const generateSalesReportPdf = (reportData) => {
  // Return the report data directly so that createPdfBinary can consume it
  return reportData;
};

/**
 * Creates a PDF buffer from a document definition using Puppeteer
 */
const createPdfBinary = async (reportData) => {
  const htmlContent = getHtmlContent(reportData);
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
  });
  await browser.close();
  return pdfBuffer;
};

module.exports = {
  generateSalesReportPdf,
  createPdfBinary,
  printer: null // Set to null since pdfmake printer is not used
};
