# Playable opening

An unnamed game prototype. The character walks to bed, falls asleep, and the camera moves into his head. The player explores a peaceful dream. Distance and time gradually corrupt the scenery, distort the soundtrack, and turn the world black. After a blackout, the same bedroom returns. Red eyes appear in its open closet.

## Controls

- A/D or left/right: move in the dream; look around after waking.
- W or up: jump. Hold for a higher jump.
- X or Shift: dash; land to recharge.
- E: enter the dream's exit door or try the bedside lamp after waking.
- Escape: pause.

Touch buttons are available on touch devices. Sound begins after pressing Go to sleep. Sound and reduced effects settings persist locally. The opening can be replayed after the final scene; no game name is assigned.

## Development

Edit root source files. Run `npm run build` or `npm test` to regenerate `dist/`, check JavaScript syntax, and run the opening tests. For a local preview, run `python3 -m http.server 8000 --directory dist` after building.

`engine.js` owns sequence timing and dream physics. `render.js` draws the pixel scenes and distortion. `audio.js` synthesizes the soundscape. `app.js` manages input, overlays and the animation loop.

The existing Cloudflare Worker serves `dist/`. Pushes to main deploy through the existing connection; the deploy command remains `npx wrangler deploy`.
