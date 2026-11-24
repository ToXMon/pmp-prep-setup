import test from 'node:test';
import assert from 'node:assert/strict';
import {drills} from './drills.mjs';
import {search, nextDrill, day} from './study.mjs';

test('search returns headings and line locators without interpreting markup', () => {
  const hits = search([{name:'fixture.md',text:'# Example\nInspect the new work.\nInspection <b>cost</b>.'}], 'inspection cost');
  assert.deepEqual(hits, [{name:'fixture.md',line:3,text:'Example: Inspection <b>cost</b>.',score:2}]);
});
test('review respects due date, track, and scenario rotation', () => {
  const first = nextDrill(drills, {}, 'quality', 0);
  assert.equal(first.id, 'q1');
  const history = {'quality:classify':{last:first.id,due:day}};
  assert.equal(nextDrill(drills, history, 'quality', day-1).id,'q3');
  assert.equal(nextDrill(drills, history, 'quality', day).id,'q2');
  assert.equal(nextDrill(drills, history, 'ethics', 0).id,'e1');
  history['quality:invest'] = {last:'q3',due:day};
  assert.equal(nextDrill(drills, history, 'quality', 0),null);
});
test('all pilot drills have a source locator and a second scenario', () => {
  assert.equal(new Set(drills.map(x=>x.id)).size,drills.length);
  for (const drill of drills) {
    assert.match(drill.citation,/PDF p\. \d+/);
    assert.ok(drills.some(other=>other.id!==drill.id && other.track===drill.track && other.concept===drill.concept));
  }
});
