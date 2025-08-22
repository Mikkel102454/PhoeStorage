function loadContextMenu(element, contextMenu, postop, posleft) {
    let isFadingOut = false;

    element.addEventListener("contextmenu", (e) => {
        e.preventDefault();

        const newTop = postop || `${e.clientY}px`;
        const newLeft = posleft || `${e.clientX}px`;

        if (contextMenu.classList.contains("visible")) {
            // If already visible, fade it out first
            isFadingOut = true;
            contextMenu.classList.remove("visible");

            // Wait for fade-out to finish
            contextMenu.addEventListener("transitionend", function handler(event) {
                if (event.propertyName === "opacity" && isFadingOut) {
                    contextMenu.removeEventListener("transitionend", handler);
                    isFadingOut = false;

                    // Move to new position
                    contextMenu.style.top = newTop;
                    contextMenu.style.left = newLeft;

                    // Now fade it back in
                    requestAnimationFrame(() => {
                        contextMenu.classList.add("visible");
                    });
                }
            });
        } else {
            // If not visible, just show it at position
            contextMenu.style.top = newTop;
            contextMenu.style.left = newLeft;
            contextMenu.classList.add("visible");
        }
    });

    window.addEventListener("click", () => {
        disableContextMenu(contextMenu);
    });
    window.addEventListener("contextmenu", (e) => {
        if (!element.contains(e.target)) {
            disableContextMenu(contextMenu);
        }
    });

}

function disableContextMenu(element){
    element.classList.remove("visible");
}


function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

function copyToClipboard(input) {
  navigator.clipboard.writeText(input);

  throwInformation("Copied to clipboard");
}

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        closeDeleteModal()
        closeShareMenu()
        closeRenameMenu()
        closeAdminPasswordMenu()
        closeUserUpdateMenu()
        closeDeleteUserMenu()
    }
});



// Generic debounce that preserves args/this per instance
function debounce(fn, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

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
    if (el.matches('.searchInput') || el.matches('.searchInputStar')) {
        const starred = el.matches('.searchInputStar');

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
