import { getBlockConfig } from '../../scripts/utils/block-config.js';

export default function decorate(block) {
  const { brand, className } = getBlockConfig(block);
  if (brand === 'toyota') {
console.log('Toyota block');
}
if (brand === 'lexus') {
console.log('Lexus block');
}



console.log(className);
  const row = block.firstElementChild;
  if (!row) return;

  const [colA, colB] = [...row.children];

  // Auto-detect which column holds the image
  const colAHasImage = !!colA.querySelector('picture');
  const imageCol = colAHasImage ? colA : colB;
  const contentCol = colAHasImage ? colB : colA;

  // Add modifier so CSS knows text side
  block.classList.add(colAHasImage ? 'cards--text-right' : 'cards--text-left');

  // Background image
  const bgWrap = document.createElement('div');
  bgWrap.className = 'cards-bg';

  const picture = imageCol.querySelector('picture');
  if (picture) {
    const img = picture.querySelector('img');
    if (img) {
      img.setAttribute('loading', 'eager');
      img.removeAttribute('width');
      img.removeAttribute('height');
    }
    bgWrap.append(picture);
  }

  // Content overlay
  const content = document.createElement('div');
  content.className = 'cards-content';

  [...contentCol.children].forEach((el) => {
    if (/^H[1-6]$/.test(el.tagName)) {
      const heading = document.createElement(el.tagName.toLowerCase());
      heading.className = 'cards-heading';
      heading.innerHTML = el.innerHTML;
      content.append(heading);
      return;
    }

    const anchor = el.querySelector('a');
    if (anchor) {
      const isPdf = anchor.href?.toLowerCase().includes('.pdf');
      const a = document.createElement('a');
      a.href = anchor.href;
      a.className = isPdf ? 'cards-link cards-pdf-link' : 'cards-link';
      a.innerHTML = anchor.innerHTML || anchor.textContent.trim();
      if (anchor.target) a.target = anchor.target;
      content.append(a);
      return;
    }

    if (el.textContent.trim()) {
      const p = document.createElement('p');
      p.className = 'cards-text';
      p.textContent = el.textContent.trim();
      content.append(p);
    }
  });

  block.textContent = '';
  block.append(bgWrap, content);
}