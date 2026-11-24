import test from 'node:test';
import assert from 'node:assert/strict';
import {drills} from './drills.mjs';
import {topics,tracks,byTopic} from './course.mjs';
import {search,nextDrill,day} from './study.mjs';
import {priorities} from './coverage.mjs';

test('every indexed topic has at least two distinct practice questions', () => {
  assert.equal(new Set(priorities.map(([id])=>id)).size, priorities.length);
  for (const [id, track,,, locator] of priorities) {
    assert.equal(byTopic[id].track, track);
    assert.ok(locator, id);
  }
  for (const topic of topics) {
    const prompts = drills.filter(d => d.concept === topic.id && d.track === topic.track).map(d => d.prompt);
    assert.ok(new Set(prompts).size >= 2, topic.id);
    assert.equal(new Set(prompts).size, prompts.length, topic.id);
  }
});

test('each track can serve every question before repeating', () => {
  for (const [track] of tracks) {
    const total = drills.filter(d => d.track === track).length;
    const history = {}, seen = new Set();
    for (let i=0; i<total; i++) {
      const d = nextDrill(drills, history, track, 0);
      assert.ok(d && !seen.has(d.id), `${track} at ${i}`);
      seen.add(d.id);
      const key = `${track}:${d.concept}`;
      history[key] = {last:d.id, due:day, attempted:[...(history[key]?.attempted ?? []), d.id]};
    }
    assert.equal(nextDrill(drills, history, track, 0), null);
    assert.ok(nextDrill(drills, history, track, day));
  }
});

test('every track has original single-best-answer questions with pinned references', () => {
  assert.equal(new Set(drills.map(d=>d.id)).size,drills.length);
  for (const [track] of tracks) assert.ok(drills.some(d=>d.track===track));
  for (const d of drills) {
    assert.equal(new Set(d.options).size,4);
    assert.ok(Number.isInteger(d.correct) && d.correct>=0 && d.correct<4);
    assert.match(byTopic[d.concept].url, /^(https:\/\/scrumguides\.org\/scrum-guide\.html|https:\/\/github\.com\/tolu-jnj\/PMP\/tree\/[0-9a-f]{40}|https:\/\/raw\.githubusercontent\.com\/tolu-jnj\/PMP\/[0-9a-f]{40}\/.+#page=\d+)$/);
  }
});
test('course search works without imports and ranks expected topics first', () => {
  assert.deepEqual(search(topics,''),topics);
  assert.equal(search(topics,'cost of quality')[0].id,'quality');
  assert.equal(search(topics,'TECOP')[0].id,'environment');
  assert.equal(search(topics,'econometric')[0].id,'forecast');
  assert.deepEqual(search(topics,'zzzxxyy'),[]);
});
test('review respects track and due date and rotates available variants', () => {
  const first=nextDrill(drills,{},'s4',0);
  const history={'s4:quality':{last:first.id,due:day}};
  assert.equal(nextDrill(drills,history,'s4',0).concept,'retro');
  assert.notEqual(nextDrill(drills,history,'s4',day).id,first.id);
  assert.equal(nextDrill(drills,history,'s1',0).concept,'gates');
});
