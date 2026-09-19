#!/usr/bin/env python3
"""Slice 4 receipts helper: fetch Sports-Reference season-schedule pages from the
Wayback Machine, then extract/verify the schedule row for every worklist game.

Usage:
  python3 scripts/receipts/fetch-slice4.py fetch     # download pages (cached)
  python3 scripts/receipts/fetch-slice4.py build     # parse + compare + write JSON
"""
import html as htmllib
import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime

ROOT = "/Users/drewhoo/Projects/hostile-territory"
SCRATCH = ("/private/tmp/claude-501/-Users-drewhoo-Projects/"
           "f889b103-352a-4124-b722-462bf0ec7390/scratchpad/slice4")
HTML_DIR = os.path.join(SCRATCH, "html")
META_PATH = os.path.join(SCRATCH, "fetch-meta.json")
WORKLIST = os.path.join(ROOT, "data/research/receipts-worklist-4.json")

SLUG_EXC = {
    "LSU": "louisiana-state", "USC": "southern-california", "Ole Miss": "mississippi",
    "TCU": "texas-christian", "SMU": "southern-methodist", "BYU": "brigham-young",
    "UCF": "central-florida", "South Florida": "south-florida", "Pitt": "pittsburgh",
    "NC State": "north-carolina-state", "UConn": "connecticut",
    "Miami (FL)": "miami-fl", "Miami (OH)": "miami-oh", "Texas A&M": "texas-am",
    "Washington State": "washington-state",
}


def slug_for(team):
    if team in SLUG_EXC:
        return SLUG_EXC[team]
    s = team.lower()
    s = re.sub(r"[^a-z0-9 ]", "", s)
    return s.replace(" ", "-")


def wb_url(team, season):
    return ("https://web.archive.org/web/%d/https://www.sports-reference.com/cfb/"
            "schools/%s/%d-schedule.html" % (season + 1, slug_for(team), season))


def title_of(body):
    m = re.search(r"<title>(.*?)</title>", body, re.S | re.I)
    return htmllib.unescape(re.sub(r"\s+", " ", m.group(1)).strip()) if m else ""


def load_pages():
    wl = json.load(open(WORKLIST))
    return wl["work"]


def fetch():
    os.makedirs(HTML_DIR, exist_ok=True)
    meta = json.load(open(META_PATH)) if os.path.exists(META_PATH) else {}
    pages = load_pages()
    for i, p in enumerate(pages):
        key = "%s-%d" % (slug_for(p["home_team"]), p["season"])
        path = os.path.join(HTML_DIR, key + ".html")
        if key in meta and meta[key].get("ok"):
            continue
        url = wb_url(p["home_team"], p["season"])
        attempts = []
        ok = False
        for attempt in range(2):
            if attempt:
                time.sleep(60)
            else:
                time.sleep(4.5)
            r = subprocess.run(
                ["curl", "-sL", "--max-time", "120", "-o", path,
                 "-w", "%{http_code}\t%{url_effective}\t%{size_download}", url],
                capture_output=True, text=True)
            parts = (r.stdout or "\t\t").split("\t")
            code = parts[0]
            eff = parts[1] if len(parts) > 1 else ""
            size = parts[2] if len(parts) > 2 else "0"
            body = open(path, encoding="utf-8", errors="replace").read() if os.path.exists(path) else ""
            title = title_of(body)
            has_tbl = 'id="schedule"' in body
            attempts.append({"code": code, "effective": eff, "size": size,
                             "title": title, "has_table": has_tbl})
            if code == "200" and has_tbl:
                ok = True
                break
        meta[key] = {"ok": ok, "url": url, "home_team": p["home_team"],
                     "season": p["season"], "attempts": attempts,
                     "title": attempts[-1]["title"],
                     "effective": attempts[-1]["effective"]}
        json.dump(meta, open(META_PATH, "w"), indent=1)
        print("%3d/%d %-28s %s %s" % (i + 1, len(pages), key,
                                      "OK " if ok else "MISS",
                                      meta[key]["title"][:70]), flush=True)
    print("done; ok=%d miss=%d" % (sum(1 for v in meta.values() if v["ok"]),
                                   sum(1 for v in meta.values() if not v["ok"])))


# ---------------------------------------------------------------- parsing

TAG = re.compile(r"<[^>]+>")


def cell_text(raw):
    t = raw.replace("&nbsp;", " ")
    t = TAG.sub("", t)
    t = htmllib.unescape(t)
    return re.sub(r"\s+", " ", t).strip()


def parse_schedule(body):
    """Return list of rows; each row = {'cells': [...], 'by': {data_stat: text}}."""
    m = re.search(r'<table[^>]*id="schedule"[^>]*>(.*?)</table>', body, re.S)
    if not m:
        return None, None
    tbl = m.group(1)
    head = re.search(r"<thead>(.*?)</thead>", tbl, re.S)
    stats = re.findall(r'data-stat="([^"]+)"', head.group(1)) if head else []
    bodym = re.search(r"<tbody>(.*?)</tbody>", tbl, re.S)
    chunk = bodym.group(1) if bodym else tbl
    rows = []
    for rm in re.finditer(r"<tr[^>]*>(.*?)</tr>", chunk, re.S):
        tr = rm.group(1)
        if "<th" in tr and "data-stat" not in tr and "<td" not in tr:
            continue  # repeated header
        cells, keys = [], []
        for cm in re.finditer(r"<(t[hd])([^>]*)>(.*?)</\1>", tr, re.S):
            attrs, inner = cm.group(2), cm.group(3)
            cells.append(cell_text(inner))
            ds = re.search(r'data-stat="([^"]+)"', attrs)
            keys.append(ds.group(1) if ds else None)
        if not cells:
            continue
        if all(k is None for k in keys) and len(cells) == len(stats):
            keys = list(stats)
        by = {}
        for k, v in zip(keys, cells):
            if k and k not in by:
                by[k] = v
        rows.append({"cells": cells, "by": by})
    return rows, stats


MONTHS = {m: i + 1 for i, m in enumerate(
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"])}


def row_date(row):
    d = row["by"].get("date_game", "")
    m = re.match(r"([A-Z][a-z]{2})[a-z]* (\d{1,2}), (\d{4})", d)
    if m:
        return "%04d-%02d-%02d" % (int(m.group(3)), MONTHS[m.group(1)], int(m.group(2)))
    m = re.match(r"(\d{4})-(\d{2})-(\d{2})", d)
    return m.group(0) if m else None


RANK = re.compile(r"^\((\d+)\)\s*")


def split_rank(text):
    m = RANK.match(text)
    if m:
        return int(m.group(1)), text[m.end():].strip()
    return None, text.strip()


ALIAS = {
    "ole miss": "mississippi", "lsu": "louisiana state", "byu": "brigham young",
    "tcu": "texas christian", "smu": "southern methodist", "ucf": "central florida",
    "usc": "southern california", "pitt": "pittsburgh",
    "nc state": "north carolina state", "uconn": "connecticut",
    "texas a&m": "texas am", "miami fl": "miami", "miami oh": "miami ohio",
    "middle tennessee": "middle tennessee state",
    "ul monroe": "louisiana monroe", "louisiana": "louisiana lafayette",
    "uab": "alabama birmingham", "utep": "texas el paso",
    "usf": "south florida",
}


def norm_team(t):
    s = t.lower().strip()
    s = re.sub(r"\*", "", s)
    s = re.sub(r"[().']", "", s).strip()
    s = re.sub(r"\s+", " ", s)
    s = ALIAS.get(s, s)
    return ALIAS.get(s, s)


def build():
    meta = json.load(open(META_PATH))
    pages = load_pages()
    out, issues = [], []
    for p in pages:
        team, season = p["home_team"], p["season"]
        key = "%s-%d" % (slug_for(team), season)
        info = meta.get(key, {})
        url = info.get("url") or wb_url(team, season)
        path = os.path.join(HTML_DIR, key + ".html")
        rows = None
        page_note = None
        if os.path.exists(path) and os.path.getsize(path) > 2000:
            body = open(path, encoding="utf-8", errors="replace").read()
            title = title_of(body)
            rows, _ = parse_schedule(body)
            if not rows:
                page_note = "snapshot fetched but no schedule table found"
            if not re.match(r"^%d\b" % season, title):
                page_note = "snapshot title does not name season %d: %r" % (season, title)
                rows = None
            elif rows:
                schools = {norm_team(split_rank(r["by"].get("school_name", ""))[1])
                           for r in rows}
                if norm_team(team) not in schools:
                    page_note = ("snapshot title %r does not match expected school %s"
                                 % (title, team))
                    rows = None
        else:
            page_note = "no usable Wayback snapshot (http %s)" % (
                (info.get("attempts") or [{}])[-1].get("code", "?"))

        for g in p["games"]:
            base = {"date": g["date"], "away_team": g["away_team"], "home_team": team,
                    "season": season, "source_url": url}
            if rows is None:
                out.append(dict(base, quote=None, sr_home_rank=None, sr_away_rank=None,
                                sr_home_points=None, sr_away_points=None,
                                site_marker=None, status="page_missing",
                                note=page_note or "page unavailable"))
                continue
            cand = [r for r in rows if row_date(r) == g["date"]]
            if not cand:
                # fall back: match on opponent name when the date differs
                alt = [r for r in rows
                       if norm_team(split_rank(r["by"].get("opp_name", ""))[1])
                       == norm_team(g["away_team"])]
                if len(alt) == 1:
                    r = alt[0]
                    out.append(dict(base, quote=" | ".join(r["cells"]),
                                    sr_home_rank=split_rank(r["by"].get("school_name", ""))[0],
                                    sr_away_rank=split_rank(r["by"].get("opp_name", ""))[0],
                                    sr_home_points=to_int(r["by"].get("points")),
                                    sr_away_points=to_int(r["by"].get("opp_points")),
                                    site_marker=r["by"].get("game_location", ""),
                                    status="discrepancy",
                                    note="worklist date %s not on SR page; SR lists this "
                                         "matchup on %s" % (g["date"], row_date(r))))
                    issues.append((key, g, "date mismatch -> %s" % row_date(r)))
                else:
                    out.append(dict(base, quote=None, sr_home_rank=None, sr_away_rank=None,
                                    sr_home_points=None, sr_away_points=None,
                                    site_marker=None, status="discrepancy",
                                    note="no schedule row for %s on the SR page" % g["date"]))
                    issues.append((key, g, "no row for date"))
                continue
            if len(cand) > 1:
                pick = [r for r in cand
                        if norm_team(split_rank(r["by"].get("opp_name", ""))[1])
                        == norm_team(g["away_team"])]
                cand = pick or cand[:1]
            r = cand[0]
            hr, hschool = split_rank(r["by"].get("school_name", ""))
            ar, aschool = split_rank(r["by"].get("opp_name", ""))
            site = r["by"].get("game_location", "")
            hp = to_int(r["by"].get("points"))
            ap = to_int(r["by"].get("opp_points"))
            res = r["by"].get("game_result", "")
            probs = []
            if norm_team(aschool) != norm_team(g["away_team"]):
                probs.append("opponent is %r, worklist says %s" % (aschool, g["away_team"]))
            if site:
                probs.append("site marker is %r (not a true road game for the visitor "
                             "per SR)" % site)
            if hr != g["home_rank_ap"]:
                probs.append("home AP rank %s vs worklist %s" % (hr, g["home_rank_ap"]))
            if ar != g["away_rank_ap"]:
                probs.append("away AP rank %s vs worklist %s" % (ar, g["away_rank_ap"]))
            if hp != g["home_points"] or ap != g["away_points"]:
                probs.append("score %s-%s (home-away) vs worklist %s-%s"
                             % (hp, ap, g["home_points"], g["away_points"]))
            exp_home_res = "L" if g["result"] == "W" else "W"
            if res and res[0] != exp_home_res:
                probs.append("home result %r, worklist visitor result %s"
                             % (res, g["result"]))
            row = dict(base, quote=" | ".join(r["cells"]),
                       sr_home_rank=hr, sr_away_rank=ar,
                       sr_home_points=hp, sr_away_points=ap, site_marker=site,
                       status="confirmed" if not probs else "discrepancy")
            if probs:
                row["note"] = "; ".join(probs)
                issues.append((key, g, row["note"]))
            out.append(row)

    out.sort(key=lambda r: (r["home_team"], r["season"], r["date"], r["away_team"]))
    json.dump(out, open(os.path.join(ROOT, "data/research/receipts-4.json"), "w"),
              indent=1)
    from collections import Counter
    c = Counter(r["status"] for r in out)
    print("rows", len(out), dict(c))
    for key, g, why in issues:
        print("ISSUE", key, g["date"], g["away_team"], "::", why)


def to_int(v):
    if v is None:
        return None
    v = v.strip()
    return int(v) if re.fullmatch(r"-?\d+", v) else None


def retry():
    """Second chance for pages whose <season+1> year picker gave no schedule table:
    try later year pickers (the season is over in all of them)."""
    meta = json.load(open(META_PATH))
    for key, info in list(meta.items()):
        path = os.path.join(HTML_DIR, key + ".html")
        good = (os.path.exists(path) and os.path.getsize(path) > 2000 and
                parse_schedule(open(path, encoding="utf-8", errors="replace").read())[0])
        if good:
            continue
        season = info["season"]
        for yr in (season + 1, season + 2, season + 3, season + 5):
            url = ("https://web.archive.org/web/%d/https://www.sports-reference.com/"
                   "cfb/schools/%s/%d-schedule.html"
                   % (yr, slug_for(info["home_team"]), season))
            time.sleep(5)
            r = subprocess.run(
                ["curl", "-sL", "--max-time", "120", "-o", path + ".try",
                 "-w", "%{http_code}\t%{url_effective}", url],
                capture_output=True, text=True)
            code, _, eff = (r.stdout or "\t").partition("\t")
            body = (open(path + ".try", encoding="utf-8", errors="replace").read()
                    if os.path.exists(path + ".try") else "")
            rows, _s = parse_schedule(body)
            title = title_of(body)
            print(key, yr, code, bool(rows), title[:60], flush=True)
            if code == "200" and rows:
                os.replace(path + ".try", path)
                info.update(ok=True, url=url, title=title, effective=eff,
                            retry_year=yr)
                json.dump(meta, open(META_PATH, "w"), indent=1)
                break
        else:
            print("STILL MISSING", key, flush=True)
    print("retry done")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "fetch"
    {"fetch": fetch, "build": build, "retry": retry}[cmd]()
