# Roblox dream opening — updated prototype

The same unnamed opening, now built around surreal exploration rather than obstacle-course jumps.

## Open and play

Download **Opening.rbxlx**, open it in Roblox Studio with **File → Open from File**, and press **Play**. The map, prompts, camera sequence, animation modules and music are already inside. Open this updated file when testing; an older Studio place does not pull GitHub changes automatically.

- WASD / native touch controls: walk and explore.
- Mouse / native camera controls: look around.
- E / gamepad X / native touch prompt: interact with dream objects and doors.
- R / gamepad Y / Return to path touch button: return safely to the last reached checkpoint.
- M: music on/off. V: full/reduced effects.
- Space remains Roblox's normal jump control, but **the entire route is walkable without jumping**.

## Dream changes

A continuous shallow dream sea connects the whole map. Follow the pale path past a floating bed, backwards clocks, hovering paper fish, suspended furniture, an enormous door, an inverted bedroom and a staircase leading nowhere. Touch familiar objects for contextual dialogue. A little door leads to a hallway that cannot fit behind it; leaving the hallway returns you somewhere else. The real front door ends the dream.

The floor, route lights and personal safety light stay readable as scenery distorts. Color, fog, prop movement and music change gradually. Full darkness happens after reaching the exit, during the cinematic blackout, rather than while navigating. An idle timeout eventually advances the story after four minutes.

## Bedtime sequence

The local cinematic actor now has segmented legs and arms. He walks with bent knees and counter-swinging arms, turns at the bed, sits, reaches for the lamp, turns it off, lies back, pulls up the blanket, closes his eyes and breathes. The camera follows his face into the dream.

After the dream, you return to the same room and the same clock time. Red eyes appear in the closet. The bedside lamp fails. Replay becomes available after the reveal.

## Falling and reset fixes

- Main ground is continuous, with invisible edge barriers and a backup safety floor.
- Checkpoints and portal destinations are inside the solid floor.
- Ground recovery uses a server raycast, avatar-aware R6/R15 clearance, zero linear/angular velocity, a short anchored stabilization, and a brief client control reset.
- Recovery retains memories, corruption and the furthest checkpoint.
- Ready/status queries send a snapshot and **never teleport the player**. This prevents respawn queries from overriding checkpoint recovery.
- R and the touch return button provide a manual escape if the character gets stuck.

## Music

Real Creator Store / APM asset IDs are configured, with quiet bedroom music, an ambient dream theme, a pitched-down dread layer, reverb, gradual filtering, crossfades and an awakening sting. M or the Music button mutes it. See **AUDIO-CREDITS.md** for asset links and availability notes. Audio loads asynchronously and never blocks the opening.

## Editing

Expand **Workspace → OpeningWorld** to edit Bedroom, Dream and Markers. The solid floor and boundaries are in **Dream → Walkable**. Keep marker names intact. The actor template is in **ReplicatedStorage → OpeningAssets → Sleeper**.

The prebuilt place contains all scripts:

- Config, State, Navigation, ActorAnimator and Music: ModuleScripts in ReplicatedStorage/OpeningShared.
- OpeningServer.server.lua: Script in ServerScriptService.
- OpeningClient.client.lua: LocalScript in StarterPlayer/StarterPlayerScripts.

Edit their corresponding files in **src/**. Rebuild and validate with:

    python3 build_place.py
    python3 check_project.py

Rebuilding regenerates modeled geometry, so export Studio edits before rebuilding if you want to keep them.

## Validation

The XML, references, transforms, embedded source and seven scripts were checked. Every segment of the walking route and every recovery/portal marker is checked against the solid floor. Executed tests cover phase flow, corruption limits, R6/R15 clearance, memory retention, actual server recovery, velocity clearing, manual return and Ready queries that cannot teleport.

**Roblox Studio is unavailable here**, so native rendering, the new body animation and audio playback still need a Studio playtest. This file has not been published to your Roblox account.

Official references: [place files](https://create.roblox.com/docs/projects/place-files), [camera control](https://create.roblox.com/docs/workspace/camera), [audio](https://create.roblox.com/docs/audio).
