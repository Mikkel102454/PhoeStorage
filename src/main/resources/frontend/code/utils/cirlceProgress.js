(function () {
  function setCircleProgress(wrapper, pct) {
    if (!wrapper) return;
    pct = Math.max(0, Math.min(100, Number(pct) || 0));

    const bar = wrapper.querySelector('.c-progress__bar');
    if (!bar) return;

    // circumference from the circle's radius
    const r = bar.r.baseVal.value;
    const C = 2 * Math.PI * r;

    // initialize dash array once
    if (!bar.dataset.init) {
      bar.style.strokeDasharray = String(C);
      bar.dataset.init = '1';
    }

    // smaller offset => more visible progress
    const offset = C * (1 - pct / 100);
    bar.style.strokeDashoffset = String(offset);

    // accessibility + optional label
    const progressNode = wrapper.querySelector('.c-progress');
    if (progressNode) progressNode.setAttribute('aria-valuenow', String(Math.round(pct)));

    const label = wrapper.querySelector('.c-progress__label span');
    if (label) label.textContent = `${Math.round(pct)}%`;
  }

  function resetCircleProgress(wrapper) {
    if (!wrapper) return;
    const bar = wrapper.querySelector('.c-progress__bar');
    if (bar) {
      delete bar.dataset.init;
      bar.style.strokeDasharray = '';
      bar.style.strokeDashoffset = '';
    }
    const progressNode = wrapper.querySelector('.c-progress');
    if (progressNode) progressNode.setAttribute('aria-valuenow', '0');
    const label = wrapper.querySelector('.c-progress__label span');
    if (label) label.textContent = '0%';
  }

  // expose to global
  window.setCircleProgress = setCircleProgress;
  window.resetCircleProgress = resetCircleProgress;
})();
