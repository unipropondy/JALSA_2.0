/**
 * Professional PDF Report Generator for Jalsa Sales Analytics
 * Generates premium 4-Page Power BI / Tableau-style executive dashboards for restaurant owners and managers.
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
 * Generates a vector dot indicator
 */
const makeDot = (color) => {
  return {
    canvas: [
      {
        type: 'rect',
        x: 0,
        y: 2,
        w: 6,
        h: 6,
        r: 3,
        color: color
      }
    ],
    width: 10,
    height: 10,
    margin: [2, 0, 0, 0]
  };
};

/**
 * Generates a dynamic Sales Trend vector bar chart using pdfmake canvas
 */
const makeSalesTrendChart = (categories) => {
  const chartHeight = 70;
  const chartWidth = 290;
  const maxBars = 5;
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
    const y = 8 + i * 18;
    shapes.push({
      type: 'line',
      x1: 10,
      y1: y,
      x2: chartWidth - 10,
      y2: y,
      lineWidth: 0.5,
      lineColor: '#f1f5f9'
    });
  }

  // Draw columns (bars) & trend dots
  const numBars = data.length;
  const barSpacing = (chartWidth - 20) / numBars;
  const barWidth = 18;
  const linePoints = [];

  data.forEach((c, idx) => {
    const val = c.Sales || 0;
    const barHeight = maxVal > 0 ? (val / maxVal) * 50 : 0;
    const x = 15 + idx * barSpacing + barSpacing / 2;
    const y = 62 - barHeight;

    // The primary blue column
    shapes.push({
      type: 'rect',
      x: x - barWidth / 2,
      y: y,
      w: barWidth,
      h: barHeight,
      color: '#1e3a8a', // Premium Navy Blue
      r: 3
    });

    // Save points for custom trend line running above the columns
    linePoints.push({ x: x, y: y - 4 });
  });

  // Connect trend line points
  for (let i = 0; i < linePoints.length - 1; i++) {
    shapes.push({
      type: 'line',
      x1: linePoints[i].x,
      y1: linePoints[i].y,
      x2: linePoints[i + 1].x,
      y2: linePoints[i + 1].y,
      lineWidth: 1.5,
      lineColor: '#10b981' // Green positive trend line
    });
    shapes.push({
      type: 'rect',
      x: linePoints[i].x - 1.5,
      y: linePoints[i].y - 1.5,
      w: 3,
      h: 3,
      color: '#10b981'
    });
  }
  if (linePoints.length > 0) {
    const last = linePoints[linePoints.length - 1];
    shapes.push({
      type: 'rect',
      x: last.x - 1.5,
      y: last.y - 1.5,
      w: 3,
      h: 3,
      color: '#10b981'
    });
  }

  // Axis baseline
  shapes.push({
    type: 'line',
    x1: 10,
    y1: 62,
    x2: chartWidth - 10,
    y2: 62,
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
          text: String(c.Category || 'Other').toUpperCase().substring(0, 10),
          fontSize: 6.5,
          color: '#475569',
          alignment: 'center',
          bold: true
        })),
        margin: [10, 2, 10, 0]
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

  // Premium Dashboard Theme Palette
  const BLUE_PRIMARY = '#1e3a8a';  // Power BI Dark Blue
  const TEAL_SUCCESS = '#10b981';  // Modern Green
  const ORANGE_HIGHLIGHT = '#f97316'; // Vivid Orange
  const RED_ALERT = '#ef4444'; // Red for Voids/Cancellations
  const SLATE_DARK = '#334155';
  const SLATE_MUTED = '#64748b';
  const BG_LIGHT = '#f8fafc';

  const content = [];

  // ================= DYNAMIC BUSINESS INSIGHTS COMPUTATION =================
  const sortedItems = [...items].sort((a, b) => (b.Sales || 0) - (a.Sales || 0));
  const topSellingItem = sortedItems[0]?.Item || 'N/A';
  const topCategory = categories[0]?.Category || 'N/A';
  
  const sortedArtists = [...artistSales].sort((a, b) => (b.ActualSales || 0) - (a.ActualSales || 0));
  const topPerformStaff = sortedArtists[0]?.Name || 'N/A';

  const rawTotal = (paymentBreakdown.Cash || 0) +
                   (paymentBreakdown.Card || 0) +
                   (paymentBreakdown.Nets || 0) +
                   (paymentBreakdown.PayNow || 0) +
                   (paymentBreakdown.Member || 0) +
                   (paymentBreakdown.Credit || 0);

  const payModes = [
    { label: 'CASH', val: paymentBreakdown.Cash || 0, color: TEAL_SUCCESS },
    { label: 'CARD', val: paymentBreakdown.Card || 0, color: '#3b82f6' },
    { label: 'NETS', val: paymentBreakdown.Nets || 0, color: '#6366f1' },
    { label: 'PAYNOW', val: paymentBreakdown.PayNow || 0, color: ORANGE_HIGHLIGHT },
    { label: 'MEMBER', val: (paymentBreakdown.Member || 0) + memberPaymentsCollected, color: '#a855f7' },
    { label: 'CREDIT', val: paymentBreakdown.Credit || 0, color: RED_ALERT }
  ];
  const sortedPayModes = [...payModes].sort((a, b) => b.val - a.val);
  const bestPayMethod = sortedPayModes[0]?.label || 'CASH';

  const discGiven = totalSales - (reconciliation.totalSalesVolume || totalSales);
  const netSales = totalSales - voidAmount - cancelledAmount;
  const gstTax = reportData.totalSales?.TotalTax || 0;
  const serviceCharge = reportData.serviceCharge || reportData.totalSales?.ServiceCharge || 0;
  const roundOff = reportData.totalSales?.RoundedBy || 0;
  const creditOutstanding = reconciliation.creditOutstanding || 0;

  // ================= 1. PREMIUM HEADER SECTION =================
  const writeHeader = (pageTitle) => {
    return [
      {
        columns: [
          {
            stack: [
              { text: companyName.toUpperCase(), fontSize: 16, bold: true, color: BLUE_PRIMARY, letterSpacing: 1 },
              { text: `${companyAddress} ${companyPhone ? ' | Tel: ' + companyPhone : ''}`, fontSize: 7.5, color: SLATE_MUTED }
            ],
            width: '*'
          },
          {
            stack: [
              { text: pageTitle.toUpperCase(), fontSize: 9.5, bold: true, color: ORANGE_HIGHLIGHT, alignment: 'right' },
              { text: `Report Period: ${period} | Version 2.0`, fontSize: 7.5, bold: true, color: SLATE_DARK, alignment: 'right', margin: [0, 2, 0, 0] }
            ],
            width: 220
          }
        ],
        margin: [0, 0, 0, 10]
      },
      {
        canvas: [{ type: 'rect', x: 0, y: 0, w: 525, h: 2, color: BLUE_PRIMARY }],
        margin: [0, 0, 0, 15]
      }
    ];
  };

  // Helper to draw a summary card cell with left accent border
  const makeKpiCard = (title, value, subtitle, color) => {
    return {
      table: {
        widths: ['*'],
        body: [
          [{
            stack: [
              { text: title.toUpperCase(), fontSize: 6, bold: true, color: SLATE_MUTED, margin: [0, 0, 0, 2] },
              { text: value, fontSize: 11, bold: true, color: SLATE_DARK },
              subtitle ? { text: subtitle, fontSize: 6, color: color, margin: [0, 1, 0, 0], bold: true } : null
            ].filter(Boolean),
            fillColor: '#ffffff',
            margin: [6, 6, 6, 6],
            border: [true, false, false, false],
            borderColor: [color, null, null, null]
          }]
        ]
      },
      layout: {
        defaultBorder: false,
        vLineWidth: (i) => i === 0 ? 3.5 : 0
      },
      margin: [1, 1, 1, 1]
    };
  };

  // ==========================================
  // PAGE 1: EXECUTIVE DASHBOARD
  // ==========================================
  content.push(writeHeader('Sales Analytics Executive Dashboard'));

  // KPI Dashboard Cards Grid (5x2 Grid)
  content.push({
    table: {
      widths: ['20%', '20%', '20%', '20%', '20%'],
      body: [
        [
          makeKpiCard('Gross Sales', formatVal(totalSales), 'Gross volume', BLUE_PRIMARY),
          makeKpiCard('Net Sales', formatVal(netSales), 'After voids/cancels', TEAL_SUCCESS),
          makeKpiCard('Collections', formatVal(totalCollections), 'Actual cash settled', TEAL_SUCCESS),
          makeKpiCard('Total Orders', formatVal(totalOrders, false), 'Completed bills', BLUE_PRIMARY),
          makeKpiCard('Items Sold', formatVal(totalItems, false), 'Dishes sold', SLATE_DARK)
        ],
        [
          makeKpiCard('Credit Sales', formatVal(paymentBreakdown.Credit || 0), 'Outstanding credit', ORANGE_HIGHLIGHT),
          makeKpiCard('Member Sales', formatVal((paymentBreakdown.Member || 0) + memberPaymentsCollected), 'Wallet transactions', '#a855f7'),
          makeKpiCard('Discounts', formatVal(discGiven), 'Promo reduction', ORANGE_HIGHLIGHT),
          makeKpiCard('Cancelled Bills', formatVal(cancelledAmount), `${cancelledCount} cancelled`, RED_ALERT),
          makeKpiCard('Voided Amount', formatVal(voidAmount), `${voidQty} items voided`, RED_ALERT)
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

  // Dedicated Executive Summary Panel & Category Chart
  const summaryPanelBody = [];
  summaryPanelBody.push([
    { text: 'BUSINESS INSIGHTS & EXTRAS', fontSize: 8.5, bold: true, fillColor: BLUE_PRIMARY, color: '#fff', colSpan: 2, margin: [5, 3, 5, 3] },
    {}
  ]);
  summaryPanelBody.push([
    { text: 'Report Scope Period', fontSize: 8, color: SLATE_DARK, margin: [5, 3, 5, 3] },
    { text: period, fontSize: 8, bold: true, color: BLUE_PRIMARY, margin: [5, 3, 5, 3] }
  ]);
  summaryPanelBody.push([
    { text: 'Gross Revenue Volume', fontSize: 8, color: SLATE_DARK, margin: [5, 3, 5, 3] },
    { text: formatVal(totalSales), fontSize: 8, bold: true, color: BLUE_PRIMARY, margin: [5, 3, 5, 3] }
  ]);
  summaryPanelBody.push([
    { text: 'Net Realized Sales', fontSize: 8, color: SLATE_DARK, margin: [5, 3, 5, 3] },
    { text: formatVal(netSales), fontSize: 8, bold: true, color: TEAL_SUCCESS, margin: [5, 3, 5, 3] }
  ]);
  summaryPanelBody.push([
    { text: 'Total Settled Collections', fontSize: 8, color: SLATE_DARK, margin: [5, 3, 5, 3] },
    { text: formatVal(totalCollections), fontSize: 8, bold: true, color: TEAL_SUCCESS, margin: [5, 3, 5, 3] }
  ]);
  summaryPanelBody.push([
    { text: 'Primary Payment Channel', fontSize: 8, color: SLATE_DARK, margin: [5, 3, 5, 3] },
    { text: bestPayMethod, fontSize: 8, bold: true, color: ORANGE_HIGHLIGHT, margin: [5, 3, 5, 3] }
  ]);
  summaryPanelBody.push([
    { text: 'Top Performing Staff', fontSize: 8, color: SLATE_DARK, margin: [5, 3, 5, 3] },
    { text: topPerformStaff.toUpperCase(), fontSize: 8, bold: true, color: BLUE_PRIMARY, margin: [5, 3, 5, 3] }
  ]);
  summaryPanelBody.push([
    { text: 'Top Selling Menu Item', fontSize: 8, color: SLATE_DARK, margin: [5, 3, 5, 3] },
    { text: topSellingItem.toUpperCase(), fontSize: 8, bold: true, color: ORANGE_HIGHLIGHT, margin: [5, 3, 5, 3] }
  ]);

  content.push({
    columns: [
      {
        width: 200,
        stack: [
          {
            table: {
              widths: ['50%', '50%'],
              body: summaryPanelBody
            },
            layout: 'lightHorizontalLines',
            fillColor: '#f8fafc'
          }
        ]
      },
      {
        width: 300,
        stack: [
          { text: 'SALES BY CATEGORY MATRIX', fontSize: 8.5, bold: true, color: BLUE_PRIMARY, margin: [0, 0, 0, 4] },
          makeSalesTrendChart(categories)
        ]
      }
    ],
    columnGap: 25,
    margin: [0, 0, 0, 15]
  });

  // ==========================================
  // PAGE 2: SALES & REVENUE ANALYTICS (PAYMENT DASHBOARD)
  // ==========================================
  content.push({ text: '', pageBreak: 'before' });
  content.push(writeHeader('Sales & Revenue Channel Analytics'));

  // Payment Analytics Dashboard Table
  const paymentAnalyticsBody = [];
  paymentAnalyticsBody.push([
    { text: 'PAYMENT CHANNEL', fontSize: 8, bold: true, fillColor: BLUE_PRIMARY, color: '#fff', margin: [0, 2.5, 0, 2.5] },
    { text: 'INDICATOR', fontSize: 8, bold: true, fillColor: BLUE_PRIMARY, color: '#fff', alignment: 'center', margin: [0, 2.5, 0, 2.5] },
    { text: 'REVENUE AMOUNT', fontSize: 8, bold: true, fillColor: BLUE_PRIMARY, color: '#fff', alignment: 'right', margin: [0, 2.5, 0, 2.5] },
    { text: 'CONTRIBUTION SHARE', fontSize: 8, bold: true, fillColor: BLUE_PRIMARY, color: '#fff', margin: [0, 2.5, 0, 2.5] },
    { text: 'SHARE %', fontSize: 8, bold: true, fillColor: BLUE_PRIMARY, color: '#fff', alignment: 'right', margin: [0, 2.5, 0, 2.5] }
  ]);

  payModes.forEach((p, idx) => {
    const sharePct = rawTotal > 0 ? (p.val / rawTotal) * 100 : 0;
    paymentAnalyticsBody.push([
      { text: p.label, fontSize: 8, bold: true, color: SLATE_DARK, fillColor: idx % 2 === 1 ? BG_LIGHT : '#ffffff', margin: [0, 3, 0, 3] },
      { stack: [makeDot(p.color)], alignment: 'center', fillColor: idx % 2 === 1 ? BG_LIGHT : '#ffffff', margin: [0, 3, 0, 3] },
      { text: formatVal(p.val), fontSize: 8, bold: true, color: SLATE_DARK, alignment: 'right', fillColor: idx % 2 === 1 ? BG_LIGHT : '#ffffff', margin: [0, 3, 0, 3] },
      { stack: [makeProgressBar(sharePct, p.color)], fillColor: idx % 2 === 1 ? BG_LIGHT : '#ffffff', margin: [5, 3, 0, 3] },
      { text: `${sharePct.toFixed(1)}%`, fontSize: 8, bold: true, color: p.color, alignment: 'right', fillColor: idx % 2 === 1 ? BG_LIGHT : '#ffffff', margin: [0, 3, 0, 3] }
    ]);
  });

  const opsMetricsBody = [];
  opsMetricsBody.push([
    { text: 'OPERATIONAL EFFICIENCY INDICATOR', fontSize: 8, bold: true, fillColor: BLUE_PRIMARY, color: '#fff', margin: [0, 2.5, 0, 2.5] },
    { text: 'PERFORMANCE VALUE', fontSize: 8, bold: true, fillColor: BLUE_PRIMARY, color: '#fff', alignment: 'right', margin: [0, 2.5, 0, 2.5] }
  ]);
  opsMetricsBody.push([
    { text: 'Average Ticket Check Value', fontSize: 8, color: SLATE_DARK, margin: [0, 3.5, 0, 3.5] },
    { text: formatVal(keyMetrics.avgCheck || 0), fontSize: 8, bold: true, alignment: 'right', color: ORANGE_HIGHLIGHT, margin: [0, 3.5, 0, 3.5] }
  ]);
  opsMetricsBody.push([
    { text: 'Average Items per Bill', fontSize: 8, color: SLATE_DARK, margin: [0, 3.5, 0, 3.5] },
    { text: (Number(keyMetrics.avgItems) || 0).toFixed(1), fontSize: 8, bold: true, alignment: 'right', margin: [0, 3.5, 0, 3.5] }
  ]);
  opsMetricsBody.push([
    { text: 'Average Price per Item', fontSize: 8, color: SLATE_DARK, margin: [0, 3.5, 0, 3.5] },
    { text: formatVal(keyMetrics.perItem || 0), fontSize: 8, bold: true, alignment: 'right', margin: [0, 3.5, 0, 3.5] }
  ]);
  opsMetricsBody.push([
    { text: 'Dine-In Channel Contribution', fontSize: 8, color: SLATE_DARK, margin: [0, 3.5, 0, 3.5] },
    { text: `${(Number(orderTypes.dineInPct) || 0).toFixed(0)}%`, fontSize: 8, bold: true, alignment: 'right', color: BLUE_PRIMARY, margin: [0, 3.5, 0, 3.5] }
  ]);
  opsMetricsBody.push([
    { text: 'Takeaway Channel Contribution', fontSize: 8, color: SLATE_DARK, margin: [0, 3.5, 0, 3.5] },
    { text: `${(Number(orderTypes.takeawayPct) || 0).toFixed(0)}%`, fontSize: 8, bold: true, alignment: 'right', color: '#a855f7', margin: [0, 3.5, 0, 3.5] }
  ]);

  content.push({
    columns: [
      {
        width: 300,
        stack: [
          { text: 'PAYMENT ANALYTICS BREAKDOWN', fontSize: 8.5, bold: true, color: BLUE_PRIMARY, margin: [0, 0, 0, 4] },
          {
            table: {
              widths: ['*', 20, 65, 110, 45],
              body: paymentAnalyticsBody
            },
            layout: 'lightHorizontalLines'
          }
        ]
      },
      {
        width: 200,
        stack: [
          { text: 'OPERATIONAL KPIS', fontSize: 8.5, bold: true, color: BLUE_PRIMARY, margin: [0, 0, 0, 4] },
          {
            table: {
              widths: ['*', 'auto'],
              body: opsMetricsBody
            },
            layout: 'lightHorizontalLines'
          }
        ]
      }
    ],
    columnGap: 25,
    margin: [0, 0, 0, 15]
  });

  // ==========================================
  // PAGE 3: ITEMS, CATEGORIES & STAFF PERFORMANCE
  // ==========================================
  content.push({ text: '', pageBreak: 'before' });
  content.push(writeHeader('Items, Categories & Staff Performance'));

  // Top Performance Dashboard widgets cards
  const makePerfWidgetCard = (widgetTitle, name, valueText, color) => {
    return {
      table: {
        widths: ['*'],
        body: [
          [{
            stack: [
              { text: widgetTitle.toUpperCase(), fontSize: 6, bold: true, color: SLATE_MUTED, margin: [0, 0, 0, 2] },
              { text: name.toUpperCase(), fontSize: 8.5, bold: true, color: BLUE_PRIMARY, margin: [0, 0, 0, 2] },
              { text: valueText, fontSize: 7.5, bold: true, color: color }
            ],
            fillColor: '#ffffff',
            margin: [5, 5, 5, 5],
            border: [true, false, false, false],
            borderColor: [color, null, null, null]
          }]
        ]
      },
      layout: {
        defaultBorder: false,
        vLineWidth: (i) => i === 0 ? 3 : 0
      },
      margin: [1, 1, 1, 1]
    };
  };

  const topSellingItemDetail = sortedItems[0];
  const topCategoryDetail = categories[0];
  const topStaffDetail = sortedArtists[0];

  content.push({
    table: {
      widths: ['20%', '20%', '20%', '20%', '20%'],
      body: [
        [
          makePerfWidgetCard('Top Selling Item', topSellingItem, `${formatVal(topSellingItemDetail?.Qty || 0, false)} Qty`, ORANGE_HIGHLIGHT),
          makePerfWidgetCard('Top Category', topCategory, `${formatVal(topCategoryDetail?.Sales || 0)} Sales`, BLUE_PRIMARY),
          makePerfWidgetCard('Top Staff', topPerformStaff, `${formatVal(topStaffDetail?.ActualSales || 0)} Achieved`, TEAL_SUCCESS),
          makePerfWidgetCard('Best Pay Mode', bestPayMethod, `Highest Share`, TEAL_SUCCESS),
          makePerfWidgetCard('Best Rev Source', topCategory, `Revenue Driver`, BLUE_PRIMARY)
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

  // Top 10 Ranked Selling Items
  const rankedItemsBody = [];
  rankedItemsBody.push([
    { text: 'RANK', fontSize: 7.5, bold: true, fillColor: SLATE_DARK, color: '#fff', alignment: 'center', margin: [0, 2, 0, 2] },
    { text: 'ITEM DESCRIPTION', fontSize: 7.5, bold: true, fillColor: SLATE_DARK, color: '#fff', margin: [0, 2, 0, 2] },
    { text: 'CATEGORY GROUP', fontSize: 7.5, bold: true, fillColor: SLATE_DARK, color: '#fff', margin: [0, 2, 0, 2] },
    { text: 'QTY SOLD', fontSize: 7.5, bold: true, fillColor: SLATE_DARK, color: '#fff', alignment: 'center', margin: [0, 2, 0, 2] },
    { text: 'REVENUE', fontSize: 7.5, bold: true, fillColor: SLATE_DARK, color: '#fff', alignment: 'right', margin: [0, 2, 0, 2] },
    { text: 'CONTRIB %', fontSize: 7.5, bold: true, fillColor: SLATE_DARK, color: '#fff', alignment: 'right', margin: [0, 2, 0, 2] }
  ]);

  const top10 = sortedItems.slice(0, 10);
  if (top10.length > 0) {
    top10.forEach((i, idx) => {
      const contrib = totalSales > 0 ? (i.Sales / totalSales) * 100 : 0;
      rankedItemsBody.push([
        { text: `#${idx + 1}`, fontSize: 7.5, bold: true, alignment: 'center', fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT, margin: [0, 2.5, 0, 2.5] },
        { text: String(i.Item || '').toUpperCase(), fontSize: 7.5, bold: true, fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT, margin: [0, 2.5, 0, 2.5] },
        { text: String(i.Category || 'Unmapped').toUpperCase(), fontSize: 7.5, color: SLATE_MUTED, fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT, margin: [0, 2.5, 0, 2.5] },
        { text: formatVal(i.Qty || 0, false), fontSize: 7.5, bold: true, alignment: 'center', fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT, margin: [0, 2.5, 0, 2.5] },
        { text: formatVal(i.Sales || 0), fontSize: 7.5, bold: true, alignment: 'right', color: ORANGE_HIGHLIGHT, fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT, margin: [0, 2.5, 0, 2.5] },
        { text: `${contrib.toFixed(1)}%`, fontSize: 7.5, bold: true, color: BLUE_PRIMARY, alignment: 'right', fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT, margin: [0, 2.5, 0, 2.5] }
      ]);
    });
  } else {
    rankedItemsBody.push([
      { text: 'No itemized sales records found', colSpan: 6, alignment: 'center', fontSize: 8, italics: true },
      {}, {}, {}, {}, {}
    ]);
  }

  content.push({
    text: 'TOP RANKED SELLING ITEMS (RANKED WIDGET)',
    fontSize: 8.5,
    bold: true,
    color: BLUE_PRIMARY,
    margin: [0, 0, 0, 4]
  });

  content.push({
    table: {
      widths: [30, '*', 110, 50, 75, 55],
      body: rankedItemsBody
    },
    layout: 'lightHorizontalLines',
    margin: [0, 0, 0, 15]
  });

  // Target Achievements Table
  if (artistSales && artistSales.length > 0) {
    const artistTableBody = [];
    artistTableBody.push([
      { text: 'STAFF / ARTIST NAME', fontSize: 7.5, bold: true, fillColor: BLUE_PRIMARY, color: '#fff', margin: [0, 2, 0, 2] },
      { text: 'TARGET AMOUNT', fontSize: 7.5, bold: true, fillColor: BLUE_PRIMARY, color: '#fff', alignment: 'right', margin: [0, 2, 0, 2] },
      { text: 'ACTUAL REVENUE', fontSize: 7.5, bold: true, fillColor: BLUE_PRIMARY, color: '#fff', alignment: 'right', margin: [0, 2, 0, 2] },
      { text: 'TARGET COMPLETION', fontSize: 7.5, bold: true, fillColor: BLUE_PRIMARY, color: '#fff', margin: [0, 2, 0, 2] }
    ]);

    artistSales.forEach((a, idx) => {
      const target = Number(a.TargetAmount) || 0;
      const actual = Number(a.ActualSales) || 0;
      const pct = target > 0 ? (actual / target) * 100 : 0;
      const isTargetMet = actual >= target && target > 0;
      artistTableBody.push([
        { text: String(a.Name || '').toUpperCase(), fontSize: 7.5, bold: true, margin: [0, 2.5, 0, 2.5], fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT },
        { text: formatVal(target), fontSize: 7.5, alignment: 'right', margin: [0, 2.5, 0, 2.5], fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT },
        { text: formatVal(actual), fontSize: 7.5, bold: true, alignment: 'right', color: isTargetMet ? TEAL_SUCCESS : SLATE_DARK, margin: [0, 2.5, 0, 2.5], fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT },
        { stack: [makeProgressBar(pct, isTargetMet ? TEAL_SUCCESS : ORANGE_HIGHLIGHT)], alignment: 'left', margin: [5, 2.5, 0, 2.5], fillColor: idx % 2 === 0 ? '#ffffff' : BG_LIGHT }
      ]);
    });

    content.push({
      text: 'TARGET ACHIEVEMENTS',
      fontSize: 8.5,
      bold: true,
      color: BLUE_PRIMARY,
      margin: [0, 0, 0, 4]
    });

    content.push({
      table: {
        widths: ['*', 90, 90, 110],
        body: artistTableBody
      },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 15]
    });
  }

  // ==========================================
  // PAGE 4: FINANCIAL HEALTH & SUMMARY
  // ==========================================
  content.push({ text: '', pageBreak: 'before' });
  content.push(writeHeader('Financial Summary & Health Ledger'));

  // Financial Health Dashboard widgets (grid)
  content.push({
    table: {
      widths: ['25%', '25%', '25%', '25%'],
      body: [
        [
          makeKpiCard('Gross Sales', formatVal(totalSales), 'Gross volume', BLUE_PRIMARY),
          makeKpiCard('Net Sales', formatVal(netSales), 'After voids/cancels', TEAL_SUCCESS),
          makeKpiCard('GST (Tax)', formatVal(gstTax), 'Government tax', BLUE_PRIMARY),
          makeKpiCard('Discounts', `-${formatVal(discGiven)}`, 'Promo reduction', ORANGE_HIGHLIGHT)
        ],
        [
          makeKpiCard('Collections', formatVal(totalCollections), 'Actual cash settled', TEAL_SUCCESS),
          makeKpiCard('Credit Outstanding', formatVal(creditOutstanding), 'Unpaid ledger amount', RED_ALERT),
          makeKpiCard('Cancelled Amount', formatVal(cancelledAmount), `${cancelledCount} bills cancelled`, RED_ALERT),
          makeKpiCard('Void Amount', formatVal(voidAmount), `${voidQty} items voided`, RED_ALERT)
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

  // Detailed tables/breakdowns for Voids and Cancelled orders
  const reconciliationBody = [];
  reconciliationBody.push([
    { text: 'AUDIT COMPONENT', fontSize: 7.5, bold: true, fillColor: BLUE_PRIMARY, color: '#fff', margin: [0, 2.5, 0, 2.5] },
    { text: 'QUANTITY / COUNT', fontSize: 7.5, bold: true, alignment: 'center', fillColor: BLUE_PRIMARY, color: '#fff', margin: [0, 2.5, 0, 2.5] },
    { text: 'TOTAL AUDIT VALUE', fontSize: 7.5, bold: true, alignment: 'right', fillColor: BLUE_PRIMARY, color: '#fff', margin: [0, 2.5, 0, 2.5] }
  ]);
  reconciliationBody.push([
    { text: 'Voided Dish Quantities (Post-order modifications)', fontSize: 7.5, color: SLATE_DARK, margin: [0, 3, 0, 3] },
    { text: formatVal(voidQty, false), fontSize: 7.5, bold: true, alignment: 'center', margin: [0, 3, 0, 3] },
    { text: formatVal(voidAmount), fontSize: 7.5, bold: true, alignment: 'right', color: RED_ALERT, margin: [0, 3, 0, 3] }
  ]);
  reconciliationBody.push([
    { text: 'Cancelled Orders (Voided/Deleted entire bills)', fontSize: 7.5, color: SLATE_DARK, margin: [0, 3, 0, 3] },
    { text: formatVal(cancelledCount, false), fontSize: 7.5, bold: true, alignment: 'center', margin: [0, 3, 0, 3] },
    { text: formatVal(cancelledAmount), fontSize: 7.5, bold: true, alignment: 'right', color: RED_ALERT, margin: [0, 3, 0, 3] }
  ]);

  content.push({
    text: 'RECONCILIATION & TRANSACTION AUDITING',
    fontSize: 8.5,
    bold: true,
    color: BLUE_PRIMARY,
    margin: [0, 0, 0, 4]
  });

  content.push({
    table: {
      widths: ['*', 100, 120],
      body: reconciliationBody
    },
    layout: 'lightHorizontalLines',
    margin: [0, 0, 0, 20]
  });

  // Footer Branding Info
  content.push({
    columns: [
      { text: 'Generated by JALSA Analytics Server v2.0', fontSize: 7, color: SLATE_MUTED },
      { text: 'CONFIDENTIAL EXECUTIVE DOCUMENT - STAKEHOLDER REVIEW ONLY', fontSize: 7, color: SLATE_MUTED, alignment: 'right' }
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
    footer: function(currentPage, pageCount) {
      return {
        columns: [
          {
            text: `Report Period: ${period} | Printed: ${printedOn || new Date().toLocaleString()}`,
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
