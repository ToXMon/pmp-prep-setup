const el = id => document.getElementById(id);
const status = el('coach-status');
let drill = null;

async function submit(mode, question, button) {
  button.disabled = true;
  status.textContent = 'Looking up course evidence…';
  try {
    const response = await fetch('/api/ask', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({mode, question}),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    el('answer').replaceChildren(...result.answer.split(/\n+/).filter(Boolean).map(line => {
      const p = document.createElement('p'); p.textContent = line; return p;
    }));
    el('sources').replaceChildren(...result.sources.map(source => {
      const item = document.createElement('li');
      item.textContent = `[${source.id}] ${source.basis === 'semantic summary' ? 'Semantic summary; source locator: ' : ''}Session ${source.session}, ${source.file}, lines ${source.lines.join('–')}; ${source.chunks.join(', ')}` +
        (source.missing.length ? `. Partial transcript; missing entries: ${source.missing.join(', ')}` : '');
      return item;
    }));
    el('coach-result').hidden = false;
    el('result-heading').textContent = mode === 'drill' ? 'Practice scenario' : mode === 'feedback' ? 'Feedback' : 'Response';
    el('result-heading').focus();
    status.textContent = '';
    return result;
  } catch (error) {
    status.textContent = error instanceof SyntaxError ? 'The coach is unavailable right now.' : error.message;
    return null;
  } finally {
    button.disabled = false;
  }
}

el('coach-form').addEventListener('submit', async event => {
  event.preventDefault();
  drill = null;
  el('feedback-form').hidden = true;
  el('coach-result').hidden = true;
  const mode = el('mode').value;
  const topic = el('question').value.trim();
  const result = await submit(mode, topic, el('ask'));
  if (mode === 'drill' && result?.kind === 'drill') {
    drill = {topic, scenario: result.answer};
    el('attempt').value = '';
    el('feedback-form').hidden = false;
  }
});
el('feedback-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (!drill) return;
  const question = JSON.stringify({topic: drill.topic.slice(0, 250), scenario: drill.scenario, attempt: el('attempt').value.trim()});
  if (await submit('feedback', question, el('grade'))) {
    drill = null;
    el('feedback-form').hidden = true;
  }
});

try {
  const response = await fetch('/api/session');
  if (!response.ok) throw new Error();
  const {signedIn} = await response.json();
  status.textContent = signedIn ? '' : 'Reload Ask PMP and enter your password.';
  el('coach-form').hidden = !signedIn;
} catch {
  status.textContent = 'This copy of PMP Prep is not connected to the coach backend. You can still use the quizzes.';
}
