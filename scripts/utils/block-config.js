/**
 * Reads common config fields from an EDS block.
 *
 * Expected authoring:
 * Brand | toyota / lexus
 * Class Name | cards-media-right
 *
 * If Brand or Class Name is not authored, it will not throw error.
 *
 * @param {HTMLElement} block
 * @returns {{ brand: string, className: string }}
 */
export function getBlockConfig(block) {
  const config = {
    brand: '',
    className: '',
  };

  if (!block) {
    return config;
  }

  const rows = [...block.children];

  rows.forEach((row) => {
    const cells = [...row.children];

    if (cells.length < 2) {
      return;
    }

    const label = cells[0]?.textContent?.trim()?.toLowerCase();
    const value = cells[1]?.textContent?.trim();

    if (!label || !value) {
      return;
    }

    if (label === 'brand') {
      config.brand = value.toLowerCase();
    }

    if (
      label === 'class name'
      || label === 'classname'
      || label === 'class'
    ) {
      config.className = value;
    }
  });

  if (config.brand) {
    block.dataset.brand = config.brand;
    block.classList.add(`brand-${config.brand}`);
  }

  if (config.className) {
    block.classList.add(config.className);
  }

  return config;
}