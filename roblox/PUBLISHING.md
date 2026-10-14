# Publish from your Chromebook

An existing empty Roblox experience can become this game. Uploading replaces the selected place's current contents. It does not change who can access the game.

## Choose the destination

1. Open [Creator Dashboard](https://create.roblox.com/dashboard/creations).
2. Choose an empty experience that you want to use for the sleeping game.
3. Open its Places page and select its start place.
4. Copy that configuration page's address. It contains both IDs:

   https://create.roblox.com/dashboard/creations/experiences/UNIVERSE_ID/places/PLACE_ID/configure

You can share that address in chat. IDs are not credentials. The existing experience's display name can be changed separately in Creator Dashboard.

## Add the publishing key

1. Open [Roblox API Keys](https://create.roblox.com/dashboard/credentials).
2. Create an API key named Sleeping game publishing.
3. Add the universe-places API with Write access, restricted to the chosen experience.
4. Generate and copy the key.
5. Open the [repository's Actions secrets](https://github.com/hoomanthatlikeschocolate-stack/taco-rpg/settings/secrets/actions).
6. Add a repository secret named ROBLOX_API_KEY and paste the key as its value.

Keep the key in GitHub Secrets. Do not paste it into chat, commit it into a file or put it in an Actions variable.

## Configure the destination

In [GitHub Actions variables](https://github.com/hoomanthatlikeschocolate-stack/taco-rpg/settings/variables/actions), add:

| Variable name | Value |
| --- | --- |
| ROBLOX_UNIVERSE_ID | The chosen empty experience's Universe ID |
| ROBLOX_PLACE_ID | That experience's start Place ID |

With the key and both IDs configured, game changes pushed to main are rebuilt, checked and uploaded automatically. Code changes to the Roblox game trigger publishing; browser-prototype changes do not.

For the first upload after configuring these values, open [GitHub Actions](https://github.com/hoomanthatlikeschocolate-stack/taco-rpg/actions), select Publish Roblox game, and click Run workflow on main. Adding settings by itself does not trigger an upload.

## What runs

The workflow checks out the selected main commit, rebuilds Opening.rbxlx, runs the game geometry/progression checks and publisher tests, then sends the complete XML place to Roblox's Place Publishing API. A successful run reports the new version number. With either destination ID missing, it runs the checks and skips uploading.

GitHub workflow source: .github/workflows/roblox-publish.yml.

A readable copy is kept at roblox/publishing/roblox-publish.yml. If the connected GitHub app cannot write workflow files, you can upload that copy to .github/workflows/roblox-publish.yml through GitHub's website.

Publishing uses the API key only in the upload step. Roblox access/audience settings are managed separately. The place publisher cannot render or playtest Roblox; a successful upload is not an engine playtest.

References: [Roblox place publishing](https://create.roblox.com/docs/cloud/guides/usage-place-publishing), [Roblox API keys](https://create.roblox.com/docs/cloud/auth/api-keys), [GitHub Actions secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets).
