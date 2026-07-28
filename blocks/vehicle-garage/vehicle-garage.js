import { vehicleData, vinLookup } from './vehicle-garage-data.js';

const VIN_REGEX = /^[A-Za-z0-9]{17}$/;

// Generic placeholder vehicle icon used in the collapsed-header summary
// whenever a model has no `image` set in vehicle-garage-data.js.
const GENERIC_ICON = '/icons/cart.png';

// Content for the "Where can I find this?" tooltip tabs. Swap the `image`
// paths for real assets and edit the copy as needed — this mirrors the
// four tabs (Doorjamb / Dashboard / Vehicle Registration Card / Insurance
// Card) from the original AEM popup.
const VIN_HELP_TABS = [
  {
    id: 'doorjamb',
    label: 'Doorjamb',
    caption: 'You can find your VIN as indicated in the highlighted section of the image',
    description: 'You can find your VIN on a label on the driver-side doorjamb.',
    image: '/icons/doorjamb.png',
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    caption: 'You can find your VIN as indicated in the highlighted section of the image',
    description: 'You can find your VIN at the top of the dashboard, visible through the windshield.',
    image: '/icons/dashboard.png',
  },
  {
    id: 'registration',
    label: 'Vehicle Registration Card',
    caption: 'You can find your VIN as indicated in the highlighted section of the image',
    description: 'You can find your VIN on your vehicle registration card.',
    image: '/icons/vrc.png',
  },
  {
    id: 'insurance',
    label: 'Insurance Card',
    caption: 'You can find your VIN as indicated in the highlighted section of the image',
    description: 'You can find your VIN on your insurance card.',
    image: '/icons/insurance.png',
  },
];

function qs(scope, sel) {
  return scope.querySelector(sel);
}

function clearOptions(select) {
  select.textContent = '';
}

function addOption(select, value, label) {
  const opt = document.createElement('option');
  opt.value = value;
  opt.textContent = label;
  select.append(opt);
  return opt;
}

function buildModelOptions(select, models, placeholder) {
  clearOptions(select);
  addOption(select, '', placeholder);
  Object.keys(models)
    .sort((a, b) => a.localeCompare(b))
    .forEach((name) => addOption(select, name, name));
}

function buildYearOptions(select, years, placeholder) {
  clearOptions(select);
  addOption(select, '', placeholder);
  [...years]
    .sort((a, b) => b - a)
    .forEach((year) => addOption(select, String(year), String(year)));
}

function readConfig(block) {
  const cfg = {};
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length < 2) return;
    const key = cells[0].textContent.trim().toLowerCase().replace(/[\s-]+/g, '');
    const value = cells[1].textContent.trim();
    if (key) cfg[key] = value;
  });
  return cfg;
}

function storageKey(brand) {
  return `vehicle-garage:selection:${brand}`;
}

function loadSelection(brand) {
  try {
    const raw = window.localStorage.getItem(storageKey(brand));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSelection(brand, selection) {
  try {
    window.localStorage.setItem(storageKey(brand), JSON.stringify(selection));
  } catch {
    // storage unavailable (private mode, quota, etc.) — non-fatal, just skip persistence
  }
}

function buildVinHelpMarkup() {
  const tabs = VIN_HELP_TABS.map((tab, i) => `
    <button type="button" role="tab" class="vehicle-garage__vinhelp-tab"
            aria-selected="${i === 0}" data-tab="${tab.id}">${tab.label}</button>
  `).join('');

  const panels = VIN_HELP_TABS.map((tab, i) => `
    <div class="vehicle-garage__vinhelp-panel" data-tabpanel="${tab.id}" ${i === 0 ? '' : 'hidden'}>
      <p class="vehicle-garage__vinhelp-caption">${tab.caption}</p>
      <div class="vehicle-garage__vinhelp-body">
        <img src="${tab.image}" alt="" class="vehicle-garage__vinhelp-image" />
        <span class="vehicle-garage__vinhelp-desc">${tab.description}</span>
      </div>
    </div>
  `).join('');

  return `
    <span class="vehicle-garage__vinhelp-arrow" aria-hidden="true"></span>
    <button type="button" class="vehicle-garage__vinhelp-close" aria-label="Close">&times;</button>
    <div class="vehicle-garage__vinhelp-tabs" role="tablist">${tabs}</div>
    ${panels}
  `;
}

export default function decorate(block) {
  const cfg = readConfig(block);
  block.textContent = '';

  const brand = (cfg.brand || 'toyota').toLowerCase();
  const models = vehicleData[brand] || {};
  const sampleImg = '/icons/no-vehicle.png';

  const text = {
    heading: cfg.heading || 'Select A Vehicle',
    vinLabel: cfg.vinlabel || 'Enter Your VIN',
    findVinLabel: cfg.findvinlabel || 'Where can I find this?',
    orLabel: cfg.orlabel || '-----------------------------  OR  -----------------------------',
    modelLabel: cfg.modellabel || `Choose your ${brand === 'lexus' ? 'Lexus' : 'Toyota'} vehicle`,
    modelPlaceholder: cfg.modelplaceholder || 'Select Model',
    yearPlaceholder: cfg.yearplaceholder || 'Select Year',
    typePlaceholder: cfg.typeplaceholder || 'Select Multimedia Type',
    navigationLabel: cfg.navigationlabel || 'With Navigation',
    withoutNavigationLabel: cfg.withoutnavigationlabel || 'Without Navigation',
    goLabel: cfg.golabel || 'Go',
    vinFieldError: cfg.vinerror || 'Please enter a valid VIN',
    dropdownError: cfg.dropdownerror || 'Please select a model, year and type',
  };

  const redirectUrl = cfg.redirecturl || '/firmware-updates/updates';

  block.classList.add(`brand-${brand}`);

  block.innerHTML = `
    <button type="button" class="vehicle-garage__toggle" aria-expanded="false">
      <span class="vehicle-garage__summary" hidden>
        <img class="vehicle-garage__summary-icon" src="${GENERIC_ICON}" alt="" />
        <span class="vehicle-garage__summary-text">
          <strong class="vehicle-garage__summary-title"></strong>
          <span class="vehicle-garage__summary-vin"></span>
        </span>
      </span>
      <span class="vehicle-garage__logo"><img src="${sampleImg}" alt="${sampleImg}" /></span>
      <span class="vehicle-garage__label">${text.heading}</span>
      <span class="vehicle-garage__circle"><i class="vehicle-garage__arrow"></i></span>
    </button>
    <div class="vehicle-garage__panel" hidden>
      <div class="vehicle-garage__row vehicle-garage__row--vin">
        <label for="vg-vin-${brand}">${text.vinLabel}</label>
        <button type="button" class="vehicle-garage__findvin">${text.findVinLabel}</button>
        <input type="text" id="vg-vin-${brand}" class="vehicle-garage__vin" maxlength="17"
               placeholder="TYPE VIN" autocomplete="off" inputmode="text" />
        <span class="vehicle-garage__msg" data-role="vin-error"></span>
        <div class="vehicle-garage__vinhelp" hidden>${buildVinHelpMarkup()}</div>
      </div>
      <p class="vehicle-garage__or">${text.orLabel}</p>
      <div class="vehicle-garage__row">
        <label for="vg-model-${brand}">${text.modelLabel}</label>
        <select id="vg-model-${brand}" class="vehicle-garage__model"></select>
      </div>
      <div class="vehicle-garage__row">
        <select id="vg-year-${brand}" class="vehicle-garage__year" aria-label="${text.yearPlaceholder}"></select>
      </div>
      <div class="vehicle-garage__row vehicle-garage__row--type" hidden>
        <select id="vg-type-${brand}" class="vehicle-garage__type" aria-label="${text.typePlaceholder}">
          <option value="">${text.typePlaceholder}</option>
          <option value="navigation">${text.navigationLabel}</option>
          <option value="without navigation">${text.withoutNavigationLabel}</option>
        </select>
      </div>
      <span class="vehicle-garage__msg" data-role="dropdown-error"></span>
      <div class="vehicle-garage__go-row">
        <button type="button" class="vehicle-garage__go" disabled>${text.goLabel}</button>
      </div>
    </div>
  `;

  const toggle = qs(block, '.vehicle-garage__toggle');
  const panel = qs(block, '.vehicle-garage__panel');
  const summaryEl = qs(block, '.vehicle-garage__summary');
  const logoEl = qs(block, '.vehicle-garage__logo');
  const summaryIcon = qs(block, '.vehicle-garage__summary-icon');
  const summaryTitle = qs(block, '.vehicle-garage__summary-title');
  const summaryVin = qs(block, '.vehicle-garage__summary-vin');
  const labelEl = qs(block, '.vehicle-garage__label');
  const vinInput = qs(block, '.vehicle-garage__vin');
  const vinError = qs(block, '[data-role="vin-error"]');
  const modelSelect = qs(block, '.vehicle-garage__model');
  const yearSelect = qs(block, '.vehicle-garage__year');
  const typeRow = qs(block, '.vehicle-garage__row--type');
  const typeSelect = qs(block, '.vehicle-garage__type');
  const dropdownError = qs(block, '[data-role="dropdown-error"]');
  const orText = qs(block, '.vehicle-garage__or');
  const goBtn = qs(block, '.vehicle-garage__go');
  const findVinBtn = qs(block, '.vehicle-garage__findvin');
  const vinHelp = qs(block, '.vehicle-garage__vinhelp');
  const vinHelpClose = qs(block, '.vehicle-garage__vinhelp-close');
  const vinHelpTabs = [...block.querySelectorAll('.vehicle-garage__vinhelp-tab')];
  const vinHelpPanels = [...block.querySelectorAll('.vehicle-garage__vinhelp-panel')];

  buildModelOptions(modelSelect, models, text.modelPlaceholder);
  buildYearOptions(yearSelect, [], text.yearPlaceholder);

  // ---------- collapsed-header summary ("2024 4RUNNER" / "VIN ...") ----------
  function lookupIcon(modelName) {
    return (models[modelName] && models[modelName].image) || GENERIC_ICON;
  }

  function updateSummary() {
    const vin = vinInput.value.trim().toUpperCase();
    const vinValid = VIN_REGEX.test(vin);
    const model = modelSelect.value;
    const year = yearSelect.value;

    let title = '';
    let vinLine = '';
    let icon = GENERIC_ICON;
    if (model && year) {
      title = `${year} ${model}`.toUpperCase();
      icon = lookupIcon(model);
    } else if (vinValid) {
      const known = (vinLookup[brand] || {})[vin];
      if (known) {
        title = `${known.year} ${known.model}`.toUpperCase();
        icon = lookupIcon(known.model);
      }
    }

    if (vinValid) {
      vinLine = `VIN ${vin}`;
    }
    if (title || vinLine) {
      summaryTitle.textContent = title;
      summaryVin.textContent = vinLine;
      summaryIcon.src = icon;
      summaryEl.hidden = false;
      logoEl.hidden = true;
      labelEl.hidden = true;
    } else {
      summaryEl.hidden = true;
      logoEl.hidden = false;
      labelEl.hidden = false;
    }
  }

let isPanelOpen = false;
function setPanelOpen(open) {
  isPanelOpen = open;
  if (open) {
    panel.hidden = false;
    requestAnimationFrame(() => {
      panel.classList.add('show');
      panel.classList.remove('hide');
    });
  } else {
    panel.classList.remove('show');
    panel.classList.add('hide');
    panel.addEventListener('transitionend', function handleTransitionEnd() {
      if (!isPanelOpen && panel.classList.contains('hide')) {
        panel.hidden = true;
      }
      panel.removeEventListener('transitionend', handleTransitionEnd);
    });
  }
  toggle.setAttribute('aria-expanded', String(open));
}

const isDesktopHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
if (isDesktopHover) {
  // Desktop: open on hover
  block.addEventListener('mouseenter', () => {
    setPanelOpen(true);
  });

  block.addEventListener('mouseleave', () => {
    setPanelOpen(false);
    vinHelp.hidden = true;
  });
} else {
  // Mobile / touch devices: click to open and click again to close
  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPanelOpen(!isPanelOpen);
  });
}

document.addEventListener('click', (e) => {
  if (!block.contains(e.target)) {
    setPanelOpen(false);
    vinHelp.hidden = true;
  }
});

  // ---------- "Where can I find this?" tabbed tooltip ----------
  findVinBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    vinHelp.hidden = !vinHelp.hidden;
  });
  vinHelpClose.addEventListener('click', () => {
    vinHelp.hidden = true;
  });
  vinHelpTabs.forEach((tabBtn) => {
    tabBtn.addEventListener('click', () => {
      const { tab } = tabBtn.dataset;
      vinHelpTabs.forEach((t) => t.setAttribute('aria-selected', String(t === tabBtn)));
      vinHelpPanels.forEach((p) => { p.hidden = p.dataset.tabpanel !== tab; });
    });
  });

  // ---------- validation / cascading selects ----------
  function updateGoState() {
  const vin = vinInput.value.trim();
  const vinValid = VIN_REGEX.test(vin);
  const modelSelected = Boolean(modelSelect.value);
  const yearSelected = Boolean(yearSelect.value);
  const typeSelected = typeRow.hidden || Boolean(typeSelect.value);
  const dropdownSelected = modelSelected && yearSelected && typeSelected;
  goBtn.disabled = !vinValid;

  if (dropdownSelected && !vinValid) {
    dropdownError.textContent = 'Please enter VIN and proceed';
    if (orText) orText.hidden = true;
  } else {
    dropdownError.textContent = '';
    if (orText) orText.hidden = false;
  }
}

  vinInput.addEventListener('input', () => {
    const val = vinInput.value.trim();
    vinError.textContent = val && !VIN_REGEX.test(val) ? text.vinFieldError : '';
    updateGoState();
    updateSummary();
  });

  modelSelect.addEventListener('change', () => {
    vinError.textContent = '';
    const years = models[modelSelect.value]?.years || [];
    buildYearOptions(yearSelect, years, text.yearPlaceholder);
    typeRow.hidden = true;
    typeSelect.value = '';
    updateGoState();
    updateSummary();
  });

  yearSelect.addEventListener('change', () => {
    typeRow.hidden = !(modelSelect.value && yearSelect.value);
    updateGoState();
    updateSummary();
  });

  typeSelect.addEventListener('change', () => {
    updateGoState();
    updateSummary();
  });

  // ---------- go / redirect ----------
  function go() {
    const vin = vinInput.value.trim().toUpperCase();
    const vinValid = VIN_REGEX.test(vin);
    if (!vinValid) {
      vinError.textContent = text.vinFieldError;
      dropdownError.textContent = 'Please enter VIN and proceed';
      goBtn.disabled = true;
      return;
    }

    const params = new URLSearchParams();
    const selection = { brand };
    params.set('vin', vin);
    selection.vin = vin;

    if (modelSelect.value) {
      params.set('model', modelSelect.value);
      selection.model = modelSelect.value;
    }

    if (yearSelect.value) {
      params.set('year', yearSelect.value);
      selection.year = yearSelect.value;
    }

    if (typeSelect.value) {
      params.set('type', typeSelect.value);
      selection.type = typeSelect.value;
    }

    saveSelection(brand, selection);
    updateSummary();
    window.location.href = `${redirectUrl}?${params.toString()}`;
  }

  goBtn.addEventListener('click', go);
  block.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target !== findVinBtn && e.target !== vinHelpClose
      && !vinHelpTabs.includes(e.target)) {
      e.preventDefault();
      go();
    }
  });

  // ---------- rehydrate from a previous visit/redirect ----------
  const saved = loadSelection(brand);
  if (saved) {
    if (saved.vin) {
      vinInput.value = saved.vin;
    }

    if (saved.model) {
      modelSelect.value = saved.model;
      const years = models[saved.model]?.years || [];
      buildYearOptions(yearSelect, years, text.yearPlaceholder);
      if (saved.year) yearSelect.value = saved.year;
      if (modelSelect.value && yearSelect.value) {
        typeRow.hidden = false;
        if (saved.type) typeSelect.value = saved.type;
      }
    }
    updateGoState();
  }
  updateSummary();
}