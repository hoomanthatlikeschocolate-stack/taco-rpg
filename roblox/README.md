# Roblox opening prototype

The same unnamed opening, rebuilt as a native 3D Roblox place.

## Open and play

1. Download **Opening.rbxlx**.
2. In Roblox Studio, use **File → Open from File** and select it.
3. Press **Play** (F5). Click **Go to sleep**.

The character walks to bed, lies down, closes his eyes, and the camera moves into his head. The dream becomes first person: walk with WASD, look with the mouse, and jump with Space. Follow three floating lights toward the distant door. The meadow deforms, fog thickens, the picture tears, colors die, and the dream turns black. Waking returns you to the same bedroom and the same clock time. Red eyes appear inside the closet. E tries the bedside lamp; it fails. Replay is available after the final reveal.

Native Roblox movement controls also support touch and gamepad. The lamp has a touch button, and gamepad X interacts. Reduced effects disables screen tears and scenery motion while keeping the story.

## What's in the file

- An editable bedroom with walls, window, bed, bedding, rug, desk, books, nightstand, clock, lamp, closet and hidden red eyes.
- A 3D floating meadow with eight safe landing platforms, trees, flowers, strange lamps, three memories, clouds, silhouettes and an exit door.
- A local cinematic actor and camera sequence. Effects and story progression are separate for each player.
- Server-controlled phases, checkpoint returns after falls, validated interactions, gradual corruption, a false awakening and replay.

The geometry is already inside the place; no asset packs, HTTP requests or script pasting are needed.

## Editing

Expand **Workspace → OpeningWorld** to edit Bedroom, Dream and Markers. Keep marker names intact; scripts reference them. Bedroom props are normal anchored parts. The actor template lives in **ReplicatedStorage → OpeningAssets → Sleeper**.

Scripts are also provided separately in **src/**:

- Config.lua → ReplicatedStorage/OpeningShared/Config (ModuleScript)
- State.lua → ReplicatedStorage/OpeningShared/State (ModuleScript)
- OpeningServer.server.lua → ServerScriptService/OpeningServer (Script)
- OpeningClient.client.lua → StarterPlayer/StarterPlayerScripts/OpeningClient (LocalScript)

The prebuilt file already contains all four. Rebuild it from source with `python3 build_place.py`. Run `python3 check_project.py` for XML, transform, embedded-source, Lua-compatible syntax and state checks. Rebuilding regenerates the modeled scene; export Studio edits before rebuilding if you want to retain them.

Audio slots in Config.Sounds are blank until you upload your own Roblox audio and enter its asset IDs. The visual opening works without audio. To collaborate on the live Studio project, publish it under your account and give your friend edit access through Roblox collaboration settings; both of you can then work in Studio.

## Validation

The generated XML, object paths, references, transforms and scripts were checked outside Roblox Studio. The phase state machine was exercised with executed tests. **Studio is unavailable in the build environment, so the first in-engine playtest is still required.** The project has not been published to your Roblox account.

Official references: [Roblox place files](https://create.roblox.com/docs/projects/place-files), [camera control](https://create.roblox.com/docs/workspace/camera).
