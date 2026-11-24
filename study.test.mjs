import test from 'node:test';
import assert from 'node:assert/strict';
import {drills} from './drills.mjs';
import {topics,tracks,byTopic} from './course.mjs';
import {search,nextDrill,day} from './study.mjs';

test('every track has original single-best-answer questions with pinned references', () => {
  assert.equal(new Set(drills.map(d=>d.id)).size,drills.length);
  for (const [track] of tracks) assert.ok(drills.some(d=>d.track===track));
  for (const d of drills) {
    assert.equal(new Set(d.options).size,4);
    assert.ok(Number.isInteger(d.correct) && d.correct>=0 && d.correct<4);
    assert.match(byTopic[d.concept].url, /\/[0-9a-f]{40}\/.+#page=\d+$/);
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
