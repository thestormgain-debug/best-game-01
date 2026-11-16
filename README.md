[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/thestormgain-debug/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/thestormgain-debug/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

# Embermoth

An original browser arcade game for the make.fun **best-game-01** competition: fly the moth,
guard the lantern, hold the vale against ten waves of wisps.

[![make.fun competition](https://make.fun/badge/best-game-01.svg)](https://make.fun/best-game-01)
[![rank](https://make.fun/badge/best-game-01/9ysiPAJjNsCWq4MiBLGntNqG1Xu48Ly9pSsyicXrarYB/best-game-01/rank.svg)](https://make.fun/best-game-01)
[![reward](https://make.fun/badge/best-game-01/9ysiPAJjNsCWq4MiBLGntNqG1Xu48Ly9pSsyicXrarYB/best-game-01/reward.svg)](https://make.fun/best-game-01)

## Play

`game/index.html` is plain static files — open `game/index.html` directly in desktop Chrome
(no server needed: it loads the prebuilt `game/bundle.min.js`), or serve the `game/` folder
with any static HTTP server.

- **Fly** — WASD or the arrow keys
- **Aim** — the mouse; **hold the left button** to loose sparks
- **Dash** — SPACE
- **Guard** the lantern through ten waves; between waves **choose one of three boons**
- Lose when the lantern's light or the moth's vigour runs out; win by holding all ten waves

## Source

Pure canvas 2D ES modules, one file per job under `game/src/`: `world.js` (simulation),
`waves.js` (difficulty schedule), `boons.js` (the between-wave choice), `render.js`, `hud.js`,
`screens.js`, `audio.js` (original Web Audio synth), `shots.js` (deterministic screenshot scenes).

Run the entry: `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`

Rebuild the playable bundle after editing `game/src/`:
`cd game && esbuild src/main.js --bundle --minify --format=iife --outfile=bundle.min.js`

License: MIT.
