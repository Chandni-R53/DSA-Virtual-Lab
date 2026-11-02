/* ==========================================================
   SLIDER RENDERER – draws the Sliding Window as a film strip

   The items are frames on a film strip. A glass "lens" (the window) slides along the strip.
   The item that enters flashes lime with "+ in", the item that leaves flashes red with "- out".
   A gold bracket under the strip marks the best window found so far.

   Step fields it reads (all sent by sliding_window.py):
     data        the items as text
     window      [lo, hi] the lens, or null when the window is empty
     enter/leave position that just entered / left the window (-1 = none)
     cand        position of the item being considered next   -> white dashed ring
     dup         position of the repeated item inside window  -> red ring
     best        [lo, hi] best window so far                  -> gold bracket
     best_label  text on the gold bracket
     badges      [{text, tone}] chips above the strip (tone: lime | gold | red)
     pointers    {position: "L" | "R" | "L = R"}              -> labels under the strip
   ========================================================== */
window.RENDERERS = window.RENDERERS || {};

(function () {
  const MIN_W = 600;
  const SIDE = 34;
  const CHIP_H = 40;
  const STRIP_Y = 78;
  const STRIP_H = 96;
  const FRAME_Y = STRIP_Y + 14;
  const FRAME_H = STRIP_H - 28;
  const IDX_Y = STRIP_Y + STRIP_H + 14;
  const TAG_Y = IDX_Y + 20;
  const BEST_Y = TAG_Y + 30;
  const H = BEST_Y + 52;

  const style = document.createElement('style');
  style.textContent = `
    .sw-wrap { display: flex; width: 100%; overflow-x: auto; padding: 14px 0 6px; scrollbar-width: thin; scrollbar-color: #3E3F4A transparent; }
    .sw-wrap::before, .sw-wrap::after { content: ""; margin: auto; }
    .sw-stage { position: relative; flex: 0 0 auto; height: ${H}px; }
    .sw-chips { position: absolute; top: 0; left: 0; right: 0; height: ${CHIP_H}px; display: flex; gap: 10px; justify-content: center; align-items: center; }
    .sw-chip { padding: 7px 16px; border-radius: 999px; font: 700 .9rem var(--font-mono); white-space: nowrap; border: 1px solid var(--lime); color: var(--lime); background: rgba(196, 240, 66, .08); }
    .sw-chip.gold { border-color: #F5C542; color: #F5C542; background: rgba(245, 197, 66, .08); }
    .sw-chip.red { border-color: #E5484D; color: #E5484D; background: rgba(229, 72, 77, .08); }
    .sw-strip { position: absolute; top: ${STRIP_Y}px; height: ${STRIP_H}px; border-radius: 10px; background: #101116; border: 1.5px solid #34353F; overflow: hidden; }
    .sw-strip::before, .sw-strip::after { content: ""; position: absolute; left: 0; right: 0; height: 7px;
      background: repeating-linear-gradient(90deg, #2B2C35 0 9px, transparent 9px 19px); }
    .sw-strip::before { top: 3px; } .sw-strip::after { bottom: 3px; }
    .sw-frame { position: absolute; top: ${FRAME_Y}px; height: ${FRAME_H}px; box-sizing: border-box; border-radius: 6px; background: #2A2B33; border: 1.5px solid #4A4B58;
      display: flex; align-items: center; justify-content: center; font: 700 1.2rem var(--font-mono); color: var(--ink);
      transition: background var(--vz-ms, 300ms) ease, border-color var(--vz-ms, 300ms) ease, color var(--vz-ms, 300ms) ease, box-shadow var(--vz-ms, 300ms) ease, opacity var(--vz-ms, 300ms) ease; }
    .sw-frame.sm { font-size: .8rem; }
    .sw-frame.sp { color: #8A8775; }
    .sw-frame.inw { background: #3A3C49; border-color: #6A6C7C; }
    .sw-frame.ent { background: var(--lime); border-color: var(--lime); color: #18181D; }
    .sw-frame.lea { background: #E5484D; border-color: #E5484D; color: #fff; opacity: .9; }
    .sw-frame.dup { box-shadow: 0 0 0 3px #E5484D; border-color: #E5484D; color: #FF8A8E; }
    .sw-frame.cnd { border: 2px dashed #fff; }
    .sw-lens { position: absolute; top: ${STRIP_Y - 10}px; height: ${STRIP_H + 20}px; box-sizing: border-box; border-radius: 12px; border: 3px solid var(--lime);
      background: rgba(196, 240, 66, .08); box-shadow: 0 0 22px rgba(196, 240, 66, .22); opacity: 0; pointer-events: none;
      transition: left var(--vz-ms, 300ms) ease, width var(--vz-ms, 300ms) ease, opacity var(--vz-ms, 300ms) ease; }
    .sw-lens.on { opacity: 1; }
    .sw-flag { position: absolute; top: ${STRIP_Y - 32}px; text-align: center; font: 700 .7rem var(--font-mono); letter-spacing: .04em; white-space: nowrap; opacity: 0; transition: opacity var(--vz-ms, 300ms) ease; }
    .sw-flag.in { color: var(--lime); opacity: 1; } .sw-flag.out { color: #E5484D; opacity: 1; }
    .sw-idx { position: absolute; top: ${IDX_Y}px; text-align: center; font: 500 .75rem var(--font-mono); color: #6A6A72; }
    .sw-tag { position: absolute; top: ${TAG_Y}px; text-align: center; font: 700 .75rem var(--font-mono); color: var(--lime); white-space: nowrap; }
    .sw-best { position: absolute; top: ${BEST_Y}px; height: 14px; box-sizing: border-box; border: 2px solid #F5C542; border-top: none; border-radius: 0 0 8px 8px; opacity: 0;
      transition: left var(--vz-ms, 300ms) ease, width var(--vz-ms, 300ms) ease, opacity var(--vz-ms, 300ms) ease; }
    .sw-best.on { opacity: .95; }
    .sw-best span { position: absolute; top: 16px; left: 50%; transform: translateX(-50%); white-space: nowrap; font: 700 .72rem var(--font-mono); color: #F5C542; }
    .vz-lg.win { border-color: var(--lime); background: rgba(196, 240, 66, .25); }
    .vz-lg.in { background: var(--lime); border-color: var(--lime); }
    .vz-lg.out { background: #E5484D; border-color: #E5484D; }
    .vz-lg.dup { background: transparent; border: 2px solid #E5484D; }
    .vz-lg.best { background: #F5C542; border-color: #F5C542; }
    @media (prefers-reduced-motion: reduce) { .sw-frame, .sw-lens, .sw-best, .sw-flag { transition: none; } }
  `;
  document.head.appendChild(style);

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  window.RENDERERS.slider = {
    render(canvas, step) {
      const data = step.data;
      const n = data.length;
      const slot = n > 14 ? 44 : n > 10 ? 52 : n > 7 ? 62 : 72;
      const sm = slot < 56 || data.some((d) => d.length > 3);
      const W = Math.max(n * slot + SIDE * 2, MIN_W);
      const X0 = (W - n * slot) / 2;
      const win = step.window;
      const inWin = (p) => win && p >= win[0] && p <= win[1];

      let wrap = canvas.firstChild;
      if (!wrap || !wrap.classList || !wrap.classList.contains('sw-wrap') || wrap.dataset.n !== String(n)) {
        let html = `<div class="sw-wrap" data-n="${n}"><div class="sw-stage" style="width:${W}px"><div class="sw-chips"></div>` +
          `<div class="sw-strip" style="left:${X0 - 10}px;width:${n * slot + 20}px"></div>`;
        for (let p = 0; p < n; p++) {
          const x = X0 + p * slot;
          html += `<div class="sw-frame" style="left:${x + 4}px;width:${slot - 8}px"></div>` +
                  `<div class="sw-flag" style="left:${x - 6}px;width:${slot + 12}px"></div>` +
                  `<div class="sw-idx" style="left:${x}px;width:${slot}px">${p}</div>` +
                  `<div class="sw-tag" style="left:${x - 6}px;width:${slot + 12}px"></div>`;
        }
        html += '<div class="sw-lens"></div><div class="sw-best"><span></span></div></div></div>';
        canvas.innerHTML = html;
        wrap = canvas.firstChild;
      }
      const stage = wrap.firstChild;

      // chips
      stage.querySelector('.sw-chips').innerHTML = (step.badges || [])
        .map((b) => `<span class="sw-chip ${b.tone === 'gold' ? 'gold' : b.tone === 'red' ? 'red' : ''}">${esc(b.text)}</span>`).join('');

      // frames
      const frames = stage.querySelectorAll('.sw-frame');
      const flags = stage.querySelectorAll('.sw-flag');
      const tags = stage.querySelectorAll('.sw-tag');
      const ptr = step.pointers || {};
      for (let p = 0; p < n; p++) {
        const ch = data[p];
        frames[p].textContent = ch === ' ' ? '␣' : ch;
        frames[p].className = 'sw-frame' + (sm ? ' sm' : '') + (ch === ' ' ? ' sp' : '') + (inWin(p) ? ' inw' : '') +
          (p === step.enter ? ' ent' : '') + (p === step.leave ? ' lea' : '') + (p === step.dup ? ' dup' : '') + (p === step.cand ? ' cnd' : '');
        flags[p].className = 'sw-flag' + (p === step.enter ? ' in' : p === step.leave ? ' out' : '');
        flags[p].textContent = p === step.enter ? '+ in' : p === step.leave ? '- out' : '';
        tags[p].textContent = ptr[p] || '';
      }

      // the lens (the window)
      const lens = stage.querySelector('.sw-lens');
      if (win) {
        lens.style.left = (X0 + win[0] * slot + 1) + 'px';
        lens.style.width = ((win[1] - win[0] + 1) * slot - 2) + 'px';
        lens.classList.add('on');
      } else lens.classList.remove('on');

      // gold bracket for the best window
      const best = stage.querySelector('.sw-best');
      if (step.best) {
        best.style.left = (X0 + step.best[0] * slot + 4) + 'px';
        best.style.width = ((step.best[1] - step.best[0] + 1) * slot - 8) + 'px';
        best.firstChild.textContent = step.best_label || 'best';
        best.classList.add('on');
      } else best.classList.remove('on');

      const focus = win ? win[1] : -1;
      if (focus >= 0 && wrap.scrollWidth > wrap.clientWidth) {
        wrap.scrollTo({ left: X0 + focus * slot - wrap.clientWidth / 2 + slot / 2, behavior: 'smooth' });
      }
    }
  };
})();