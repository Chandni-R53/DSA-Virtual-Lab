/* ==========================================================
   PARTITION RENDERER – draws Quick Sort

   Pillars grow from a zero line. The part being sorted is highlighted, outside it is dimmed.
   A dashed "pivot level" line runs across the part so you can SEE which pillars are
   smaller (below the line) and bigger (above it). Pillars slide to their new place on a swap.

   Step fields it reads (all sent by quick_sort.py):
     data, ids   numbers and their identity (ids[position] = original number, so they can slide)
     range       [lo, hi] part being sorted        -> bracket on top, rest is dimmed
     pivot       position of the pivot             -> blue pillar + dashed level line
     i, scanned  end of the "small" side / last checked position
     comparing   [j, pivot]                        -> lime ring on j
     swapping    two positions                     -> amber flash
     done        positions in their final place    -> dark green
     pointers    {position: "i j pivot"}           -> labels under the pillars
   ========================================================== */
window.RENDERERS = window.RENDERERS || {};

(function () {
  const TOP = 58;            // room above the pillars for the bracket
  const ZONE = 200;          // height of the pillar area
  const PAD = 26;            // room for a number label above / below a pillar
  const SIDE = 28;
  const BELOW = 92;          // index numbers + pointer labels

  const style = document.createElement('style');
  style.textContent = `
    .qs-wrap { display: flex; width: 100%; overflow-x: auto; padding: 8px 0 8px; scrollbar-width: thin; scrollbar-color: #3E3F4A transparent; }
    .qs-wrap::before, .qs-wrap::after { content: ""; margin: auto; }
    .qs-stage { position: relative; flex: 0 0 auto; }
    .qs-band { position: absolute; top: ${TOP}px; height: ${ZONE}px; border-radius: 6px; background: transparent;
      transition: background var(--vz-ms, 300ms) ease, opacity var(--vz-ms, 300ms) ease; }
    .qs-band.sml { background: rgba(196, 240, 66, .07); }
    .qs-band.big { background: rgba(167, 139, 250, .09); }
    .qs-band.pvt { background: rgba(122, 162, 247, .10); }
    .qs-band.srt { background: rgba(85, 103, 43, .20); }
    .qs-zero { position: absolute; height: 1px; background: #3E3F4A; left: ${SIDE - 10}px; right: ${SIDE - 10}px; }
    .qs-bar { position: absolute; border-radius: 4px; background: #3E3F4A; border: 1.5px solid #5A5B68;
      transition: left var(--vz-ms, 300ms) ease, height var(--vz-ms, 300ms) ease, top var(--vz-ms, 300ms) ease,
                  background var(--vz-ms, 300ms) ease, border-color var(--vz-ms, 300ms) ease,
                  box-shadow var(--vz-ms, 300ms) ease, opacity var(--vz-ms, 300ms) ease; }
    .qs-val { position: absolute; left: -8px; right: -8px; text-align: center; font: 600 .85rem var(--font-mono); color: var(--ink); white-space: nowrap; }
    .qs-bar.up .qs-val { top: -22px; } .qs-bar.down .qs-val { bottom: -22px; }
    .qs-bar.sm .qs-val { font-size: .68rem; }
    .qs-bar.sml { background: #8AB82E; border-color: var(--lime); }
    .qs-bar.big { background: #6D5BB5; border-color: #A78BFA; }
    .qs-bar.pvt { background: #7AA2F7; border-color: #7AA2F7; box-shadow: 0 0 0 4px rgba(122, 162, 247, .22); }
    .qs-bar.srt { background: #55672B; border-color: #7A9A3A; box-shadow: none; }
    .qs-bar.cmp { border: 2px solid var(--lime); box-shadow: 0 0 0 4px rgba(196, 240, 66, .25); }
    .qs-bar.swp { background: #F5A524; border-color: #F5A524; box-shadow: 0 0 0 5px rgba(245, 165, 36, .28); }
    .qs-bar.swp .qs-val { color: #F5A524; }
    .qs-bar.pvt .qs-val { color: #7AA2F7; }
    .qs-bar.dim { opacity: .3; }
    .qs-level { position: absolute; height: 0; border-top: 2px dashed #7AA2F7; opacity: 0; pointer-events: none;
      transition: top var(--vz-ms, 300ms) ease, left var(--vz-ms, 300ms) ease, width var(--vz-ms, 300ms) ease, opacity var(--vz-ms, 300ms) ease; }
    .qs-level.on { opacity: .9; }
    .qs-brk { position: absolute; top: 14px; height: 18px; border: 2px solid var(--lime); border-bottom: none; border-radius: 6px 6px 0 0; opacity: 0;
      transition: left var(--vz-ms, 300ms) ease, width var(--vz-ms, 300ms) ease, opacity var(--vz-ms, 300ms) ease; }
    .qs-brk.on { opacity: .85; }
    .qs-brk span { position: absolute; left: 50%; top: -11px; transform: translateX(-50%); padding: 0 8px; background: var(--stage-bg, #202027); color: var(--lime); font: 600 .72rem var(--font-mono); white-space: nowrap; }
    .qs-idx { position: absolute; top: ${TOP + ZONE + 8}px; text-align: center; font: 500 .75rem var(--font-mono); color: #6A6A72; }
    .qs-tag { position: absolute; top: ${TOP + ZONE + 28}px; text-align: center; font: 600 .68rem/1.25 var(--font-mono); color: var(--lime); white-space: nowrap; }
    .qs-tag b { display: block; font-weight: 600; }
    .qs-tag b.pv { color: #7AA2F7; }
    .vz-lg.sml { background: #8AB82E; border-color: var(--lime); }
    .vz-lg.big { background: #6D5BB5; border-color: #A78BFA; }
    .vz-lg.pvt { background: #7AA2F7; border-color: #7AA2F7; }
    .vz-lg.swp { background: #F5A524; border-color: #F5A524; }
    .vz-lg.srt { background: #55672B; border-color: #7A9A3A; }
    @media (prefers-reduced-motion: reduce) { .qs-bar, .qs-band, .qs-level, .qs-brk { transition: none; } }
  `;
  document.head.appendChild(style);

  window.RENDERERS.partition = {
    render(canvas, step) {
      const data = step.data;
      const n = data.length;
      const ids = step.ids || data.map((_, i) => i);
      const slot = n > 16 ? 40 : n > 12 ? 46 : n > 8 ? 54 : 64;
      const bw = slot - (n > 16 ? 10 : 14);
      const cls = n > 16 ? 'sm' : '';
      const range = step.range || null;
      const done = step.done || [];
      const comparing = step.comparing || [];
      const swapping = step.swapping || [];
      const pointers = step.pointers || {};
      const pivot = typeof step.pivot === 'number' ? step.pivot : -1;
      const W = n * slot + SIDE * 2;

      let wrap = canvas.firstChild;
      if (!wrap || !wrap.classList || !wrap.classList.contains('qs-wrap') || wrap.dataset.n !== String(n)) {
        let html = `<div class="qs-wrap" data-n="${n}"><div class="qs-stage" style="width:${W}px;height:${TOP + ZONE + BELOW}px">`;
        for (let p = 0; p < n; p++) {
          html += `<div class="qs-band" style="left:${SIDE + p * slot}px;width:${slot}px"></div>`;
          html += `<div class="qs-idx" style="left:${SIDE + p * slot}px;width:${slot}px">${p}</div>`;
          html += `<div class="qs-tag" style="left:${SIDE + p * slot - 8}px;width:${slot + 16}px"></div>`;
        }
        html += '<div class="qs-zero"></div><div class="qs-brk"><span></span></div><div class="qs-level"></div>';
        for (let id = 0; id < n; id++) html += `<div class="qs-bar" data-id="${id}"><span class="qs-val"></span></div>`;
        html += '</div></div>';
        canvas.innerHTML = html;
        wrap = canvas.firstChild;
      }
      const stage = wrap.firstChild;
      const bands = stage.querySelectorAll('.qs-band');
      const tags = stage.querySelectorAll('.qs-tag');
      const bars = {};
      stage.querySelectorAll('.qs-bar').forEach((b) => { bars[b.dataset.id] = b; });

      // one scale for all pillars; the zero line sits lower when there are negative numbers
      const top = Math.max(0, ...data);
      const bottom = Math.max(0, ...data.map((v) => -v));
      const scale = (ZONE - 2 * PAD) / ((top + bottom) || 1);
      const zeroY = TOP + PAD + top * scale;
      stage.querySelector('.qs-zero').style.top = zeroY + 'px';

      const small = (p) => range && p >= range[0] && p <= range[1] && p !== pivot && p <= step.i;
      const big = (p) => range && p >= range[0] && p <= range[1] && p !== pivot && p > step.i && p <= step.scanned;

      for (let p = 0; p < n; p++) {
        const v = data[p];
        const h = Math.max(6, Math.abs(v) * scale);
        const bar = bars[ids[p]];
        const isDone = done.indexOf(p) >= 0;
        const inRange = range && p >= range[0] && p <= range[1];
        let zone = '';
        if (isDone) zone = 'srt';
        else if (p === pivot) zone = 'pvt';
        else if (small(p)) zone = 'sml';
        else if (big(p)) zone = 'big';

        bar.className = 'qs-bar ' + cls + ' ' + (v < 0 ? 'down' : 'up') + ' ' + zone +
          (p === comparing[0] && !isDone ? ' cmp' : '') +
          (swapping.indexOf(p) >= 0 ? ' swp' : '') +
          (range && !inRange && !isDone ? ' dim' : '');
        bar.style.left = (SIDE + p * slot + (slot - bw) / 2) + 'px';
        bar.style.width = bw + 'px';
        bar.style.height = h + 'px';
        bar.style.top = (v < 0 ? zeroY : zeroY - h) + 'px';
        bar.firstChild.textContent = v;

        bands[p].className = 'qs-band ' + (zone === 'srt' ? 'srt' : inRange ? zone : '');

        const parts = pointers[p] ? String(pointers[p]).split(' ') : [];
        tags[p].innerHTML = parts.map((t) => `<b class="${t === 'pivot' ? 'pv' : ''}">${t}</b>`).join('');
      }

      // dashed level line at the pivot's value
      const level = stage.querySelector('.qs-level');
      if (range && pivot >= 0 && data[pivot] !== undefined) {
        const y = data[pivot] >= 0 ? zeroY - Math.max(6, data[pivot] * scale) : zeroY + Math.max(6, -data[pivot] * scale);
        level.style.top = y + 'px';
        level.style.left = (SIDE + range[0] * slot) + 'px';
        level.style.width = ((range[1] - range[0] + 1) * slot) + 'px';
                level.classList.add('on');
      } else level.classList.remove('on');

      // bracket over the active part
      const brk = stage.querySelector('.qs-brk');
      if (range) {
        brk.style.left = (SIDE + range[0] * slot + 4) + 'px';
        brk.style.width = ((range[1] - range[0] + 1) * slot - 8) + 'px';
        brk.firstChild.textContent = 'sorting indexes ' + range[0] + '–' + range[1] + (pivot >= 0 ? '  ·  pivot = ' + data[pivot] : '');
        brk.classList.add('on');
      } else brk.classList.remove('on');

      const focus = swapping.length ? swapping[0] : (comparing.length ? comparing[0] : (range ? range[0] : -1));
      if (focus >= 0 && wrap.scrollWidth > wrap.clientWidth) {
        wrap.scrollTo({ left: SIDE + focus * slot - wrap.clientWidth / 2 + slot / 2, behavior: 'smooth' });
      }
    }
  };
})();