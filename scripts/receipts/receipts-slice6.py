#!/usr/bin/env python3
"""Slice 6 receipts helper: fetch Sports-Reference season-schedule pages via the
Wayback Machine, then extract/verify the schedule row for each worklist game.

Usage:
  receipts-slice6.py fetch [--only N]   # populate the HTML cache (polite, 4s+ sleeps)
  receipts-slice6.py parse              # extract rows, write receipts-6.json
"""
import html as htmllib
import json
import os
import re
import subprocess
import sys
import time

REPO = "/Users/drewhoo/Projects/hostile-territory"
SCRATCH = "/private/tmp/claude-501/-Users-drewhoo-Projects/f889b103-352a-4124-b722-462bf0ec7390/scratchpad/slice6"
CACHE = os.path.join(SCRATCH, "html")
META = os.path.join(SCRATCH, "fetch-meta.json")
WORKLIST = os.path.join(REPO, "data/research/receipts-worklist-6.json")
OUT = os.path.join(REPO, "data/research/receipts-6.json")
PARSE_LOG = os.path.join(SCRATCH, "parse-log.json")

SLUG_EXCEPTIONS = {
    "lsu": "louisiana-state",
    "louisiana state": "louisiana-state",
    "usc": "southern-california",
    "southern california": "southern-california",
    "ole miss": "mississippi",
    "tcu": "texas-christian",
    "texas christian": "texas-christian",
    "smu": "southern-methodist",
    "southern methodist": "southern-methodist",
    "byu": "brigham-young",
    "brigham young": "brigham-young",
    "ucf": "central-florida",
    "central florida": "central-florida",
    "south florida": "south-florida",
    "pitt": "pittsburgh",
    "nc state": "north-carolina-state",
    "north carolina state": "north-carolina-state",
    "uconn": "connecticut",
    "miami (fl)": "miami-fl",
    "miami (oh)": "miami-oh",
    "texas a&m": "texas-am",
    "washington state": "washington-state",
}

MONTHS = {m: i + 1 for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"])}


def slugify(name):
    key = name.strip().lower()
    if key in SLUG_EXCEPTIONS:
        return SLUG_EXCEPTIONS[key]
    s = re.sub(r"[^a-z0-9 \-]", "", key)
    s = re.sub(r"[\s\-]+", "-", s.strip())
    return s


def page_url(slug, season):
    return ("https://web.archive.org/web/%d/https://www.sports-reference.com/cfb/schools/%s/%d-schedule.html"
            % (season + 1, slug, season))


def cache_path(slug, season):
    return os.path.join(CACHE, "%s-%d.html" % (slug, season))


def curl(url, dest):
    r = subprocess.run(
        ["curl", "-sL", "--max-time", "75", "--connect-timeout", "20", "-o", dest,
         "-w", "%{http_code}\t%{url_effective}\t%{size_download}", url],
        capture_output=True, text=True)
    parts = (r.stdout or "\t\t").split("\t")
    code = parts[0] or "000"
    eff = parts[1] if len(parts) > 1 else ""
    size = int(parts[2]) if len(parts) > 2 and parts[2].isdigit() else 0
    return code, eff, size


def get_title(path):
    try:
        h = open(path, encoding="utf-8", errors="replace").read()
    except OSError:
        return None
    m = re.search(r"<title[^>]*>(.*?)</title>", h, re.S | re.I)
    return clean_text(m.group(1)) if m else ""


def title_ok(title, team, slug, season):
    if not title:
        return False
    if not title.startswith(str(season)):
        return False
    tl = title.lower()
    cands = {team.lower(), slug.replace("-", " ")}
    # the display name may be the alias (UCF) or the slug words (Central Florida)
    for c in cands:
        head = c.split()[0]
        if c in tl or (len(head) > 3 and head in tl):
            return False if False else True
    return False


def do_fetch(limit=None, sleep_s=4.5, max_attempts=99):
    os.makedirs(CACHE, exist_ok=True)
    work = json.load(open(WORKLIST))["work"]
    meta = json.load(open(META)) if os.path.exists(META) else {}
    n = 0
    for page in work:
        team, season = page["home_team"], page["season"]
        slug = slugify(team)
        key = "%s|%d" % (team, season)
        if key in meta and (meta[key].get("ok") or len(meta[key].get("attempts", [])) >= max_attempts):
            continue
        if limit is not None and n >= limit:
            break
        n += 1
        url = page_url(slug, season)
        dest = cache_path(slug, season)
        attempts = list((meta.get(key) or {}).get("attempts", []))
        code, eff, size = curl(url, dest)
        title = get_title(dest)
        ok = code == "200" and title_ok(title, team, slug, season)
        attempts.append({"code": code, "effective_url": eff, "size": size, "title": title})
        meta[key] = {"team": team, "season": season, "slug": slug, "url": url,
                     "cache": dest, "ok": ok, "attempts": attempts}
        json.dump(meta, open(META, "w"), indent=1)
        print(("OK  " if ok else "BAD ") + key + "  code=" + code + " " + str(title)[:60], flush=True)
        time.sleep(sleep_s)
    print("fetched %d pages this run; %d ok / %d total" %
          (n, sum(1 for v in meta.values() if v["ok"]), len(meta)), flush=True)


TAG = re.compile(r"<[^>]+>")


def clean_text(s):
    s = s.replace("&nbsp;", " ").replace("\xa0", " ")
    s = TAG.sub("", s)
    s = htmllib.unescape(s)
    return re.sub(r"\s+", " ", s).strip()


def extract_table(h):
    m = re.search(r'<table[^>]*id="schedule"[^>]*>(.*?)</table>', h, re.S)
    if not m:
        return None
    return m.group(1)


def parse_rows(tbl):
    """Return (headers, rows) where rows are lists of (stat_or_None, text)."""
    headers = []
    hm = re.search(r"<thead>(.*?)</thead>", tbl, re.S)
    if hm:
        headers = [clean_text(c) for c in re.findall(r"<th[^>]*>(.*?)</th>", hm.group(1), re.S)]
        body = tbl[hm.end():]
    else:
        body = tbl
    rows = []
    for rm in re.finditer(r"<tr([^>]*)>(.*?)</tr>", body, re.S):
        attrs, inner = rm.group(1), rm.group(2)
        if "thead" in attrs:
            continue
        cells = []
        for cm in re.finditer(r"<(t[hd])([^>]*)>(.*?)</\1>", inner, re.S):
            sm = re.search(r'data-stat="([^"]+)"', cm.group(2))
            csk = re.search(r'csk="([^"]*)"', cm.group(2))
            cells.append({"stat": sm.group(1) if sm else None,
                          "csk": csk.group(1) if csk else None,
                          "text": clean_text(cm.group(3))})
        if not cells:
            continue
        # skip repeated header rows
        if all(c["text"] in ("", "Date", "School", "Opponent", "Conf", "G") for c in cells):
            continue
        rows.append(cells)
    return headers, rows


def norm_date(txt, csk, season):
    if csk and re.match(r"^\d{4}-\d{2}-\d{2}$", csk):
        return csk
    m = re.match(r"^([A-Za-z]{3})[a-z]* (\d{1,2}),? (\d{4})$", txt)
    if m:
        mo = MONTHS.get(m.group(1).lower())
        if mo:
            return "%s-%02d-%02d" % (m.group(3), mo, int(m.group(2)))
    m = re.match(r"^(\d{4})-(\d{2})-(\d{2})", txt)
    if m:
        return m.group(0)
    m = re.match(r"^([A-Za-z]{3})[a-z]* (\d{1,2})$", txt)
    if m:
        mo = MONTHS.get(m.group(1).lower())
        if mo:
            yr = season if mo >= 7 else season + 1
            return "%d-%02d-%02d" % (yr, mo, int(m.group(2)))
    return None


RANK = re.compile(r"^\((\d+)\)\s*(.*)$")


def split_rank(txt):
    m = RANK.match(txt)
    if m:
        return int(m.group(1)), m.group(2).strip()
    return None, txt.strip()


def columns(headers, cells):
    """Map a row's cells to the fields we need. Returns dict or raises ValueError."""
    stats = {c["stat"]: c for c in cells if c["stat"]}
    if "date_game" in stats and "opp_name" in stats:
        return {
            "date": stats["date_game"],
            "school": stats.get("school_name") or stats.get("team_name"),
            "site": stats.get("game_location"),
            "opp": stats["opp_name"],
            "result": stats.get("game_result"),
            "pts": stats.get("points"),
            "opp_pts": stats.get("opp_points"),
            "order": [c["text"] for c in cells],
        }
    # positional, driven by the header row
    def hidx(*names):
        for i, h in enumerate(headers):
            if h in names:
                return i
        return None
    i_date = hidx("Date")
    i_school = hidx("School", "Team")
    i_conf = hidx("Conf")
    if i_date is None or i_school is None or i_conf is None:
        raise ValueError("header map failed: %r" % (headers,))
    if len(cells) < i_conf + 4:
        raise ValueError("short row: %r" % ([c["text"] for c in cells],))
    return {
        "date": cells[i_date],
        "school": cells[i_school],
        "site": cells[i_school + 1],
        "opp": cells[i_school + 2],
        "result": cells[i_conf + 1],
        "pts": cells[i_conf + 2],
        "opp_pts": cells[i_conf + 3],
        "order": [c["text"] for c in cells],
    }


def to_int(txt):
    t = (txt or "").strip()
    return int(t) if re.match(r"^-?\d+$", t) else None


def do_parse():
    work = json.load(open(WORKLIST))["work"]
    meta = json.load(open(META))
    out, log = [], []
    for page in work:
        team, season = page["home_team"], page["season"]
        key = "%s|%d" % (team, season)
        info = meta.get(key)
        wl_games = page["games"]
        if not info or not info.get("ok"):
            for g in wl_games:
                out.append({
                    "date": g["date"], "away_team": g["away_team"], "home_team": team, "season": season,
                    "source_url": page_url(slugify(team), season), "quote": "",
                    "sr_home_rank": None, "sr_away_rank": None,
                    "sr_home_points": None, "sr_away_points": None, "site_marker": None,
                    "status": "page_missing",
                    "note": "no usable Wayback snapshot: last attempt %s" % (
                        json.dumps((info or {}).get("attempts", [])[-1:]) if info else "never fetched"),
                })
            continue
        h = open(info["cache"], encoding="utf-8", errors="replace").read()
        tbl = extract_table(h)
        if not tbl:
            for g in wl_games:
                out.append({
                    "date": g["date"], "away_team": g["away_team"], "home_team": team, "season": season,
                    "source_url": info["url"], "quote": "",
                    "sr_home_rank": None, "sr_away_rank": None,
                    "sr_home_points": None, "sr_away_points": None, "site_marker": None,
                    "status": "page_missing", "note": "snapshot fetched but no schedule table in it",
                })
            continue
        headers, rows = parse_rows(tbl)
        parsed = []
        for cells in rows:
            try:
                f = columns(headers, cells)
            except ValueError as e:
                log.append({"page": key, "error": str(e)})
                continue
            d = norm_date(f["date"]["text"], f["date"]["csk"], season)
            parsed.append((d, f))
        for g in wl_games:
            matches = [f for d, f in parsed if d == g["date"]]
            rec = {"date": g["date"], "away_team": g["away_team"], "home_team": team,
                   "season": season, "source_url": info["url"]}
            if not matches:
                near = [(d, f) for d, f in parsed
                        if slugify(clean_text(split_rank(f["opp"]["text"])[1])) == slugify(g["away_team"])]
                rec.update({
                    "quote": " | ".join(near[0][1]["order"]) if near else "",
                    "sr_home_rank": None, "sr_away_rank": None,
                    "sr_home_points": None, "sr_away_points": None, "site_marker": None,
                    "status": "discrepancy",
                    "note": ("no schedule row dated %s; nearest row by opponent is dated %s" % (g["date"], near[0][0]))
                    if near else "no schedule row dated %s and no row against %s" % (g["date"], g["away_team"]),
                })
                out.append(rec)
                continue
            f = matches[0]
            hr, hname = split_rank(f["school"]["text"])
            ar, aname = split_rank(f["opp"]["text"])
            site = f["site"]["text"]
            pts, opp_pts = to_int(f["pts"]["text"]), to_int(f["opp_pts"]["text"])
            res = f["result"]["text"]
            rec.update({
                "quote": " | ".join(f["order"]),
                "sr_home_rank": hr, "sr_away_rank": ar,
                "sr_home_points": pts, "sr_away_points": opp_pts,
                "site_marker": site,
            })
            problems = []
            if len(matches) > 1:
                problems.append("%d rows share date %s" % (len(matches), g["date"]))
            if slugify(hname) != slugify(team):
                problems.append("school cell is %r, not %s" % (hname, team))
            if slugify(aname) != slugify(g["away_team"]):
                problems.append("opponent cell is %r, not %s" % (aname, g["away_team"]))
            if hr != g["home_rank_ap"]:
                problems.append("SR home rank %s vs worklist home_rank_ap %s" % (hr, g["home_rank_ap"]))
            if ar != g["away_rank_ap"]:
                problems.append("SR away rank %s vs worklist away_rank_ap %s" % (ar, g["away_rank_ap"]))
            if site != "":
                problems.append("site marker %r (SR does not call this a home game for %s)" % (site, team))
            if pts != g["home_points"]:
                problems.append("SR home points %s vs worklist %s" % (pts, g["home_points"]))
            if opp_pts != g["away_points"]:
                problems.append("SR away points %s vs worklist %s" % (opp_pts, g["away_points"]))
            expect_home_res = {"W": "L", "L": "W", "T": "T"}.get(g["result"])
            if res and res.split()[0] not in ("W", "L", "T"):
                problems.append("unreadable result cell %r" % res)
            elif res and res.split()[0] != expect_home_res:
                problems.append("SR home result %r vs worklist visitor result %r" % (res, g["result"]))
            rec["status"] = "confirmed" if not problems else "discrepancy"
            if problems:
                rec["note"] = "; ".join(problems)
            out.append(rec)
    json.dump(out, open(OUT, "w"), indent=1)
    json.dump(log, open(PARSE_LOG, "w"), indent=1)
    from collections import Counter
    c = Counter(r["status"] for r in out)
    print(json.dumps(dict(c)), "rows:", len(out), "parse_log:", len(log))


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "fetch"
    if cmd == "fetch":
        def arg(name, cast, default):
            return cast(sys.argv[sys.argv.index(name) + 1]) if name in sys.argv else default
        do_fetch(arg("--only", int, None), arg("--sleep", float, 4.5), arg("--max-attempts", int, 99))
    elif cmd == "parse":
        do_parse()
    else:
        print(__doc__)
        sys.exit(2)
