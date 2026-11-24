import {drills} from './drills.mjs';
import {search, nextDrill, day} from './study.mjs';
const $ = id => document.getElementById(id);
const key = 'pmp-prep-setup:v1';
let history = {}, current, documents = [], importVersion = 0, persistent = true;
try { history = JSON.parse(localStorage.getItem(key) || '{}') || {}; if (Array.isArray(history) || typeof history !== 'object') history = {}; } catch { persistent = false; }
function show(focus = false) {
  current = nextDrill(drills, history, $('track').value);
  $('prompt').textContent = current?.prompt ?? 'You’re caught up for now.';
  $('progress').textContent = `${current ? 'Answer before checking the rubric.' : 'Switch tracks or come back when a review is due.'}${persistent ? '' : ' Progress is only saved for this visit.'}`;
  $('answer').value = '';
  $('answer').disabled = !current;
  $('reveal').disabled = !current;
  $('feedback').hidden = true;
  if (focus) $('prompt').focus();
}
$('track').onchange = () => show();
$('reveal').onclick = () => {
  if (!current) return;
  if (!$('answer').value.trim()) { $('answer').focus(); return; }
  $('rubric').textContent = current.rubric;
  $('citation').textContent = current.citation;
  $('feedback').hidden = false;
  $('rubric-heading').focus();
};
for (const button of document.querySelectorAll('[data-score]')) button.onclick = () => {
  if (!current || $('feedback').hidden) return;
  const keyForConcept = `${current.track}:${current.concept}`;
  const result = button.dataset.score;
  history[keyForConcept] = {last:current.id, due:Date.now() + day * (result === 'got' ? 3 : 1)};
  try { localStorage.setItem(key, JSON.stringify(history)); } catch { persistent = false; }
  show(true);
};
function displayResults() {
  const list = $('results');
  list.replaceChildren();
  const term = $('query').value.trim();
  const hits = term ? search(documents, term) : [];
  $('search-status').textContent = `${documents.length} files loaded.${term ? ` ${hits.length} results shown.` : ''}`;
  for (const hit of hits) {
    const li = document.createElement('li'), label = document.createElement('strong'), snippet = document.createElement('div');
    label.textContent = `${hit.name} · line ${hit.line}`;
    snippet.textContent = hit.text;
    li.append(label,snippet);
    list.append(li);
  }
}
$('files').onchange = async () => {
  const version = ++importVersion;
  const files = [...$('files').files];
  documents = [];
  const allowed = files.filter(f => /\.md$/i.test(f.name) && f.size <= 2_000_000).slice(0, 30);
  const read = await Promise.allSettled(allowed.map(async f => ({name:f.name,text:await f.text()})));
  if (version !== importVersion) return;
  documents = read.filter(x => x.status === 'fulfilled').map(x => x.value);
  displayResults();
  if (files.length > documents.length) $('search-status').textContent += ` ${files.length - documents.length} skipped (file type, size, count, or read error).`;
};
$('query').oninput = displayResults;
show();
displayResults();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
