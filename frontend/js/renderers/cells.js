/* ==========================================================
   CELLS RENDERER – draws a row of boxes (array / search / later: stack, queue)

   Rule: a renderer only DRAWS one step. It knows nothing about the algorithm.
   The boxes are created once and then only their classes change,
   which is what lets the CSS transitions animate smoothly.

   Step fields it reads: data, current, checked, found, missing
   Optional: pointers {index: "L M R"} – custom labels above boxes (Binary Search). Without it, 'i ▼' is used.
   ========================================================== */
window.RENDERERS = window.RENDERERS || {};

window.RENDERERS.cells = {
  render(canvas, step) {
    const n = step.data.length;
    const small = n > 10;                       // many numbers -> slightly smaller boxes

    // (Re)build the boxes only if the array changed
    let row = canvas.firstChild;
    if (!row || row.children.length !== n || row.dataset.small !== String(small)) {
      canvas.innerHTML = '<div class="vz-cells"></div>';
      row = canvas.firstChild;
      row.dataset.small = String(small);
      for (let i = 0; i < n; i++) {
        row.insertAdjacentHTML('beforeend',
          `<div class="vz-cell${small ? ' sm' : ''}"><span class="vz-ptr"></span><div class="vz-box"></div><span class="vz-idx">${i}</span></div>`);
      }
    }

    for (let i = 0; i < n; i++) {
      const cell = row.children[i];
      const isFound = i === step.found;
      const isCurrent = i === step.current && !isFound;
      const isChecked = !isFound && !isCurrent && !step.missing && step.checked.indexOf(i) >= 0;

      cell.className = 'vz-cell' + (small ? ' sm' : '') +
        (isCurrent ? ' is-current' : '') +
        (isChecked ? ' is-checked' : '') +
        (isFound ? ' is-found' : '') +
        (step.missing ? ' is-missing' : '');
      // pointer above the box: custom labels if the algorithm sent them, else 'i ▼' on the current box
      const label = step.pointers ? (step.pointers[i] || '') : (isCurrent ? 'i ▼' : '');
      cell.children[0].textContent = isFound ? 'found' : label;
      cell.children[1].textContent = step.data[i];
    }

    // Keep the box being looked at in view when the row has to scroll sideways
    const focusIndex = step.found >= 0 ? step.found : step.current;
    if (focusIndex >= 0 && row.scrollWidth > row.clientWidth) {
      const cell = row.children[focusIndex];
      row.scrollTo({ left: cell.offsetLeft - row.clientWidth / 2 + cell.offsetWidth / 2, behavior: 'smooth' });
    }
  }
};