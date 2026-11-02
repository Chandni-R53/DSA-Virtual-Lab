/* ==========================================================
   LETTERS RENDERER – draws a string as a row of letter keys (Strings)

   Each character is a keycap. Reversed characters slide to their new place. When looking for a
   word, a second row of word tiles slides along under the text, turning green or red as the
   characters are compared.

   Step fields it reads (all sent by strings.py):
     data, ids   the characters, and the identity of each (so it can slide)
     active      positions being looked at              -> lime ring, lifted
     match       positions that matched / were counted  -> lime
     mismatch    positions that did not match           -> red
     swapping    two positions just swapped             -> amber
     done        positions in their final place         -> dark green
     dim         ignored positions (spaces, symbols)    -> faded
     window      [lo, hi] part the word is lined up with -> dashed frame
     pattern     {chars, offset, ok, bad, gone?} the word row (Find)
     badge       {text, tone} the counter chip (Count)
     pointers    {position: "i"}                        -> labels under the characters
   ========================================================== */
window.RENDERERS = window.RENDERERS || {};

(function () {
  const SIDE = 30;
  const MIN_W = 560;
  const BADGE_Y = 0;
  const TILE_Y = 58;
  const TILE_H = 64;
  const IDX_Y = TILE_Y + TILE_H + 12;
  const TAG_Y = IDX_Y + 22;
  const PAT_Y = TAG_Y + 34;
  const PAT_H = 54;
  const H_TEXT = TAG_Y + 30;
  const H_FIND = PAT_Y + PAT_H + 18;

  const style = document.createElement('style');
  style.textContent = `
    .lt-wrap { display: flex; width: 100%; overflow-x: auto; padding: 14px 0 6px; scrollbar-width: thin; scrollbar-color: #3E3F4A transparent; }
    .lt-wrap::before, .lt-wrap::after { content: ""; margin: auto; }
    .lt-stage { position: relative; flex: 0 0 auto; }
    .lt-badge { position: absolute; top: ${BADGE_Y}px; left: 50%; transform: translateX(-50%); padding: 7px 18px; border-radius: 999px;
      font: 700 .95rem var(--font-mono); border: 1px solid var(--lime); color: var(--lime); background: rgba(196, 240, 66, .08); opacity: 0; white-space: nowrap;
      transition: opacity var(--vz-ms, 300ms) ease; }
    .lt-badge.on { opacity: 1; }
    .lt-badge.red { border-color: #E5484D; color: #E5484D; background: rgba(229, 72, 77, .08); }
    .lt-win { position: absolute; top: ${TILE_Y - 9}px; height: ${TILE_H + 18}px; border: 2px dashed var(--lime); border-radius: 12px; opacity: 0; pointer-events: none;
      transition: left var(--vz-ms, 300ms) ease, width var(--vz-ms, 300ms) ease, opacity var(--vz-ms, 300ms) ease; }
    .lt-win.on { opacity: .8; }
    .lt-key { position: absolute; top: ${TILE_Y}px; height: ${TILE_H}px; border-radius: 9px; box-sizing: border-box;
      background: linear-gradient(#F1EFE3, #DEDBC9); border: 1px solid #BDBAA6; border-bottom: 5px solid #A29F8A; color: #18181D;
      display: flex; align-items: center; justify-content: center; font: 700 1.45rem var(--font-mono);
      transition: left var(--vz-ms, 300ms) ease, top var(--vz-ms, 300ms) ease, background var(--vz-ms, 300ms) ease, border-color var(--vz-ms, 300ms) ease,
                  box-shadow var(--vz-ms, 300ms) ease, color var(--vz-ms, 300ms) ease, opacity var(--vz-ms, 300ms) ease; }
    .lt-key.sm { font-size: 1.05rem; }
    .lt-key.sp { color: #8A8775; font-size: 1rem; }
    .lt-key.act { top: ${TILE_Y - 8}px; box-shadow: 0 0 0 3px var(--lime), 0 10px 18px rgba(0,0,0,.35); }
    .lt-key.mat { background: var(--lime); border-color: #A9CB36; border-bottom-color: #7E9A22; }
    .lt-key.mis { background: #E5484D; border-color: #C23A3F; border-bottom-color: #8F2A2E; color: #fff; }
    .lt-key.swp { background: #F5A524; border-color: #D98E14; border-bottom-color: #A66C0C; box-shadow: 0 0 0 4px rgba(245, 165, 36, .3); }
    .lt-key.fin { background: #55672B; border-color: #6C8236; border-bottom-color: #3A4A1B; color: #E8F2C8; }
    .lt-key.dim { opacity: .3; }
    .lt-idx { position: absolute; top: ${IDX_Y}px; text-align: center; font: 500 .75rem var(--font-mono); color: #6A6A72; }
    .lt-tag { position: absolute; top: ${TAG_Y}px; text-align: center; font: 600 .72rem var(--font-mono); color: var(--lime); white-space: nowrap; }
    .lt-tag.skip { color: #6A6A72; font-weight: 500; }
    .vz-lg.ign { opacity: .4; }
    .lt-pat { position: absolute; top: ${PAT_Y}px; height: ${PAT_H}px; box-sizing: border-box; border-radius: 9px; background: #2B2C4A; border: 1.5px dashed #6C6FD6;
      border-bottom-width: 4px; color: #C9CBFF; display: flex; align-items: center; justify-content: center; font: 700 1.25rem var(--font-mono);
      transition: left var(--vz-ms, 300ms) ease, background var(--vz-ms, 300ms) ease, border-color var(--vz-ms, 300ms) ease, opacity var(--vz-ms, 300ms) ease; }
    .lt-pat.sm { font-size: 1rem; }
    .lt-pat.ok { background: var(--lime); border: 1.5px solid #A9CB36; border-bottom: 4px solid #7E9A22; color: #18181D; }
    .lt-pat.bad { background: #E5484D; border: 1.5px solid #C23A3F; border-bottom: 4px solid #8F2A2E; color: #fff; }
    .lt-pat.gone { opacity: 0; }
    .lt-patlbl { position: absolute; top: ${PAT_Y - 20}px; font: 600 .62rem var(--font-mono); letter-spacing: .12em; color: #6C6FD6; transition: opacity var(--vz-ms, 300ms) ease; }
    .vz-lg.bad { background: #E5484D; border-color: #E5484D; }
    .vz-lg.swp { background: #F5A524; border-color: #F5A524; }
    .vz-lg.srt { background: #55672B; border-color: #7A9A3A; }
    @media (prefers-reduced-motion: reduce) { .lt-key, .lt-pat, .lt-win, .lt-badge { transition: none; } }
  `;
  document.head.appendChild(style);

  const show = (c) => (c === ' ' ? '␣' : c);

  window.RENDERERS.letters = {
    render(canvas, step) {
      const data = step.data;
      const ids = step.ids;
      const n = data.length;
      const pat = step.pattern || null;
      const slot = n > 14 ? 40 : n > 10 ? 48 : n > 7 ? 56 : 64;
      const gap = 8;
      const sm = slot < 50;
      const W = Math.max(n * slot + SIDE * 2, MIN_W);
      const X0 = (W - n * slot) / 2;
      const has = (arr, p) => arr && arr.indexOf(p) >= 0;
      const patKey = pat ? pat.chars.join('') : '';

      let wrap = canvas.firstChild;
      if (!wrap || !wrap.classList || !wrap.classList.contains('lt-wrap') ||
          wrap.dataset.n !== String(n) || wrap.dataset.pat !== patKey) {
        let html = `<div class="lt-wrap" data-n="${n}" data-pat="${patKey.replace(/"/g, '&quot;')}"><div class="lt-stage" style="width:${W}px">` +
                   '<div class="lt-badge"></div><div class="lt-win"></div>';
        for (let p = 0; p < n; p++) {
          const x = X0 + p * slot;
          html += `<div class="lt-idx" style="left:${x}px;width:${slot}px">${p}</div>` +
                  `<div class="lt-tag" style="left:${x - 6}px;width:${slot + 12}px"></div>`;
        }
        for (let id = 0; id < n; id++) html += `<div class="lt-key" data-id="${id}"></div>`;
        if (pat) {
          html += '<div class="lt-patlbl" style="left:' + X0 + 'px">THE WORD</div>';
          for (let k = 0; k < pat.chars.length; k++) html += `<div class="lt-pat" data-k="${k}"></div>`;
        }
        html += '</div></div>';
        canvas.innerHTML = html;
        wrap = canvas.firstChild;
      }
      const stage = wrap.firstChild;
      stage.style.height = (pat ? H_FIND : H_TEXT) + 'px';

      // counter chip
      const badge = stage.querySelector('.lt-badge');
      if (step.badge) { badge.textContent = step.badge.text; badge.className = 'lt-badge on' + (step.badge.tone === 'red' ? ' red' : ''); }
      else badge.className = 'lt-badge';

      // characters
      const keys = {};
      stage.querySelectorAll('.lt-key').forEach((k) => { keys[k.dataset.id] = k; });
      for (let p = 0; p < n; p++) {
        const k = keys[ids[p]];
        const ch = data[p];
        k.textContent = show(ch);
        k.style.left = (X0 + p * slot + gap / 2) + 'px';
        k.style.width = (slot - gap) + 'px';
        k.className = 'lt-key' + (sm ? ' sm' : '') + (ch === ' ' ? ' sp' : '') +
          (has(step.done, p) ? ' fin' : '') + (has(step.match, p) ? ' mat' : '') +
          (has(step.mismatch, p) ? ' mis' : '') + (has(step.swapping, p) ? ' swp' : '') +
          (has(step.active, p) ? ' act' : '') + (has(step.dim, p) ? ' dim' : '');
      }
      const tags = stage.querySelectorAll('.lt-tag');
      const ptr = step.pointers || {};
      for (let p = 0; p < n; p++) { tags[p].textContent = ptr[p] || ''; tags[p].className = 'lt-tag' + (ptr[p] === 'skip' ? ' skip' : ''); }

      // dashed frame around the part the word is lined up with
      const win = stage.querySelector('.lt-win');
      if (step.window) {
        win.style.left = (X0 + step.window[0] * slot - 1) + 'px';
        win.style.width = ((step.window[1] - step.window[0] + 1) * slot + 2) + 'px';
        win.classList.add('on');
      } else win.classList.remove('on');

      // the word row (Find)
      if (pat) {
        const tiles = stage.querySelectorAll('.lt-pat');
        tiles.forEach((t, k) => {
          t.textContent = show(pat.chars[k]);
          t.style.left = (X0 + (pat.offset + k) * slot + gap / 2) + 'px';
          t.style.width = (slot - gap) + 'px';
          t.className = 'lt-pat' + (sm ? ' sm' : '') + (has(pat.ok, k) ? ' ok' : '') + (pat.bad === k ? ' bad' : '') + (pat.gone ? ' gone' : '');
        });
        stage.querySelector('.lt-patlbl').style.opacity = pat.gone ? 0 : 1;
      }

      const focus = step.swapping && step.swapping.length ? step.swapping[0] :
        (step.window ? step.window[0] : (step.active && step.active.length ? step.active[0] : -1));
      if (focus >= 0 && wrap.scrollWidth > wrap.clientWidth) {
        wrap.scrollTo({ left: X0 + focus * slot - wrap.clientWidth / 2 + slot / 2, behavior: 'smooth' });
      }
    }
  };
})();