import os, re, urllib.request, html

SITEMAP = os.environ["SITEMAP_URL"]
xml = urllib.request.urlopen(SITEMAP, timeout=30).read().decode("utf-8", "ignore")
urls = re.findall(r"<loc>([^<]+)</loc>", xml)
blog_urls = [u for u in urls if "/blog/" in u and u.rstrip("/") .endswith(".html") or ("/blog/" in u and not u.rstrip("/").endswith("/blog"))]
blog_urls = [u for u in blog_urls if u.rstrip("/") != SITEMAP.split("/blog")[0] + "/blog"][:5]

def title_for(u):
    try:
        page = urllib.request.urlopen(u, timeout=20).read().decode("utf-8", "ignore")
        m = re.search(r"<title>([^<]+)</title>", page, re.I)
        if m: return html.unescape(m.group(1)).split("|")[0].strip()[:80]
    except Exception: pass
    slug = u.rstrip("/").rsplit("/", 1)[-1].replace(".html", "").replace("-", " ").title()
    return slug

lines = ["", "## Latest from the blog", ""]
for u in blog_urls:
    lines.append(f"- [{title_for(u)}]({u})")
lines.append("")
section = "\n".join(lines)

readme_path = "README.md"
readme = open(readme_path).read()
new_block = f"<!-- BLOG:START -->{section}<!-- BLOG:END -->"
if "<!-- BLOG:START -->" in readme:
    readme = re.sub(r"<!-- BLOG:START -->.*?<!-- BLOG:END -->", new_block, readme, flags=re.S)
else:
    readme = readme.rstrip() + "\n" + new_block + "\n"
open(readme_path, "w").write(readme)
print(f"synced {len(blog_urls)} posts")
