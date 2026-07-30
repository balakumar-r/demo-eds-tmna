function scrollToTop(e) {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export default function decorate(block) {
  // clear any authored content (block can be empty in the doc)
  block.textContent = '';
  block.classList.add('back-to-top-container');

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'back-to-top-btn';
  button.setAttribute('aria-label', 'Back to Top');

  const icon = document.createElement('span');
  icon.className = 'back-to-top-icon';

  const text = document.createElement('span');
  text.className = 'back-to-top-text';
  text.textContent = 'Back to Top';

  button.append(icon, text);
  button.addEventListener('click', scrollToTop);

  block.append(button);
}
