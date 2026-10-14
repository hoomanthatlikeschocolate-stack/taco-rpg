import contextlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
import urllib.error

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("publisher", ROOT / "publish_place.py")
p = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)


class PublishingTests(unittest.TestCase):
    def setUp(self):
        self.env = {"ROBLOX_UNIVERSE_ID": "123", "ROBLOX_PLACE_ID": "456", "ROBLOX_API_KEY": "test-only-placeholder"}
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.file = Path(self.temp.name) / "place.rbxlx"
        self.file.write_text('<roblox version="4"><Item class="Part"/></roblox>')

    def test_missing_credentials_and_invalid_destination_never_open_network(self):
        for key, value in [
            ("ROBLOX_API_KEY", ""), ("ROBLOX_API_KEY", "key\nheader"),
            ("ROBLOX_UNIVERSE_ID", ""), ("ROBLOX_PLACE_ID", "123/456"),
            ("ROBLOX_PLACE_ID", "１２３"), ("ROBLOX_PLACE_ID", "0")
        ]:
            env = dict(self.env, **{key: value})
            with self.subTest(key=key, value=value):
                with self.assertRaises(p.PublishingError):
                    p.make_request(env, self.file)

    def test_uploads_exact_xml_to_selected_place_and_requires_version_number(self):
        request = p.make_request(self.env, self.file)
        self.assertEqual(request.full_url, "https://apis.roblox.com/universes/v1/123/places/456/versions?versionType=Published")
        self.assertEqual(request.data, self.file.read_bytes())
        self.assertEqual(request.get_method(), "POST")
        self.assertEqual(request.get_header("Content-type"), "application/xml")
        self.assertEqual(request.get_header("X-api-key"), self.env["ROBLOX_API_KEY"])
        class Opener:
            def __init__(self, data): self.data = data
            def open(self, req, timeout): return contextlib.closing(io.BytesIO(json.dumps(self.data).encode()))
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            self.assertEqual(p.publish(self.env, self.file, Opener({"versionNumber": 7})), 7)
        self.assertNotIn(self.env["ROBLOX_API_KEY"], output.getvalue())
        for result in [{}, {"versionNumber": True}, {"versionNumber": 0}, []]:
            with self.assertRaises(p.PublishingError):
                p.publish(self.env, self.file, Opener(result))

    def test_unsupported_instances_and_redirects_are_blocked(self):
        self.file.write_text('<roblox version="4"><Item class="EditableMesh"/></roblox>')
        with self.assertRaises(p.PublishingError):
            p.make_request(self.env, self.file)
        request = object()
        self.assertIsNone(p.NoRedirect().redirect_request(request, None, 302, "redirect", {}, "https://example.com"))

    def test_http_error_details_cannot_expose_credentials(self):
        secret = self.env["ROBLOX_API_KEY"]
        class Opener:
            def open(self, request, timeout):
                raise urllib.error.HTTPError(request.full_url, 403, secret, {}, io.BytesIO(secret.encode()))
        with self.assertRaises(p.PublishingError) as error:
            p.publish(self.env, self.file, Opener())
        self.assertIn("403", str(error.exception))
        self.assertNotIn(secret, str(error.exception))


if __name__ == "__main__":
    unittest.main()
