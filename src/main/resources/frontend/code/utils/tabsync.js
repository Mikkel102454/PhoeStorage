const tabs = document.querySelectorAll('[type="tab"]');

function syncTab() {
    const defaultHref = tabs[0]?.getAttribute('href') || '';
    const h = location.hash || defaultHref;

    tabs.forEach(t => t.removeAttribute('tab-current'));

    const active = Array.from(tabs).find(t => t.getAttribute('href') === h);

    if (active) {
        active.setAttribute('tab-current', 'page');
        if (!location.hash && defaultHref) history.replaceState(null, '', defaultHref);
    }
}

window.addEventListener('hashchange', syncTab);
syncTab();
