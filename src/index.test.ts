import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderToneSpec, validateOutput, validateAgainstCorpus, ToneSpec } from './index.js';

const sampleSpec: ToneSpec = {
  locale: 'es-PR',
  voice: {
    tu_or_usted: 'tú',
    formality: 'warm-direct',
    forbidden: ['cafre'],
  },
  corpus: [
    { good: 'Mira lo que armamos para tu negocio', bad: 'Echa un vistazo a lo que hemos creado' },
  ],
  gender_table: { WhatsApp: 'el', app: 'la' },
  max_sentence_words: 30,
};

test('renderToneSpec emits the locale', () => {
  const out = renderToneSpec(sampleSpec);
  assert.match(out, /es-PR/);
  assert.match(out, /tú/);
  assert.match(out, /warm-direct/);
});

test('validateOutput flags forbidden vocabulary as error', () => {
  const r = validateOutput('Esto es bien cafre la verdad', sampleSpec);
  assert.equal(r.passed, false);
  assert.ok(r.errors.some(e => e.rule === 'forbidden_vocabulary'));
});

test('validateOutput flags gender drift as warning', () => {
  const r = validateOutput('Te lo paso por la WhatsApp ahora.', sampleSpec);
  assert.ok(r.warnings.some(w => w.rule === 'gender_drift'));
});

test('validateOutput passes clean output', () => {
  const r = validateOutput('Mira lo que armamos. Te lo paso por el WhatsApp ahora.', sampleSpec);
  assert.equal(r.passed, true);
});

test('validateAgainstCorpus returns a score in 0..1', () => {
  const score = validateAgainstCorpus('Mira lo que armamos para tu negocio hoy', sampleSpec.corpus);
  assert.ok(score.score >= 0 && score.score <= 1);
});
