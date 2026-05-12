# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Considering
- `es-CO` (Colombia) locale support — see [#2](https://github.com/janfaris/spanish-tone-spec/issues/2)
- LangChain + Mastra adapters — see [#3](https://github.com/janfaris/spanish-tone-spec/issues/3)
- Embedding-based corpus similarity (replacing token Jaccard) — see [#4](https://github.com/janfaris/spanish-tone-spec/issues/4)

## [0.1.0] - 2026-05-12

### Added
- Initial public release. Extracted from production use in [Lupa](https://janfaris.com).
- `ToneSpec` interface with locale, voice, corpus, gender table, max sentence words, and required CTA patterns.
- `renderToneSpec(spec)` — renders the spec into a markdown prompt section ready to inject into a system prompt.
- `validateOutput(text, spec)` — diagnostic validator. Hard violations become errors; soft violations become warnings.
- `validateAgainstCorpus(text, corpus)` — token-Jaccard similarity score against the corpus' good vs bad cluster.
- 5 unit tests covering rendering, forbidden vocabulary detection, gender drift detection, clean output, and similarity scoring.
- MIT license.
- Published to npm as [`spanish-tone-spec`](https://www.npmjs.com/package/spanish-tone-spec).

[Unreleased]: https://github.com/janfaris/spanish-tone-spec/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/janfaris/spanish-tone-spec/releases/tag/v0.1.0
