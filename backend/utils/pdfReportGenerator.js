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
 * Generates a visual progress bar component using pdfmake canvas
 */
const makeProgressBar = (percentage, color) => {
  const barWidth = 100;
  const filledWidth = Math.max(0, Math.min(barWidth, (percentage / 100) * barWidth));
  return {
    canvas: [
      {
        type: 'rect',
        x: 0,
        y: 3,
        w: barWidth,
        h: 6,
        color: '#f1f5f9' // Light background bar
      },
      filledWidth > 0 ? {
        type: 'rect',
        x: 0,
        y: 3,
        w: filledWidth,
        h: 6,
        color: color
      } : null
    ].filter(Boolean)
  };
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

  // Color Palette Definitions (Premium Cool Tech / Modern Executive Theme)
  const NAVY_DARK = '#0f172a'; // Deep Navy slate
  const BRAND_ACCENT = '#ea580c'; // Warm Orange
  const PURPLE_ACCENT = '#6366f1'; // Indigo
  const TEXT_DARK = '#1e293b'; // Slate 800
  const TEXT_MUTED = '#64748b'; // Slate 500
  const BG_LIGHT = '#f8fafc'; // Slate 50
  const SUCCESS_COLOR = '#0d9488'; // Teal
  const DANGER_COLOR = '#e11d48'; // Rose/Red
  const WARNING_COLOR = '#d97706'; // Amber

  const content = [];

  // ========== HEADER SECTION ==========
  content.push({
    columns: [
      {
        stack: [
          { text: companyName.toUpperCase(), fontSize: 18, bold: true, color: NAVY_DARK, letterSpacing: 1.5 },
          { text: companyAddress, fontSize: 8, color: TEXT_MUTED, margin: [0, 4, 0, 0] },
          companyPhone ? { text: `Phone: ${companyPhone}`, fontSize: 8, color: TEXT_MUTED, margin: [0, 2, 0, 0] } : null
        ],
        width: '60%'
      },
      {
        stack: [
          { text: 'SALES ANALYTICS DASHBOARD', fontSize: 12, bold: true, color: BRAND_ACCENT, alignment: 'right', letterSpacing: 0.5 },
          {
            table: {
              widths: ['*'],
              body: [[
                { text: `PERIOD: ${period}`, fontSize: 8.5, bold: true, color: '#ffffff', alignment: 'center', margin: [6, 3, 6, 3] }
              ]]
            },
            fillColor: NAVY_DARK,
            margin: [0, 6, 0, 0]
          }
        ],
        width: '40%'
      }
    ],
    margin: [0, 0, 0, 15]
  });

  // Thin modern divider line
  content.push({
    canvas: [{ type: 'rect', x: 0, y: 0, w: 535, h: 2, color: BRAND_ACCENT }],
    margin: [0, 0, 0, 15]
  });

  // ========== 1. KPI SUMMARY CARDS GRID ==========
  // Helper to draw a summary card cell with left accent border
  const makeCard = (title, value, accentColor) => {
    return {
      table: {
        widths: ['*'],
        body: [
          [{
            stack: [
              { text: title.toUpperCase(), fontSize: 6.5, bold: true, color: TEXT_MUTED, margin: [2, 0, 0, 2] },
              { text: value, fontSize: 12, bold: true, color: accentColor || TEXT_DARK, margin: [2, 0, 0, 0] }
            ],
            border: [true, false, false, false],
            borderColor: [accentColor, null, null, null],
            fillColor: '#ffffff',
            margin: [6, 4, 6, 4]
          }]
        ]
      },
      layout: {
        defaultBorder: false,
        vLineWidth: (i) => i === 0 ? 3 : 0
      },
      margin: [2, 2, 2, 2]
    };
  };

  content.push({
    table: {
      widths: ['25%', '25%', '25%', '25%'],
      body: [
        [
          makeCard('Total Sales', formatVal(totalSales), PURPLE_ACCENT),
          makeCard('Net Collections', formatVal(totalCollections), SUCCESS_COLOR),
          makeCard('Credit Collected', formatVal(creditPaymentsCollected), BRAND_ACCENT),
          makeCard('Member Payments', formatVal((paymentBreakdown.Member || 0) + memberPaymentsCollected), '#db2777')
        ],
        [
          makeCard('Total Bills', formatVal(totalOrders, false), TEXT_DARK),
          makeCard('Items Sold', formatVal(totalItems, false), TEXT_DARK),
          makeCard('Void Amount', formatVal(voidAmount), WARNING_COLOR),
          makeCard('Cancelled Value', formatVal(cancelledAmount), DANGER_COLOR)
        ]
      ]
    },
    layout: {
      defaultBorder: false,
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0
    },
    margin: [0, 0, 0, 20]
  });

  // ========== 2. PAYMENT MIX (WITH BAR CHART) & KEY OPERATIONAL METRICS ==========
  const breakdownBody = [];
  breakdownBody.push([
    { text: 'Method', fontSize: 8, bold: true, fillColor: NAVY_DARK, color: '#fff', margin: [0, 2, 0, 2] },
    { text: 'Revenue', fontSize: 8, bold: true, fillColor: NAVY_DARK, color: '#fff', alignment: 'right', margin: [0, 2, 0, 2] },
    { text: 'Mix %', fontSize: 8, bold: true, fillColor: NAVY_DARK, color: '#fff', alignment: 'right', margin: [0, 2, 0, 2] },
    { text: 'Distribution Share', fontSize: 8, bold: true, fillColor: NAVY_DARK, color: '#fff', margin: [0, 2, 0, 2] }
  ]);

  const rawTotal = (paymentBreakdown.Cash || 0) +
                       (paymentBreakdown.Card || 0) +
                       (paymentBreakdown.Nets || 0) +
                       (paymentBreakdown.PayNow || 0) +
                       (paymentBreakdown.Member || 0) +
                       (paymentBreakdown.Credit || 0);

  const pModes = [
    { label: 'Cash', val: paymentBreakdown.Cash || 0, color: SUCCESS_COLOR },
    { label: 'Card', val: paymentBreakdown.Card || 0, color: PURPLE_ACCENT },
    { label: 'NETS', val: paymentBreakdown.Nets || 0, color: '#0ea5e9' },
    { label: 'PayNow', val: paymentBreakdown.PayNow || 0, color: WARNING_COLOR },
    { label: 'Member Wallet', val: paymentBreakdown.Member || 0, color: '#db2777' },
    { label: 'Credit Outstanding', val: paymentBreakdown.Credit || 0, color: DANGER_COLOR }
  ];

  pModes.forEach(p => {
    const sharePct = rawTotal > 0 ? (p.val / rawTotal) * 100 : 0;
    breakdownBody.push([
      { text: p.label, fontSize: 8, bold: true, color: TEXT_DARK, margin: [0, 3, 0, 3] },
      { text: formatVal(p.val), fontSize: 8, bold: true, color: TEXT_DARK, alignment: 'right', margin: [0, 3, 0, 3] },
      { text: `${sharePct.toFixed(1)}%`, fontSize: 8, color: TEXT_MUTED, alignment: 'right', margin: [0, 3, 0, 3] },
      { stack: [makeProgressBar(sharePct, p.color)], alignment: 'left', margin: [4, 3, 0, 3] }
    ]);
  });

  const keyMetricsBody = [];
  keyMetricsBody.push([
    { text: 'Metric Indicator', fontSize: 8, bold: true, fillColor: NAVY_DARK, color: '#fff', margin: [0, 2, 0, 2] },
    { text: 'Performance Value', fontSize: 8, bold: true, fillColor: NAVY_DARK, color: '#fff', alignment: 'right', margin: [0, 2, 0, 2] }
  ]);

  keyMetricsBody.push([
    { text: 'Average Bill Value', fontSize: 8, color: TEXT_DARK, margin: [0, 3, 0, 3] },
    { text: formatVal(keyMetrics.avgCheck || 0), fontSize: 8, bold: true, alignment: 'right', color: BRAND_ACCENT, margin: [0, 3, 0, 3] }
  ]);
  keyMetricsBody.push([
    { text: 'Conversion Ratio', fontSize: 8, color: TEXT_DARK, margin: [0, 3, 0, 3] },
    { text: formatVal(keyMetrics.conversion || 0, false), fontSize: 8, alignment: 'right', margin: [0, 3, 0, 3] }
  ]);
  keyMetricsBody.push([
    { text: 'Avg Items per Bill', fontSize: 8, color: TEXT_DARK, margin: [0, 3, 0, 3] },
    { text: (Number(keyMetrics.avgItems) || 0).toFixed(1), fontSize: 8, alignment: 'right', margin: [0, 3, 0, 3] }
  ]);
  keyMetricsBody.push([
    { text: 'Average Item Price', fontSize: 8, color: TEXT_DARK, margin: [0, 3, 0, 3] },
    { text: formatVal(keyMetrics.perItem || 0), fontSize: 8, alignment: 'right', margin: [0, 3, 0, 3] }
  ]);

  content.push({
    columns: [
      {
        width: '58%',
        stack: [
          { text: 'Revenue Distribution Share', fontSize: 9.5, bold: true, color: NAVY_DARK, margin: [0, 0, 0, 5] },
          {
            table: {
              widths: ['auto', 'auto', 'auto', '*'],
              body: breakdownBody
            },
            layout: 'lightHorizontalLines'
          }
        ]
      },
      {
        width: '38%',
        offset: '4%',
        stack: [
          { text: 'Operational Efficiency', fontSize: 9.5, bold: true, color: NAVY_DARK, margin: [0, 0, 0, 5] },
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
    columnGap: 15,
    margin: [0, 0, 0, 15]
  });

  // ========== 3. RECONCILIATION SUMMARY & CHANNEL BREAKDOWNS (PROGRESS BARS) ==========
  const reconBody = [];
  reconBody.push([
    { text: 'Reconciliation Particulars', fontSize: 8, bold: true, fillColor: NAVY_DARK, color: '#fff', margin: [0, 2, 0, 2] },
    { text: 'Amount', fontSize: 8, bold: true, fillColor: NAVY_DARK, color: '#fff', alignment: 'right', margin: [0, 2, 0, 2] }
  ]);

  reconBody.push([
    { text: 'Gross Sales Volume', fontSize: 8, bold: true, margin: [0, 3, 0, 3] },
    { text: formatVal(reconciliation.totalSalesVolume || 0), fontSize: 8, bold: true, alignment: 'right', color: PURPLE_ACCENT, margin: [0, 3, 0, 3] }
  ]);
  reconBody.push([
    { text: 'Prepaid Wallet Redemptions', fontSize: 8, color: TEXT_MUTED, margin: [0, 3, 0, 3] },
    { text: formatVal(reconciliation.memberSales || 0), fontSize: 8, alignment: 'right', color: TEXT_DARK, margin: [0, 3, 0, 3] }
  ]);
  reconBody.push([
    { text: 'Credit Customer Collections', fontSize: 8, color: TEXT_MUTED, margin: [0, 3, 0, 3] },
    { text: formatVal(reconciliation.creditCollected || 0), fontSize: 8, alignment: 'right', color: SUCCESS_COLOR, margin: [0, 3, 0, 3] }
  ]);
  reconBody.push([
    { text: 'New Outstanding Credit (Pending)', fontSize: 8, color: TEXT_MUTED, margin: [0, 3, 0, 3] },
    { text: formatVal(reconciliation.creditOutstanding || 0), fontSize: 8, alignment: 'right', color: DANGER_COLOR, margin: [0, 3, 0, 3] }
  ]);
  reconBody.push([
    { text: 'Net Collections Volume', fontSize: 8, bold: true, fillColor: '#e6fffa', color: SUCCESS_COLOR, margin: [0, 3, 0, 3] },
    { text: formatVal(reconciliation.totalCollectionsVolume || 0), fontSize: 8, bold: true, alignment: 'right', fillColor: '#e6fffa', color: SUCCESS_COLOR, margin: [0, 3, 0, 3] }
  ]);

  const ordDineInPct = Number(orderTypes.dineInPct) || 0;
  const ordTakeawayPct = Number(orderTypes.takeawayPct) || 0;

  const orderTypesBody = [];
  orderTypesBody.push([
    { text: 'Channel', fontSize: 8, bold: true, fillColor: NAVY_DARK, color: '#fff', margin: [0, 2, 0, 2] },
    { text: 'Share', fontSize: 8, bold: true, fillColor: NAVY_DARK, color: '#fff', alignment: 'center', margin: [0, 2, 0, 2] },
    { text: 'Share %', fontSize: 8, bold: true, fillColor: NAVY_DARK, color: '#fff', alignment: 'right', margin: [0, 2, 0, 2] }
  ]);

  orderTypesBody.push([
    { text: 'Dine-In', fontSize: 8, margin: [0, 3, 0, 3] },
    { stack: [makeProgressBar(ordDineInPct, BRAND_ACCENT)], alignment: 'center', margin: [0, 3, 0, 3] },
    { text: `${ordDineInPct.toFixed(0)}%`, fontSize: 8, alignment: 'right', bold: true, color: BRAND_ACCENT, margin: [0, 3, 0, 3] }
  ]);
  orderTypesBody.push([
    { text: 'Takeaway', fontSize: 8, margin: [0, 3, 0, 3] },
    { stack: [makeProgressBar(ordTakeawayPct, PURPLE_ACCENT)], alignment: 'center', margin: [0, 3, 0, 3] },
    { text: `${ordTakeawayPct.toFixed(0)}%`, fontSize: 8, alignment: 'right', bold: true, color: PURPLE_ACCENT, margin: [0, 3, 0, 3] }
  ]);

  content.push({
    columns: [
      {
        width: '58%',
        stack: [
          { text: 'Financial Reconciliation', fontSize: 9.5, bold: true, color: NAVY_DARK, margin: [0, 0, 0, 5] },
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
        width: '38%',
        offset: '4%',
        stack: [
          { text: 'Order Channels Mix', fontSize: 9.5, bold: true, color: NAVY_DARK, margin: [0, 0, 0, 5] },
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
    columnGap: 15,
    margin: [0, 0, 0, 15]
  });

  // ========== 6. CATEGORY CONTRIBUTIONS (WITH DYNAMIC SHARE PROGRESS BARS) ==========
  content.push({
    text: 'Sales Performance by Category',
    fontSize: 9.5,
    bold: true,
    color: NAVY_DARK,
    margin: [0, 5, 0, 5]
  });

  const catTableBody = [];
  catTableBody.push([
    { text: 'Category Name', fontSize: 8, bold: true, fillColor: '#334155', color: '#fff', margin: [0, 2, 0, 2] },
    { text: 'Qty Sold', fontSize: 8, bold: true, fillColor: '#334155', color: '#fff', alignment: 'center', margin: [0, 2, 0, 2] },
    { text: 'Sales Revenue', fontSize: 8, bold: true, fillColor: '#334155', color: '#fff', alignment: 'right', margin: [0, 2, 0, 2] },
    { text: 'Share Contribution', fontSize: 8, bold: true, fillColor: '#334155', color: '#fff', margin: [0, 2, 0, 2] }
  ]);

  let totalCatQty = 0;
  let totalCatSales = 0;

  if (categories && categories.length > 0) {
    categories.forEach(c => {
      totalCatQty += Number(c.Qty) || 0;
      totalCatSales += Number(c.Sales) || 0;
    });

    categories.forEach((c, idx) => {
      const sharePct = totalCatSales > 0 ? (c.Sales / totalCatSales) * 100 : 0;
      catTableBody.push([
        { text: c.Category || 'Unmapped', fontSize: 8, margin: [0, 2.5, 0, 2.5], fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT },
        { text: formatVal(c.Qty || 0, false), fontSize: 8, alignment: 'center', margin: [0, 2.5, 0, 2.5], fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT },
        { text: formatVal(c.Sales || 0), fontSize: 8, bold: true, alignment: 'right', color: BRAND_ACCENT, margin: [0, 2.5, 0, 2.5], fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT },
        { stack: [makeProgressBar(sharePct, BRAND_ACCENT)], alignment: 'left', margin: [4, 2.5, 0, 2.5], fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT }
      ]);
    });
  } else {
    catTableBody.push([
      { text: 'No category sales records', colSpan: 4, alignment: 'center', fontSize: 8, italics: true },
      {},
      {},
      {}
    ]);
  }

  catTableBody.push([
    { text: 'Total Category Contributions', fontSize: 8, bold: true, fillColor: BG_LIGHT, margin: [0, 3.5, 0, 3.5] },
    { text: formatVal(totalCatQty, false), fontSize: 8, bold: true, alignment: 'center', fillColor: BG_LIGHT, margin: [0, 3.5, 0, 3.5] },
    { text: formatVal(totalCatSales), fontSize: 8, bold: true, alignment: 'right', color: BRAND_ACCENT, fillColor: BG_LIGHT, margin: [0, 3.5, 0, 3.5] },
    { text: '100%', fontSize: 8, bold: true, color: TEXT_MUTED, fillColor: BG_LIGHT, margin: [4, 3.5, 0, 3.5] }
  ]);

  content.push({
    table: {
      widths: ['*', 60, 90, 120],
      body: catTableBody
    },
    layout: 'lightHorizontalLines',
    margin: [0, 0, 0, 15]
  });

  // ========== 7. ITEM SALES REPORT ==========
  content.push({
    text: 'Detailed Item Sales Ledger',
    fontSize: 9.5,
    bold: true,
    color: NAVY_DARK,
    margin: [0, 5, 0, 5],
    pageBreak: 'before' // Clean page break to keep tabular list on separate sheets
  });

  const itemTableBody = [];
  itemTableBody.push([
    { text: 'Item Description', fontSize: 8, bold: true, fillColor: '#334155', color: '#fff', margin: [0, 2.5, 0, 2.5] },
    { text: 'Category Group', fontSize: 8, bold: true, fillColor: '#334155', color: '#fff', margin: [0, 2.5, 0, 2.5] },
    { text: 'Qty Sold', fontSize: 8, bold: true, fillColor: '#334155', color: '#fff', alignment: 'center', margin: [0, 2.5, 0, 2.5] },
    { text: 'Total Revenue', fontSize: 8, bold: true, fillColor: '#334155', color: '#fff', alignment: 'right', margin: [0, 2.5, 0, 2.5] }
  ]);

  let totalItemQty = 0;
  let totalItemSales = 0;

  if (items && items.length > 0) {
    items.forEach((i, idx) => {
      totalItemQty += Number(i.Qty) || 0;
      totalItemSales += Number(i.Sales) || 0;
      itemTableBody.push([
        { text: i.Item || 'Unknown', fontSize: 8, margin: [0, 2.5, 0, 2.5], fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT },
        { text: i.Category || 'Unmapped', fontSize: 8, color: TEXT_MUTED, margin: [0, 2.5, 0, 2.5], fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT },
        { text: formatVal(i.Qty || 0, false), fontSize: 8, alignment: 'center', margin: [0, 2.5, 0, 2.5], fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT },
        { text: formatVal(i.Sales || 0), fontSize: 8, bold: true, alignment: 'right', color: BRAND_ACCENT, margin: [0, 2.5, 0, 2.5], fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT }
      ]);
    });
  } else {
    itemTableBody.push([
      { text: 'No item sales records', colSpan: 4, alignment: 'center', fontSize: 8, italics: true },
      {},
      {},
      {}
    ]);
  }

  itemTableBody.push([
    { text: 'Total Itemized Sales', fontSize: 8, bold: true, fillColor: BG_LIGHT, colSpan: 2, margin: [0, 3.5, 0, 3.5] },
    {},
    { text: formatVal(totalItemQty, false), fontSize: 8, bold: true, alignment: 'center', fillColor: BG_LIGHT, margin: [0, 3.5, 0, 3.5] },
    { text: formatVal(totalItemSales), fontSize: 8, bold: true, alignment: 'right', color: BRAND_ACCENT, fillColor: BG_LIGHT, margin: [0, 3.5, 0, 3.5] }
  ]);

  content.push({
    table: {
      widths: ['*', 140, 60, 100],
      body: itemTableBody
    },
    layout: 'lightHorizontalLines',
    margin: [0, 0, 0, 15]
  });

  // ========== 8. ARTIST TARGET REPORT (IF DATA EXISTS) ==========
  if (artistSales && artistSales.length > 0) {
    content.push({
      text: 'Artist Performance & KPI Achievements',
      fontSize: 9.5,
      bold: true,
      color: NAVY_DARK,
      margin: [0, 5, 0, 5]
    });

    const artistTableBody = [];
    artistTableBody.push([
      { text: 'Artist Name', fontSize: 8, bold: true, fillColor: PURPLE_ACCENT, color: '#fff', margin: [0, 2.5, 0, 2.5] },
      { text: 'Target Amount', fontSize: 8, bold: true, fillColor: PURPLE_ACCENT, color: '#fff', alignment: 'right', margin: [0, 2.5, 0, 2.5] },
      { text: 'Actual Sales', fontSize: 8, bold: true, fillColor: PURPLE_ACCENT, color: '#fff', alignment: 'right', margin: [0, 2.5, 0, 2.5] },
      { text: 'Achievement Share', fontSize: 8, bold: true, fillColor: PURPLE_ACCENT, color: '#fff', margin: [0, 2.5, 0, 2.5] }
    ]);

    artistSales.forEach((a, idx) => {
      const target = Number(a.TargetAmount) || 0;
      const actual = Number(a.ActualSales) || 0;
      const pct = target > 0 ? (actual / target) * 100 : 0;
      const isTargetMet = actual >= target && target > 0;
      artistTableBody.push([
        { text: a.Name || '', fontSize: 8, margin: [0, 2.5, 0, 2.5], fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT },
        { text: formatVal(target), fontSize: 8, alignment: 'right', margin: [0, 2.5, 0, 2.5], fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT },
        { text: formatVal(actual), fontSize: 8, bold: true, alignment: 'right', color: isTargetMet ? SUCCESS_COLOR : TEXT_DARK, margin: [0, 2.5, 0, 2.5], fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT },
        { stack: [makeProgressBar(pct, isTargetMet ? SUCCESS_COLOR : BRAND_ACCENT)], alignment: 'left', margin: [4, 2.5, 0, 2.5], fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT }
      ]);
    });

    content.push({
      table: {
        widths: ['*', 100, 100, 150],
        body: artistTableBody
      },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 15]
    });
  }

  // Footer Branding info
  content.push({
    columns: [
      { text: 'Powered by UNIPRO Enterprise POS Analytics', fontSize: 7, color: TEXT_MUTED },
      { text: 'CONFIDENTIAL - FOR INTERNAL BOARD REVIEW ONLY', fontSize: 7, color: TEXT_MUTED, alignment: 'right' }
    ],
    margin: [0, 15, 0, 0]
  });

  return {
    content,
    pageSize: 'A4',
    pageMargins: [35, 35, 35, 40],
    defaultStyle: {
      font: 'Roboto',
      fontSize: 8.5,
      lineHeight: 1.3
    },
    footer: function(currentPage, pageCount) {
      return {
        columns: [
          {
            text: `Report Period: ${period} | Printed: ${printedOn || new Date().toLocaleString()}`,
            fontSize: 7.5,
            color: TEXT_MUTED,
            margin: [35, 10, 0, 0]
          },
          {
            text: `Page ${currentPage} of ${pageCount}`,
            alignment: 'right',
            fontSize: 7.5,
            color: TEXT_MUTED,
            margin: [0, 10, 35, 0]
          }
        ]
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
