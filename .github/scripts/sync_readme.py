import html
import os
import re
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

SITEMAP = os.environ["SITEMAP_URL"]
DOMAIN = os.environ["ORIGIN_DOMAIN"].lower().rstrip(".")
CTX = ssl.create_default_context()
USER_AGENT = "README blog sync/2.0 (+https://github.com/feifeizhao25-ship-it)"


def fetch(url: str, attempts: int = 3) -> str:
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme != "https" or (parsed.hostname or "").lower().rstrip(".") != DOMAIN:
        raise ValueError(f"refusing non-canonical URL: {url}")
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    error: Exception | None = None
    for attempt in range(attempts):
        try:
            with urllib.request.urlopen(request, timeout=30, context=CTX) as response:
                return response.read().decode("utf-8", "replace")
        except (OSError, urllib.error.URLError) as exc:
            error = exc
            if attempt + 1 < attempts:
                time.sleep(2**attempt)
    raise RuntimeError(f"failed to fetch {url} after {attempts} attempts: {error}")


def blog_entries(xml: str) -> list[tuple[str, str]]:
    root = ET.fromstring(xml)
    entries: list[tuple[str, str]] = []
    for node in root.findall(".//{*}url"):
        location = (node.findtext("{*}loc") or "").strip()
        last_modified = (node.findtext("{*}lastmod") or "").strip()
        parsed = urllib.parse.urlparse(location)
        if (
            parsed.scheme == "https"
            and (parsed.hostname or "").lower().rstrip(".") == DOMAIN
            and parsed.path.startswith("/blog/")
        ):
            entries.append((last_modified, location))
    return sorted(set(entries), reverse=True)[:5]


def title_for(url: str) -> str:
    try:
        page = fetch(url)
        match = re.search(r"<title[^>]*>(.*?)</title>", page, re.I | re.S)
        if match:
            title = html.unescape(re.sub(r"\s+", " ", match.group(1))).split("|")[0].strip()
            return title.replace("[", "\\[").replace("]", "\\]")[:80]
    except Exception as exc:
        print(f"warning: title fetch failed for {url}: {exc}", file=sys.stderr)
    slug = urllib.parse.urlparse(url).path.rstrip("/").rsplit("/", 1)[-1]
    return slug.removesuffix(".html").replace("-", " ").title()[:80]


def main() -> int:
    try:
        entries = blog_entries(fetch(SITEMAP))
    except Exception as exc:
        print(f"warning: sitemap unavailable; README left unchanged: {exc}", file=sys.stderr)
        return 0
    if not entries:
        print("warning: no canonical blog posts found; README left unchanged", file=sys.stderr)
        return 0

    lines = ["", "## Latest from the blog", ""]
    lines.extend(f"- [{title_for(url)}]({url})" for _, url in entries)
    lines.append("")
    section = "\n".join(lines)
    block = f"<!-- BLOG:START -->{section}<!-- BLOG:END -->"

    path = Path("README.md")
    readme = path.read_text(encoding="utf-8")
    if "<!-- BLOG:START -->" in readme:
        updated = re.sub(r"<!-- BLOG:START -->.*?<!-- BLOG:END -->", block, readme, flags=re.S)
    else:
        updated = readme.rstrip() + "\n" + block + "\n"
    if updated != readme:
        path.write_text(updated, encoding="utf-8")
    print(f"synced {len(entries)} canonical posts")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
