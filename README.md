# spanish-tone-spec

> Prompt-side Spanish locale tone control for LLM output. No post-hoc regex.

[![npm](https://img.shields.io/npm/v/spanish-tone-spec.svg)](https://www.npmjs.com/package/spanish-tone-spec)
[![license](https://img.shields.io/npm/l/spanish-tone-spec.svg)](./LICENSE)

LLMs default to neutral or Mexican Spanish. If you're shipping Spanish-language product copy for Puerto Rico, the Caribbean, Spain, or any specific Spanish-speaking market, that's a tone mismatch. `spanish-tone-spec` is a small, declarative format for telling an LLM exactly how to sound — and a runtime validator that catches drift before it ships.

**What it is not:** a regex post-processor. Tone fixes live in the prompt and corpus, never after the model call.

## Install

```bash
npm install spanish-tone-spec
```

## Quick start

```ts
import { renderToneSpec, validateOutput } from 'spanish-tone-spec';
import { generate } from 'ai';

const tone = {
  locale: 'es-PR',
  voice: {
    tu_or_usted: 'tú',
    formality: 'warm-direct',
    forbidden: ['cafre', 'overly-formal-spanish-spain-vocabulary'],
  },
  corpus: [
    { good: 'Mira lo que armamos para tu negocio', bad: 'Echa un vistazo a lo que hemos creado' },
    { good: 'Te lo paso por WhatsApp', bad: 'Te lo envío a través de WhatsApp' },
  ],
  gender_table: {
    'WhatsApp': 'el',
    'app': 'la',
    'demo': 'la',
    'feedback': 'el',
  },
};

// 1. Render into your system prompt
const systemPrompt = `You write product copy.\n\n${renderToneSpec(tone)}`;

// 2. Generate
const result = await generate({ system: systemPrompt, prompt: userQuery });

// 3. Validate (throws on hard violations, warns on soft)
const { passed, errors, warnings } = validateOutput(result, tone);
```

## Why this exists

I built [Lupa](https://janfaris.com) — an AI sales tool for Puerto Rican small businesses — and the first version generated copy that PR business owners described as *"correct, but it doesn't sound like us."* Three rounds of regex post-processing made it worse (broke valid Spanish, missed real issues).

The fix: encode the tone rules upstream, then validate downstream. Hard rules (run-on covers, missing CTAs) throw. Soft rules (gender drift, brand voice mismatches) surface as warnings the operator can override.

After 4 months of production use in Lupa, this library is the extracted, reusable version of that approach.

## Locales supported

- `es-PR` (Puerto Rico) — primary
- `es-MX` (México)
- `es-ES` (España)
- `es-AR` (Argentina)
- Custom locales via `LocaleConfig` interface

## API

### `renderToneSpec(spec): string`

Returns a markdown-formatted prompt section ready to inject into a system prompt. ~600-1200 tokens depending on corpus size.

### `validateOutput(text, spec): ValidationResult`

Returns `{ passed: boolean, errors: HardViolation[], warnings: SoftViolation[] }`.

**Hard violations (throw by default):**
- Forbidden vocabulary present
- Cover-page run-on (any sentence > N words)
- Missing required CTA pattern

**Soft violations (warnings):**
- Gender drift (`la WhatsApp` instead of `el WhatsApp`)
- Brand voice drift (formality mismatch)
- Calque from English (overly literal translation)

### `validateAgainstCorpus(text, corpus): SimilarityScore`

LLM-as-judge helper. Pass it your corpus examples; it returns a 0-1 score of how close the output sits to the "good" cluster vs. the "bad" cluster.

## When to use

✅ You're shipping Spanish product copy in a specific market
✅ Generic Spanish output feels off but you can't articulate why
✅ You already tried regex post-processing and it made things worse

❌ You want a translation library (use DeepL)
❌ You don't have time to build a corpus (you need 5-15 examples minimum)

## Roadmap

- [ ] Catalan / Galician spec extensions
- [ ] LangChain + Mastra adapters
- [ ] CLI for spec validation
- [ ] Auto-corpus generation from existing copy

## License

MIT © Jan Faris
