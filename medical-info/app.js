/* ═══════════════════════════════════════════
   MEDSEARCH Rx — app.js
   APIs: Wikipedia (disease) + OpenFDA (medicine)
═══════════════════════════════════════════ */

// ── API Endpoints ──────────────────────────────────────────────
const WIKI_SEARCH  = 'https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*&srlimit=5&srsearch=';
const WIKI_SUMMARY = 'https://en.wikipedia.org/api/rest_v1/page/summary/';
const WIKI_PARSE   = 'https://en.wikipedia.org/w/api.php?action=parse&format=json&origin=*&prop=';
const FDA_API      = 'https://api.fda.gov/drug/label.json';

// Wikipedia section headings to look for
const SECTION_KEYWORDS = {
  symptoms:    ['signs and symptoms', 'symptoms', 'clinical presentation', 'clinical features', 'presentation', 'manifestations'],
  causes:      ['causes', 'cause', 'etiology', 'aetiology', 'pathophysiology', 'pathogenesis', 'mechanism'],
  prevention:  ['prevention', 'preventive measures', 'prophylaxis', 'preventing'],
  riskFactors: ['risk factors', 'risk factor', 'epidemiology', 'demographics'],
};

// Medicine card accent colours (cycling)
const CARD_ACCENTS = ['#2563eb', '#0d9488', '#7c3aed', '#059669', '#d97706', '#dc2626'];

// ── Utility ────────────────────────────────────────────────────
function truncate(text, max) {
  if (!text) return null;
  const s = text.replace(/\s+/g, ' ').trim();
  return s.length > max ? s.slice(0, max).replace(/\s+\S*$/, '') + '…' : s;
}

function extractTextFromHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  div.querySelectorAll('sup, .reference, .reflist, .references, .navbox, .hatnote, table, h2, h3, h4, style, script').forEach(el => el.remove());
  div.querySelectorAll('li').forEach(li => li.prepend('• '));
  return truncate(
    div.textContent
      .replace(/\[\d+\]/g, '')
      .replace(/\[edit\]/gi, '')
      .replace(/\[hide\]/gi, '')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/ {2,}/g, ' '),
    650
  );
}

function cleanFdaText(raw) {
  if (!raw) return null;
  return raw
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\(\d+\)/g, '')
    .replace(/[•·]/g, '')
    .replace(/^\d+\s+(?:[A-Z]+(?:\s+|$))+/, '') // strip "1 INDICATIONS AND USAGE"
    .trim();
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}

// ── URL / Share ────────────────────────────────────────────────
function getUrlDisease() {
  return new URLSearchParams(window.location.search).get('disease') || '';
}
function updateUrl(query) {
  const url = new URL(window.location.href);
  url.searchParams.set('disease', query);
  history.pushState({ disease: query }, '', url.toString());
}

// ── Theme ──────────────────────────────────────────────────────
function initTheme() {
  const saved     = localStorage.getItem('medsearch-theme');
  const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  setTheme(saved || preferred);
}
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('theme-label').textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
  localStorage.setItem('medsearch-theme', theme);
}
function toggleTheme() {
  setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
}

// ── Toast ──────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, ms = 2800) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hide');
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.remove('show'); t.classList.add('hide'); }, ms);
}

// ── Skeleton Loaders ───────────────────────────────────────────
function showDiseaseLoading() {
  document.getElementById('disease-content').innerHTML = `
    <div class="skel-card">
      <div class="disease-banner" style="background:var(--bg-2)">
        <div class="skel" style="width:80px;height:80px;border-radius:14px;flex-shrink:0"></div>
        <div style="flex:1;display:flex;flex-direction:column;gap:10px">
          <div class="skel" style="height:26px;width:55%"></div>
          <div class="skel" style="height:14px;width:100%"></div>
          <div class="skel" style="height:14px;width:78%"></div>
          <div class="skel" style="height:14px;width:88%"></div>
        </div>
      </div>
      <div class="disease-info-panel">
        <div class="skel" style="height:12px;width:30%;margin-bottom:16px"></div>
        <div class="info-grid">
          ${[0,1,2,3].map(i => `<div class="skel" style="height:110px;border-radius:12px;animation-delay:${i*.1}s"></div>`).join('')}
        </div>
      </div>
    </div>`;
}

function showMedicineLoading() {
  document.getElementById('medicine-content').innerHTML = `
    <div class="medicine-shelf">
      ${[0,1,2].map(i => `
        <div class="skel-card" style="border-top:4px solid var(--border)">
          <div style="display:flex;gap:14px;padding:20px;background:var(--bg-2)">
            <div class="skel" style="width:46px;height:46px;border-radius:12px;flex-shrink:0"></div>
            <div style="flex:1;display:flex;flex-direction:column;gap:8px">
              <div class="skel" style="height:18px;width:65%"></div>
              <div class="skel" style="height:12px;width:40%"></div>
            </div>
          </div>
          <div style="padding:18px 20px;display:flex;flex-direction:column;gap:14px">
            ${[0,1,2].map(j => `<div class="skel" style="height:58px;border-radius:10px;animation-delay:${(i+j)*.08}s"></div>`).join('')}
          </div>
        </div>`).join('')}
    </div>`;
}

// ── Disease Card ───────────────────────────────────────────────
function renderDiseaseCard(data) {
  const thumb = data.thumbnail
    ? `<img class="disease-thumb" src="${escapeHtml(data.thumbnail)}" alt="${escapeHtml(data.name)}" loading="lazy"
         onerror="this.outerHTML='<div class=\\'disease-thumb-placeholder\\'>🦠</div>'">`
    : `<div class="disease-thumb-placeholder">🦠</div>`;

  const fields = [
    { key: 'symptoms',    icon: '🩺', label: 'Symptoms' },
    { key: 'causes',      icon: '🔬', label: 'Causes' },
    { key: 'prevention',  icon: '🛡️', label: 'Prevention' },
    { key: 'riskFactors', icon: '⚠️', label: 'Risk Factors' },
  ];

  const infoBoxes = fields.map(f => `
    <div class="info-box">
      <div class="info-box-label"><span aria-hidden="true">${f.icon}</span>${f.label}</div>
      <div class="info-box-text">${
        data[f.key]
          ? escapeHtml(data[f.key])
          : '<span class="no-data">Not available for this article</span>'
      }</div>
    </div>`).join('');

  const wikiBtn = data.url
    ? `<a class="wiki-btn" href="${escapeHtml(data.url)}" target="_blank" rel="noopener noreferrer">
         📖 View full article on Wikipedia ↗
       </a>`
    : '';

  document.getElementById('disease-content').innerHTML = `
    <div class="disease-card animate-fade-up">
      <div class="disease-banner">
        ${thumb}
        <div class="disease-main">
          <h3 class="disease-name">${escapeHtml(data.name)}</h3>
          <p class="disease-desc">${escapeHtml(truncate(data.description, 360))}</p>
          ${wikiBtn}
        </div>
      </div>
      <div class="disease-info-panel">
        <div class="info-panel-label">
          <span aria-hidden="true">📋</span> Medical Information Panel
        </div>
        <div class="info-grid">${infoBoxes}</div>
      </div>
    </div>`;
}

// ── Medicine Cabinet Cards ─────────────────────────────────────
function renderMedicineCards(medicines) {
  // Show count
  const countEl = document.getElementById('med-count');
  if (countEl) {
    countEl.textContent = `${medicines.length} medication${medicines.length !== 1 ? 's' : ''} found`;
    countEl.hidden = false;
  }

  const cards = medicines.map((med, i) => {
    const accent = CARD_ACCENTS[i % CARD_ACCENTS.length];
    const delay  = `animate-delay-${Math.min(i + 1, 6)}`;

    const usageHtml = med.usage ? `
      <div class="med-row">
        <span class="med-row-icon" aria-hidden="true">📋</span>
        <div>
          <div class="med-row-label">Usage &amp; Indications</div>
          <div class="med-row-text">${escapeHtml(truncate(med.usage, 300))}</div>
        </div>
      </div>` : '';

    const dosageHtml = med.dosage ? `
      <div class="med-row">
        <span class="med-row-icon" aria-hidden="true">⚖️</span>
        <div>
          <div class="med-row-label">Dosage</div>
          <div class="med-row-text">${escapeHtml(truncate(med.dosage, 240))}</div>
        </div>
      </div>` : '';

    const sideHtml = med.sideEffects ? `
      <div class="med-row">
        <span class="med-row-icon" aria-hidden="true">⚡</span>
        <div>
          <div class="med-row-label">Side Effects</div>
          <div class="med-row-text">${escapeHtml(truncate(med.sideEffects, 240))}</div>
        </div>
      </div>` : '';

    const warnHtml = med.warnings ? `
      <div class="med-warn-box">
        <div class="med-warn-title"><span aria-hidden="true">⚠️</span> Warnings</div>
        <div class="med-warn-text">${escapeHtml(truncate(med.warnings, 260))}</div>
      </div>` : '';

    return `
      <div class="med-card animate-fade-up ${delay}" style="--card-accent:${accent}">
        <div class="med-card-top">
          <div class="med-pill-badge" aria-hidden="true">💊</div>
          <div class="med-names">
            <div class="med-brand">${escapeHtml(med.brandName || med.genericName || 'Unknown Medication')}</div>
            ${med.genericName && med.brandName ? `<div class="med-generic">Generic: ${escapeHtml(med.genericName)}</div>` : ''}
            ${med.manufacturer ? `<div class="med-mfr">by ${escapeHtml(truncate(med.manufacturer, 45))}</div>` : ''}
          </div>
        </div>
        <div class="med-card-body">
          ${usageHtml}${dosageHtml}${sideHtml}${warnHtml}
        </div>
      </div>`;
  }).join('');

  document.getElementById('medicine-content').innerHTML =
    `<div class="medicine-shelf">${cards}</div>`;
}

// ── State Cards ────────────────────────────────────────────────
function showDiseaseError(msg) {
  document.getElementById('disease-content').innerHTML = `
    <div class="state-card error animate-fade-up">
      <div class="state-icon">😕</div>
      <div class="state-title">Couldn't Load Disease Info</div>
      <p class="state-msg">${escapeHtml(msg)}. Please try a different search term.</p>
    </div>`;
}
function showMedicineError(msg) {
  document.getElementById('medicine-content').innerHTML = `
    <div class="state-card error animate-fade-up">
      <div class="state-icon">⚠️</div>
      <div class="state-title">Couldn't Load Medications</div>
      <p class="state-msg">${escapeHtml(msg)}. The FDA database may be temporarily unavailable.</p>
    </div>`;
}
function showDiseaseEmpty(query) {
  document.getElementById('disease-content').innerHTML = `
    <div class="state-card animate-fade-up">
      <div class="state-icon">🔍</div>
      <div class="state-title">No Results Found</div>
      <p class="state-msg">No Wikipedia article found for "<strong>${escapeHtml(query)}</strong>". Try a more specific disease name.</p>
    </div>`;
}
function showMedicineEmpty(query) {
  const countEl = document.getElementById('med-count');
  if (countEl) countEl.hidden = true;
  document.getElementById('medicine-content').innerHTML = `
    <div class="state-card animate-fade-up">
      <div class="state-icon">💊</div>
      <div class="state-title">No Medications Found</div>
      <p class="state-msg">The FDA database returned no drug labels for "<strong>${escapeHtml(query)}</strong>". Try a more specific disease name.</p>
    </div>`;
}

// ── Wikipedia API ──────────────────────────────────────────────
async function searchWikipedia(query) {
  const res  = await fetch(WIKI_SEARCH + encodeURIComponent(query + ' disease'));
  if (!res.ok) throw new Error('Wikipedia search failed');
  const data = await res.json();
  return data.query?.search || [];
}

async function getWikipediaSummary(title) {
  const res = await fetch(WIKI_SUMMARY + encodeURIComponent(title));
  if (!res.ok) throw new Error('Wikipedia summary failed');
  return res.json();
}

async function getWikipediaSections(title) {
  const res  = await fetch(`${WIKI_PARSE}sections&page=${encodeURIComponent(title)}&redirects=1`);
  if (!res.ok) throw new Error('Wikipedia sections failed');
  const data = await res.json();
  return data.parse?.sections || [];
}

async function getWikipediaSectionText(title, idx) {
  const res  = await fetch(`${WIKI_PARSE}text&page=${encodeURIComponent(title)}&section=${idx}&redirects=1`);
  if (!res.ok) return null;
  const data = await res.json();
  return extractTextFromHtml(data.parse?.text?.['*'] || '');
}

function findBestMatch(results, query) {
  const q = query.toLowerCase();
  return results.find(r => r.title.toLowerCase() === q)
      || results.find(r => r.title.toLowerCase().includes(q))
      || results[0];
}

function mapSections(sections) {
  const out = {};
  for (const [key, kws] of Object.entries(SECTION_KEYWORDS)) {
    for (const s of sections) {
      const name = s.line.toLowerCase().replace(/<[^>]+>/g, '');
      if (kws.some(kw => name.includes(kw))) { if (!out[key]) out[key] = s.index; }
    }
  }
  return out;
}

async function fetchDiseaseData(query) {
  const results = await searchWikipedia(query);
  if (!results.length) return null;

  const match    = findBestMatch(results, query);
  const pageTitle = match.title;

  const [summary, sections] = await Promise.all([
    getWikipediaSummary(pageTitle),
    getWikipediaSections(pageTitle),
  ]);

  // Handle disambiguation — try next result
  if (summary.type === 'disambiguation' && results.length > 1) {
    const alt = results.find(r => r.title !== pageTitle);
    if (alt) {
      const [altSum, altSec] = await Promise.all([getWikipediaSummary(alt.title), getWikipediaSections(alt.title)]);
      return buildDiseaseResult(alt.title, altSum, altSec);
    }
  }
  return buildDiseaseResult(pageTitle, summary, sections);
}

async function buildDiseaseResult(pageTitle, summary, sections) {
  const sectionMap = mapSections(sections);
  const entries    = Object.entries(sectionMap);
  const texts      = await Promise.all(entries.map(([, idx]) => getWikipediaSectionText(pageTitle, idx)));
  const content    = {};
  entries.forEach(([key], i) => { content[key] = texts[i]; });

  return {
    name:        summary.title   || pageTitle,
    description: summary.extract || summary.description || 'No description available.',
    thumbnail:   summary.thumbnail?.source || null,
    url:         summary.content_urls?.desktop?.page || null,
    symptoms:    content.symptoms    || null,
    causes:      content.causes      || null,
    prevention:  content.prevention  || null,
    riskFactors: content.riskFactors || null,
  };
}

// ── OpenFDA API ────────────────────────────────────────────────
async function fetchMedicines(query) {
  const attempts = [
    `${FDA_API}?search=indications_and_usage:"${encodeURIComponent(query)}"&limit=6`,
    `${FDA_API}?search=indications_and_usage:${encodeURIComponent(query)}&limit=6`,
  ];

  let data = null;
  for (const url of attempts) {
    const res = await fetch(url);
    if (res.status === 404) continue;
    if (!res.ok) throw new Error(`FDA API error ${res.status}`);
    const json = await res.json();
    if (json.results?.length) { data = json; break; }
  }

  if (!data?.results?.length) return [];

  return data.results.map(drug => ({
    brandName:    drug.openfda?.brand_name?.[0]        || null,
    genericName:  drug.openfda?.generic_name?.[0]      || null,
    manufacturer: drug.openfda?.manufacturer_name?.[0] || null,
    usage:        cleanFdaText(drug.indications_and_usage?.[0])                    || null,
    dosage:       cleanFdaText(drug.dosage_and_administration?.[0])                || null,
    sideEffects:  cleanFdaText(drug.adverse_reactions?.[0])                        || null,
    warnings:     cleanFdaText(drug.warnings?.[0] || drug.warnings_and_cautions?.[0]) || null,
  })).filter(m => m.brandName || m.genericName);
}

// ── Main Search ────────────────────────────────────────────────
async function runSearch(query) {
  query = query.trim();
  if (!query) return;

  updateUrl(query);

  const resultsSection = document.getElementById('results');
  resultsSection.hidden = false;
  document.getElementById('current-query').textContent = query;

  // Reset med count badge
  const countEl = document.getElementById('med-count');
  if (countEl) countEl.hidden = true;

  if (window.innerWidth < 768) {
    setTimeout(() => resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }

  showDiseaseLoading();
  showMedicineLoading();

  const [diseaseRes, medRes] = await Promise.allSettled([
    fetchDiseaseData(query),
    fetchMedicines(query),
  ]);

  if (diseaseRes.status === 'fulfilled') {
    diseaseRes.value ? renderDiseaseCard(diseaseRes.value) : showDiseaseEmpty(query);
  } else {
    console.error('Disease error:', diseaseRes.reason);
    showDiseaseError(diseaseRes.reason?.message || 'Unknown error');
  }

  if (medRes.status === 'fulfilled') {
    medRes.value.length > 0 ? renderMedicineCards(medRes.value) : showMedicineEmpty(query);
  } else {
    console.error('Medicine error:', medRes.reason);
    showMedicineError(medRes.reason?.message || 'Unknown error');
  }
}

// ── Event Listeners ────────────────────────────────────────────
document.getElementById('search-form').addEventListener('submit', e => {
  e.preventDefault();
  runSearch(document.getElementById('search-input').value);
});

document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

document.getElementById('copy-link-btn').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    const btn  = document.getElementById('copy-link-btn');
    const span = document.getElementById('share-btn-text');
    btn.classList.add('copied');
    span.textContent = '✓ Link Copied!';
    showToast('Share link copied to clipboard ✓');
    setTimeout(() => { btn.classList.remove('copied'); span.textContent = 'Copy Share Link'; }, 2500);
  } catch {
    showToast('Copy this URL: ' + window.location.href, 4000);
  }
});

document.querySelectorAll('.pill-tag').forEach(btn =>
  btn.addEventListener('click', () => {
    document.getElementById('search-input').value = btn.dataset.query;
    runSearch(btn.dataset.query);
  })
);

window.addEventListener('popstate', e => {
  const d = e.state?.disease || getUrlDisease();
  if (d) { document.getElementById('search-input').value = d; runSearch(d); }
});

// ── Init ───────────────────────────────────────────────────────
initTheme();
const initialDisease = getUrlDisease();
if (initialDisease) {
  document.getElementById('search-input').value = initialDisease;
  runSearch(initialDisease);
}
