"""Publish the built XML place to the explicitly configured Roblox destination."""
from pathlib import Path
import json
import os
import re
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent
UNSUPPORTED = {"EditableImage", "EditableMesh", "PartOperation", "UnionOperation", "NegateOperation",
    "SurfaceAppearance", "BaseWrap", "WrapLayer", "WrapTarget"}


class PublishingError(Exception):
    pass


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        # Never forward the publishing credential to a redirect destination.
        return None


def error_detail(error, secret):
    """Read only bounded JSON diagnostic fields and redact credentials."""
    try:
        payload = error.read(8192).decode("utf-8", errors="replace")
        if secret:
            payload = payload.replace(secret, "[redacted]")
        data = json.loads(payload)
    except (OSError, ValueError):
        return ""
    messages = []
    def pick(value):
        if isinstance(value, str):
            clean = re.sub(r"[A-Za-z0-9+/=_-]{40,}", "[redacted]", value)
            messages.append(" ".join(clean.split())[:350])
        elif isinstance(value, list):
            for entry in value[:5]:
                pick(entry)
        elif isinstance(value, dict):
            for key in ("code", "error", "message", "title", "errors"):
                if key in value:
                    pick(value[key])
    pick(data)
    return "; ".join(dict.fromkeys(messages))[:650]


def make_request(environ, place):
    ids = []
    for name in ("ROBLOX_UNIVERSE_ID", "ROBLOX_PLACE_ID"):
        value = environ.get(name, "").strip()
        if not re.fullmatch(r"[1-9][0-9]{0,18}", value):
            raise PublishingError(f"Set {name} to the selected game's numeric ID in the publishing workflow.")
        ids.append(value)
    key = environ.get("ROBLOX_API_KEY", "").strip()
    if not key or any(ord(char) < 33 or ord(char) > 126 for char in key):
        raise PublishingError("Add ROBLOX_API_KEY as a GitHub Actions secret. Do not put it in source code.")
    payload = place.read_bytes()
    if len(payload) > 100 * 1024 * 1024:
        raise PublishingError("The place exceeds Roblox's 100 MB limit.")
    try:
        root = ET.fromstring(payload)
    except ET.ParseError:
        raise PublishingError("The built place is not valid XML.") from None
    if root.tag != "roblox" or root.attrib.get("version") != "4":
        raise PublishingError("Expected a Roblox XML place, version 4.")
    if any(item.attrib.get("class") in UNSUPPORTED for item in root.iter("Item")):
        raise PublishingError("This place contains instance types that require publishing from Studio.")
    universe, place_id = ids
    url = f"https://apis.roblox.com/universes/v1/{universe}/places/{place_id}/versions?versionType=Published"
    return urllib.request.Request(url, data=payload, method="POST",
        headers={"x-api-key": key, "Content-Type": "application/xml", "Accept": "application/json"})


def publish(environ=None, place=None, opener=None):
    environ = os.environ if environ is None else environ
    place = ROOT / "Opening.rbxlx" if place is None else Path(place)
    request = make_request(environ, place)
    opener = urllib.request.build_opener(NoRedirect()) if opener is None else opener
    try:
        with opener.open(request, timeout=120) as response:
            result = json.loads(response.read())
    except urllib.error.HTTPError as error:
        detail = error_detail(error, environ.get("ROBLOX_API_KEY", "").strip())
        hints = {
            401: "Check that ROBLOX_API_KEY is active and has universe-places Write permission.",
            403: "The key needs permission to publish to this specific experience.",
            404: "Check the Universe ID and start Place ID.",
            429: "Roblox rate limited publishing. Run the workflow again later.",
        }
        raise PublishingError(f"Roblox returned HTTP {error.code}. " +
            (detail + ". " if detail else "") +
            hints.get(error.code, "Publishing did not return success. Check Roblox and retry later.")) from None
    except (urllib.error.URLError, TimeoutError):
        raise PublishingError("Could not reach Roblox. Check version history before retrying.") from None
    except (ValueError, UnicodeError):
        raise PublishingError("Roblox returned an unreadable response. Check version history before retrying.") from None
    version = result.get("versionNumber") if isinstance(result, dict) else None
    if type(version) is not int or version < 1:
        raise PublishingError("Roblox did not return a place version number. Check version history before retrying.")
    print(f"Uploaded Roblox place version {version}.")
    summary = environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        place_id = environ["ROBLOX_PLACE_ID"].strip()
        with open(summary, "a") as out:
            out.write(f"## Roblox upload complete\n\nPlace version: **{version}**\n\n"
                f"[Open game](https://www.roblox.com/games/{place_id}/)\n\n"
                "This uploads game content. It does not change audience/access settings.\n")
    return version


if __name__ == "__main__":
    try:
        publish()
    except (PublishingError, OSError) as error:
        # No raw HTTP response bodies, request headers or credentials in logs.
        print(f"Publish failed: {error}", file=sys.stderr)
        sys.exit(1)
