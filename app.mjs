import {drills} from './drills.mjs';
import {tracks, topics, byTopic} from './course.mjs';
import {search, nextDrill, day} from './study.mjs';

const $ = id => document.getElementById(id);
const key = 'pmp-prep-setup:mcq-v1';
let history = {}, current, answered = false, persistent = true;
try {
  const saved = JSON.parse(localStorage.getItem(key) || '{}');
  if (saved && typeof saved === 'object' && !Array.isArray(saved)) history = saved;
} catch { persistent = false; }

for (const [value, label] of tracks) {
  const count = drills.filter(d => d.track === value).length;
  $('track').add(new Option(`${label} · ${count} questions`, value));
}
function save() {
  try { localStorage.setItem(key, JSON.stringify(history)); } catch { persistent = false; }
}
function sourceLink(topic) {
  const link = document.createElement('a');
  link.href = topic.url;
  link.textContent = topic.source;
  return link;
}
function show(focus = false) {
  current = nextDrill(drills, history, $('track').value);
  answered = false;
  $('practice-form').hidden = !current;
  $('feedback').hidden = true;
  $('restart').hidden = !!current;
  $('submit').disabled = true;
  $('progress').textContent = `${current ? 'Choose the single best answer.' : 'You’re caught up. Switch tracks, practice this track again, or return when review is due.'}${persistent ? '' : ' Progress may only last for this visit.'}`;
  $('prompt').textContent = current?.prompt ?? '';
  $('choices').replaceChildren();
  current?.options.forEach((text, index) => {
    const label = document.createElement('label');
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'choice';
    radio.value = index;
    label.className = 'choice';
    label.append(radio, document.createTextNode(text));
    $('choices').append(label);
  });
  if (focus) (current ? $('prompt') : $('restart')).focus();
}
$('track').onchange = () => show();
$('choices').onchange = () => { if (!answered) $('submit').disabled = false; };
$('practice-form').onsubmit = event => {
  event.preventDefault();
  const selected = $('choices').querySelector('input:checked');
  if (!current || !selected || answered) return;
  answered = true;
  $('submit').disabled = true;
  $('choices').querySelectorAll('input').forEach(input => { input.disabled = true; });
  const correct = Number(selected.value) === current.correct;
  $('verdict').textContent = correct ? 'Correct' : 'Not quite';
  $('rubric').textContent = `Best answer: ${current.options[current.correct]} ${current.rationale}`;
  $('citation').replaceChildren(sourceLink(byTopic[current.concept]));
  $('feedback').hidden = false;
  const group = `${current.track}:${current.concept}`;
  const previous = history[group];
  const attempted = Array.isArray(previous?.attempted) ? previous.attempted : [previous?.last].filter(Boolean);
  history[group] = {last:current.id, attempted:[...new Set([...attempted,current.id])], due:Date.now() + day * (correct ? 3 : 1)};
  save();
  $('verdict').focus();
};
$('next').onclick = () => show(true);
$('restart').onclick = () => {
  for (const key of Object.keys(history)) if (key.startsWith(`${$('track').value}:`)) delete history[key];
  save();
  show(true);
};
function displayResults() {
  const hits = search(topics, $('query').value);
  $('results').replaceChildren();
  $('search-status').textContent = `${hits.length} ${hits.length === 1 ? 'topic' : 'topics'} shown.`;
  for (const topic of hits) {
    const li = document.createElement('li'), title = document.createElement('strong'), summary = document.createElement('div');
    title.textContent = topic.title;
    summary.textContent = topic.summary;
    li.append(title, summary, sourceLink(topic));
    $('results').append(li);
  }
}
$('query').oninput = displayResults;
show();
displayResults();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
