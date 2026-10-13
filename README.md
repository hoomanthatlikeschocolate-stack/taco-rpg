# Riftbound — The Unremembering

A browser platformer RPG about a missing brother, a kingdom that traded away its memories, and the dark world that learned to use them.

## Play

Play through **The Broken Crossing** and **The Drowned Archive**. Speak to Maelin, recover the three Echoes, restore their lanterns, free Captain Lumen from his oath, and follow Ivo's torn pages into the Archive. Ivo's final conversation offers two endings; both lead into **The Unwritten House** story. Meet Orin, recover three rift keystones, confront the thing practicing your name, and decide what happens to the kingdom's stolen memories.

- W jumping, forgiving jump buffering, continuous wall climbing and automatic ledge pull-ups.
- Eight-direction dash, double jump, ranged Rift Bolts, protective Ward Pulse, a second air dash and temporary Rift Anchors.
- Four upgrade paths, XP, levels, focus, health, checkpoints and unlocked fast travel.
- Distinct characters, changing conversations, eleven readable inscriptions and three story pages.
- Pip's gear quest, Sera's lantern quest, two hidden relics, supply caches and a replayable timed bell challenge.
- Charging husks, shooting watchers, treasure mimics, moving hazards and a three-pattern Warden fight.
- The Hollow listens: loud movement raises dread, a stolen-face pursuer follows noise, and quiet movement, Before, lanterns or Ward help you escape.
- Sixteen paired rift apertures, crumbling ledges, timed platforms, silence plates and shielded sentinels. Bolts stun; flank guards or spend focus on a third-hit finisher; a fresh Ward reflects bolts.
- A new boss, The Borrowed, telegraphs copies of your recent moves. Bait its next attack and change tactics.
- Original adaptive music for Before, the Hollow, the Archive, rift chambers and boss fights.
- Quest guidance, journal, power explanations, touch controls, sound volume and reduced screen movement.
- Saves remain on the current device. Earlier saves migrate with earned upgrades and Crossing completion preserved.

## Rift chambers (0.3.0)

Numbered rifts use E. Lettered apertures open when you dash through them, preserving speed and sometimes changing realms. Match their glyphs. Release W before aiming a horizontal dash.

- **I — Folded Atrium:** west of the Broken Crossing checkpoint, after its lantern. Carry momentum through aperture A, shift onto the gold landing ledge and recover a keystone to awaken V.
- **II — Clockwell:** beside the tower, after the Woodland Lantern. Shoot the clock eye with K to hold the ledges for six seconds; plan your jumps and realm changes.
- **III — Hushed Choir:** Archive stone shelves, after Ivo's story. Hold S on the quiet stone to open a seven-second bridge, or take a noisy portal shortcut.
- **IV — Unwritten House:** beside the Wood checkpoint. Ivo's Archive ending and all three keystones open it.

V places a six-second foothold for 30 focus. Press V again to recall for 10 focus and restore your movement. The final House choice grants 20 focus capacity and either slows dread or reduces Ward cooldown.

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
| Talk / read / restore / enter rift | E |
| Quiet walk / silence plate | Hold S |
| Place / recall Rift Anchor | V, after the Fold keystone |
| Quest journal / lore / fast travel | F |
| Upgrades | U or Tab |
| Pause | Escape |
| Return to checkpoint | R |
| Sound | M |

Space is no longer the jump key. The first lantern unlocks Second Wind, the second unlocks Rift Bolt, and the third unlocks Ward Pulse. Finishing Ivo's story unlocks Echo Step.

## Development

Edit the **root source files**: world.js contains the levels and interactables; story.js contains quests and dialogue; engine.js handles gameplay; rifts.js handles portal, dread and chamber systems; rift-story.js contains the third chapter; render.js draws the pixel art; app.js handles the interface; music.js creates the original soundtrack.

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

This release includes two overworld regions, three distinct traversal chambers and a final arena. Version-one and version-two saves migrate automatically. There are no accounts, multiplayer or cloud saves.
