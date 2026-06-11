/**
 * Professional PDF Report Generator for Jalsa Sales Analytics
 * Generates premium Power BI / Tableau-style executive dashboards for restaurant owners and managers.
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
  const barWidth = 120;
  const filledWidth = Math.max(0, Math.min(barWidth, (percentage / 100) * barWidth));
  return {
    canvas: [
      {
        type: 'rect',
        x: 0,
        y: 3,
        w: barWidth,
        h: 6,
        color: '#f1f5f9', // Light background bar
        r: 3
      },
      filledWidth > 0 ? {
        type: 'rect',
        x: 0,
        y: 3,
        w: filledWidth,
        h: 6,
        color: color,
        r: 3
      } : null
    ].filter(Boolean)
  };
};

/**
 * Generates a vector branding emblem / logo for the dashboard header
 */
const makeLogoEmblem = () => {
  return {
    canvas: [
      {
        type: 'rect',
        x: 0,
        y: 0,
        w: 32,
        h: 32,
        r: 8,
        color: '#1e3a8a' // Deep Navy Blue
      },
      {
        type: 'rect',
        x: 6,
        y: 6,
        w: 20,
        h: 20,
        r: 5,
        color: '#f97316' // Orange highlight
      }
    ],
    width: 38,
    height: 38,
    margin: [0, 0, 10, 0]
  };
};

/**
 * Generates a dynamic Sales Trend vector bar chart using pdfmake canvas
 */
const makeSalesTrendChart = (categories) => {
  const chartHeight = 65;
  const chartWidth = 515;
  const maxBars = 6;
  const data = (categories && categories.length > 0)
    ? categories.slice(0, maxBars)
    : [
      { Category: 'Dine-In', Sales: 1200 },
      { Category: 'Takeaway', Sales: 800 },
      { Category: 'Delivery', Sales: 600 },
      { Category: 'Beverages', Sales: 400 },
      { Category: 'Desserts', Sales: 250 }
    ];

  const maxVal = Math.max(...data.map(c => c.Sales || 1));

  const shapes = [];

  // Background grid lines (horizontal ticks)
  for (let i = 0; i <= 3; i++) {
    const y = 8 + i * 16;
    shapes.push({
      type: 'line',
      x1: 15,
      y1: y,
      x2: chartWidth - 15,
      y2: y,
      lineWidth: 0.5,
      lineColor: '#f1f5f9'
    });
  }

  // Draw columns (bars) & trend dots
  const numBars = data.length;
  const barSpacing = (chartWidth - 40) / numBars;
  const barWidth = 22;
  const linePoints = [];

  data.forEach((c, idx) => {
    const val = c.Sales || 0;
    const barHeight = maxVal > 0 ? (val / maxVal) * 45 : 0;
    const x = 30 + idx * barSpacing + barSpacing / 2;
    const y = 56 - barHeight;

    // The primary blue column
    shapes.push({
      type: 'rect',
      x: x - barWidth / 2,
      y: y,
      w: barWidth,
      h: barHeight,
      color: '#3b82f6', // Premium Blue
      r: 3
    });

    // Save points for custom trend line running above the columns
    linePoints.push({ x: x, y: y - 5 });
  });

  // Connect trend line points
  for (let i = 0; i < linePoints.length - 1; i++) {
    shapes.push({
      type: 'line',
      x1: linePoints[i].x,
      y1: linePoints[i].y,
      x2: linePoints[i + 1].x,
      y2: linePoints[i + 1].y,
      lineWidth: 1.8,
      lineColor: '#10b981' // Green positive trend line
    });
    shapes.push({
      type: 'rect',
      x: linePoints[i].x - 2,
      y: linePoints[i].y - 2,
      w: 4,
      h: 4,
      color: '#10b981'
    });
  }
  if (linePoints.length > 0) {
    const last = linePoints[linePoints.length - 1];
    shapes.push({
      type: 'rect',
      x: last.x - 2,
      y: last.y - 2,
      w: 4,
      h: 4,
      color: '#10b981'
    });
  }

  // Axis baseline
  shapes.push({
    type: 'line',
    x1: 15,
    y1: 56,
    x2: chartWidth - 15,
    y2: 56,
    lineWidth: 1,
    lineColor: '#cbd5e1'
  });

  return {
    stack: [
      {
        canvas: shapes,
        height: chartHeight
      },
      {
        columns: data.map(c => ({
          text: String(c.Category || 'Other').toUpperCase().substring(0, 15),
          fontSize: 7,
          color: '#475569',
          alignment: 'center',
          bold: true
        })),
        margin: [15, 2, 15, 0]
      }
    ],
    margin: [0, 8, 0, 15]
  };
};

/**
 * Generates a comprehensive sales report PDF definition
 */
const generateSalesReportPdf = (reportData) => {
  const {
    companyName = 'JALSA',
    companyAddress = '1 ROCHOR CANAL ROAD, #B1-29 SIM LIM SQUARE, SINGAPORE 188504',
    companyPhone = '',
    period = '09/06/2026',
    printedOn = '',
    totalSales = 0,
    totalTax = 0,
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

  const topItem = items.length > 0 ? [...items].sort((a, b) => b.Sales - a.Sales)[0] : null;
  const topCategory = categories.length > 0 ? [...categories].sort((a, b) => b.Sales - a.Sales)[0] : null;
  const topStaff = artistSales.length > 0 ? [...artistSales].sort((a, b) => b.ActualSales - a.ActualSales)[0] : null;

  const topItemText = topItem ? String(topItem.Item).toUpperCase() : 'NONE';
  const topItemSub = topItem ? `${Number(topItem.Qty).toFixed(0)} units · ${formatVal(topItem.Sales)}` : '0 units · $0.00';

  const topCatText = topCategory ? String(topCategory.Category).toUpperCase() : 'NONE';
  const topCatSub = topCategory ? `${formatVal(topCategory.Sales)} revenue` : '$0.00 revenue';

  const topStaffText = topStaff ? String(topStaff.Name).toUpperCase() : 'NONE';
  const topStaffSub = topStaff ? `${formatVal(topStaff.ActualSales)} achieved` : '$0.00 achieved';

  // Premium Dashboard Theme Palette
  const BLUE_PRIMARY = '#1e3a8a';  // Power BI Dark Blue
  const TEAL_SUCCESS = '#10b981';  // Modern Green
  const ORANGE_HIGHLIGHT = '#f97316'; // Vivid Orange
  const RED_ALERT = '#ef4444'; // Red for Voids/Cancellations
  const SLATE_DARK = '#334155';
  const SLATE_MUTED = '#64748b';
  const BG_LIGHT = '#f8fafc';

  const content = [];

  // ================= 1. PREMIUM HEADER SECTION =================
  content.push({
    columns: [
      {
        stack: [
          { text: companyName.toUpperCase(), fontSize: 16, bold: true, color: BLUE_PRIMARY, letterSpacing: 1 },
          { text: `${companyAddress} ${companyPhone ? ' | Tel: ' + companyPhone : ''}`, fontSize: 7.5, color: SLATE_MUTED }
        ],
        width: '*',
        margin: [0, 2, 0, 0]
      },
      {
        stack: [
          { text: 'SALES ANALYTICS EXECUTIVE DASHBOARD', fontSize: 9.5, bold: true, color: ORANGE_HIGHLIGHT, alignment: 'right' },
          { text: `Report Period: ${period}`, fontSize: 8, bold: true, color: SLATE_DARK, alignment: 'right', margin: [0, 2, 0, 0] }
        ],
        width: 220
      }
    ],
    margin: [0, 0, 0, 10]
  });

  content.push({
    canvas: [{ type: 'rect', x: 0, y: 0, w: 525, h: 2, color: ORANGE_HIGHLIGHT }],
    margin: [0, 0, 0, 15]
  });

  // ================= 2. TOP SUMMARY CARDS =================
  const makeTopSummaryCard = (title, value, subtitle, borderLeftColor) => {
    return {
      table: {
        widths: ['*'],
        body: [
          [{
            stack: [
              { text: title.toUpperCase(), fontSize: 7, bold: true, color: SLATE_MUTED, margin: [0, 0, 0, 4] },
              { text: value, fontSize: 11, bold: true, color: ORANGE_HIGHLIGHT, margin: [0, 0, 0, 3] },
              { text: subtitle, fontSize: 7.5, color: SLATE_MUTED }
            ],
            fillColor: '#fffaf8',
            margin: [10, 8, 10, 8],
            border: [true, false, false, false],
            borderColor: [borderLeftColor, null, null, null]
          }]
        ]
      },
      layout: {
        defaultBorder: false,
        vLineWidth: (i) => i === 0 ? 3.5 : 0
      },
      margin: [2, 2, 2, 2]
    };
  };

  content.push({
    table: {
      widths: ['33.3%', '33.3%', '33.4%'],
      body: [
        [
          makeTopSummaryCard('Top Menu Item', topItemText, topItemSub, ORANGE_HIGHLIGHT),
          makeTopSummaryCard('Top Category', topCatText, topCatSub, '#000000'),
          makeTopSummaryCard('Top Staff', topStaffText, topStaffSub, '#000000')
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
    margin: [0, 0, 0, 18]
  });

  // Section Header Helper
  const makeSectionHeader = (title) => {
    return {
      columns: [
        {
          canvas: [{ type: 'rect', x: 0, y: 0, w: 3, h: 12, color: ORANGE_HIGHLIGHT }],
          width: 8,
          margin: [0, 2, 0, 0]
        },
        {
          text: title.toUpperCase(),
          fontSize: 9.5,
          bold: true,
          color: '#c2410c', // Dark rust/orange
          width: '*'
        }
      ],
      margin: [0, 12, 0, 8]
    };
  };

  // ================= 3. TOP 10 RANKED MENU ITEMS =================
  content.push(makeSectionHeader('Top 10 Ranked Menu Items'));

  const rankedItemsBody = [];
  rankedItemsBody.push([
    { text: '#', fontSize: 7, bold: true, fillColor: '#c2410c', color: '#fff', alignment: 'center', margin: [0, 3, 0, 3] },
    { text: 'Item', fontSize: 7, bold: true, fillColor: '#c2410c', color: '#fff', margin: [0, 3, 0, 3] },
    { text: 'Category', fontSize: 7, bold: true, fillColor: '#c2410c', color: '#fff', margin: [0, 3, 0, 3] },
    { text: 'Qty', fontSize: 7, bold: true, fillColor: '#c2410c', color: '#fff', alignment: 'center', margin: [0, 3, 0, 3] },
    { text: 'Revenue', fontSize: 7, bold: true, fillColor: '#c2410c', color: '#fff', alignment: 'right', margin: [0, 3, 0, 3] },
    { text: 'Share', fontSize: 7, bold: true, fillColor: '#c2410c', color: '#fff', margin: [0, 3, 0, 3] },
    { text: '%', fontSize: 7, bold: true, fillColor: '#c2410c', color: '#fff', alignment: 'right', margin: [0, 3, 0, 3] }
  ]);

  const sortedItems = [...items].sort((a, b) => (b.Sales || 0) - (a.Sales || 0)).slice(0, 10);

  if (sortedItems.length > 0) {
    sortedItems.forEach((i, idx) => {
      const sharePct = totalSales > 0 ? (i.Sales / totalSales) * 100 : 0;
      rankedItemsBody.push([
        { text: `${idx + 1}`, fontSize: 7.5, bold: true, alignment: 'center', fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT, margin: [0, 3, 0, 3] },
        { text: String(i.Item || '').toUpperCase(), fontSize: 7.5, bold: true, fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT, margin: [0, 3, 0, 3] },
        { text: String(i.Category || 'Unmapped').toUpperCase(), fontSize: 7.5, color: SLATE_MUTED, fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT, margin: [0, 3, 0, 3] },
        { text: formatVal(i.Qty || 0, false), fontSize: 7.5, bold: true, alignment: 'center', fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT, margin: [0, 3, 0, 3] },
        { text: formatVal(i.Sales || 0), fontSize: 7.5, bold: true, alignment: 'right', color: ORANGE_HIGHLIGHT, fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT, margin: [0, 3, 0, 3] },
        { stack: [makeProgressBar(sharePct, ORANGE_HIGHLIGHT)], fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT, margin: [5, 3, 0, 3] },
        { text: `${sharePct.toFixed(1)}%`, fontSize: 7.5, bold: true, color: SLATE_DARK, alignment: 'right', fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT, margin: [0, 3, 0, 3] }
      ]);
    });
  } else {
    rankedItemsBody.push([
      { text: 'No itemized sales records found', colSpan: 7, alignment: 'center', fontSize: 8, italics: true },
      {}, {}, {}, {}, {}, {}
    ]);
  }

  content.push({
    table: {
      widths: [20, '*', 100, 35, 60, 95, 45],
      body: rankedItemsBody
    },
    layout: 'lightHorizontalLines',
    margin: [0, 0, 0, 15]
  });

  // ================= 4. STAFF TARGET ACHIEVEMENTS =================
  if (artistSales && artistSales.length > 0) {
    content.push(makeSectionHeader('Staff Target Achievements'));

    const artistTableBody = [];
    artistTableBody.push([
      { text: 'Staff Name', fontSize: 7.5, bold: true, fillColor: '#c2410c', color: '#fff', margin: [0, 3, 0, 3] },
      { text: 'Target', fontSize: 7.5, bold: true, fillColor: '#c2410c', color: '#fff', alignment: 'right', margin: [0, 3, 0, 3] },
      { text: 'Achieved', fontSize: 7.5, bold: true, fillColor: '#c2410c', color: '#fff', alignment: 'right', margin: [0, 3, 0, 3] },
      { text: 'Progress', fontSize: 7.5, bold: true, fillColor: '#c2410c', color: '#fff', margin: [0, 3, 0, 3] },
      { text: '%', fontSize: 7.5, bold: true, fillColor: '#c2410c', color: '#fff', alignment: 'center', margin: [0, 3, 0, 3] },
      { text: 'Status', fontSize: 7.5, bold: true, fillColor: '#c2410c', color: '#fff', alignment: 'center', margin: [0, 3, 0, 3] }
    ]);

    artistSales.forEach((a, idx) => {
      const target = Number(a.TargetAmount) || 0;
      const actual = Number(a.ActualSales) || 0;
      const pct = target > 0 ? (actual / target) * 100 : 0;
      const isTargetMet = actual >= target && target > 0;
      const statusText = isTargetMet ? 'ACHIEVED' : 'IN PROGRESS';
      const statusColor = isTargetMet ? TEAL_SUCCESS : ORANGE_HIGHLIGHT;

      artistTableBody.push([
        { text: String(a.Name || '').toUpperCase(), fontSize: 7.5, bold: true, margin: [0, 3, 0, 3], fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT },
        { text: formatVal(target), fontSize: 7.5, alignment: 'right', margin: [0, 3, 0, 3], fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT },
        { text: formatVal(actual), fontSize: 7.5, bold: true, alignment: 'right', color: ORANGE_HIGHLIGHT, margin: [0, 3, 0, 3], fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT },
        { stack: [makeProgressBar(pct, statusColor)], alignment: 'left', margin: [5, 3, 0, 3], fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT },
        { text: `${pct.toFixed(0)}%`, fontSize: 7.5, bold: true, color: statusColor, alignment: 'center', margin: [0, 3, 0, 3], fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT },
        { text: statusText, fontSize: 7.5, bold: true, color: statusColor, alignment: 'center', margin: [0, 3, 0, 3], fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT }
      ]);
    });

    content.push({
      table: {
        widths: ['*', 75, 75, 120, 45, 80],
        body: artistTableBody
      },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 15]
    });
  }

  // ================= 5. FINANCIAL HEALTH LEDGER =================
  content.push(makeSectionHeader('Financial Health Ledger'));

  const makeFinancialCard = (title, value, subtitle, borderLeftColor) => {
    return {
      table: {
        widths: ['*'],
        body: [
          [{
            stack: [
              { text: title.toUpperCase(), fontSize: 6.5, bold: true, color: SLATE_MUTED, margin: [0, 0, 0, 4] },
              { text: value, fontSize: 13, bold: true, color: SLATE_DARK },
              { text: subtitle, fontSize: 6.5, color: borderLeftColor, margin: [0, 2, 0, 0], bold: true }
            ],
            fillColor: '#ffffff',
            margin: [8, 8, 8, 8],
            border: [true, false, false, false],
            borderColor: [borderLeftColor, null, null, null]
          }]
        ]
      },
      layout: {
        defaultBorder: false,
        vLineWidth: (i) => i === 0 ? 3.5 : 0
      },
      margin: [2, 2, 2, 2]
    };
  };

  content.push({
    table: {
      widths: ['25%', '25%', '25%', '25%'],
      body: [
        [
          makeFinancialCard('GST / Tax', formatVal(totalTax), 'Collected tax', BLUE_PRIMARY),
          makeFinancialCard('Credit Outstanding', formatVal(paymentBreakdown.CreditOutstanding || 0), 'Unpaid ledger', ORANGE_HIGHLIGHT),
          makeFinancialCard('Total Voids', formatVal(voidAmount), `${voidQty} items`, RED_ALERT),
          makeFinancialCard('Net Collections', formatVal(totalCollections), 'Cash in hand', TEAL_SUCCESS)
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
    margin: [0, 0, 0, 15]
  });

  // Footer Branding Info
  content.push({
    columns: [
      { text: 'Powered by UNIPRO Enterprise POS Analytics', fontSize: 7, color: SLATE_MUTED },
      { text: 'CONFIDENTIAL - FOR INTERNAL BOARD REVIEW ONLY', fontSize: 7, color: SLATE_MUTED, alignment: 'right' }
    ],
    margin: [0, 15, 0, 0]
  });

  return {
    content,
    pageSize: 'A4',
    pageMargins: [35, 35, 35, 45],
    defaultStyle: {
      font: 'Roboto',
      fontSize: 8.5,
      lineHeight: 1.35
    },
    footer: function (currentPage, pageCount) {
      return {
        columns: [
          {
            text: `Report Period: ${period} | Printed On: ${printedOn || new Date().toLocaleString()}`,
            fontSize: 7.5,
            color: SLATE_MUTED,
            margin: [35, 12, 0, 0]
          },
          {
            text: `Page ${currentPage} of ${pageCount}`,
            alignment: 'right',
            fontSize: 7.5,
            color: SLATE_MUTED,
            margin: [0, 12, 35, 0]
          }
        ]
      };
    }
  };
};

/**
 * Creates a PDF buffer from a document definition
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
