# Roblox opening and first playable day

An unnamed native Roblox horror prototype. Download **Opening.rbxlx**, open it in **Roblox Studio → File → Open from File**, and press **Play**. All geometry, scripts, prompts, UI and configured music are embedded. No script pasting is needed.

Open this newly downloaded place to test the update. An older open Studio place does not automatically load changes from GitHub. Publishing to your existing Roblox experience is a separate action in Studio.

## What happens

1. A black loading cover and a client-ready spawning handshake prevent the player's account avatar from appearing before the cinematic.
2. The character walks around the furniture, lifts a hinged section of the blanket, gets underneath it, settles the blanket over his body and falls asleep. The camera moves toward his head.
3. You explore a dream with a continuous walkable floor, floating furniture and books, backwards clocks, rising rain, paper fish, a phone, a cup full of stars and lanterns. Six objects can be interacted with; a small door opens into an impossible hallway.
4. **Nothing glitches or corrupts during the first 45 seconds**, regardless of exploration or interactions. Distortion then builds gradually. At **90 seconds**, the dream wakes you automatically. Doors never control waking.
5. The bedroom is darker. Red eyes appear in the closet, then disappear. After the glow fades, E turns on the lamp and the character gets out of bed.
6. Walk to the couch and watch the news. A fictional report describes two unexplained overnight deaths. It is presented on the TV and in timed subtitles.
7. The character says, “I should probably eat some breakfast.” Take bread from the fridge, use the toaster, wait for it to pop and eat.
8. Get into the car, drive along the road to work, slow down and park. Walk into the fast-food restaurant.
9. Take three different orders, prepare the requested burgers, fries and drinks, and serve them. Wipe the counter and empty the trash to finish the shift. A coworker can be spoken to.
10. Drive home, enter the house and go to bed again. The prototype finishes at the second bedtime and offers replay.

An objective and a small glowing marker guide each daytime task. Actions are validated on the server and cannot skip the news, toast timer, orders or cleanup.

## Controls

| Action | Keyboard | Other input |
| --- | --- | --- |
| Walk / explore | WASD | Native Roblox touch controls or gamepad |
| Interact | E | Gamepad X or native touch prompt |
| Jump | Space | Native Roblox jump control; the dream needs no jumps |
| Recover in dream | R | Gamepad Y or Return to path button |
| Drive | W accelerate, S brake/reverse, A/D steer | Touch driving pad or gamepad left stick |
| Park at destination | E, after slowing down | Gamepad X or Park button |
| Music | M or Music button | Music button |
| Reduced effects | V or Effects button | Effects button |

Cars use server-owned arcade movement on a continuous bounded road. Releasing the controls brakes; stale input also brakes. Parking requires reaching the destination at low speed.

## Editing

- Workspace → OpeningWorld → Bedroom: bed, cloth panels, closet, couch and TV.
- OpeningWorld → Dream: surreal objects, prompts and solid Walkable floor.
- OpeningWorld → Day: Kitchen, Street, Restaurant, cars and daytime interactions.
- OpeningWorld → Markers: choreography, spawn, recovery and parking locations.
- ReplicatedStorage → OpeningAssets → Sleeper: the segmented cinematic character.
- ReplicatedStorage → OpeningShared: Config, State, Navigation, Driving, ActorAnimator and Music.
- ReplicatedFirst: Loading and OpeningClient LocalScripts. The main client starts here so it can request avatar spawning only after its UI and event receivers exist.
- ServerScriptService: OpeningServer.

The corresponding editable sources are in **src/**. Rebuild owned geometry and embedded scripts with:

    python3 build_place.py
    python3 check_project.py

The generator uses **build_day.py** for the house extension and workday. Rebuilding replaces generated geometry; export Studio changes before rebuilding to preserve hand edits.

Config owns the 45-second delay, 90-second waking timer, report text, order recipes, audio IDs and car tuning. Story state is kept per player for the running session. This prototype does not yet persist progress between sessions.

## Recovery and visibility

The dream floor has no platform gaps. Edge barriers, a backup floor, checkpoints, ground raycasts, avatar-aware clearance, velocity clearing and brief stabilization prevent endless falling. R returns to the furthest reached checkpoint without losing interactions or resetting the dream timer. Daytime falling returns to a safe location while retaining quest progress.

The floor, path lights and local safety light stay readable during corruption. Full black occurs during the waking transition. Reduced effects and music controls are available throughout.

## Audio

Configured Creator Store / APM tracks provide bedroom music, a dream theme, a dread layer, an awakening sting and quiet daytime background music. The TV report uses text and subtitles; it has no uploaded voice recording. See **AUDIO-CREDITS.md**. Asset playback depends on Roblox availability and experience permissions.

## Validation

The generated XML, references, transforms and embedded sources pass checks. All nine Lua-compatible scripts compile. Geometry checks cover the cinematic walking route, dream recovery points, connected house/street ground and parking areas.

Executed tests cover the strict quiet period, automatic waking, disappearing-eye/lamp timing, breakfast, every order, cleanup, both drives and second bedtime. The actual server script is run with service substitutes to exercise the loading handshake, checkpoint recovery, velocity clearing, invalid quest actions and a complete playthrough.

**Roblox Studio is unavailable in this environment.** Native rendering, bed animation, device controls and audio still need a Studio playtest. This place has not been published to a Roblox account.

Official references: [loading screens](https://create.roblox.com/docs/players/loading-screens), [character spawning](https://create.roblox.com/docs/reference/engine/classes/Players), [camera control](https://create.roblox.com/docs/workspace/camera), [audio](https://create.roblox.com/docs/audio).
