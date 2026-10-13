# Riftbound — The Unremembering

A browser platformer RPG about a missing brother, a kingdom that traded away its memories, and the dark world that learned to use them.

## Play

Play through **The Broken Crossing** and **The Drowned Archive**. Speak to Maelin, recover the three Echoes, restore their lanterns, free Captain Lumen from his oath, and follow Ivo's torn pages into the Archive. The final conversation offers two endings; both let you keep exploring.

- W jumping, forgiving jump buffering, continuous wall climbing and automatic ledge pull-ups.
- Eight-direction dash, double jump, ranged Rift Bolts, protective Ward Pulse and a second air dash.
- Four upgrade paths, XP, levels, focus, health, checkpoints and unlocked fast travel.
- Distinct characters, changing conversations, seven readable inscriptions and three story pages.
- Pip's gear quest, Sera's lantern quest, two hidden relics, supply caches and a replayable timed bell challenge.
- Charging husks, shooting watchers, treasure mimics, moving hazards and a three-pattern Warden fight.
- A darker Hollow with watching silhouettes and distortion; original adaptive music for Before, the Hollow, the Archive and the boss.
- Quest guidance, journal, power explanations, touch controls, sound volume and reduced screen movement.
- Saves remain on the current device. Earlier saves migrate with earned upgrades and Crossing completion preserved.

## Controls

| Action | Key |
| --- | --- |
| Move | A / D or left / right |
| Jump | W or up |
| Climb | Hold W while pressing A/D into a wall |
| Double jump | Release and press W again, after the first lantern |
| Dash / aim | X or Shift, aimed with WASD |
| Change realm | Q |
| Sword combo | Hold J or Z |
| Rift Bolt | K, after the second lantern |
| Ward Pulse | L, after the third lantern |
| Talk / read / restore / open | E |
| Quest journal / lore / fast travel | F |
| Upgrades | U or Tab |
| Pause | Escape |
| Return to checkpoint | R |
| Sound | M |

Space is no longer the jump key. The first lantern unlocks Second Wind, the second unlocks Rift Bolt, and the third unlocks Ward Pulse. Finishing Ivo's story unlocks Echo Step.

## Development

Edit the **root source files**: world.js contains the levels and interactables; story.js contains quests and dialogue; engine.js handles gameplay; render.js draws the pixel art; app.js handles the interface; music.js creates the original soundtrack.

Run npm run build or npm test. The build copies root source files into dist/, checks every JavaScript module, and runs the gameplay tests. Do not edit generated copies in dist/.

No runtime dependencies or downloaded game assets are required. For a local preview, run:

    npm run build
    python3 -m http.server 8000 --directory dist

Open http://localhost:8000. For Workers development, use npx wrangler dev.

## Cloudflare deployment

The existing taco-rpg Worker serves the game assets from dist/ through wrangler.json.

| Setting | Value |
| --- | --- |
| Repository | hoomanthatlikeschocolate-stack/taco-rpg |
| Production branch | main |
| Root directory | / |
| Build command | npm run build |
| Deploy command | npx wrangler deploy |
| Preview command | npx wrangler versions upload |

Pushes to main deploy through the existing Cloudflare connection. The preview command uploads a version without changing production.

There are two playable areas in this release. More worlds can extend the journey beyond Ivo's story. There are no accounts, multiplayer or cloud saves.
