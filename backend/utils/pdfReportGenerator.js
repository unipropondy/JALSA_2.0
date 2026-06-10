/**
 * Jalsa Sales Analytics — PDF Report Generator
 * Theme: White & Orange — Clean Executive Dashboard
 * Layout: 1–2 pages depending on data depth
 * Engine: pdfmake
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

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  ORANGE:       '#F97316', // Primary brand accent
  ORANGE_DARK:  '#C2410C', // Deep orange for headings
  ORANGE_SOFT:  '#FFF7ED', // Warm tinted background
  ORANGE_LIGHT: '#FFEDD5', // Card highlight strip
  WHITE:        '#FFFFFF',
  GRAY_100:     '#F9FAFB',
  GRAY_200:     '#F1F5F9',
  GRAY_400:     '#94A3B8',
  GRAY_600:     '#475569',
  GRAY_800:     '#1E293B',
  BLACK:        '#0F172A',
  GREEN:        '#16A34A',
  RED:          '#DC2626',
  BLUE:         '#2563EB'
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const fmt = (val, isCurrency = true) => {
  const n = Number(val) || 0;
  return isCurrency ? `$${n.toFixed(2)}` : String(n);
};

const pct = (part, whole) =>
  whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : '0.0%';

/** Thin horizontal divider line */
const divider = (color = C.ORANGE, marginV = 6) => ({
  canvas: [{ type: 'line', x1: 0, y1: 0, x2: 525, y2: 0, lineWidth: 1.5, lineColor: color }],
  margin: [0, marginV, 0, marginV]
});

/** Small filled progress bar */
const progressBar = (percentage, color = C.ORANGE) => {
  const W = 90;
  const filled = Math.max(0, Math.min(W, (percentage / 100) * W));
  return {
    canvas: [
      { type: 'rect', x: 0, y: 2, w: W,      h: 5, color: C.GRAY_200, r: 2 },
      filled > 0
        ? { type: 'rect', x: 0, y: 2, w: filled, h: 5, color: color, r: 2 }
        : null
    ].filter(Boolean)
  };
};

/** KPI card — left orange accent bar + value */
const kpiCard = (label, value, note, noteColor = C.ORANGE) => ({
  table: {
    widths: ['*'],
    body: [[{
      stack: [
        { text: label.toUpperCase(), fontSize: 6, bold: true, color: C.GRAY_400, margin: [0, 0, 0, 1] },
        { text: value, fontSize: 12, bold: true, color: C.BLACK },
        note ? { text: note, fontSize: 6, bold: true, color: noteColor, margin: [0, 1, 0, 0] } : null
      ].filter(Boolean),
      fillColor: C.WHITE,
      margin: [7, 6, 6, 6],
      border: [true, false, false, false],
      borderColor: [C.ORANGE, null, null, null]
    }]]
  },
  layout: { defaultBorder: false, vLineWidth: (i) => (i === 0 ? 3 : 0) },
  margin: [2, 2, 2, 2]
});

/** Section heading with left orange notch */
const sectionHeading = (text) => ({
  columns: [
    {
      canvas: [{ type: 'rect', x: 0, y: 0, w: 3, h: 12, color: C.ORANGE, r: 1 }],
      width: 8
    },
    { text: text.toUpperCase(), fontSize: 8.5, bold: true, color: C.ORANGE_DARK, width: '*' }
  ],
  margin: [0, 12, 0, 5]
});

/** Inline badge chip */
const badge = (text, bgColor, textColor = C.WHITE) => ({
  table: {
    widths: ['*'],
    body: [[{ text, fontSize: 6.5, bold: true, color: textColor, fillColor: bgColor, alignment: 'center', margin: [4, 1, 4, 1] }]]
  },
  layout: { defaultBorder: false }
});

/** Mini bar chart from category array */
const miniBarChart = (categories) => {
  const data = (categories && categories.length > 0)
    ? categories.slice(0, 6)
    : [
        { Category: 'Dine-In',   Sales: 1200 },
        { Category: 'Takeaway',  Sales: 800 },
        { Category: 'Delivery',  Sales: 600 },
        { Category: 'Beverages', Sales: 400 },
        { Category: 'Desserts',  Sales: 250 }
      ];

  const maxVal = Math.max(...data.map(c => c.Sales || 1), 1);
  const W = 300, H = 72, padL = 8, padR = 8;
  const numBars = data.length;
  const slotW = (W - padL - padR) / numBars;
  const barW = Math.min(20, slotW * 0.55);
  const shapes = [];

  // Gridlines
  [0, 1, 2, 3].forEach(i => {
    const y = 6 + i * 16;
    shapes.push({ type: 'line', x1: padL, y1: y, x2: W - padR, y2: y, lineWidth: 0.4, lineColor: C.GRAY_200 });
  });

  // Bars
  data.forEach((c, idx) => {
    const val = c.Sales || 0;
    const bH = maxVal > 0 ? (val / maxVal) * 52 : 0;
    const x  = padL + idx * slotW + (slotW - barW) / 2;
    const y  = H - 14 - bH;

    // Shadow effect (slightly wider darker bar behind)
    shapes.push({ type: 'rect', x: x + 1, y: y + 2, w: barW, h: bH, color: C.ORANGE_LIGHT, r: 3 });
    // Main bar
    shapes.push({ type: 'rect', x, y, w: barW, h: bH, color: C.ORANGE, r: 3 });
    // Value dot on top
    shapes.push({ type: 'rect', x: x + barW / 2 - 2, y: y - 3, w: 4, h: 4, color: C.ORANGE_DARK, r: 2 });
  });

  // Baseline
  shapes.push({ type: 'line', x1: padL, y1: H - 14, x2: W - padR, y2: H - 14, lineWidth: 1, lineColor: C.GRAY_400 });

  return {
    stack: [
      { canvas: shapes, height: H },
      {
        columns: data.map(c => ({
          text: String(c.Category || '').toUpperCase().substring(0, 8),
          fontSize: 5.8, color: C.GRAY_600, alignment: 'center', bold: true
        })),
        margin: [padL, 1, padR, 0]
      }
    ],
    margin: [0, 4, 0, 8]
  };
};

// ─── HEADER ───────────────────────────────────────────────────────────────────

const pageHeader = (companyName, address, phone, period, pageTitle) => ([
  {
    columns: [
      {
        stack: [
          {
            columns: [
              {
                canvas: [{ type: 'rect', x: 0, y: 0, w: 28, h: 28, color: C.ORANGE, r: 4 }],
                width: 34
              },
              {
                stack: [
                  { text: companyName.toUpperCase(), fontSize: 15, bold: true, color: C.ORANGE_DARK },
                  { text: `${address}${phone ? ' · ' + phone : ''}`, fontSize: 6.5, color: C.GRAY_400, margin: [0, 1, 0, 0] }
                ]
              }
            ]
          }
        ],
        width: '*'
      },
      {
        stack: [
          { text: pageTitle.toUpperCase(), fontSize: 8, bold: true, color: C.WHITE, alignment: 'center',
            background: C.ORANGE, margin: [6, 2, 6, 2] },
          { text: `Period: ${period}`, fontSize: 7, color: C.GRAY_600, alignment: 'right', margin: [0, 3, 0, 0] }
        ],
        width: 180
      }
    ]
  },
  divider(C.ORANGE, 8)
]);

// ─── MAIN GENERATOR ───────────────────────────────────────────────────────────

const generateSalesReportPdf = (reportData) => {
  const {
    companyName          = 'JALSA',
    companyAddress       = '1 ROCHOR CANAL ROAD, #B1-29 SIM LIM SQUARE, SINGAPORE 188504',
    companyPhone         = '',
    period               = new Date().toLocaleDateString(),
    printedOn            = new Date().toLocaleString(),
    totalSales           = 0,
    totalCollections     = 0,
    creditPaymentsCollected  = 0,
    memberPaymentsCollected  = 0,
    totalOrders          = 0,
    totalItems           = 0,
    voidQty              = 0,
    voidAmount           = 0,
    cancelledCount       = 0,
    cancelledAmount      = 0,
    paymentBreakdown     = {},
    reconciliation       = {},
    keyMetrics           = {},
    orderTypes           = {},
    categories           = [],
    items                = [],
    artistSales          = []
  } = reportData || {};

  // Derived values
  const netSales    = totalSales - voidAmount - cancelledAmount;
  const discGiven   = totalSales - (reconciliation.totalSalesVolume || totalSales);
  const gstTax      = reportData?.totalSales?.TotalTax || 0;
  const creditOut   = reconciliation.creditOutstanding || 0;

  const payModes = [
    { label: 'Cash',    val: paymentBreakdown.Cash   || 0, color: C.GREEN  },
    { label: 'Card',    val: paymentBreakdown.Card   || 0, color: C.BLUE   },
    { label: 'NETS',    val: paymentBreakdown.Nets   || 0, color: '#7C3AED'},
    { label: 'PayNow',  val: paymentBreakdown.PayNow || 0, color: C.ORANGE },
    { label: 'Member',  val: (paymentBreakdown.Member || 0) + memberPaymentsCollected, color: '#DB2777' },
    { label: 'Credit',  val: paymentBreakdown.Credit || 0, color: C.RED    }
  ];
  const rawTotal     = payModes.reduce((s, p) => s + p.val, 0);
  const bestPayMode  = [...payModes].sort((a, b) => b.val - a.val)[0]?.label || '—';

  const sortedItems   = [...items].sort((a, b) => (b.Sales || 0) - (a.Sales || 0));
  const sortedArtists = [...artistSales].sort((a, b) => (b.ActualSales || 0) - (a.ActualSales || 0));
  const topItem       = sortedItems[0]?.Item || '—';
  const topCategory   = categories[0]?.Category || '—';
  const topStaff      = sortedArtists[0]?.Name || '—';

  const needsPage2 = items.length > 0 || artistSales.length > 0;

  const content = [];

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE 1 — EXECUTIVE OVERVIEW
  // ══════════════════════════════════════════════════════════════════════════

  content.push(...pageHeader(companyName, companyAddress, companyPhone, period, 'Executive Sales Dashboard'));

  // ── ROW 1: 5-column KPI strip ──────────────────────────────────────────
  content.push({
    table: {
      widths: ['20%', '20%', '20%', '20%', '20%'],
      body: [[
        kpiCard('Gross Sales',   fmt(totalSales),          'Total revenue',       C.ORANGE),
        kpiCard('Net Sales',     fmt(netSales),             'After voids',         C.GREEN),
        kpiCard('Collections',   fmt(totalCollections),    'Cash settled',        C.GREEN),
        kpiCard('Total Orders',  fmt(totalOrders, false),  'Completed bills',     C.BLUE),
        kpiCard('Items Sold',    fmt(totalItems, false),   'Dishes served',       C.GRAY_600)
      ]]
    },
    layout: { defaultBorder: false, hLineWidth: () => 0, vLineWidth: () => 0,
              paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 },
    margin: [0, 0, 0, 4]
  });

  // ── ROW 2: second KPI strip ────────────────────────────────────────────
  content.push({
    table: {
      widths: ['20%', '20%', '20%', '20%', '20%'],
      body: [[
        kpiCard('Credit Sales',  fmt(paymentBreakdown.Credit || 0), 'Outstanding',       C.RED),
        kpiCard('Member Sales',  fmt((paymentBreakdown.Member || 0) + memberPaymentsCollected), 'Wallet txns', '#DB2777'),
        kpiCard('Discounts',     fmt(discGiven),                     'Promo reduction',   C.ORANGE),
        kpiCard('Cancelled',     fmt(cancelledAmount),               `${cancelledCount} bills`, C.RED),
        kpiCard('Voided',        fmt(voidAmount),                    `${voidQty} items`,  C.RED)
      ]]
    },
    layout: { defaultBorder: false, hLineWidth: () => 0, vLineWidth: () => 0,
              paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 },
    margin: [0, 0, 0, 14]
  });

  // ── TWO-COLUMN: Insights panel + Bar chart ─────────────────────────────
  content.push({
    columns: [
      // Left: Business Insights summary
      {
        width: 205,
        stack: [
          sectionHeading('Business Insights'),
          {
            table: {
              widths: ['*', 'auto'],
              body: [
                [
                  { text: 'INSIGHTS', fontSize: 7, bold: true, fillColor: C.ORANGE, color: C.WHITE, colSpan: 2, margin: [5, 3, 5, 3] },
                  {}
                ],
                ...([
                  ['Report Period',         { text: period,                    bold: true, color: C.ORANGE }],
                  ['Gross Revenue',         { text: fmt(totalSales),           bold: true, color: C.ORANGE }],
                  ['Net Realized Sales',    { text: fmt(netSales),             bold: true, color: C.GREEN  }],
                  ['Total Collections',     { text: fmt(totalCollections),     bold: true, color: C.GREEN  }],
                  ['Primary Pay Channel',   { text: bestPayMode,               bold: true, color: C.ORANGE }],
                  ['Top Staff',             { text: topStaff.toUpperCase(),    bold: true, color: C.BLACK  }],
                  ['Top Menu Item',         { text: topItem.toUpperCase(),     bold: true, color: C.ORANGE }],
                  ['Top Category',          { text: topCategory.toUpperCase(), bold: true, color: C.BLACK  }],
                  ['Avg Ticket Value',      { text: fmt(keyMetrics.avgCheck || 0), bold: true, color: C.ORANGE }],
                  ['Avg Items / Bill',      { text: (Number(keyMetrics.avgItems) || 0).toFixed(1), bold: true, color: C.BLACK }]
                ].map(([label, val]) => [
                  { text: label, fontSize: 7.5, color: C.GRAY_600, margin: [5, 3, 5, 3] },
                  { ...val, fontSize: 7.5, alignment: 'right', margin: [5, 3, 5, 3] }
                ]))
              ]
            },
            layout: 'lightHorizontalLines',
            fillColor: C.GRAY_100
          }
        ]
      },
      // Right: Category bar chart + Payment breakdown
      {
        width: '*',
        stack: [
          sectionHeading('Sales by Category'),
          miniBarChart(categories),
          sectionHeading('Payment Channel Breakdown'),
          {
            table: {
              widths: ['*', 45, 90, 35],
              body: [
                [
                  { text: 'Channel',   fontSize: 7, bold: true, fillColor: C.ORANGE, color: C.WHITE, margin: [4, 2.5, 4, 2.5] },
                  { text: 'Amount',    fontSize: 7, bold: true, fillColor: C.ORANGE, color: C.WHITE, alignment: 'right', margin: [4, 2.5, 4, 2.5] },
                  { text: 'Share',     fontSize: 7, bold: true, fillColor: C.ORANGE, color: C.WHITE, margin: [4, 2.5, 4, 2.5] },
                  { text: '%',         fontSize: 7, bold: true, fillColor: C.ORANGE, color: C.WHITE, alignment: 'right', margin: [4, 2.5, 4, 2.5] }
                ],
                ...payModes.map((p, i) => {
                  const share = rawTotal > 0 ? (p.val / rawTotal) * 100 : 0;
                  const bg = i % 2 === 0 ? C.WHITE : C.GRAY_100;
                  return [
                    { text: p.label, fontSize: 7, bold: true, color: C.BLACK, fillColor: bg, margin: [4, 2.5, 4, 2.5] },
                    { text: fmt(p.val), fontSize: 7, bold: true, alignment: 'right', color: p.color, fillColor: bg, margin: [4, 2.5, 4, 2.5] },
                    { stack: [progressBar(share, p.color)], fillColor: bg, margin: [4, 2.5, 4, 2.5] },
                    { text: `${share.toFixed(1)}%`, fontSize: 7, bold: true, alignment: 'right', color: p.color, fillColor: bg, margin: [4, 2.5, 4, 2.5] }
                  ];
                })
              ]
            },
            layout: 'lightHorizontalLines'
          }
        ]
      }
    ],
    columnGap: 20
  });

  // ── Ops KPIs strip ────────────────────────────────────────────────────
  content.push({
    columns: [
      kpiCard('Avg Ticket',      fmt(keyMetrics.avgCheck || 0),                            'Per bill',   C.ORANGE),
      kpiCard('Avg Item Price',  fmt(keyMetrics.perItem  || 0),                            'Per dish',   C.ORANGE),
      kpiCard('Avg Items/Bill',  (Number(keyMetrics.avgItems) || 0).toFixed(1),            'Items',      C.GRAY_600),
      kpiCard('Dine-In Share',   `${(Number(orderTypes.dineInPct)   || 0).toFixed(0)}%`,  'Channel',    C.BLUE),
      kpiCard('Takeaway Share',  `${(Number(orderTypes.takeawayPct) || 0).toFixed(0)}%`,  'Channel',    '#DB2777')
    ],
    margin: [0, 14, 0, 0]
  });

  // ── Reconciliation row ─────────────────────────────────────────────────
  content.push(sectionHeading('Reconciliation Snapshot'));
  content.push({
    table: {
      widths: ['*', 80, 80, 80, 80],
      body: [
        [
          { text: 'Metric',             fontSize: 7, bold: true, fillColor: C.ORANGE, color: C.WHITE, margin: [4, 2.5, 4, 2.5] },
          { text: 'Gross Sales',        fontSize: 7, bold: true, fillColor: C.ORANGE, color: C.WHITE, alignment: 'right', margin: [4, 2.5, 4, 2.5] },
          { text: 'Voids',              fontSize: 7, bold: true, fillColor: C.ORANGE, color: C.WHITE, alignment: 'right', margin: [4, 2.5, 4, 2.5] },
          { text: 'Cancellations',      fontSize: 7, bold: true, fillColor: C.ORANGE, color: C.WHITE, alignment: 'right', margin: [4, 2.5, 4, 2.5] },
          { text: 'Net Realized',       fontSize: 7, bold: true, fillColor: C.ORANGE, color: C.WHITE, alignment: 'right', margin: [4, 2.5, 4, 2.5] }
        ],
        [
          { text: 'Current Period',     fontSize: 7.5, color: C.GRAY_600, margin: [4, 3, 4, 3] },
          { text: fmt(totalSales),      fontSize: 7.5, bold: true, alignment: 'right', color: C.BLACK,  margin: [4, 3, 4, 3] },
          { text: `−${fmt(voidAmount)}`,      fontSize: 7.5, bold: true, alignment: 'right', color: C.RED,   margin: [4, 3, 4, 3] },
          { text: `−${fmt(cancelledAmount)}`, fontSize: 7.5, bold: true, alignment: 'right', color: C.RED,   margin: [4, 3, 4, 3] },
          { text: fmt(netSales),        fontSize: 7.5, bold: true, alignment: 'right', color: C.GREEN,  margin: [4, 3, 4, 3] }
        ]
      ]
    },
    layout: 'lightHorizontalLines',
    margin: [0, 0, 0, 6]
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE 2 — ITEM RANKINGS & STAFF PERFORMANCE  (only if data exists)
  // ══════════════════════════════════════════════════════════════════════════

  if (needsPage2) {
    content.push({ text: '', pageBreak: 'before' });
    content.push(...pageHeader(companyName, companyAddress, companyPhone, period, 'Menu & Staff Performance'));

    // ── Top Performer badges row ──────────────────────────────────────────
    content.push({
      table: {
        widths: ['33.3%', '33.3%', '33.3%'],
        body: [[
          {
            stack: [
              { text: '🏆  TOP MENU ITEM', fontSize: 6.5, bold: true, color: C.GRAY_400 },
              { text: topItem.toUpperCase(), fontSize: 10, bold: true, color: C.ORANGE_DARK, margin: [0, 2, 0, 1] },
              { text: `${fmt(sortedItems[0]?.Qty || 0, false)} units · ${fmt(sortedItems[0]?.Sales || 0)}`, fontSize: 7, color: C.GRAY_600 }
            ],
            fillColor: C.ORANGE_SOFT, margin: [8, 7, 8, 7],
            border: [true, false, false, false], borderColor: [C.ORANGE, null, null, null]
          },
          {
            stack: [
              { text: '⭐  TOP CATEGORY', fontSize: 6.5, bold: true, color: C.GRAY_400 },
              { text: topCategory.toUpperCase(), fontSize: 10, bold: true, color: C.ORANGE_DARK, margin: [0, 2, 0, 1] },
              { text: `${fmt(categories[0]?.Sales || 0)} revenue`, fontSize: 7, color: C.GRAY_600 }
            ],
            fillColor: C.ORANGE_SOFT, margin: [8, 7, 8, 7],
            border: [true, false, false, false], borderColor: [C.ORANGE, null, null, null]
          },
          {
            stack: [
              { text: '👤  TOP STAFF',      fontSize: 6.5, bold: true, color: C.GRAY_400 },
              { text: topStaff.toUpperCase(), fontSize: 10, bold: true, color: C.ORANGE_DARK, margin: [0, 2, 0, 1] },
              { text: `${fmt(sortedArtists[0]?.ActualSales || 0)} achieved`, fontSize: 7, color: C.GRAY_600 }
            ],
            fillColor: C.ORANGE_SOFT, margin: [8, 7, 8, 7],
            border: [true, false, false, false], borderColor: [C.ORANGE, null, null, null]
          }
        ]]
      },
      layout: { defaultBorder: false, vLineWidth: (i) => (i === 0 || i === 1 || i === 2) ? 3 : 0 },
      margin: [0, 0, 0, 14]
    });

    // ── Top 10 Items Ranked Table ──────────────────────────────────────────
    if (sortedItems.length > 0) {
      content.push(sectionHeading('Top 10 Ranked Menu Items'));

      const itemRows = sortedItems.slice(0, 10).map((item, idx) => {
        const share = totalSales > 0 ? (item.Sales / totalSales) * 100 : 0;
        const isTop3 = idx < 3;
        const bg = idx % 2 === 0 ? C.WHITE : C.GRAY_100;
        return [
          {
            stack: [isTop3
              ? { canvas: [{ type: 'rect', x: 0, y: 0, w: 16, h: 14, color: C.ORANGE, r: 7 }], width: 20 }
              : null,
              { text: `#${idx + 1}`, fontSize: 7, bold: true, color: isTop3 ? C.ORANGE_DARK : C.GRAY_400,
                margin: isTop3 ? [-16, -11, 0, 0] : [0, 0, 0, 0], alignment: 'center' }
            ].filter(Boolean),
            fillColor: bg, margin: [2, 3, 2, 3]
          },
          { text: String(item.Item || '').toUpperCase(), fontSize: 7.5, bold: true, color: C.BLACK, fillColor: bg, margin: [3, 3, 3, 3] },
          { text: String(item.Category || 'Uncategorized').toUpperCase(), fontSize: 7, color: C.GRAY_600, fillColor: bg, margin: [3, 3, 3, 3] },
          { text: fmt(item.Qty || 0, false), fontSize: 7.5, bold: true, alignment: 'center', color: C.BLACK, fillColor: bg, margin: [3, 3, 3, 3] },
          { text: fmt(item.Sales || 0), fontSize: 7.5, bold: true, alignment: 'right', color: C.ORANGE, fillColor: bg, margin: [3, 3, 3, 3] },
          { stack: [progressBar(share, C.ORANGE)], fillColor: bg, margin: [5, 3, 3, 3] },
          { text: `${share.toFixed(1)}%`, fontSize: 7, bold: true, alignment: 'right', color: C.ORANGE_DARK, fillColor: bg, margin: [3, 3, 3, 3] }
        ];
      });

      content.push({
        table: {
          widths: [22, '*', 110, 40, 65, 70, 38],
          body: [
            [
              { text: '#',         fontSize: 7, bold: true, fillColor: C.ORANGE_DARK, color: C.WHITE, alignment: 'center', margin: [2, 2.5, 2, 2.5] },
              { text: 'Item',      fontSize: 7, bold: true, fillColor: C.ORANGE_DARK, color: C.WHITE, margin: [3, 2.5, 3, 2.5] },
              { text: 'Category',  fontSize: 7, bold: true, fillColor: C.ORANGE_DARK, color: C.WHITE, margin: [3, 2.5, 3, 2.5] },
              { text: 'Qty',       fontSize: 7, bold: true, fillColor: C.ORANGE_DARK, color: C.WHITE, alignment: 'center', margin: [3, 2.5, 3, 2.5] },
              { text: 'Revenue',   fontSize: 7, bold: true, fillColor: C.ORANGE_DARK, color: C.WHITE, alignment: 'right', margin: [3, 2.5, 3, 2.5] },
              { text: 'Share',     fontSize: 7, bold: true, fillColor: C.ORANGE_DARK, color: C.WHITE, margin: [3, 2.5, 3, 2.5] },
              { text: '%',         fontSize: 7, bold: true, fillColor: C.ORANGE_DARK, color: C.WHITE, alignment: 'right', margin: [3, 2.5, 3, 2.5] }
            ],
            ...itemRows
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 14]
      });
    }

    // ── Staff Target Achievements ──────────────────────────────────────────
    if (artistSales.length > 0) {
      content.push(sectionHeading('Staff Target Achievements'));

      const staffRows = sortedArtists.map((a, idx) => {
        const target = Number(a.TargetAmount) || 0;
        const actual = Number(a.ActualSales)  || 0;
        const achieved = target > 0 ? (actual / target) * 100 : 0;
        const met = actual >= target && target > 0;
        const bg = idx % 2 === 0 ? C.WHITE : C.GRAY_100;
        return [
          { text: String(a.Name || '').toUpperCase(), fontSize: 7.5, bold: true, color: C.BLACK, fillColor: bg, margin: [4, 3, 4, 3] },
          { text: fmt(target), fontSize: 7.5, alignment: 'right', color: C.GRAY_600, fillColor: bg, margin: [4, 3, 4, 3] },
          { text: fmt(actual), fontSize: 7.5, bold: true, alignment: 'right', color: met ? C.GREEN : C.ORANGE, fillColor: bg, margin: [4, 3, 4, 3] },
          { stack: [progressBar(achieved, met ? C.GREEN : C.ORANGE)], fillColor: bg, margin: [6, 3, 4, 3] },
          { text: `${achieved.toFixed(0)}%`, fontSize: 7.5, bold: true, alignment: 'right', color: met ? C.GREEN : C.ORANGE, fillColor: bg, margin: [4, 3, 4, 3] },
          {
            stack: [met
              ? { text: '✓ MET', fontSize: 6, bold: true, color: C.GREEN }
              : { text: '↗ IN PROGRESS', fontSize: 6, bold: true, color: C.ORANGE }
            ],
            fillColor: bg, margin: [4, 3, 4, 3]
          }
        ];
      });

      content.push({
        table: {
          widths: ['*', 75, 75, 100, 40, 70],
          body: [
            [
              { text: 'Staff Name',  fontSize: 7, bold: true, fillColor: C.ORANGE_DARK, color: C.WHITE, margin: [4, 2.5, 4, 2.5] },
              { text: 'Target',      fontSize: 7, bold: true, fillColor: C.ORANGE_DARK, color: C.WHITE, alignment: 'right', margin: [4, 2.5, 4, 2.5] },
              { text: 'Achieved',    fontSize: 7, bold: true, fillColor: C.ORANGE_DARK, color: C.WHITE, alignment: 'right', margin: [4, 2.5, 4, 2.5] },
              { text: 'Progress',    fontSize: 7, bold: true, fillColor: C.ORANGE_DARK, color: C.WHITE, margin: [4, 2.5, 4, 2.5] },
              { text: '%',           fontSize: 7, bold: true, fillColor: C.ORANGE_DARK, color: C.WHITE, alignment: 'right', margin: [4, 2.5, 4, 2.5] },
              { text: 'Status',      fontSize: 7, bold: true, fillColor: C.ORANGE_DARK, color: C.WHITE, margin: [4, 2.5, 4, 2.5] }
            ],
            ...staffRows
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 14]
      });
    }

    // ── Financial Ledger footer strip ─────────────────────────────────────
    content.push(sectionHeading('Financial Health Ledger'));
    content.push({
      table: {
        widths: ['25%', '25%', '25%', '25%'],
        body: [[
          kpiCard('GST / Tax',          fmt(gstTax),       'Collected tax',     C.BLUE),
          kpiCard('Credit Outstanding', fmt(creditOut),    'Unpaid ledger',     C.RED),
          kpiCard('Total Voids',        fmt(voidAmount),   `${voidQty} items`,  C.RED),
          kpiCard('Net Collections',    fmt(totalCollections), 'Cash in hand',  C.GREEN)
        ]]
      },
      layout: { defaultBorder: false, hLineWidth: () => 0, vLineWidth: () => 0,
                paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 },
      margin: [0, 0, 0, 6]
    });
  }

  // ── Global Footer branding ────────────────────────────────────────────
  content.push(divider(C.GRAY_200, 14));
  content.push({
    columns: [
      { text: `Generated by ${companyName} Analytics · ${printedOn}`, fontSize: 6.5, color: C.GRAY_400 },
      { text: 'CONFIDENTIAL — MANAGEMENT USE ONLY', fontSize: 6.5, color: C.GRAY_400, alignment: 'right' }
    ]
  });

  // ── Document Definition ───────────────────────────────────────────────
  return {
    content,
    pageSize: 'A4',
    pageMargins: [36, 36, 36, 48],
    defaultStyle: { font: 'Roboto', fontSize: 8.5, lineHeight: 1.3 },
    footer: (currentPage, pageCount) => ({
      columns: [
        { text: `${companyName} · Period: ${period}`, fontSize: 7, color: C.GRAY_400, margin: [36, 10, 0, 0] },
        { text: `Page ${currentPage} of ${pageCount}`, fontSize: 7, color: C.ORANGE, bold: true, alignment: 'right', margin: [0, 10, 36, 0] }
      ]
    })
  };
};

// ─── PDF BINARY HELPER ────────────────────────────────────────────────────────

const createPdfBinary = (docDefinition) =>
  new Promise((resolve, reject) => {
    try {
      const doc = printer.createPdfKitDocument(docDefinition);
      const chunks = [];
      doc.on('data',  chunk => chunks.push(chunk));
      doc.on('end',   () => resolve(Buffer.concat(chunks)));
      doc.on('error', err => reject(err));
      doc.end();
    } catch (err) {
      reject(err);
    }
  });

module.exports = { generateSalesReportPdf, createPdfBinary, printer };