/**
 * Tests légers du catalogue d’incidents (sans serveur HTTP).
 * node --test src/data/incidents.test.js
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { INCIDENTS, pickIncident, STAGES } = require('./incidents');
const { BODIES, CREW_RATES, PLANTS, SRC } = require('./science');

describe('incident catalog', () => {
  it('has required pedagogical fields', () => {
    for (const inc of INCIDENTS) {
      assert.ok(inc.id, 'id');
      assert.ok(inc.title?.fr && inc.title?.en, 'title bilingual');
      assert.ok(inc.cause?.fr, 'cause');
      assert.ok(inc.danger?.fr, 'danger');
      assert.ok(inc.whatToDo?.fr, 'whatToDo');
      assert.ok(typeof inc.timeLimitSec === 'number' && inc.timeLimitSec > 0, 'timeLimitSec game rule');
      assert.ok(['low', 'medium', 'high', 'critical'].includes(inc.urgency), 'urgency');
      assert.ok(Array.isArray(inc.resources) && inc.resources.length, 'resources');
      assert.ok(Array.isArray(inc.stages) && inc.stages.length >= 3, 'stages');
      assert.ok(inc.failEffects && typeof inc.failEffects === 'object', 'failEffects');
      assert.ok(inc.successEffects && typeof inc.successEffects === 'object', 'successEffects');
    }
  });

  it('pickIncident respects destination', () => {
    const moon = pickIncident('MOON', () => 0.01);
    assert.ok(moon);
    assert.ok(moon.destinations.includes('BOTH') || moon.destinations.includes('MOON'));
    const mars = pickIncident('MARS', () => 0.5);
    assert.ok(mars);
  });

  it('STAGES order is pedagogical', () => {
    assert.deepEqual(STAGES, ['diagnose', 'instruct', 'move', 'repair', 'result']);
  });
});

describe('science data', () => {
  it('bodies have sourced gravity', () => {
    assert.equal(BODIES.MOON.gravity.value, 1.62);
    assert.equal(BODIES.MARS.gravity.value, 3.71);
    assert.ok(BODIES.MOON.gravity.url.includes('nasa') || BODIES.MOON.gravity.source.length > 5);
  });

  it('crew rates are labeled', () => {
    assert.ok(CREW_RATES.o2KgPerPersonDay.value > 0);
    assert.ok(CREW_RATES.o2KgPerPersonDay.source);
  });

  it('plants reference NASA systems', () => {
    assert.ok(PLANTS.some((p) => p.nasaSystem.includes('Veggie')));
    assert.ok(SRC.veggie.url.includes('nasa.gov'));
  });
});
