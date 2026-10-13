# Riftbound

A browser-based pixel art platformer RPG. The playable prologue, **The Broken Crossing**, takes place in the past and present of one fractured kingdom.

## Playable base

- Accelerated movement, variable-height jumps, coyote time, buffered jumps, wall slides and wall jumps.
- Eight-direction dash, landing recharge, and floating dash refill crystals.
- Past/present timeline switching with alternate platforms and protection against shifting into solid walls.
- Sword combat, enemy stomping, seven enemies, and a telegraphed Rift Warden boss.
- XP, levels, skill points, three upgrade paths, three Echo seals, and a hidden bell.
- Five checkpoints. Progress saves on the current device; deaths preserve earned progress.
- Pause, controls, original procedural pixel scenery, synthesized audio, fullscreen, and touch controls.

## Controls

| Action | Keys |
| --- | --- |
| Move | A / D or left / right arrows |
| Jump / wall jump | Space or C |
| Aim dash | WASD or arrow keys |
| Dash | X or Shift |
| Change timeline | Q |
| Attack | J or Z |
| Talk | E |
| Upgrades | Tab or U |
| Pause | Escape |
| Return to checkpoint | R |
| Toggle audio | M |

Collect the three Echo seals, defeat the Warden, and reach the gate. The Warden takes more damage when you attack from the timeline opposite its aura.

## Development

No runtime dependencies or external game assets. Serve `dist/` with any static HTTP server. For example, `python3 -m http.server 8000 --directory dist`, then open `http://localhost:8000`.

Run `npm test` for gameplay tests or `npm run build` to verify all game files and tests. `vercel.json` configures a static Vercel deployment using `dist/` as the output directory.

The base uses separate world data, a fixed-step physics engine, a canvas renderer, and a browser UI. Add future regions in `dist/world.js` and abilities in `dist/engine.js`.

This is the first playable foundation. There are no accounts, multiplayer, or cloud saves yet.

## Cloudflare Workers deployment

`wrangler.json` deploys the playable files in `dist/` as static assets to the
existing `taco-rpg` Worker.

In Cloudflare, open **Workers & Pages > taco-rpg > Settings > Build** and use:

| Setting | Value |
| --- | --- |
| Repository | `hoomanthatlikeschocolate-stack/taco-rpg` |
| Production branch | `main` |
| Root directory / path | `/` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Preview command | `npx wrangler versions upload` |

Save the settings and retry the latest build containing `wrangler.json`.
The preview command uploads a version without changing the live game.

For local Workers development, run `npx wrangler dev`.
