# Roblox horror prototype

The current game is an **unnamed native Roblox game**. Its editable scripts, generated map and self-contained Studio place are in [roblox/](roblox/).

Download [Opening.rbxlx](roblox/Opening.rbxlx), open it in **Roblox Studio → File → Open from File**, and press **Play**. All code is already embedded.

The latest version includes the corrected bed choreography, an interactive dream that stays peaceful for 45 seconds and wakes you automatically at 90 seconds, the dark-bedroom reveal, a morning news report, breakfast, driving to a fast-food shift, three customer orders, cleanup, driving home and going to sleep again.

See [the Roblox instructions](roblox/README.md) for controls, editing and validation. Open the updated place file to receive changes; GitHub does not synchronize an already-open Studio place automatically.

## Source and checks

    cd roblox
    python3 build_place.py
    python3 check_project.py

The checks validate generated geometry, embedded scripts, state progression, both drives and actual server code using service substitutes. A Roblox Studio playtest is still required for engine rendering, animations, device controls and audio.

The older browser prototype remains in the repository root and uses the existing Cloudflare Worker deployment. The current native Roblox game is in **roblox/**.
