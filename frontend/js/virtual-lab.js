/* ==========================================================
   Virtual Lab landing page
   1) DATA      – categories + visualizations (edit this to add topics)
   2) PREVIEWS  – tiny SVG drawings, one per visualization
   3) RENDERING – pills, cards, search
   ========================================================== */

/* ---------- 1) DATA ----------
   Each visualization: [name, previewKey]. Its id is made from the name,
   and the card links to visualizer.html?topic=<category id>&sub=<id>. */
const CATEGORIES = [
  { id: 'arrays-strings', title: 'Arrays & Strings',
    icon: 'M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM9 5v14M15 5v14',
    items: ['Arrays', 'Strings', 'Prefix Sum', 'Sliding Window', 'Two Pointers'] },
  { id: 'searching-sorting', title: 'Searching & Sorting',
    icon: 'M18 20V10M12 20V4M6 20v-6',
    items: ['Linear Search', 'Binary Search', 'Bubble Sort', 'Selection Sort', 'Insertion Sort', 'Merge Sort', 'Quick Sort'] },
  { id: 'linked-lists', title: 'Linked Lists',
    icon: 'M3 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M15 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M9 12h6',
    items: ['Traversal', 'Insertion', 'Deletion', 'Reverse Linked List'] },
  { id: 'stack-queue', title: 'Stack & Queue',
    icon: 'M5 4h14v4H5zM5 10h14v4H5zM5 16h14v4H5z',
    items: ['Push', 'Pop', 'Peek', 'Enqueue', 'Dequeue', 'Circular Queue', 'Priority Queue'] },
  { id: 'hashing', title: 'Hashing',
    icon: 'M4 9h16M4 15h16M10 3L8 21M16 3l-2 18',
    items: ['Hash Table', 'Hash Map', 'Hash Set', 'Frequency Counting'] },
  { id: 'trees', title: 'Trees',
    icon: 'M9 5a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M3 18a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M15 18a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M12 8L6 15M12 8l6 7',
    items: ['Binary Tree', 'Tree Traversal', 'Binary Search Tree', 'Heap'] },
  { id: 'graphs', title: 'Graphs',
    icon: 'M2 6a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M16 6a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M9 18a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M8 6h8M6.5 8.5l4 7M17.5 8.5l-4 7',
    items: ['Graph Representation', 'BFS', 'DFS', 'Shortest Path', 'Topological Sort'] },
  { id: 'recursion', title: 'Recursion',
    icon: 'M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15',
    items: ['Recursion Basics', 'Recursive Call Stack', 'Divide & Conquer'] },
  { id: 'greedy', title: 'Greedy',
    icon: 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M12 8l-4 4 4 4 4-4z',
    items: ['Greedy Approach', 'Activity Selection', 'Fractional Knapsack'] },
  { id: 'dynamic-programming', title: 'Dynamic Programming',
    icon: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
    items: ['Memoization', 'Tabulation', '0/1 Knapsack', 'Longest Common Subsequence'] },
  { id: 'backtracking', title: 'Backtracking',
    icon: 'M9 14L4 9l5-5M20 20v-7a4 4 0 0 0-4-4H4',
    items: ['N-Queens', 'Subsets', 'Permutations'] }
];

const DEFAULT_CATEGORY = 'arrays-strings';

/* ---------- 2) PREVIEWS ----------
   Every preview is an SVG drawn on a 300 x 100 canvas.
   Small helpers below build the common shapes. */
const svg = (inner) => `<svg viewBox="0 0 300 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${inner}</svg>`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// Row of boxes. Item: {t, tag, hot, dim} or {sep:'→'} for a connector symbol.
const C = (t, tag, hot, dim) => ({ t, tag, hot, dim });
const SEP = (sep) => ({ sep });
function row(items) {
  const GAP = 6, Y = 28, H = 34;
  const widths = items.map((i) => (i.sep ? 22 : Math.max(34, 14 + String(i.t).length * 8)));
  const total = widths.reduce((a, b) => a + b, 0) + GAP * (items.length - 1);
  let x = (300 - total) / 2, out = '';
  items.forEach((it, n) => {
    const w = widths[n], cx = x + w / 2;
    if (it.sep) {
      out += `<text class="p-txt faint" x="${cx}" y="${Y + H / 2}">${esc(it.sep)}</text>`;
    } else {
      out += `<rect class="p-box${it.hot ? ' hot' : ''}${it.dim ? ' dim' : ''}" x="${x}" y="${Y}" width="${w}" height="${H}" rx="8"/>`;
      out += `<text class="p-txt${it.hot ? ' dark' : ''}" x="${cx}" y="${Y + H / 2}">${esc(it.t)}</text>`;
      if (it.tag) out += `<text class="p-tag${it.hot ? ' hot' : ''}" x="${cx}" y="${Y + H + 16}">${esc(it.tag)}</text>`;
    }
    x += w + GAP;
  });
  return svg(out);
}

// Vertical bars. `hot` = indexes shown in lime, `gapAt` = leave a gap before this index.
function bars(list, hot, gapAt) {
  const BW = 22, G = 8, extra = gapAt === undefined ? 0 : 14;
  const total = list.length * BW + (list.length - 1) * G + extra;
  let x = (300 - total) / 2, out = '';
  list.forEach((h, i) => {
    if (i === gapAt) x += extra;
    const hh = h * 0.78;
    out += `<rect class="p-box${hot.includes(i) ? ' hot' : ''}" x="${x}" y="${92 - hh}" width="${BW}" height="${hh}" rx="3"/>`;
    x += BW + G;
  });
  return svg(out);
}

// Vertical stack of labelled blocks (first label = bottom).
function stack(labels, hotIdx) {
  const H = 20, G = 4, total = labels.length * (H + G) - G;
  let y = (100 - total) / 2 + total - H, out = '';
  labels.forEach((t, i) => {
    out += `<rect class="p-box${i === hotIdx ? ' hot' : ''}" x="85" y="${y}" width="130" height="${H}" rx="6"/>`;
    out += `<text class="p-txt${i === hotIdx ? ' dark' : ''}" x="150" y="${y + H / 2}">${esc(t)}</text>`;
    y -= H + G;
  });
  return svg(out);
}

// Table of cells. cells = rows of [text, style] where style: 'hot' | 'dim' | 'alt' | ''.
function grid(rows) {
  const cols = rows[0].length;
  const cw = Math.min(40, 250 / cols), ch = Math.min(22, 88 / rows.length), G = 3;
  const x0 = (300 - (cols * cw + (cols - 1) * G)) / 2, y0 = (100 - (rows.length * ch + (rows.length - 1) * G)) / 2;
  let out = '';
  rows.forEach((r, ri) => r.forEach(([t, st], ci) => {
    const x = x0 + ci * (cw + G), y = y0 + ri * (ch + G);
    if (st !== 'dim') out += `<rect class="p-box ${st || ''}" x="${x}" y="${y}" width="${cw}" height="${ch}" rx="4" ${st ? 'stroke-width="0"' : ''}/>`;
    if (t !== '') out += `<text class="p-txt${st === 'hot' ? ' dark' : st === 'dim' ? ' faint' : ''}" x="${x + cw / 2}" y="${y + ch / 2}">${esc(t)}</text>`;
  }));
  return svg(out);
}

// Graph / tree helpers: node(x, y, label, state) and edge(x1, y1, x2, y2, hot)
const node = (x, y, t, st, r) => {
  const cls = st === 'h' ? 'hot' : st === 'm' ? 'mid' : st === 'l' ? 'low' : '';
  return `<circle class="p-box ${cls}" cx="${x}" cy="${y}" r="${r || 12}"/>` +
    (t !== undefined && t !== '' ? `<text class="p-txt${st === 'h' || st === 'm' ? ' dark' : ''}" x="${x}" y="${y}">${esc(t)}</text>` : '');
};
const edge = (a, b, c, d, hot) => `<line class="p-edge${hot ? ' hot' : ''}" x1="${a}" y1="${b}" x2="${c}" y2="${d}"/>`;
const label = (x, y, t) => `<text class="p-txt faint" x="${x}" y="${y}">${esc(t)}</text>`;

// Shared 7-node binary tree layout (values and highlight state differ per use)
function tree7(vals, states, hotEdges) {
  const P = [[150, 18], [90, 52], [210, 52], [60, 86], [120, 86], [180, 86], [240, 86]];
  const E = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];
  let out = E.map(([a, b]) => edge(P[a][0], P[a][1], P[b][0], P[b][1], hotEdges.includes(b))).join('');
  P.forEach((p, i) => { out += node(p[0], p[1], vals[i], states[i]); });
  return svg(out);
}

// Each key = visualization name. Anything missing falls back to simple bars (see getPreview).
const PREVIEWS = {
  /* Arrays & Strings */
  'Arrays':         () => row([C(10, '0'), C(20, '1'), C(30, '2', true), C(40, '3'), C(50, '4')]),
  'Strings':        () => row([C('H', '0'), C('E', '1'), C('L', '2', true), C('L', '3'), C('O', '4')]),
  'Prefix Sum':     () => row([C(3, 'p[0]'), C(4, 'p[1]'), C(8, 'p[2]'), C(10, 'p[3]', true)]),
  'Sliding Window': () => row([C(2, '0'), C(1, 'L', true), C(5, '', true), C(1, 'R', true), C(3, '4'), C(2, '5'), C(4, '6')]),
  'Two Pointers':   () => row([C(1, 'L', true), C(2), C(4), C(6), C(8), C(11, 'R', true)]),

  /* Searching & Sorting */
  'Linear Search':  () => row([C(4, '', false, true), C(2, '', false, true), C(7, 'found', true), C(1), C(9)]),
  'Binary Search':  () => row([C(4, 'L', true), C(8), C(12), C(16, 'M', true), C(23), C(42), C(57, 'R', true)]),
  'Bubble Sort':    () => bars([35, 60, 28, 52, 44, 68, 76, 88, 100], [1, 2]),
  'Selection Sort': () => bars([20, 32, 45, 70, 60, 38, 82, 55, 90], [5]),
  'Insertion Sort': () => bars([25, 40, 55, 70, 32, 85, 62, 48, 95], [4]),
  'Merge Sort':     () => bars([30, 55, 80, 95, 20, 45, 65, 90], [3, 4], 4),
  'Quick Sort':     () => bars([40, 25, 55, 100, 70, 35, 85, 50, 60], [3]),

  /* Linked Lists */
  'Traversal':      () => row([C(10, 'head'), SEP('→'), C(20, 'curr', true), SEP('→'), C(30), SEP('→'), C('null', '', false, true)]),
  'Insertion':      () => row([C(10, 'head'), SEP('→'), C(20), SEP('→'), C(25, 'new', true), SEP('→'), C(30)]),
  'Deletion':       () => row([C(10, 'head'), SEP('→'), C(20, 'del', true, false), SEP('⇢'), C(30), SEP('→'), C('null', '', false, true)]),
  'Reverse Linked List': () => row([C('null', '', false, true), SEP('←'), C(10), SEP('←'), C(20), SEP('←'), C(30, 'head', true)]),

  /* Stack & Queue */
  'Push':           () => stack(['10', '20', '30  ← push'], 2),
  'Pop':            () => stack(['10', '20', '30  → pop'], 2),
  'Peek':           () => stack(['10', '20', '30  ← top'], 2),
  'Enqueue':        () => row([C(10, 'front'), C(20), C(30, 'rear', true), SEP('←')]),
  'Dequeue':        () => row([SEP('←'), C(10, 'front', true), C(20), C(30, 'rear')]),
  'Circular Queue': () => {
    let out = '';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
      out += node(150 + Math.cos(a) * 34, 50 + Math.sin(a) * 34, '', i < 3 ? 'h' : '', 9);
    }
    return svg(out + label(150, 50, 'mod n'));
  },
  'Priority Queue': () => svg(
    edge(150, 20, 95, 56) + edge(150, 20, 205, 56) + edge(95, 56, 65, 88) + edge(95, 56, 125, 88) +
    node(150, 20, 5, 'h') + node(95, 56, 10) + node(205, 56, 15) + node(65, 88, 20) + node(125, 88, 25)),

  /* Hashing */
  'Hash Table': () => {
    let out = edge(92, 50, 196, 63, true) + edge(92, 18, 196, 13) + edge(92, 82, 196, 88);
    [['bob', 8, ''], ['alice', 40, 'hot'], ['eve', 72, '']].forEach(([t, y, c]) => {
      out += `<rect class="p-box ${c}" x="14" y="${y}" width="78" height="20" rx="4"/><text class="p-txt${c ? ' dark' : ''}" x="53" y="${y + 10}">${t}</text>`;
    });
    [4, 29, 54, 79].forEach((y, i) => {
      out += `<rect class="p-box ${i === 2 ? 'ghost' : ''}" x="196" y="${y}" width="90" height="18" rx="4"/><text class="p-txt${i === 2 ? '' : ' faint'}" x="241" y="${y + 9}">${i}</text>`;
    });
    return svg(out);
  },
  'Hash Map':  () => row([C(95, 'alice', true), C(88, 'bob'), C(91, 'carol')]),
  'Hash Set':  () => row([SEP('{'), C(5), C(12, '', true), C(42), SEP('}')]),
  'Frequency Counting': () => row([C(1, 'b'), C(3, 'a', true), C(2, 'n')]),

  /* Trees */
  'Binary Tree':        () => tree7(['', '', '', '', '', '', ''], ['h', 'h', '', '', 'h', '', ''], [1, 4]),
  'Tree Traversal':     () => tree7([4, 2, 6, 1, 3, 5, 7], ['', 'h', '', 'h', 'h', '', ''], []),
  'Binary Search Tree': () => tree7([20, 10, 30, 5, 15, 25, 35], ['h', 'h', '', '', 'h', '', ''], [1, 4]),
  'Heap': () => svg(
    edge(150, 20, 95, 56) + edge(150, 20, 205, 56) + edge(95, 56, 65, 88) + edge(95, 56, 125, 88) +
    node(150, 20, 9, 'h') + node(95, 56, 5) + node(205, 56, 7) + node(65, 88, 2) + node(125, 88, 4)),

  /* Graphs */
  'Graph Representation': () => grid([
    [['', 'dim'], ['A', 'dim'], ['B', 'dim'], ['C', 'dim'], ['D', 'dim']],
    [['A', 'dim'], [0], [1, 'hot'], [1, 'hot'], [0]],
    [['B', 'dim'], [1, 'hot'], [0], [0], [1, 'hot']],
    [['C', 'dim'], [1, 'hot'], [0], [0], [1, 'hot']],
    [['D', 'dim'], [0], [1, 'hot'], [1, 'hot'], [0]]
  ].map((r) => r.map((c) => [c[0], c[1] || '']))),
  'BFS': () => svg(
    edge(45, 50, 115, 22) + edge(45, 50, 115, 78) + edge(115, 22, 195, 22) + edge(115, 78, 195, 78) +
    edge(195, 22, 260, 50) + edge(195, 78, 260, 50) +
    node(45, 50, 0, 'h') + node(115, 22, 1, 'm') + node(115, 78, 1, 'm') + node(195, 22, 2, 'l') + node(195, 78, 2, 'l') + node(260, 50, '')),
  'DFS': () => svg(
    edge(45, 50, 115, 22, true) + edge(45, 50, 115, 78) + edge(115, 22, 195, 22, true) + edge(115, 78, 195, 78) +
    edge(195, 22, 260, 50, true) + edge(195, 78, 260, 50) +
    node(45, 50, 1, 'h') + node(115, 22, 2, 'h') + node(115, 78, '') + node(195, 22, 3, 'h') + node(195, 78, '') + node(260, 50, 4, 'h')),
  'Shortest Path': () => svg(
    edge(40, 50, 130, 18, true) + edge(40, 50, 130, 82) + edge(130, 18, 260, 50, true) + edge(130, 82, 260, 50) +
    label(76, 24, 2) + label(76, 78, 5) + label(204, 24, 3) + label(204, 78, 1) +
    node(40, 50, 'S', 'h') + node(130, 18, 'A', 'h') + node(130, 82, 'B') + node(260, 50, 'T', 'h')),
  'Topological Sort': () => svg(
    '<defs><marker id="vlArrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7z" fill="#7A7B88"/></marker></defs>' +
    [[41, 46, 92, 27], [41, 54, 92, 73], [116, 26, 171, 45], [116, 74, 171, 55], [197, 50, 250, 50]]
      .map(([a, b, c, d]) => `<line class="p-edge" x1="${a}" y1="${b}" x2="${c}" y2="${d}" marker-end="url(#vlArrow)"/>`).join('') +
    node(30, 50, 1, 'h') + node(105, 22, 2, 'h') + node(105, 78, 3, 'h') + node(185, 50, 4) + node(265, 50, 5)),

  /* Recursion */
  'Recursion Basics':      () => row([C(3), SEP('→'), C(2), SEP('→'), C(1), SEP('→'), C(0, 'base', true)]),
  'Recursive Call Stack':  () => stack(['sum(4)', 'sum(3)', 'sum(2)', 'sum(1)'], 3),
  'Divide & Conquer': () => {
    const box = (x, y, w, t, c) => `<rect class="p-box ${c}" x="${x}" y="${y}" width="${w}" height="18" rx="4"/><text class="p-txt${c === 'hot' ? ' dark' : ''}" x="${x + w / 2}" y="${y + 9}">${t}</text>`;
    return svg(
      edge(150, 26, 90, 40) + edge(150, 26, 210, 40) + edge(90, 58, 40, 72) + edge(90, 58, 110, 72) + edge(210, 58, 190, 72) + edge(210, 58, 260, 72) +
      box(100, 8, 100, 'n', 'hot') + box(40, 40, 100, 'n/2', '') + box(160, 40, 100, 'n/2', '') +
      box(10, 72, 60, 'n/4', 'ghost') + box(80, 72, 60, 'n/4', 'ghost') + box(160, 72, 60, 'n/4', 'ghost') + box(230, 72, 60, 'n/4', 'ghost'));
  },

  /* Greedy */
  'Greedy Approach': () => row([C('25¢', '', true), SEP('+'), C('10¢'), SEP('+'), C('1¢')]),
  'Activity Selection': () => {
    const bar = (x, y, w, hot) => `<rect class="p-box ${hot ? 'hot' : ''}" x="${x}" y="${y}" width="${w}" height="14" rx="4"/>`;
    return svg(bar(10, 8, 70, 1) + bar(100, 8, 70, 1) + bar(195, 8, 85, 1) + bar(30, 30, 100) + bar(80, 52, 120) + bar(150, 74, 100));
  },
  'Fractional Knapsack': () => svg(
    [['$10', 12, 220], ['$6', 42, 220], ['$2', 72, 110]].map(([t, y, w]) =>
      label(30, y + 8, t) + `<rect class="p-box" x="60" y="${y}" width="220" height="16" rx="4"/><rect class="p-box hot" x="60" y="${y}" width="${w}" height="16" rx="4"/>`).join('')),

  /* Dynamic Programming */
  'Memoization': () => row([C(1, 'f1'), C(1, 'f2'), C(2, 'f3'), C(3, 'f4'), C(5, 'f5', true)]),
  'Tabulation': () => grid([
    [[0, 'dim'], [1, 'dim'], [2, 'dim'], [3, 'dim'], [4, 'dim']],
    [[0, ''], [1, ''], [1, ''], [2, ''], [2, '']],
    [[0, ''], [1, ''], [1, ''], [2, ''], ['?', 'hot']]
  ]),
  '0/1 Knapsack': () => grid([
    [[0, ''], [0, ''], [0, ''], [0, '']], [[0, ''], [3, ''], [3, ''], [3, '']],
    [[0, ''], [3, ''], [7, ''], [7, '']], [[0, ''], [3, ''], [7, ''], [10, 'hot']]
  ]),
  'Longest Common Subsequence': () => grid([
    [['', 'dim'], ['A', 'dim'], ['C', 'dim'], ['E', 'dim']],
    [['A', 'dim'], [1, 'hot'], [1, ''], [1, '']],
    [['C', 'dim'], [1, ''], [2, 'hot'], [2, '']],
    [['E', 'dim'], [1, ''], [2, ''], [3, 'hot']]
  ]),

  /* Backtracking */
  'N-Queens': () => {
    const q = [1, 3, 0, 2];
    return grid([0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => (q[r] === c ? ['♛', 'hot'] : ['', (r + c) % 2 ? 'alt' : '']))));
  },
  'Subsets':      () => row([C('[ ]'), C('[1]'), C('[2]'), C('[1,2]', '', true)]),
  'Permutations': () => row([C('123', '', true), C('132'), C('213'), C('231')])
};

// Fallback for any new visualization that has no drawing yet: simple bars
function getPreview(name) {
  if (PREVIEWS[name]) return PREVIEWS[name]();
  return bars([30, 55, 40, 80, 65, 90, 50], [3]);
}

/* ---------- 3) RENDERING ---------- */
const catsEl = document.getElementById('vlCats');
const gridEl = document.getElementById('vlGrid');
const headingEl = document.getElementById('vlHeading');
const emptyEl = document.getElementById('vlEmpty');
const emptyQueryEl = document.getElementById('vlEmptyQuery');
const searchEl = document.getElementById('vlSearch');
const clearEl = document.getElementById('vlSearchClear');

let selectedId = DEFAULT_CATEGORY;
let query = '';

// "Binary Search" -> "binary-search"  (used in the link to the visualizer page)
const slug = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Build the category pills. When searching, no pill is highlighted.
function renderCats() {
  catsEl.innerHTML = '';
  CATEGORIES.forEach((cat) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    const active = !query && cat.id === selectedId;
    btn.className = 'vl-cat' + (active ? ' active' : '');
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    btn.innerHTML = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${cat.icon}"/></svg><span>${esc(cat.title)}</span>`;
    btn.addEventListener('click', () => {
      selectedId = cat.id;
      setQuery('');          // picking a category leaves search mode
    });
    catsEl.appendChild(btn);
  });
}

function cardHTML(cat, name, showCat) {
  const href = `visualizer.html?topic=${cat.id}&sub=${slug(name)}`;
  return `<a class="vl-tile" href="${href}" data-topic="${cat.id}" data-sub="${slug(name)}">
    <div class="vl-stage">${getPreview(name)}</div>
    <div class="vl-tile-foot">
      <span class="vl-tile-name">${esc(name)}${showCat ? `<span class="vl-tile-cat">${esc(cat.title)}</span>` : ''}</span>
      <span class="vl-tile-go">Visualize <span aria-hidden="true">→</span></span>
    </div>
  </a>`;
}

// Draw the cards: either the selected category, or search results across all categories
function renderCards() {
  let cards = [];
  if (query) {
    const q = query.toLowerCase();
    CATEGORIES.forEach((cat) => cat.items.forEach((name) => {
      if (name.toLowerCase().includes(q)) cards.push(cardHTML(cat, name, true));
    }));
    headingEl.textContent = 'Search results';
  } else {
    const cat = CATEGORIES.find((c) => c.id === selectedId);
    cards = cat.items.map((name) => cardHTML(cat, name, false));
    headingEl.textContent = cat.title;
  }
  gridEl.innerHTML = cards.join('');
  gridEl.hidden = cards.length === 0;
  emptyEl.hidden = cards.length !== 0;
  emptyQueryEl.textContent = query;
}

function setQuery(value) {
  query = value.trim();
  searchEl.value = value;
  clearEl.hidden = value === '';   // show the × only when there is text
  renderCats();
  renderCards();
}

searchEl.addEventListener('input', () => setQuery(searchEl.value));
clearEl.addEventListener('click', () => { setQuery(''); searchEl.focus(); });
document.getElementById('vlEmptyReset').addEventListener('click', () => setQuery(''));

renderCats();
renderCards();