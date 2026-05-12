export interface ToneSpec {
  /** Locale identifier (e.g. 'es-PR', 'es-MX', 'es-ES', 'es-AR') */
  locale: string;
  voice: {
    /** Whether to address the user as 'tú' or 'usted' */
    tu_or_usted: 'tú' | 'usted';
    /** Overall register */
    formality: 'casual' | 'warm-direct' | 'formal' | 'professional-warm';
    /** Vocabulary the model must not use */
    forbidden?: string[];
    /** Optional notes appended to the rendered prompt */
    notes?: string[];
  };
  /** Pairs of good/bad copy examples that train the model's tone */
  corpus: ToneExample[];
  /** Article-to-noun map for English nouns absorbed into Spanish */
  gender_table?: Record<string, 'el' | 'la'>;
  /** Optional CTA patterns the output must conform to */
  required_cta_patterns?: RegExp[];
  /** Max words per sentence (catches run-on covers) */
  max_sentence_words?: number;
}

export interface ToneExample {
  good: string;
  bad: string;
  /** Optional reason this pair illustrates */
  reason?: string;
}

export interface ValidationResult {
  passed: boolean;
  errors: Violation[];
  warnings: Violation[];
}

export interface Violation {
  rule: string;
  message: string;
  match?: string;
  severity: 'error' | 'warning';
}

export interface SimilarityScore {
  /** 0..1, higher = closer to 'good' cluster */
  score: number;
  closest_good?: string;
  closest_bad?: string;
}

/**
 * Render a ToneSpec into a markdown-formatted prompt section.
 * Inject the return value into your system prompt; the model will
 * follow it for the rest of the conversation.
 */
export function renderToneSpec(spec: ToneSpec): string {
  const lines: string[] = [];
  lines.push(`## Spanish Tone Specification`);
  lines.push('');
  lines.push(`You write in **${spec.locale}** Spanish.`);
  lines.push('');
  lines.push(`### Voice`);
  lines.push(`- Address: **${spec.voice.tu_or_usted}**`);
  lines.push(`- Register: **${spec.voice.formality}**`);
  if (spec.voice.forbidden?.length) {
    lines.push(`- Never use: ${spec.voice.forbidden.map(w => `\`${w}\``).join(', ')}`);
  }
  if (spec.voice.notes?.length) {
    for (const note of spec.voice.notes) lines.push(`- ${note}`);
  }
  lines.push('');

  if (spec.corpus.length) {
    lines.push(`### Tone examples (write like the "good" column)`);
    lines.push('');
    lines.push(`| ✓ Good | ✗ Bad |`);
    lines.push(`|--------|-------|`);
    for (const ex of spec.corpus) {
      lines.push(`| ${escapeCell(ex.good)} | ${escapeCell(ex.bad)} |`);
    }
    lines.push('');
  }

  if (spec.gender_table && Object.keys(spec.gender_table).length) {
    lines.push(`### Gender (for English nouns absorbed into Spanish)`);
    for (const [noun, art] of Object.entries(spec.gender_table)) {
      lines.push(`- **${art} ${noun}** (never \`${art === 'el' ? 'la' : 'el'} ${noun}\`)`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function escapeCell(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

/**
 * Validate generated output against a ToneSpec.
 * Hard violations become errors; soft violations become warnings.
 */
export function validateOutput(text: string, spec: ToneSpec): ValidationResult {
  const errors: Violation[] = [];
  const warnings: Violation[] = [];

  // Forbidden vocabulary
  if (spec.voice.forbidden) {
    for (const word of spec.voice.forbidden) {
      const re = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i');
      const m = text.match(re);
      if (m) {
        errors.push({
          rule: 'forbidden_vocabulary',
          message: `Forbidden term used: "${word}"`,
          match: m[0],
          severity: 'error',
        });
      }
    }
  }

  // Run-on sentences
  if (spec.max_sentence_words) {
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
    for (const s of sentences) {
      const words = s.split(/\s+/).length;
      if (words > spec.max_sentence_words) {
        errors.push({
          rule: 'run_on_sentence',
          message: `Sentence exceeds ${spec.max_sentence_words} words (${words} words)`,
          match: s.slice(0, 60) + '…',
          severity: 'error',
        });
      }
    }
  }

  // Required CTA patterns
  if (spec.required_cta_patterns?.length) {
    const anyMatch = spec.required_cta_patterns.some(re => re.test(text));
    if (!anyMatch) {
      errors.push({
        rule: 'missing_cta',
        message: 'No required CTA pattern matched',
        severity: 'error',
      });
    }
  }

  // Gender drift (soft)
  if (spec.gender_table) {
    for (const [noun, correctArt] of Object.entries(spec.gender_table)) {
      const wrongArt = correctArt === 'el' ? 'la' : 'el';
      const re = new RegExp(`\\b${wrongArt}\\s+${escapeRegex(noun)}\\b`, 'i');
      const m = text.match(re);
      if (m) {
        warnings.push({
          rule: 'gender_drift',
          message: `"${noun}" should use "${correctArt}", got "${wrongArt}"`,
          match: m[0],
          severity: 'warning',
        });
      }
    }
  }

  return { passed: errors.length === 0, errors, warnings };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Score how close `text` sits to the "good" cluster of a corpus.
 * Naive implementation: token overlap. Replace with embeddings for production.
 */
export function validateAgainstCorpus(text: string, corpus: ToneExample[]): SimilarityScore {
  const tokens = tokenize(text);
  let bestGood = 0;
  let bestBad = 0;
  let closestGood: string | undefined;
  let closestBad: string | undefined;

  for (const ex of corpus) {
    const goodOverlap = jaccard(tokens, tokenize(ex.good));
    const badOverlap = jaccard(tokens, tokenize(ex.bad));
    if (goodOverlap > bestGood) { bestGood = goodOverlap; closestGood = ex.good; }
    if (badOverlap > bestBad) { bestBad = badOverlap; closestBad = ex.bad; }
  }

  const score = bestGood / (bestGood + bestBad + 1e-9);
  return { score, closest_good: closestGood, closest_bad: closestBad };
}

function tokenize(s: string): Set<string> {
  return new Set(s.toLowerCase().split(/\W+/).filter(w => w.length > 2));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  const inter = new Set([...a].filter(x => b.has(x)));
  const union = new Set([...a, ...b]);
  return inter.size / (union.size || 1);
}
