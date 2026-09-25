// Run with `npm test`. Also proves data/roadmap.yaml passes its schema.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadRoadmap } from './roadmap.ts';
import { createPlan } from './plan.ts';

const data = loadRoadmap();
const plan = createPlan(data, { startDate: '2026-09-28', skipRace: false });
const noRace = createPlan(data, { startDate: '2026-09-28', skipRace: true });

test('roadmap covers every day with a phase', () => {
  for (let d = 1; d <= data.meta.days; d++) assert.ok(plan.phaseOf(d), `day ${d}`);
});

test('race days have no tasks; skipping the race extends week 8', () => {
  assert.equal(plan.phaseOf(55).id, 'race');
  assert.ok(plan.isRestDay(55) && plan.isRaceDay(56));
  assert.equal(plan.tasksByDay[56].length, 0);

  assert.equal(noRace.race, undefined);
  assert.equal(noRace.phaseOf(56).id, 'w8');
  assert.ok(noRace.tasksByDay[55].length > 0);
  assert.ok(!noRace.isRaceDay(56));
});

test('dates follow the start date', () => {
  assert.equal(plan.fmtLong(1), 'Mon, 28 Sep');
  assert.equal(plan.fmtFull(56), 'Sun, 22 Nov 2026');
  assert.equal(plan.dayFor(new Date(2026, 8, 28, 23, 59)), 1);
  assert.equal(plan.dayFor(new Date(2026, 9, 4)), 7);
  assert.equal(plan.dayFor(new Date(2026, 0, 1)), 1); // before start clamps
  assert.equal(plan.dayFor(new Date(2027, 0, 1)), 60); // after end clamps
  assert.equal(plan.startsIn(new Date(2026, 8, 25)), 3);

  const wed = createPlan(data, { startDate: '2026-09-30', skipRace: false });
  assert.equal(wed.fmtLong(1), 'Wed, 30 Sep');
  assert.equal(wed.tasksByDay[4].length, 3); // day 4 is a Saturday: weekend blocks
});

test('task blocks follow the daily rhythm', () => {
  const tue = plan.tasksByDay[2].map((t) => t.kind);
  assert.deepEqual(tue, ['learn', 'build', 'interview', 'capture']);
  assert.deepEqual(plan.tasksByDay[3].map((t) => t.kind), ['learn', 'build', 'capture']);
  assert.equal(plan.tasksByDay[6][0].min, 135); // Saturday deep build
  assert.equal(plan.tasksByDay[57][2].title, 'Behavioural mock (4th mock)');
  assert.equal(plan.tasksByDay[1][0].url, 'https://www.youtube.com/watch?v=7xTGNNLPyMI'); // learn block links its resource
  const ids = plan.tasksByDay.flat().map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length);
});
