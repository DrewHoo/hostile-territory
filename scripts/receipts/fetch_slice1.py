#!/usr/bin/env python3
"""Slice-1 receipts fetcher: pull Sports-Reference season-schedule pages from the
Wayback Machine, cache the HTML, and verify each worklist game's row.

Usage:
  python3 scripts/receipts/fetch_slice1.py fetch    # download/cache the 100 pages
  python3 scripts/receipts/fetch_slice1.py parse    # write data/research/receipts-1.json
"""
import html as htmllib
import json
import os
import re
import subprocess
import sys
import time

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WORKLIST = os.path.join(REPO, "data/research/receipts-worklist-1.json")
OUT = os.path.join(REPO, "data/research/receipts-1.json")
CACHE = os.environ.get(
    "RECEIPTS_CACHE",
    "/private/tmp/claude-501/-Users-drewhoo-Projects/"
    "f889b103-352a-4124-b722-462bf0ec7390/scratchpad/slice1/html",
)

# slug rule: lowercase, spaces -> hyphens, drop punctuation; plus exceptions
EXC = {
    "lsu": "louisiana-state",
    "usc": "southern-california",
    "ole miss": "mississippi",
    "tcu": "texas-christian",
    "smu": "southern-methodist",
    "byu": "brigham-young",
    "ucf": "central-florida",
    "south florida": "south-florida",
    "pitt": "pittsburgh",
    "nc state": "north-carolina-state",
    "uconn": "connecticut",
    "miami (fl)": "miami-fl",
    "miami (oh)": "miami-oh",
    "texas a&m": "texas-am",
    "washington state": "washington-state",
    # opponents in this slice that SR slugs differently from their common name
    "unlv": "nevada-las-vegas",
    "southern miss": "southern-mississippi",
    "louisiana": "louisiana-lafayette",
    "louisiana monroe": "louisiana-monroe",
    "florida international": "florida-international",
}
# extra slugs SR has used for the same program over time (accepted as a match)
ALT_SLUGS = {
    "louisiana-lafayette": {"louisiana", "southwestern-louisiana"},
    "louisiana-monroe": {"northeast-louisiana"},
    "central-florida": {"ucf"},
    "miami-fl": {"miami-florida"},
    "texas-am": {"texas-a-m"},
}


def slug(name):
    n = name.strip().lower()
    if n in EXC:
        return EXC[n]
    n = re.sub(r"[^a-z0-9 -]", "", n)
    return re.sub(r"\s+", "-", n.strip())


def norm_name(s):
    return re.sub(r"[^a-z0-9]", "", s.lower())


NAME_ALIASES = {
    "lsu": {"lsu", "louisianastate"},
    "olemiss": {"olemiss", "mississippi"},
    "unlv": {"unlv", "nevadalasvegas"},
    "ucf": {"ucf", "centralflorida"},
    "usc": {"usc", "southerncalifornia"},
    "tcu": {"tcu", "texaschristian"},
    "smu": {"smu", "southernmethodist"},
    "byu": {"byu", "brighamyoung"},
    "pittsburgh": {"pittsburgh", "pitt"},
    "ncstate": {"ncstate", "northcarolinastate"},
    "uconn": {"uconn", "connecticut"},
    "southernmiss": {"southernmiss", "southernmississippi"},
    "louisiana": {"louisiana", "louisianalafayette", "southwesternlouisiana"},
    "louisianamonroe": {"louisianamonroe", "northeastlouisiana"},
    "miamifl": {"miamifl", "miamiflorida", "miami"},
    "texasam": {"texasam"},
}


def name_ok(worklist_name, page_text):
    a, b = norm_name(worklist_name), norm_name(page_text)
    if a == b:
        return True
    return b in NAME_ALIASES.get(a, set())


def slug_ok(worklist_name, page_slug):
    want = slug(worklist_name)
    return page_slug == want or page_slug in ALT_SLUGS.get(want, set())


def url_for(team, season):
    return (
        "https://web.archive.org/web/%d/https://www.sports-reference.com/cfb/"
        "schools/%s/%d-schedule.html" % (season + 1, slug(team), season)
    )


def cache_path(team, season):
    return os.path.join(CACHE, "%s-%d.html" % (slug(team), season))


def load_worklist():
    with open(WORKLIST) as f:
        return json.load(f)["work"]


# ---------------------------------------------------------------- fetch


def fetch_all(retry=False):
    os.makedirs(CACHE, exist_ok=True)
    pages = load_worklist()
    attempts = (1, 2, 3, 4) if retry else (1, 2)
    gap = 12.0 if retry else 4.5
    for i, page in enumerate(pages, 1):
        team, season = page["home_team"], page["season"]
        path = cache_path(team, season)
        if os.path.exists(path) and os.path.getsize(path) > 5000:
            print("%3d/%d cached   %s %d" % (i, len(pages), team, season))
            continue
        if retry and not os.path.exists(path + ".missing"):
            continue
        url = url_for(team, season)
        ok = False
        for attempt in attempts:
            time.sleep(gap)
            p = subprocess.run(
                ["curl", "-sL", "--max-time", "120", "-w", "%{http_code}",
                 "-o", path + ".part", url],
                capture_output=True, text=True,
            )
            code = (p.stdout or "").strip()[-3:]
            if code == "200" and os.path.getsize(path + ".part") > 5000:
                os.replace(path + ".part", path)
                ok = True
                break
            print("   http %s on attempt %d for %s %d" % (code, attempt, team, season))
            if code in ("429", "500", "502", "503", "504", "000", ""):
                time.sleep(60)
        if not ok:
            open(path + ".missing", "w").write(url)
            if os.path.exists(path + ".part"):
                os.remove(path + ".part")
        elif os.path.exists(path + ".missing"):
            os.remove(path + ".missing")
        print("%3d/%d %s  %s %d" % (i, len(pages), "ok" if ok else "MISSING", team, season))


# ---------------------------------------------------------------- parse

TAG = re.compile(r"<[^>]+>")
ROW = re.compile(r"<tr[^>]*>(.*?)</tr>", re.S)
CELL = re.compile(r"<(t[hd])\b([^>]*)>(.*?)</\1>", re.S)
SCHOOL_HREF = re.compile(r"/cfb/schools/([a-z0-9-]+)/(\d{4})\.html")


def text_of(frag):
    t = TAG.sub(" ", frag)
    t = htmllib.unescape(t).replace("\xa0", " ")
    return re.sub(r"\s+", " ", t).strip()


def cells_of(row_html):
    out = []
    for m in CELL.finditer(row_html):
        attrs, inner = m.group(2), m.group(3)
        ds = re.search(r'data-stat="([^"]+)"', attrs)
        csk = re.search(r'csk="([^"]*)"', attrs)
        out.append({
            "stat": ds.group(1) if ds else None,
            "csk": csk.group(1) if csk else None,
            "text": text_of(inner),
            "html": inner,
        })
    return out


def rank_of(cell_text):
    m = re.match(r"^\(\s*(\d+)\s*\)", cell_text)
    return int(m.group(1)) if m else None


def strip_rank(cell_text):
    return re.sub(r"^\(\s*\d+\s*\)\s*", "", cell_text).strip()


def find_rows(page_html, season):
    """Return {iso_date: (cells, quote)} for every schedule row on the page."""
    rows = {}
    for rm in ROW.finditer(page_html):
        cells = cells_of(rm.group(1))
        if len(cells) < 8:
            continue
        iso = None
        for c in cells:
            if c["csk"] and re.fullmatch(r"\d{4}-\d{2}-\d{2}", c["csk"] or ""):
                iso = c["csk"]
                break
            if c["stat"] == "date_game":
                m = re.search(r"([A-Z][a-z]{2}) (\d{1,2}), (\d{4})", c["text"])
                if m:
                    mon = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug",
                           "Sep", "Oct", "Nov", "Dec"].index(m.group(1)) + 1
                    iso = "%s-%02d-%02d" % (m.group(3), mon, int(m.group(2)))
                break
        if not iso:
            continue
        quote = " | ".join(c["text"] for c in cells)
        rows[iso] = (cells, quote)
    return rows


def extract(cells, home_slug, season):
    """Pull the schedule fields out of one row, by data-stat when present,
    otherwise positionally from the school cell."""
    by = {c["stat"]: c for c in cells if c["stat"]}
    need = ("school_name", "game_location", "opp_name", "game_result", "points",
            "opp_points")
    if all(k in by for k in need):
        return {
            "school": by["school_name"],
            "site": by["game_location"],
            "opp": by["opp_name"],
            "result": by["game_result"],
            "points": by["points"],
            "opp_points": by["opp_points"],
        }
    # positional: school cell is the one linking to the home team's own season page
    si = None
    for i, c in enumerate(cells):
        for m in SCHOOL_HREF.finditer(c["html"]):
            if m.group(1) == home_slug:
                si = i
                break
        if si is not None:
            break
    if si is None or si + 6 >= len(cells):
        return None
    return {
        "school": cells[si],
        "site": cells[si + 1],
        "opp": cells[si + 2],
        "result": cells[si + 4],
        "points": cells[si + 5],
        "opp_points": cells[si + 6],
    }


def opp_slug_of(cell):
    m = SCHOOL_HREF.search(cell["html"])
    return m.group(1) if m else None


def parse_all():
    pages = load_worklist()
    out = []
    for page in pages:
        team, season = page["home_team"], page["season"]
        url = url_for(team, season)
        path = cache_path(team, season)
        hs = slug(team)
        page_html = None
        if os.path.exists(path):
            page_html = open(path, encoding="utf-8", errors="replace").read()
            title = re.search(r"<title>(.*?)</title>", page_html, re.S)
            title = text_of(title.group(1)) if title else ""
            school_word = team.split()[0] if team != "BYU" else "BYU"
            if str(season) not in title or school_word.lower() not in title.lower():
                page_html = None
                bad_title = title
        if page_html is None:
            for g in page["games"]:
                out.append({
                    "date": g["date"], "away_team": g["away_team"], "home_team": team,
                    "season": season, "source_url": url, "quote": "",
                    "sr_home_rank": None, "sr_away_rank": None,
                    "sr_home_points": None, "sr_away_points": None,
                    "site_marker": "", "status": "page_missing",
                    "note": "no usable Wayback snapshot for this season-schedule page",
                })
            continue

        rows = find_rows(page_html, season)
        for g in page["games"]:
            row = rows.get(g["date"])
            base = {
                "date": g["date"], "away_team": g["away_team"], "home_team": team,
                "season": season, "source_url": url,
            }
            if not row:
                out.append(dict(base, quote="", sr_home_rank=None, sr_away_rank=None,
                                sr_home_points=None, sr_away_points=None,
                                site_marker="", status="discrepancy",
                                note="no schedule row on the SR page for this date"))
                continue
            cells, quote = row
            f = extract(cells, hs, season)
            if not f:
                out.append(dict(base, quote=quote, sr_home_rank=None, sr_away_rank=None,
                                sr_home_points=None, sr_away_points=None,
                                site_marker="", status="discrepancy",
                                note="row found but its cells could not be mapped"))
                continue
            hr = rank_of(f["school"]["text"])
            ar = rank_of(f["opp"]["text"])
            site = f["site"]["text"]
            opp_text = strip_rank(f["opp"]["text"])
            oslug = opp_slug_of(f["opp"])
            try:
                hp = int(f["points"]["text"])
                ap = int(f["opp_points"]["text"])
            except ValueError:
                hp = ap = None
            res = f["result"]["text"]

            problems = []
            if hr != g["home_rank_ap"]:
                problems.append("SR home rank %s != worklist home_rank_ap %s"
                                % (hr, g["home_rank_ap"]))
            ok_opp = (slug_ok(g["away_team"], oslug) if oslug
                      else name_ok(g["away_team"], opp_text))
            if not ok_opp:
                problems.append("SR opponent %r (slug %s) != worklist away_team %r"
                                % (opp_text, oslug, g["away_team"]))
            if site != "":
                problems.append("SR site marker is %r, not empty (SR does not treat "
                                "this as the visitor's true road game)" % site)
            exp_home_res = "L" if g["result"] == "W" else "W"
            if res != exp_home_res:
                problems.append("SR home result %r contradicts worklist visitor result "
                                "%r" % (res, g["result"]))
            if hp is None or ap is None:
                problems.append("SR points cells not numeric (%r / %r)"
                                % (f["points"]["text"], f["opp_points"]["text"]))
            else:
                if hp != g["home_points"] or ap != g["away_points"]:
                    problems.append("SR score home %s-%s != worklist home %s-%s"
                                    % (hp, ap, g["home_points"], g["away_points"]))
            note_bits = list(problems)
            if ar != g["away_rank_ap"]:
                note_bits.append("(also: SR away rank %s vs worklist away_rank_ap %s)"
                                 % (ar, g["away_rank_ap"]))
            row_out = dict(
                base, quote=quote, sr_home_rank=hr, sr_away_rank=ar,
                sr_home_points=hp, sr_away_points=ap, site_marker=site,
                status="discrepancy" if problems else "confirmed",
            )
            if problems:
                row_out["note"] = "; ".join(note_bits)
            elif ar != g["away_rank_ap"]:
                row_out["note"] = "; ".join(note_bits)
            out.append(row_out)

    out.sort(key=lambda r: (r["home_team"], r["season"], r["date"]))
    with open(OUT, "w") as f:
        json.dump(out, f, indent=2)
        f.write("\n")
    from collections import Counter
    c = Counter(r["status"] for r in out)
    print(json.dumps(dict(c), indent=2), "total", len(out))


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "fetch"
    if cmd == "fetch":
        fetch_all()
    elif cmd == "retry":
        fetch_all(retry=True)
    else:
        parse_all()
