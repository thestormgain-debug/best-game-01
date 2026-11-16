// Embermoth's hand-in program (Node 22, standard library only).
//
// What it does, in order:
//   1. copies this repository's game/ and screenshots/ folders into /output (or, outside the
//      grader's container, into whatever MAKEFUN_OUTPUT_DIR names),
//   2. writes /output/dossier.json — the summary the judge reads — with buildDossier from the
//      vendored make.fun library, byte for byte what the site's own scorer rebuilds.
// The caps below mirror the scorer's own: only text_max_bytes shapes the dossier's text, the rest
// refuse an entry the scorer would refuse anyway.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repository = fileURLToPath(new URL('.', import.meta.url));
const output = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(output, { recursive: true });
cpSync(join(repository, 'game'), join(output, 'game'), { recursive: true });
mkdirSync(join(output, 'screenshots'), { recursive: true });
if (existsSync(join(repository, 'screenshots'))) {
  cpSync(join(repository, 'screenshots'), join(output, 'screenshots'), { recursive: true });
}

writeFileSync(
  join(output, 'dossier.json'),
  buildDossier(output, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
