// Generic debounce that preserves args/this per instance
function debounce(fn, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

const debouncedMap = new WeakMap();

function getDebouncedFor(el, fn, delay) {
    if (!debouncedMap.has(el)) {
        debouncedMap.set(el, debounce(fn, delay));
    }
    return debouncedMap.get(el);
}


document.addEventListener('input', (e) => {
    const el = e.target;
    if (el.matches('#searchInput') || el.matches('#searchInputStar')) {
        const starred = el.matches('#searchInputStar');

        const debounced = getDebouncedFor(
            el,
            async (val, element, isStarred) => {
                try {
                    await search(val, element, isStarred);
                } catch (err) {
                    console.error('search failed:', err);
                }
            },
            400
        );

        debounced(el.value, el, starred); // schedules; not awaited
    }
});
