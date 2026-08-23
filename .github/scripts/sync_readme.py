import os, re, html, ssl, urllib.request

SITEMAP = os.environ["SITEMAP_URL"]
DOMAIN = os.environ.get("ORIGIN_DOMAIN", "")
ORIGIN_IP = os.environ.get("ORIGIN_IP", "")
CTX = ssl.create_default_context(); CTX.check_hostname = False; CTX.verify_mode = ssl.CERT_NONE

def fetch(url):
    if ORIGIN_IP and DOMAIN and DOMAIN in url:
        req = urllib.request.Request(url.replace(DOMAIN, ORIGIN_IP), headers={"Host": DOMAIN, "User-Agent": "Mozilla/5.0"})
    else:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    return urllib.request.urlopen(req, timeout=30, context=CTX).read().decode("utf-8", "ignore")

xml = fetch(SITEMAP)
urls = re.findall(r"<loc>([^<]+)</loc>", xml)
blog_urls = [u for u in urls if "/blog/" in u][:5]

def title_for(u):
    try:
        page = fetch(u)
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

readme = open("README.md").read()
new_block = f"<!-- BLOG:START -->{section}<!-- BLOG:END -->"
if "<!-- BLOG:START -->" in readme:
    readme = re.sub(r"<!-- BLOG:START -->.*?<!-- BLOG:END -->", new_block, readme, flags=re.S)
else:
    readme = readme.rstrip() + "\n" + new_block + "\n"
open("README.md", "w").write(readme)
print(f"synced {len(blog_urls)} posts")
