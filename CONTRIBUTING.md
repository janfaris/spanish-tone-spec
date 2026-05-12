# Contributing

Thanks for considering a contribution! This is a small, focused library — please file an issue before opening a PR for non-trivial changes so we can align.

## Filing an issue

Please include:
- Locale + voice config you're using
- Input text or use case
- Expected vs actual behavior
- Reproduction snippet if you can

## Adding a new locale

`spanish-tone-spec` is locale-agnostic by design. To add a new locale:

1. Create a corpus of 15–50 good/bad pairs that exemplify the locale's voice.
2. Build a gender table for English nouns commonly absorbed into that locale's Spanish.
3. Document forbidden vocabulary specific to the locale.
4. Open an issue with the proposed `ToneSpec`. Tests welcome.

## Code style

- TypeScript strict mode.
- One responsibility per function.
- Tests in `src/*.test.ts` using `node --test`.
- No dependencies beyond what's already in `package.json`.

## License

By contributing, you agree your contributions are licensed under MIT.
