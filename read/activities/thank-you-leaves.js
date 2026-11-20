(() => {
  'use strict';

  const activity = document.querySelector('[data-activity="thank-you-leaves"]');
  if (!activity) return;

  const storageKey = 'snackpack.read.thank-you-leaves.v1';
  const colours = ['rust', 'gold', 'red', 'brown'];
  const maxLeaves = 12;
  const form = activity.querySelector('form');
  const input = form.elements.name;
  const keep = form.elements.keep;
  const branch = activity.querySelector('.read-leaf-branch');
  const list = branch.querySelector('ul');
  const status = activity.querySelector('[role="status"]');
  const clear = activity.querySelector('[data-clear-leaves]');
  const print = activity.querySelector('[data-print-leaves]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let leaves = [];

  try {
    const saved = localStorage.getItem(storageKey);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        leaves = parsed.filter(leaf => typeof leaf?.name === 'string' &&
          leaf.name.trim() && leaf.name.length <= 40 && colours.includes(leaf.colour)).slice(-maxLeaves);
        keep.checked = true;
      }
    }
  } catch {
    // The activity still runs in memory when storage is unavailable.
  }

  function save() {
    try {
      if (keep.checked) localStorage.setItem(storageKey, JSON.stringify(leaves));
      else localStorage.removeItem(storageKey);
      return true;
    } catch {
      status.textContent = 'Your browser could not update saved leaves.';
      return false;
    }
  }

  function addLeaf(leaf) {
    const item = document.createElement('li');
    item.dataset.colour = leaf.colour;
    item.textContent = leaf.name;
    item.style.setProperty('--leaf-tilt', Math.round(Math.random() * 10 - 5) + 'deg');
    list.append(item);
  }

  function updateButtons() {
    clear.disabled = !leaves.length && !keep.checked;
    print.disabled = !leaves.length;
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const name = input.value.trim();
    if (!name) {
      status.textContent = 'Write a name to hang a leaf.';
      input.focus();
      return;
    }
    const leaf = { name, colour: form.elements.colour.value };
    if (leaves.length === maxLeaves) {
      leaves.shift();
      const oldest = list.firstElementChild;
      if (!reducedMotion.matches && typeof oldest.animate === 'function') {
        const falling = document.createElement('div');
        falling.dataset.colour = oldest.dataset.colour;
        falling.textContent = oldest.textContent;
        const bounds = oldest.getBoundingClientRect();
        const branchBounds = branch.getBoundingClientRect();
        falling.setAttribute('aria-hidden', 'true');
        falling.classList.add('read-leaf-falling');
        Object.assign(falling.style, {
          top: bounds.top - branchBounds.top + 'px',
          left: bounds.left - branchBounds.left + 'px',
          width: bounds.width + 'px'
        });
        branch.append(falling);
        const animation = falling.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(32px) rotate(12deg)' }], 300);
        animation.finished.then(() => falling.remove(), () => falling.remove());
      }
      oldest.remove();
    }
    leaves.push(leaf);
    addLeaf(leaf);
    if (!keep.checked || save()) status.textContent = 'Leaf added for ' + name;
    input.value = '';
    input.focus();
    updateButtons();
  });

  keep.addEventListener('change', () => {
    if (save()) status.textContent = keep.checked ? 'Leaves will be kept on this device.' : 'Saved leaves were removed from this device.';
    updateButtons();
  });
  clear.addEventListener('click', () => {
    leaves = [];
    list.replaceChildren();
    branch.querySelectorAll('.read-leaf-falling').forEach(leaf => leaf.remove());
    keep.checked = false;
    if (save()) status.textContent = 'Branch cleared.';
    input.focus();
    updateButtons();
  });
  print.addEventListener('click', () => {
    document.body.classList.add('read-print-branch');
    window.print();
  });
  window.addEventListener('afterprint', () => document.body.classList.remove('read-print-branch'));

  leaves.forEach(addLeaf);
  updateButtons();
  activity.querySelector('[data-leaves-controls]').hidden = false;
})();
