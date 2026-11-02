/* ==========================================================
   MEMORY RENDERER – draws an array as cells in computer memory (Arrays)

   A dark memory strip with one cell per position. Under every cell is its memory ADDRESS,
   above it its INDEX. Numbers are tiles that slide from cell to cell, so inserting or
   deleting shows the "shifting" for real. An address banner shows how the computer
   finds a cell: base + index x size.

   Step fields it reads (all sent by arrays.py):
     data, ids   cells (null = empty) and the identity of each number (so it can slide)
     active      positions being looked at          -> lime ring
     moving      [from, to] a number that moved     -> amber
     written     position just written              -> solid lime
     ghost       {pos, v} a number just removed     -> faded, crossed out
     formula     text shown in the address banner
     pointers    {position: "label"}                -> small labels under the address
     base, size  start address and bytes per cell
   ========================================================== */
window.RENDERERS = window.RENDERERS || {};

(function () {
  const BANNER = 54;      // address banner
  const IDX_Y = BANNER + 14;
  const CELL_Y = IDX_Y + 36;
  const CELL_H = 64;
  const ADDR_Y = CELL_Y + CELL_H + 12;
  const TAG_Y = ADDR_Y + 26;
  const H = TAG_Y + 34;
  const SIDE = 34;
  const BANNER_W = 560;    // the address banner is always this wide
  const MIN_W = 640;       // the stage is never narrower than this, so the banner always fits

  const style = document.createElement('style');
  style.textContent = `
    .mem-wrap { display: flex; width: 100%; overflow-x: auto; padding: 14px 0 6px; scrollbar-width: thin; scrollbar-color: #3E3F4A transparent; }
    .mem-wrap::before, .mem-wrap::after { content: ""; margin: auto; }
    .mem-stage { position: relative; flex: 0 0 auto; height: ${H}px; }
    .mem-banner { position: absolute; top: 0; left: 50%; width: ${BANNER_W}px; margin-left: -${BANNER_W / 2}px; height: 38px; display: flex; align-items: center; justify-content: center;
      border-radius: 10px; border: 1px dashed #3E3F4A; font: 500 .82rem var(--font-mono); color: #8E8E94; white-space: nowrap; overflow: hidden;
      transition: border-color var(--vz-ms, 300ms) ease, color var(--vz-ms, 300ms) ease, background var(--vz-ms, 300ms) ease; }
    .mem-banner.on { border: 1px solid var(--lime); color: var(--lime); background: rgba(196, 240, 66, .07); }
    .mem-strip { position: absolute; top: ${CELL_Y - 8}px; height: ${CELL_H + 16}px; border-radius: 12px; background: #1B1C22; border: 1.5px solid #3E3F4A; }
    .mem-strip::before { content: "MEMORY"; position: absolute; left: 12px; top: -9px; padding: 0 6px; background: var(--stage-bg, #202027); font: 600 .6rem var(--font-mono); letter-spacing: .12em; color: #6A6A72; }
    .mem-cell { position: absolute; top: ${CELL_Y}px; height: ${CELL_H}px; border-radius: 8px; border: 1.5px dashed #34353F; background: rgba(255,255,255,.015);
      transition: border-color var(--vz-ms, 300ms) ease, background var(--vz-ms, 300ms) ease; }
    .mem-cell.act { border: 1.5px solid var(--lime); background: rgba(196, 240, 66, .07); }
    .mem-cell.hole::after { content: "empty"; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font: 500 .62rem var(--font-mono); color: #4D4E58; letter-spacing: .08em; }
    .mem-cell.ghosted::after { content: none; }
    .mem-idx { position: absolute; top: ${IDX_Y}px; text-align: center; font: 600 .78rem var(--font-mono); color: #8E8E94; transition: color var(--vz-ms, 300ms) ease; }
    .mem-addr { position: absolute; top: ${ADDR_Y}px; text-align: center; font: 500 .7rem var(--font-mono); color: #5E5F68; transition: color var(--vz-ms, 300ms) ease; }
    .mem-idx.act, .mem-addr.act { color: var(--lime); }
    .mem-tag { position: absolute; top: ${TAG_Y}px; text-align: center; font: 600 .68rem var(--font-mono); color: var(--lime); white-space: nowrap; }
    .mem-tile { position: absolute; top: ${CELL_Y + 5}px; height: ${CELL_H - 10}px; border-radius: 7px; background: #3E3F4A; border: 1.5px solid #5A5B68;
      display: flex; align-items: center; justify-content: center; font: 700 1.05rem var(--font-mono); color: var(--ink);
      transition: left var(--vz-ms, 300ms) ease, background var(--vz-ms, 300ms) ease, border-color var(--vz-ms, 300ms) ease,
                  box-shadow var(--vz-ms, 300ms) ease, color var(--vz-ms, 300ms) ease, opacity var(--vz-ms, 300ms) ease; }
    .mem-tile.sm { font-size: .82rem; }
    .mem-tile.act { border: 2px solid var(--lime); box-shadow: 0 0 0 4px rgba(196, 240, 66, .18); }
    .mem-tile.mov { background: #F5A524; border-color: #F5A524; color: #1B1C22; box-shadow: 0 0 0 5px rgba(245, 165, 36, .26); }
    .mem-tile.wr { background: var(--lime); border-color: var(--lime); color: #1B1C22; box-shadow: 0 0 0 5px rgba(196, 240, 66, .22); }
    .mem-tile.pop { animation: mem-pop calc(var(--vz-ms, 300ms) * 1.2) ease; }
    @keyframes mem-pop { from { transform: scale(.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .mem-ghost { position: absolute; top: ${CELL_Y + 5}px; height: ${CELL_H - 10}px; border-radius: 7px; border: 1.5px dashed #E5484D; color: #E5484D; opacity: .8;
      display: flex; align-items: center; justify-content: center; font: 700 1.05rem var(--font-mono); text-decoration: line-through; background: rgba(229,72,77,.08); }
    .mem-ghost.sm { font-size: .82rem; }
    .mem-empty { position: absolute; left: 0; right: 0; top: ${CELL_Y}px; text-align: center; font: 500 .9rem var(--font-mono); color: #8E8E94; }
    .vz-lg.swp { background: #F5A524; border-color: #F5A524; }
    .vz-lg.emp { border: 1.5px dashed #5A5B68; background: transparent; }
    @media (prefers-reduced-motion: reduce) { .mem-tile, .mem-cell, .mem-banner { transition: none; } .mem-tile.pop { animation: none; } }
  `;
  document.head.appendChild(style);

  window.RENDERERS.memory = {
    render(canvas, step) {
      const data = step.data;
      const ids = step.ids;
      const n = data.length;
      const slot = n > 14 ? 46 : n > 10 ? 56 : n > 7 ? 66 : 78;
      const inset = 5;
      const sm = slot < 60;
      const active = step.active || [];
      const moving = step.moving || [];
      const pointers = step.pointers || {};
      const base = step.base, size = step.size;
      const W = Math.max(n * slot + SIDE * 2, MIN_W);
      const X0 = (W - n * slot) / 2;                  // the cells are centred inside the stage

      let wrap = canvas.firstChild;
      if (!wrap || !wrap.classList || !wrap.classList.contains('mem-wrap') || wrap.dataset.n !== String(n)) {
        let html = `<div class="mem-wrap" data-n="${n}"><div class="mem-stage" style="width:${W}px"><div class="mem-banner"></div>`;
        if (n === 0) {
          html += `<div class="mem-empty">The array is empty: it has 0 cells.</div>`;
        } else {
          html += `<div class="mem-strip" style="left:${X0 - 6}px;width:${n * slot + 12}px"></div>`;
          for (let p = 0; p < n; p++) {
            const x = X0 + p * slot;
            html += `<div class="mem-cell" style="left:${x + 2}px;width:${slot - 4}px"></div>` +
                    `<div class="mem-idx" style="left:${x}px;width:${slot}px">${p}</div>` +
                    `<div class="mem-addr" style="left:${x - 6}px;width:${slot + 12}px">${base + p * size}</div>` +
                    `<div class="mem-tag" style="left:${x - 6}px;width:${slot + 12}px"></div>`;
          }
        }
        html += '</div></div>';
        canvas.innerHTML = html;
        wrap = canvas.firstChild;
      }
      const stage = wrap.firstChild;
      const banner = stage.querySelector('.mem-banner');
      banner.textContent = step.formula || 'address of a cell  =  start + index × size';
      banner.classList.toggle('on', !!step.formula);

      const cells = stage.querySelectorAll('.mem-cell');
      const idxs = stage.querySelectorAll('.mem-idx');
      const addrs = stage.querySelectorAll('.mem-addr');
      const tags = stage.querySelectorAll('.mem-tag');

      // tiles are created and removed as numbers appear / disappear (so they can slide in between)
      const live = {};
      stage.querySelectorAll('.mem-tile').forEach((t) => { live[t.dataset.id] = t; });
      const wanted = {};
      ids.forEach((id) => { if (id !== null && id !== undefined) wanted[id] = true; });
      Object.keys(live).forEach((id) => { if (!wanted[id]) live[id].remove(); });

      for (let p = 0; p < n; p++) {
        const isAct = active.indexOf(p) >= 0;
        cells[p].className = 'mem-cell' + (isAct ? ' act' : '') + (data[p] === null ? ' hole' : '') + (step.ghost && step.ghost.pos === p ? ' ghosted' : '');
        idxs[p].className = 'mem-idx' + (isAct ? ' act' : '');
        addrs[p].className = 'mem-addr' + (isAct ? ' act' : '');
        tags[p].textContent = pointers[p] || '';

        if (data[p] === null || data[p] === undefined) continue;
        const id = ids[p];
        let tile = live[id];
        if (!tile) {
          tile = document.createElement('div');
          tile.dataset.id = id;
          tile.className = 'mem-tile';
          tile.style.left = (X0 + p * slot + inset) + 'px';
          stage.appendChild(tile);
        }
        tile.style.width = (slot - inset * 2) + 'px';
        tile.style.left = (X0 + p * slot + inset) + 'px';
        tile.textContent = data[p];
        tile.className = 'mem-tile' + (sm ? ' sm' : '') + (!live[id] && step.written === p ? ' pop' : '') +
          (isAct ? ' act' : '') + (moving[1] === p ? ' mov' : '') + (step.written === p ? ' wr' : '');
      }

      // a number that was just removed is shown faded and crossed out where it used to be
      const old = stage.querySelector('.mem-ghost');
      if (old) old.remove();
      if (step.ghost && step.ghost.pos < n) {
        const g = document.createElement('div');
        g.className = 'mem-ghost' + (sm ? ' sm' : '');
        g.style.left = (X0 + step.ghost.pos * slot + inset) + 'px';
        g.style.width = (slot - inset * 2) + 'px';
        g.textContent = step.ghost.v;
        stage.appendChild(g);
      }

      let focus = moving.length ? moving[1] : (step.written >= 0 ? step.written : (active.length ? active[0] : -1));
      if (focus >= 0 && wrap.scrollWidth > wrap.clientWidth) {
        wrap.scrollTo({ left: X0 + focus * slot - wrap.clientWidth / 2 + slot / 2, behavior: 'smooth' });
      }
    }
  };
})();