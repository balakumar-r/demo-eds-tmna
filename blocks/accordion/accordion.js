function decorateAccordionV1(block) {
  const wrapper = document.createElement('div');
  wrapper.className = 'accordion-v1';

  const allTriggers = [];
  const allPanels = [];

  [...block.children].forEach((row, idx) => {
    const item = document.createElement('div');
    item.className = 'accordion-v1-item';

    const headingEl = row.querySelector(':scope > *:first-child');

    const panelEl = document.createElement('div');
    panelEl.className = 'accordion-v1-panel';
    panelEl.setAttribute('role', 'region');

    const inner = document.createElement('div');
    inner.className = 'accordion-v1-panel-inner';

    let titleHTML = `Item ${idx + 1}`;
    if (headingEl) titleHTML = headingEl.innerHTML;

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'accordion-v1-trigger';
    trigger.setAttribute('aria-expanded', 'false');

    const id = `accordion-v1-${Math.random().toString(36).slice(2, 9)}`;
    trigger.setAttribute('aria-controls', `${id}-panel`);
    panelEl.id = `${id}-panel`;

    const titleSpan = document.createElement('span');
    titleSpan.className = 'accordion-v1-trigger-text';
    titleSpan.innerHTML = titleHTML;
    trigger.appendChild(titleSpan);

    [...row.children].forEach((child, index) => {
      if (index === 0) return;
      inner.appendChild(child.cloneNode(true));
    });

    panelEl.appendChild(inner);

    function closePanel(triggerEl, panel) {
      triggerEl.setAttribute('aria-expanded', 'false');
      panel.style.maxHeight = '0px';

      panel.addEventListener('transitionend', function hide() {
        panel.hidden = true;
        panel.removeEventListener('transitionend', hide);
      });
    }

    function openPanel(triggerEl, panel) {
      triggerEl.setAttribute('aria-expanded', 'true');
      panel.hidden = false;
      panel.style.maxHeight = '0px';

      requestAnimationFrame(() => {
        panel.style.maxHeight = `${panel.scrollHeight}px`;
      });
    }

    trigger.addEventListener('click', () => {
      const isOpen = trigger.getAttribute('aria-expanded') === 'true';

      allTriggers.forEach((currentTrigger, index) => {
        if (currentTrigger !== trigger) {
          closePanel(currentTrigger, allPanels[index]);
        }
      });

      if (isOpen) {
        closePanel(trigger, panelEl);
      } else {
        openPanel(trigger, panelEl);
      }
    });

    panelEl.hidden = true;
    panelEl.style.maxHeight = '0px';

    allTriggers.push(trigger);
    allPanels.push(panelEl);

    item.append(trigger, panelEl);
    wrapper.append(item);
  });

  block.replaceChildren(wrapper);
}

function decorateAccordionV2(block) {
  const blockName = 'accordion-v2';
  const rows = [...block.children];

  const configRow = rows[rows.length - 1];
  const isConfigRow = configRow
    && configRow.children[0]?.textContent.trim().toLowerCase() === 'icon';

  const panelRows = isConfigRow ? rows.slice(0, -1) : rows;

  block.classList.add(`${blockName}--decorated`);

  panelRows.forEach((row, index) => {
    const [titleCell, contentCell] = row.children;

    if (!titleCell || !contentCell) return;

    row.className = `${blockName}__item`;

    const trigger = document.createElement('button');
    trigger.className = `${blockName}__trigger`;
    trigger.type = 'button';
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', `${blockName}-panel-${index}`);
    trigger.id = `${blockName}-trigger-${index}`;

    const title = document.createElement('span');
    title.className = `${blockName}__title`;
    title.textContent = titleCell.textContent.trim();

    const icon = document.createElement('span');
    icon.className = `${blockName}__icon`;
    icon.setAttribute('aria-hidden', 'true');

    trigger.append(title, icon);

    const panel = document.createElement('div');
    panel.className = `${blockName}__panel`;
    panel.id = `${blockName}-panel-${index}`;
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', trigger.id);
    panel.hidden = true;

    const list = document.createElement('ul');
    list.className = `${blockName}__links`;

    const links = contentCell.querySelectorAll('a');

    if (links.length) {
      links.forEach((anchor) => {
        const li = document.createElement('li');
        li.className = `${blockName}__links-item`;
        anchor.classList.add(`${blockName}__link`);
        li.append(anchor);
        list.append(li);
      });

      panel.append(list);
    } else {
      const content = document.createElement('div');
      content.className = `${blockName}__content`;
      content.innerHTML = contentCell.innerHTML;
      panel.append(content);
    }

    row.replaceChildren(trigger, panel);

    trigger.addEventListener('click', () => {
      const expanded = trigger.getAttribute('aria-expanded') === 'true';

      trigger.setAttribute('aria-expanded', String(!expanded));
      panel.hidden = expanded;
      row.classList.toggle(`${blockName}__item--open`, !expanded);
      row.classList.toggle('active', !expanded);
    });
  });

  if (isConfigRow) configRow.remove();
}

export default function decorate(block) {
  if (block.classList.contains('accordion-v2')) {
    decorateAccordionV2(block);
    return;
  }

  decorateAccordionV1(block);
}