const area = document.getElementById('drop-zone'); // right-click zone
const menu = document.getElementById('ctx-menu');   // context menu element

function openMenu(x, y) {
  // convert pixels -> viewport %
  const leftVW = (x / window.innerWidth) * 100;
  const topVH  = (y / window.innerHeight) * 100;

  menu.classList.add('open');
  menu.style.left = leftVW + 'vw';
  menu.style.top  = topVH  + 'vh';

  // check if menu goes outside viewport
  const rect = menu.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    menu.style.left = ( (x - rect.width) / window.innerWidth * 100 ) + 'vw';
  }
  if (rect.bottom > window.innerHeight) {
    menu.style.top = ( (y - rect.height) / window.innerHeight * 100 ) + 'vh';
  }
}

function closeContextMenu() {
  menu.classList.remove('open');
}

area.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  openMenu(e.clientX, e.clientY);
});

document.addEventListener('mousedown', (e) => {
  if (menu.classList.contains('open') && !menu.contains(e.target)) {
    closeContextMenu();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeContextMenu();
});

window.addEventListener('resize', closeContextMenu);
