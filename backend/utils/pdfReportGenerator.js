/**
 * Professional PDF Report Generator for Jalsa Sales Analytics
 * Generates enterprise-style A4 PDF reports matching the dashboard's design, structure, and data flow.
 */

const PdfPrinter = require('pdfmake');

const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};

const printer = new PdfPrinter(fonts);

/**
 * Format currency to $XX.XX
 */
const formatVal = (val, isCurrency = true) => {
  const num = Number(val) || 0;
  return isCurrency ? `$${num.toFixed(2)}` : num.toString();
};

/**
 * Generates a comprehensive sales report PDF definition
 * @param {Object} reportData - Report data from database/API
 * @returns {Object} pdfmake document definition
 */
const generateSalesReportPdf = (reportData) => {
  const {
    companyName = 'JALSA',
    companyAddress = '1 ROCHOR CANAL ROAD, #B1-29 SIM LIM SQUARE, SINGAPORE 188504',
    companyPhone = '',
    period = '09/06/2026',
    printedOn = '',
    totalSales = 0,
    totalCollections = 0,
    creditPaymentsCollected = 0,
    memberPaymentsCollected = 0,
    totalOrders = 0,
    totalItems = 0,
    voidQty = 0,
    voidAmount = 0,
    cancelledCount = 0,
    cancelledAmount = 0,
    paymentBreakdown = {},
    reconciliation = {},
    keyMetrics = {},
    orderTypes = {},
    categories = [],
    items = [],
    artistSales = []
  } = reportData || {};

  const content = [];

  // ========== HEADER SECTION ==========
  content.push({
    stack: [
      { text: companyName, fontSize: 20, bold: true, alignment: 'center', color: '#1e293b' },
      { text: companyAddress, fontSize: 9, alignment: 'center', color: '#64748b', margin: [0, 4, 0, 0] },
      companyPhone ? { text: `Phone: ${companyPhone}`, fontSize: 9, alignment: 'center', color: '#64748b', margin: [0, 2, 0, 0] } : null
    ].filter(Boolean),
    margin: [0, 0, 0, 10]
  });

  // Title Banner
  content.push({
    text: 'SALES ANALYTICS REPORT',
    fontSize: 14,
    bold: true,
    alignment: 'center',
    color: '#0f172a',
    margin: [0, 5, 0, 5]
  });

  content.push({
    table: {
      widths: ['*'],
      body: [
        [{
          text: `Period: ${period}`,
          fontSize: 10,
          bold: true,
          alignment: 'center',
          fillColor: '#f1f5f9',
          border: [0, 0, 0, 0],
          margin: [6, 6, 6, 6],
          color: '#1e293b'
        }]
      ]
    },
    margin: [0, 0, 0, 15]
  });

  // ========== 1. SUMMARY CARDS SECTION ==========
  content.push({
    text: '1. Summary Metrics',
    fontSize: 11,
    bold: true,
    color: '#0f172a',
    margin: [0, 5, 0, 8]
  });

  // Helper to draw a summary card cell
  const makeCard = (title, value, accentColor) => {
    return {
      stack: [
        { text: title.toUpperCase(), fontSize: 8, bold: true, color: '#64748b', margin: [2, 2, 2, 2] },
        { text: value, fontSize: 13, bold: true, color: accentColor || '#1e293b', margin: [2, 2, 2, 2] }
      ],
      fillColor: '#f8fafc',
      margin: [2, 2, 2, 2]
    };
  };

  content.push({
    table: {
      widths: ['25%', '25%', '25%', '25%'],
      body: [
        [
          makeCard('Total Sales', formatVal(totalSales), '#3b82f6'),
          makeCard('Total Collections', formatVal(totalCollections), '#10b981'),
          makeCard('Credit Payments', formatVal(creditPaymentsCollected), '#e11d48'),
          makeCard('Member Payments', formatVal((paymentBreakdown.Member || 0) + memberPaymentsCollected), '#ec4899')
        ],
        [
          makeCard('Total Orders', formatVal(totalOrders, false), '#64748b'),
          makeCard('Items Sold', formatVal(totalItems, false), '#64748b'),
          makeCard('Total Voids', formatVal(voidQty, false), '#f59e0b'),
          makeCard('Cancelled Orders', formatVal(cancelledCount, false), '#ef4444')
        ]
      ]
    },
    layout: {
      defaultBorder: false,
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingLeft: () => 5,
      paddingRight: () => 5,
      paddingTop: () => 5,
      paddingBottom: () => 5
    },
    margin: [0, 0, 0, 15]
  });

  // ========== 2. PAYMENT BREAKDOWN & KEY METRICS (SIDE BY SIDE) ==========
  const breakdownBody = [];
  breakdownBody.push([
    { text: 'Mode', fontSize: 9, bold: true, fillColor: '#1e293b', color: '#fff' },
    { text: 'Amount', fontSize: 9, bold: true, fillColor: '#1e293b', color: '#fff', alignment: 'right' }
  ]);

  const pModes = [
    { label: 'Cash', val: paymentBreakdown.Cash || 0, color: '#10b981' },
    { label: 'Card', val: paymentBreakdown.Card || 0, color: '#818cf8' },
    { label: 'NETS', val: paymentBreakdown.Nets || 0, color: '#3b82f6' },
    { label: 'PayNow', val: paymentBreakdown.PayNow || 0, color: '#f59e0b' },
    { label: 'Member', val: paymentBreakdown.Member || 0, color: '#ec4899' },
    { label: 'Credit', val: paymentBreakdown.Credit || 0, color: '#e11d48' }
  ];

  pModes.forEach(p => {
    breakdownBody.push([
      { text: p.label, fontSize: 9, bold: true, color: p.color },
      { text: formatVal(p.val), fontSize: 9, bold: true, color: p.color, alignment: 'right' }
    ]);
  });

  const keyMetricsBody = [];
  keyMetricsBody.push([
    { text: 'Metric', fontSize: 9, bold: true, fillColor: '#1e293b', color: '#fff' },
    { text: 'Value', fontSize: 9, bold: true, fillColor: '#1e293b', color: '#fff', alignment: 'right' }
  ]);

  keyMetricsBody.push([
    { text: 'Avg Check', fontSize: 9, color: '#1e293b' },
    { text: formatVal(keyMetrics.avgCheck || 0), fontSize: 9, alignment: 'right' }
  ]);
  keyMetricsBody.push([
    { text: 'Conversion', fontSize: 9, color: '#1e293b' },
    { text: formatVal(keyMetrics.conversion || 0, false), fontSize: 9, alignment: 'right' }
  ]);
  keyMetricsBody.push([
    { text: 'Avg Items', fontSize: 9, color: '#1e293b' },
    { text: (Number(keyMetrics.avgItems) || 0).toFixed(1), fontSize: 9, alignment: 'right' }
  ]);
  keyMetricsBody.push([
    { text: 'Per Item', fontSize: 9, color: '#1e293b' },
    { text: formatVal(keyMetrics.perItem || 0), fontSize: 9, alignment: 'right' }
  ]);

  content.push({
    columns: [
      {
        width: '50%',
        stack: [
          { text: '2. Payment Breakdown', fontSize: 11, bold: true, color: '#0f172a', margin: [0, 0, 0, 5] },
          {
            table: {
              widths: ['*', 'auto'],
              body: breakdownBody
            },
            layout: 'lightHorizontalLines'
          }
        ]
      },
      {
        width: '45%',
        offset: '5%',
        stack: [
          { text: '4. Key Metrics', fontSize: 11, bold: true, color: '#0f172a', margin: [0, 0, 0, 5] },
          {
            table: {
              widths: ['*', 'auto'],
              body: keyMetricsBody
            },
            layout: 'lightHorizontalLines'
          }
        ]
      }
    ],
    columnGap: 20,
    margin: [0, 0, 0, 15]
  });

  // ========== 3. RECONCILIATION SUMMARY & ORDER TYPES (SIDE BY SIDE) ==========
  const reconBody = [];
  reconBody.push([
    { text: 'Reconciliation Particulars', fontSize: 9, bold: true, fillColor: '#1e293b', color: '#fff' },
    { text: 'Amount', fontSize: 9, bold: true, fillColor: '#1e293b', color: '#fff', alignment: 'right' }
  ]);

  reconBody.push([
    { text: 'Total Sales Volume', fontSize: 9, bold: true },
    { text: formatVal(reconciliation.totalSalesVolume || 0), fontSize: 9, bold: true, alignment: 'right' }
  ]);
  reconBody.push([
    { text: 'Member Accounts (Sales)', fontSize: 9, color: '#ec4899' },
    { text: formatVal(reconciliation.memberSales || 0), fontSize: 9, alignment: 'right', color: '#ec4899' }
  ]);
  reconBody.push([
    { text: 'Credit Customers (Collected)', fontSize: 9, color: '#10b981' },
    { text: formatVal(reconciliation.creditCollected || 0), fontSize: 9, alignment: 'right', color: '#10b981' }
  ]);
  reconBody.push([
    { text: 'Credit Outstanding (Pending)', fontSize: 9, color: '#e11d48' },
    { text: formatVal(reconciliation.creditOutstanding || 0), fontSize: 9, alignment: 'right', color: '#e11d48' }
  ]);
  reconBody.push([
    { text: 'Total Collections Volume', fontSize: 9, bold: true, fillColor: '#e2f0d9', color: '#1e293b' },
    { text: formatVal(reconciliation.totalCollectionsVolume || 0), fontSize: 9, bold: true, alignment: 'right', fillColor: '#e2f0d9', color: '#1e293b' }
  ]);

  const ordDineInPct = Number(orderTypes.dineInPct) || 0;
  const ordTakeawayPct = Number(orderTypes.takeawayPct) || 0;

  const orderTypesBody = [];
  orderTypesBody.push([
    { text: 'Order Type', fontSize: 9, bold: true, fillColor: '#1e293b', color: '#fff' },
    { text: 'Count', fontSize: 9, bold: true, fillColor: '#1e293b', color: '#fff', alignment: 'center' },
    { text: '%', fontSize: 9, bold: true, fillColor: '#1e293b', color: '#fff', alignment: 'right' }
  ]);

  orderTypesBody.push([
    { text: 'Dine-In', fontSize: 9 },
    { text: formatVal(orderTypes.dineInCount || 0, false), fontSize: 9, alignment: 'center' },
    { text: `${ordDineInPct.toFixed(0)}%`, fontSize: 9, alignment: 'right', bold: true }
  ]);
  orderTypesBody.push([
    { text: 'Takeaway', fontSize: 9 },
    { text: formatVal(orderTypes.takeawayCount || 0, false), fontSize: 9, alignment: 'center' },
    { text: `${ordTakeawayPct.toFixed(0)}%`, fontSize: 9, alignment: 'right', bold: true }
  ]);

  content.push({
    columns: [
      {
        width: '55%',
        stack: [
          { text: '3. Reconciliation Summary', fontSize: 11, bold: true, color: '#0f172a', margin: [0, 0, 0, 5] },
          {
            table: {
              widths: ['*', 'auto'],
              body: reconBody
            },
            layout: 'lightHorizontalLines'
          }
        ]
      },
      {
        width: '40%',
        offset: '5%',
        stack: [
          { text: '5. Order Types', fontSize: 11, bold: true, color: '#0f172a', margin: [0, 0, 0, 5] },
          {
            table: {
              widths: ['*', 'auto', 'auto'],
              body: orderTypesBody
            },
            layout: 'lightHorizontalLines'
          }
        ]
      }
    ],
    columnGap: 20,
    margin: [0, 0, 0, 20]
  });

  // ========== 6. CATEGORY SALES REPORT (SUMMARIZED BY CATEGORY) ==========
  content.push({
    text: '6. Category Sales Report',
    fontSize: 11,
    bold: true,
    color: '#0f172a',
    margin: [0, 5, 0, 5]
  });

  const catTableBody = [];
  catTableBody.push([
    { text: 'Category', fontSize: 9, bold: true, fillColor: '#34495e', color: '#fff' },
    { text: 'Qty', fontSize: 9, bold: true, fillColor: '#34495e', color: '#fff', alignment: 'center' },
    { text: 'Sales', fontSize: 9, bold: true, fillColor: '#34495e', color: '#fff', alignment: 'right' }
  ]);

  let totalCatQty = 0;
  let totalCatSales = 0;

  if (categories && categories.length > 0) {
    categories.forEach(c => {
      totalCatQty += Number(c.Qty) || 0;
      totalCatSales += Number(c.Sales) || 0;
      catTableBody.push([
        { text: c.Category || 'Unmapped', fontSize: 9 },
        { text: formatVal(c.Qty || 0, false), fontSize: 9, alignment: 'center' },
        { text: formatVal(c.Sales || 0), fontSize: 9, alignment: 'right' }
      ]);
    });
  } else {
    catTableBody.push([
      { text: 'No category sales records', colSpan: 3, alignment: 'center', fontSize: 9, italics: true },
      {},
      {}
    ]);
  }

  catTableBody.push([
    { text: 'Total', fontSize: 9, bold: true, fillColor: '#f8fafc' },
    { text: formatVal(totalCatQty, false), fontSize: 9, bold: true, alignment: 'center', fillColor: '#f8fafc' },
    { text: formatVal(totalCatSales), fontSize: 9, bold: true, alignment: 'right', fillColor: '#f8fafc' }
  ]);

  content.push({
    table: {
      widths: ['*', 60, 100],
      body: catTableBody
    },
    layout: 'lightHorizontalLines',
    margin: [0, 0, 0, 20]
  });

  // ========== 7. ITEM SALES REPORT ==========
  content.push({
    text: '7. Item Sales Report',
    fontSize: 11,
    bold: true,
    color: '#0f172a',
    margin: [0, 5, 0, 5],
    pageBreak: 'before' // Always print detailed item sales on a new page to keep structure clean
  });

  const itemTableBody = [];
  itemTableBody.push([
    { text: 'Item', fontSize: 9, bold: true, fillColor: '#34495e', color: '#fff' },
    { text: 'Category', fontSize: 9, bold: true, fillColor: '#34495e', color: '#fff' },
    { text: 'Qty', fontSize: 9, bold: true, fillColor: '#34495e', color: '#fff', alignment: 'center' },
    { text: 'Sales', fontSize: 9, bold: true, fillColor: '#34495e', color: '#fff', alignment: 'right' }
  ]);

  let totalItemQty = 0;
  let totalItemSales = 0;

  if (items && items.length > 0) {
    items.forEach(i => {
      totalItemQty += Number(i.Qty) || 0;
      totalItemSales += Number(i.Sales) || 0;
      itemTableBody.push([
        { text: i.Item || 'Unknown', fontSize: 9 },
        { text: i.Category || 'Unmapped', fontSize: 9, color: '#64748b' },
        { text: formatVal(i.Qty || 0, false), fontSize: 9, alignment: 'center' },
        { text: formatVal(i.Sales || 0), fontSize: 9, alignment: 'right' }
      ]);
    });
  } else {
    itemTableBody.push([
      { text: 'No item sales records', colSpan: 4, alignment: 'center', fontSize: 9, italics: true },
      {},
      {},
      {}
    ]);
  }

  itemTableBody.push([
    { text: 'Total', fontSize: 9, bold: true, fillColor: '#f8fafc', colSpan: 2 },
    {},
    { text: formatVal(totalItemQty, false), fontSize: 9, bold: true, alignment: 'center', fillColor: '#f8fafc' },
    { text: formatVal(totalItemSales), fontSize: 9, bold: true, alignment: 'right', fillColor: '#f8fafc' }
  ]);

  content.push({
    table: {
      widths: ['*', 120, 50, 80],
      body: itemTableBody
    },
    layout: 'lightHorizontalLines',
    margin: [0, 0, 0, 20]
  });

  // ========== 8. ARTIST TARGET REPORT (IF DATA EXISTS) ==========
  if (artistSales && artistSales.length > 0) {
    content.push({
      text: '8. Artist Target Report',
      fontSize: 11,
      bold: true,
      color: '#0f172a',
      margin: [0, 5, 0, 5]
    });

    const artistTableBody = [];
    artistTableBody.push([
      { text: 'Artist Name', fontSize: 9, bold: true, fillColor: '#1e293b', color: '#fff' },
      { text: 'Target Amount', fontSize: 9, bold: true, fillColor: '#1e293b', color: '#fff', alignment: 'right' },
      { text: 'Actual Sales', fontSize: 9, bold: true, fillColor: '#1e293b', color: '#fff', alignment: 'right' },
      { text: 'Achievement %', fontSize: 9, bold: true, fillColor: '#1e293b', color: '#fff', alignment: 'right' }
    ]);

    artistSales.forEach(a => {
      const target = Number(a.TargetAmount) || 0;
      const actual = Number(a.ActualSales) || 0;
      const pct = target > 0 ? (actual / target) * 100 : 0;
      artistTableBody.push([
        { text: a.Name || '', fontSize: 9 },
        { text: formatVal(target), fontSize: 9, alignment: 'right' },
        { text: formatVal(actual), fontSize: 9, alignment: 'right', color: actual >= target && target > 0 ? '#10b981' : '#1e293b' },
        { text: `${pct.toFixed(0)}%`, fontSize: 9, bold: true, alignment: 'right', color: actual >= target && target > 0 ? '#10b981' : '#64748b' }
      ]);
    });

    content.push({
      table: {
        widths: ['*', 100, 100, 100],
        body: artistTableBody
      },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 20]
    });
  }

  // Printed date and powered by in small text at bottom
  content.push({
    columns: [
      {
        text: `Printed On: ${printedOn} (Singapore Time)`,
        fontSize: 7.5,
        color: '#94a3b8'
      },
      {
        text: 'Powered by UNIPRO',
        fontSize: 7.5,
        color: '#94a3b8',
        alignment: 'right'
      }
    ],
    margin: [0, 10, 0, 0]
  });

  return {
    content,
    pageSize: 'A4',
    pageMargins: [30, 30, 30, 40],
    defaultStyle: {
      font: 'Roboto',
      fontSize: 9,
      lineHeight: 1.35
    },
    footer: function(currentPage, pageCount) {
      return {
        text: `Page ${currentPage} of ${pageCount}`,
        alignment: 'center',
        fontSize: 8,
        color: '#94a3b8',
        margin: [0, 15, 0, 0]
      };
    }
  };
};

/**
 * Creates a PDF buffer from a document definition
 * @param {Object} docDefinition - pdfmake document definition
 * @returns {Promise<Buffer>} PDF as buffer
 */
const createPdfBinary = (docDefinition) => {
  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks = [];
      pdfDoc.on('data', chunk => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', err => reject(err));
      pdfDoc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateSalesReportPdf,
  createPdfBinary,
  printer
};
