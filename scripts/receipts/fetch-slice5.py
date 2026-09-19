#!/usr/bin/env python3
"""Receipts slice 5: fetch Sports-Reference season-schedule pages via the Wayback
Machine and verify each worklist game's schedule row.

Usage:
  python3 scripts/receipts/fetch-slice5.py fetch   # download pages into CACHE
  python3 scripts/receipts/fetch-slice5.py build   # parse cache -> receipts-5.json

Spec: data/research/receipts-README.md
"""
import html as htmllib
import json
import os
import re
import subprocess
import sys
import time

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WORKLIST = os.path.join(REPO, "data", "research", "receipts-worklist-5.json")
OUT = os.path.join(REPO, "data", "research", "receipts-5.json")
CACHE = os.environ.get(
    "SLICE5_CACHE",
    "/private/tmp/claude-501/-Users-drewhoo-Projects/"
    "f889b103-352a-4124-b722-462bf0ec7390/scratchpad/slice5/pages",
)

SLUGS = {
    "LSU": "louisiana-state",
    "USC": "southern-california",
    "Ole Miss": "mississippi",
    "TCU": "texas-christian",
    "SMU": "southern-methodist",
    "BYU": "brigham-young",
    "UCF": "central-florida",
    "South Florida": "south-florida",
    "Pitt": "pittsburgh",
    "NC State": "north-carolina-state",
    "UConn": "connecticut",
    "Miami (FL)": "miami-fl",
    "Miami (OH)": "miami-oh",
    "Texas A&M": "texas-am",
    "Washington State": "washington-state",
}

# Worklist team name -> acceptable Sports-Reference display strings.
ALIASES = {
    "BYU": ["Brigham Young", "BYU"],
    "LSU": ["Louisiana State", "LSU"],
    "Ole Miss": ["Mississippi", "Ole Miss"],
    "SMU": ["Southern Methodist", "SMU"],
    "TCU": ["Texas Christian", "TCU"],
    "UCF": ["Central Florida", "UCF"],
    "USC": ["Southern California", "USC"],
    "UAB": ["Alabama-Birmingham", "UAB"],
    "UTEP": ["Texas-El Paso", "UTEP"],
    "UNLV": ["Nevada-Las Vegas", "UNLV"],
    "Pittsburgh": ["Pittsburgh", "Pitt"],
    "Miami (FL)": ["Miami (FL)", "Miami"],
}


def slug(team):
    if team in SLUGS:
        return SLUGS[team]
    s = team.lower().replace("&", "")
    s = re.sub(r"[^a-z0-9 ]", "", s)
    return re.sub(r"\s+", "-", s.strip())


def names(team):
    return ALIASES.get(team, [team])


def wayback_url(team, season):
    return (
        "https://web.archive.org/web/%d/https://www.sports-reference.com/cfb/schools/%s/%d-schedule.html"
        % (season + 1, slug(team), season)
    )


def cache_path(team, season):
    return os.path.join(CACHE, "%s-%d.html" % (slug(team), season))


def load_work():
    with open(WORKLIST) as f:
        return json.load(f)["work"]


# ---------------------------------------------------------------- fetch phase

def curl(url, dest):
    r = subprocess.run(
        ["curl", "-sL", "--max-time", "120", "-o", dest, "-w", "%{http_code}", url],
        capture_output=True, text=True,
    )
    return r.stdout.strip()


def title_of(path):
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            h = f.read()
    except OSError:
        return None
    m = re.search(r"<title>(.*?)</title>", h, re.S)
    return htmllib.unescape(m.group(1)).strip() if m else None


def title_ok(title, team, season):
    if not title:
        return False
    if str(season) not in title:
        return False
    if "Schedule" not in title:
        return False
    return any(n.split(" (")[0] in title for n in names(team))


def do_fetch(start=0, end=None):
    os.makedirs(CACHE, exist_ok=True)
    pages = load_work()
    sel = pages[start:end]
    status = {}
    for i, p in enumerate(sel, start + 1):
        team, season = p["home_team"], p["season"]
        dest = cache_path(team, season)
        key = "%s|%d" % (team, season)
        if os.path.exists(dest) and title_ok(title_of(dest), team, season):
            status[key] = "cached"
            print("[%3d/%d] %-14s %d cached" % (i, len(pages), team, season), flush=True)
            continue
        url = wayback_url(team, season)
        ok = False
        for attempt in (1, 2):
            code = curl(url, dest)
            t = title_of(dest)
            if code == "200" and title_ok(t, team, season):
                ok = True
                break
            print("   [%s %d] attempt %d code=%s title=%r" % (team, season, attempt, code, t), flush=True)
            if attempt == 1:
                time.sleep(60 if code != "200" else 8)
        status[key] = "ok" if ok else "missing"
        if not ok and os.path.exists(dest):
            os.rename(dest, dest + ".bad")
        print("[%3d/%d] %-14s %d %s" % (i, len(pages), team, season, status[key]), flush=True)
        time.sleep(4.5)
    print("CHUNK COMPLETE %d-%d" % (start, end if end is not None else len(pages)), flush=True)


# ---------------------------------------------------------------- parse phase

TAG = re.compile(r"<[^>]+>")


def celltext(h):
    t = TAG.sub("", h)
    t = htmllib.unescape(t).replace("\xa0", " ")
    return re.sub(r"\s+", " ", t).strip()


CELL = re.compile(r"<(td|th)\b([^>]*)>(.*?)</\1>", re.S)

LABEL_KEYS = {
    "G": "g", "Rk": "g", "Date": "date_game", "Time": "time_game", "Day": "day_name",
    "School": "school_name", "Opponent": "opp_name", "Conf": "conf_abbr",
    "Pts": "points", "Opp": "opp_points", "W": "wins", "L": "losses", "T": "ties",
    "Streak": "game_streak", "Notes": "notes", "TV": "broadcaster",
}


def heads_from_labels(labels):
    """Older snapshots ship no data-stat attrs. The two unlabelled columns are the
    site marker (right after School) and the result (right after Conf)."""
    keys, prev = [], None
    for i, lab in enumerate(labels):
        if lab == "":
            k = ("game_location" if prev == "school_name"
                 else "game_result" if prev == "conf_abbr" else "col%d" % i)
        else:
            k = LABEL_KEYS.get(lab, "col%d" % i)
        keys.append(k)
        prev = k
    return keys


def parse_rows(path):
    with open(path, encoding="utf-8", errors="replace") as f:
        h = f.read()
    h = h.replace("<!--", "").replace("-->", "")
    m = re.search(r'<table[^>]*id="schedule"[^>]*>(.*?)</table>', h, re.S)
    if not m:
        return None, None
    tbl = m.group(1)
    hm = re.search(r"<thead>(.*?)</thead>", tbl, re.S)
    heads = re.findall(r'data-stat="([^"]+)"', hm.group(1)) if hm else []
    if hm and not heads:
        # Older Wayback snapshots have no data-stat attributes; map header labels.
        heads = heads_from_labels(
            [celltext(x) for x in re.findall(r"<th[^>]*>(.*?)</th>", hm.group(1), re.S)])
    body = tbl[hm.end():] if hm else tbl
    rows = []
    for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", body, re.S):
        cells = CELL.findall(tr)
        if not cells or not any(tag == "td" for tag, _, _ in cells):
            continue
        txts = [celltext(c[2]) for c in cells]
        ds = [re.search(r'data-stat="([^"]+)"', c[1]) for c in cells]
        if all(ds):
            keys = [d.group(1) for d in ds]
            aligned = True
        else:
            keys = heads[: len(txts)]
            aligned = len(txts) == len(heads)
        rows.append({"keys": keys, "txts": txts, "tr": tr, "aligned": aligned})
    return rows, heads


MONTHS = {m: i + 1 for i, m in enumerate(
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"])}


def row_date(row):
    tr = row["tr"]
    m = re.search(r'csk="(\d{4}-\d{2}-\d{2})"', tr)
    if m:
        return m.group(1)
    for k, t in zip(row["keys"], row["txts"]):
        if k == "date_game":
            mm = re.match(r"([A-Z][a-z]{2}) (\d{1,2}), (\d{4})", t)
            if mm:
                return "%s-%02d-%02d" % (mm.group(3), MONTHS[mm.group(1)], int(mm.group(2)))
    return None


def get(row, key):
    for k, t in zip(row["keys"], row["txts"]):
        if k == key:
            return t
    return None


def rank_and_name(cell):
    if cell is None:
        return None, None
    m = re.match(r"\((\d+)\)\s*(.*)$", cell)
    if m:
        return int(m.group(1)), m.group(2).strip()
    return None, cell.strip()


def to_int(s):
    try:
        return int(s)
    except (TypeError, ValueError):
        return None


def do_build():
    pages = load_work()
    out = []
    for p in pages:
        team, season = p["home_team"], p["season"]
        url = wayback_url(team, season)
        path = cache_path(team, season)
        rows = None
        if os.path.exists(path) and title_ok(title_of(path), team, season):
            rows, _ = parse_rows(path)
        if rows is None:
            for g in p["games"]:
                out.append({
                    "date": g["date"], "away_team": g["away_team"], "home_team": team,
                    "season": season, "source_url": url, "quote": "",
                    "sr_home_rank": None, "sr_away_rank": None,
                    "sr_home_points": None, "sr_away_points": None, "site_marker": None,
                    "status": "page_missing",
                    "note": "No usable Wayback snapshot of the %d %s schedule page." % (season, team),
                })
            continue
        bydate = {}
        for r in rows:
            bydate.setdefault(row_date(r), []).append(r)
        for g in p["games"]:
            cands = bydate.get(g["date"], [])
            row = None
            if len(cands) == 1:
                row = cands[0]
            elif cands:
                for c in cands:
                    _, opp = rank_and_name(get(c, "opp_name"))
                    if opp in names(g["away_team"]):
                        row = c
                        break
                row = row or cands[0]
            if row is None:
                out.append({
                    "date": g["date"], "away_team": g["away_team"], "home_team": team,
                    "season": season, "source_url": url, "quote": "",
                    "sr_home_rank": None, "sr_away_rank": None,
                    "sr_home_points": None, "sr_away_points": None, "site_marker": None,
                    "status": "discrepancy",
                    "note": "No schedule row on the %d %s page for %s." % (season, team, g["date"]),
                })
                continue
            quote = " | ".join(row["txts"])
            hrank, hname = rank_and_name(get(row, "school_name"))
            arank, aname = rank_and_name(get(row, "opp_name"))
            marker = get(row, "game_location") or ""
            res = get(row, "game_result") or ""
            hp = to_int(get(row, "points"))
            ap = to_int(get(row, "opp_points"))
            problems = []
            if not row.get("aligned", True):
                problems.append("could not align row cells to table headers")
            if hname not in names(team):
                problems.append("school cell %r is not %s" % (hname, team))
            if aname not in names(g["away_team"]):
                problems.append("opponent cell %r is not %s" % (aname, g["away_team"]))
            if marker != "":
                problems.append("site marker %r (SR does not call this a true road game for %s)"
                                % (marker, g["away_team"]))
            if hrank != g["home_rank_ap"]:
                problems.append("home AP rank %s vs worklist %s" % (hrank, g["home_rank_ap"]))
            if arank != g["away_rank_ap"]:
                problems.append("away AP rank %s vs worklist %s" % (arank, g["away_rank_ap"]))
            if hp != g["home_points"] or ap != g["away_points"]:
                problems.append("score home %s-%s vs worklist home %s-%s"
                                % (hp, ap, g["home_points"], g["away_points"]))
            want = {"W": "L", "L": "W", "T": "T"}.get(g["result"])
            if res != want:
                problems.append("home result %r, expected %r for visitor %s"
                                % (res, want, g["result"]))
            rec = {
                "date": g["date"], "away_team": g["away_team"], "home_team": team,
                "season": season, "source_url": url, "quote": quote,
                "sr_home_rank": hrank, "sr_away_rank": arank,
                "sr_home_points": hp, "sr_away_points": ap, "site_marker": marker,
                "status": "confirmed" if not problems else "discrepancy",
            }
            if problems:
                rec["note"] = "; ".join(problems)
            out.append(rec)
    with open(OUT, "w") as f:
        json.dump(out, f, indent=1)
        f.write("\n")
    from collections import Counter
    c = Counter(r["status"] for r in out)
    print(json.dumps(dict(c), indent=1))
    for r in out:
        if r["status"] == "discrepancy":
            print("DISC %s %s %s at %s: %s" % (r["season"], r["away_team"], "@", r["home_team"], r["note"]))
        elif r["status"] == "page_missing":
            print("MISS %s %s @ %s" % (r["season"], r["away_team"], r["home_team"]))


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "build"
    if cmd == "fetch":
        a = int(sys.argv[2]) if len(sys.argv) > 2 else 0
        b = int(sys.argv[3]) if len(sys.argv) > 3 else None
        do_fetch(a, b)
    else:
        do_build()
