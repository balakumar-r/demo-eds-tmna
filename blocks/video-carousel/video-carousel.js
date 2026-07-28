const BLOCK_CLASS = 'video-carousel';

function getText(cell) {
  return cell ? cell.textContent.trim() : '';
}

function getUrl(cell) {
  if (!cell) return '';

  const link = cell.querySelector('a');

  if (link) {
    return link.href;
  }

  return cell.textContent.trim();
}

function getImageData(cell, fallbackAlt) {
  const img = cell ? cell.querySelector('img') : null;

  if (!img) {
    return {
      src: '',
      alt: fallbackAlt || '',
    };
  }

  return {
    src: img.currentSrc || img.src || '',
    alt: img.alt || fallbackAlt || '',
  };
}

function getYoutubeId(url) {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes('youtu.be')) {
      return parsedUrl.pathname.replace('/', '');
    }

    if (parsedUrl.hostname.includes('youtube.com')) {
      return parsedUrl.searchParams.get('v');
    }
  } catch (error) {
    return '';
  }

  return '';
}

function getVimeoId(url) {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes('vimeo.com')) {
      return parsedUrl.pathname.split('/').filter(Boolean)[0];
    }
  } catch (error) {
    return '';
  }

  return '';
}

function isExternalVideo(url) {
  return Boolean(getYoutubeId(url) || getVimeoId(url));
}

function getVideoEmbedUrl(url) {
  const youtubeId = getYoutubeId(url);
  const vimeoId = getVimeoId(url);

  if (youtubeId) {
    return `https://www.youtube.com/embed/${youtubeId}?rel=0&autoplay=0`;
  }

  if (vimeoId) {
    return `https://player.vimeo.com/video/${vimeoId}`;
  }

  return url;
}

function extractItems(block) {
  return [...block.children]
    .map((row) => [...row.children])
    .filter((cells) => cells.length >= 3)
    .map((cells) => {
      const imageCell = cells[0];
      const titleCell = cells[1];
      const videoCell = cells[2];
      const altCell = cells[3];

      const title = getText(titleCell);
      const videoUrl = getUrl(videoCell);
      const altText = getText(altCell) || title;
      const imageData = getImageData(imageCell, altText);

      return {
        title,
        videoUrl,
        imageSrc: imageData.src,
        imageAlt: imageData.alt,
      };
    })
    .filter((item) => item.title && item.videoUrl && item.imageSrc);
}

function createPlayIcon() {
  const play = document.createElement('span');
  play.className = `${BLOCK_CLASS}__play`;
  play.setAttribute('aria-hidden', 'true');

  const icon = document.createElement('span');
  icon.className = `${BLOCK_CLASS}__play-icon`;

  play.append(icon);

  return play;
}

function createNavButton(type) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `${BLOCK_CLASS}__nav ${BLOCK_CLASS}__nav--${type}`;
  button.setAttribute('aria-label', type === 'prev' ? 'Previous video' : 'Next video');

  const icon = document.createElement('span');
  icon.className = `${BLOCK_CLASS}__nav-icon`;
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = type === 'prev' ? '‹' : '›';

  button.append(icon);

  return button;
}

function createVideoCard(item, index, openModal) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = `${BLOCK_CLASS}__card`;
  card.setAttribute('aria-label', `Open video: ${item.title}`);

  const image = document.createElement('img');
  image.className = `${BLOCK_CLASS}__image`;
  image.src = item.imageSrc;
  image.alt = item.imageAlt || item.title;
  image.loading = index > 2 ? 'lazy' : 'eager';

  const title = document.createElement('span');
  title.className = `${BLOCK_CLASS}__title`;
  title.textContent = item.title;

  card.append(image, createPlayIcon(), title);

  card.addEventListener('click', () => {
    openModal(item);
  });

  return card;
}

function createModal() {
  const modal = document.createElement('div');
  modal.className = `${BLOCK_CLASS}__modal`;
  modal.setAttribute('hidden', '');
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Video player');

  const backdrop = document.createElement('div');
  backdrop.className = `${BLOCK_CLASS}__modal-backdrop`;
  backdrop.setAttribute('data-video-close', '');

  const dialog = document.createElement('div');
  dialog.className = `${BLOCK_CLASS}__modal-dialog`;
  dialog.setAttribute('role', 'document');

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = `${BLOCK_CLASS}__modal-close`;
  closeButton.setAttribute('data-video-close', '');
  closeButton.setAttribute('aria-label', 'Close video');
  closeButton.innerHTML = '<span aria-hidden="true">&times;</span>';

  const content = document.createElement('div');
  content.className = `${BLOCK_CLASS}__modal-content`;

  dialog.append(closeButton, content);
  modal.append(backdrop, dialog);
  document.body.append(modal);

  return modal;
}

function buildModalVideo(item) {
  const wrapper = document.createElement('div');
  wrapper.className = `${BLOCK_CLASS}__player`;

  const title = document.createElement('h2');
  title.className = `${BLOCK_CLASS}__modal-title`;
  title.textContent = item.title;

  const videoHolder = document.createElement('div');
  videoHolder.className = `${BLOCK_CLASS}__video-holder`;

  if (isExternalVideo(item.videoUrl)) {
    const iframe = document.createElement('iframe');
    iframe.className = `${BLOCK_CLASS}__iframe`;
    iframe.src = getVideoEmbedUrl(item.videoUrl);
    iframe.title = item.title;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;

    videoHolder.append(iframe);
  } else {
    const video = document.createElement('video');
    video.className = `${BLOCK_CLASS}__video`;
    video.src = item.videoUrl;
    video.poster = item.imageSrc;
    video.controls = true;
    video.preload = 'metadata';

    videoHolder.append(video);
  }

  wrapper.append(title, videoHolder);

  return wrapper;
}

function getFocusableItems(container) {
  return [...container.querySelectorAll(
    'button:not([disabled]), a[href], iframe, video[controls], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), not([tabindex="-1"])',
  )].filter((item) => item.offsetParent !== null);
}

function trapFocus(modal, event) {
  if (event.key !== 'Tab') return;

  const focusableItems = getFocusableItems(modal);

  if (!focusableItems.length) return;

  const firstItem = focusableItems[0];
  const lastItem = focusableItems[focusableItems.length - 1];

  if (event.shiftKey && document.activeElement === firstItem) {
    event.preventDefault();
    lastItem.focus();
  }

  if (!event.shiftKey && document.activeElement === lastItem) {
    event.preventDefault();
    firstItem.focus();
  }
}

function initModal() {
  const modal = createModal();
  const modalContent = modal.querySelector(`.${BLOCK_CLASS}__modal-content`);
  const closeItems = modal.querySelectorAll('[data-video-close]');
  let previousFocusedElement = null;

  function closeModal() {
    modal.setAttribute('hidden', '');
    modal.classList.remove(`${BLOCK_CLASS}__modal--open`);
    document.documentElement.classList.remove(`${BLOCK_CLASS}-modal-open`);
    modalContent.innerHTML = '';

    if (previousFocusedElement) {
      previousFocusedElement.focus();
    }
  }

  function openModal(item) {
    previousFocusedElement = document.activeElement;

    modalContent.innerHTML = '';
    modalContent.append(buildModalVideo(item));

    modal.removeAttribute('hidden');

    requestAnimationFrame(() => {
      modal.classList.add(`${BLOCK_CLASS}__modal--open`);
      document.documentElement.classList.add(`${BLOCK_CLASS}-modal-open`);

      const closeButton = modal.querySelector(`.${BLOCK_CLASS}__modal-close`);

      if (closeButton) {
        closeButton.focus();
      }
    });
  }

  closeItems.forEach((item) => {
    item.addEventListener('click', closeModal);
  });

  modal.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeModal();
    }

    trapFocus(modal, event);
  });

  return {
    openModal,
    closeModal,
  };
}

function updateCarousel(track, pagination, prevButton, nextButton, currentIndex, totalItems) {
  track.style.transform = `translateX(calc(-1 * var(--video-carousel-step) * ${currentIndex}))`;

  pagination.textContent = `${currentIndex + 1} of ${totalItems}`;

  prevButton.disabled = currentIndex === 0;
  nextButton.disabled = currentIndex >= totalItems - 1;
}

export default function decorate(block) {
  const items = extractItems(block);

  block.textContent = '';
  block.className = BLOCK_CLASS;

  if (!items.length) {
    block.classList.add(`${BLOCK_CLASS}--empty`);
    return;
  }

  const modal = initModal();
  let currentIndex = 0;

  const viewport = document.createElement('div');
  viewport.className = `${BLOCK_CLASS}__viewport`;

  const track = document.createElement('div');
  track.className = `${BLOCK_CLASS}__track`;

  items.forEach((item, index) => {
    track.append(createVideoCard(item, index, modal.openModal));
  });

  viewport.append(track);

  const controls = document.createElement('div');
  controls.className = `${BLOCK_CLASS}__controls`;

  const prevButton = createNavButton('prev');

  const pagination = document.createElement('span');
  pagination.className = `${BLOCK_CLASS}__pagination`;
  pagination.setAttribute('aria-live', 'polite');

  const nextButton = createNavButton('next');

  controls.append(prevButton, pagination, nextButton);
  block.append(viewport, controls);

  function update() {
    updateCarousel(track, pagination, prevButton, nextButton, currentIndex, items.length);
  }

  prevButton.addEventListener('click', () => {
    currentIndex = Math.max(0, currentIndex - 1);
    update();
  });

  nextButton.addEventListener('click', () => {
    currentIndex = Math.min(items.length - 1, currentIndex + 1);
    update();
  });

  block.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      currentIndex = Math.max(0, currentIndex - 1);
      update();
    }

    if (event.key === 'ArrowRight') {
      currentIndex = Math.min(items.length - 1, currentIndex + 1);
      update();
    }
  });

  update();
}