#!/usr/bin/env python3
"""Championship-week neutral-site audit.

For every suspect in data/research/ccg-suspects.json (December, week 14+,
season_type regular, venue empty or campus-looking), fetch the AWAY team's
Sports-Reference season-schedule page from the Wayback Machine and read the
site-marker cell between the School and Opponent columns:

  '@' -> SR agrees this was a true road game            -> verdict "road"
  'N' -> SR calls it neutral                            -> verdict "neutral"
  ''  -> SR has the away team at home (can't happen)    -> verdict "unresolved"

Usage:
  ccg-audit.py fetch [--only N]   # populate the HTML cache (polite, 4s+ sleeps)
  ccg-audit.py parse              # write ccg-audit.json + ccg-audit-notes.md
"""
import html as htmllib
import json
import os
import re
import subprocess
import sys
import time
import unicodedata

REPO = "/Users/drewhoo/Projects/hostile-territory"
SCRATCH = ("/private/tmp/claude-501/-Users-drewhoo-Projects/"
           "f889b103-352a-4124-b722-462bf0ec7390/scratchpad/ccg")
CACHE = os.path.join(SCRATCH, "html")
META = os.path.join(SCRATCH, "fetch-meta.json")
SUSPECTS = os.path.join(REPO, "data/research/ccg-suspects.json")
OUT_JSON = os.path.join(REPO, "data/research/ccg-audit.json")
OUT_MD = os.path.join(REPO, "data/research/ccg-audit-notes.md")

SLUG_EXCEPTIONS = {
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
    "unlv": "nevada-las-vegas",
    "utep": "texas-el-paso",
    "uab": "alabama-birmingham",
    "southern miss": "southern-mississippi",
    "umass": "massachusetts",
    "louisiana": "louisiana-lafayette",
}

# The <season+1> year picker occasionally lands on a pre/mid-season snapshot
# (unplayed games, "TBD" kickoff times). These pages get an explicit timestamp.
# UNLV's own 2024 schedule page has only pre/early-season captures, so that game
# is read from Boise State's page, whose last capture (Dec 25, 2024) is post-game.
PICKER = {
    "Boise State|2024": "20241225124425",
}

# Nine away-team schedule pages have no Wayback capture at all (CDX returns zero
# snapshots for the URL, and the season-summary page carries no schedule table).
# For those we read the HOME team's page instead, exactly as the receipts fleet
# does: there an empty site marker means a real home game (so the visitor's true
# road game) and 'N' still means neutral.
HOME_SIDE = {
    "Hawaii|2019": "Boise State",
    "Louisiana|2019": "Appalachian State",
    "Rice|2020": "Marshall",
    "Stanford|2020": "Washington",
    "Akron|2020": "Buffalo",
    "Houston|2021": "Cincinnati",
    "New Mexico State|2023": "Liberty",
    "SMU|2023": "Tulane",
    "UNLV|2024": "Boise State",
}

# Two suspects have no archived Sports-Reference schedule page on EITHER side
# (CDX returns zero captures for both teams' <season>-schedule.html, and the
# season-summary snapshots carry no schedule table). These fall back to other SR
# pages that do have captures, quoted verbatim below.
#
# Akron|2020 leans on the boxscore page title. SR writes "X at Y" for a road game
# and "X vs Y" for a neutral-site one — calibrated against three games already in
# this set whose schedule pages agree: 2002-12-07 "Oklahoma vs Colorado" (Big 12
# CG, Houston, 'N'), 2007-12-01 "Virginia Tech vs Boston College" (ACC CG,
# Jacksonville, 'N'), and 2011-12-02 "UCLA at Oregon" (Pac-12 CG at Autzen, '@').
SPECIAL = {
    "Akron|2020": {
        "verdict": "road",
        "source_url": ("https://web.archive.org/web/20230608171621id_/"
                       "https://www.sports-reference.com/cfb/boxscores/2020-12-12-buffalo.html"),
        "quote": ("Akron at Buffalo Box Score, December 12, 2020 | College Football at "
                  "Sports-Reference.com"),
        "note": ("neither akron/2020-schedule.html nor buffalo/2020-schedule.html has any "
                 "Wayback capture; SR's boxscore page titles this game 'Akron AT Buffalo', "
                 "and SR writes 'vs' (not 'at') for its neutral-site games"),
    },
    "Troy|2025": {
        "verdict": "road",
        "source_url": ("https://web.archive.org/web/20260218070136id_/"
                       "https://www.sports-reference.com/cfb/years/2025-schedule.html"),
        "quote": "880 | 16 | Dec 5, 2025 | 7:00 PM | Fri | (19) James Madison | 31 |  | Troy | 14 |",
        "note": ("troy/2025-schedule.html has one capture (Aug 31, 2025, preseason) and "
                 "james-madison/2025-schedule.html one (Sep 6, 2025); SR's 2025 season "
                 "schedule page carries the played game, with the site marker between "
                 "winner James Madison and loser Troy EMPTY, i.e. JMU was at home, and an "
                 "empty notes cell"),
    },
    "SMU|2023": {
        "verdict": "road",
        "source_url": ("https://web.archive.org/web/20251006214757id_/"
                       "https://www.sports-reference.com/cfb/conferences/american/2023-schedule.html"),
        "quote": ("57 | Dec 2, 2023 | 4:00 PM | Sat | (25) Southern Methodist | 26 | @ | "
                  "(17) Tulane | 14 |"),
        "note": ("neither southern-methodist/2023-schedule.html nor tulane/2023-schedule.html "
                 "has any Wayback capture; the AAC 2023 conference schedule page puts '@' "
                 "between winner SMU and loser Tulane, i.e. played at Tulane, and its notes "
                 "cell is empty"),
    },
}

MONTHS = {m: i + 1 for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"])}

TAG = re.compile(r"<[^>]+>")


def clean_text(s):
    s = s.replace("&nbsp;", " ").replace("\xa0", " ")
    s = TAG.sub("", s)
    s = htmllib.unescape(s)
    return re.sub(r"\s+", " ", s).strip()


def slugify(name):
    key = unicodedata.normalize("NFKD", name.strip().lower())
    key = "".join(c for c in key if not unicodedata.combining(c))
    if key in SLUG_EXCEPTIONS:
        return SLUG_EXCEPTIONS[key]
    s = re.sub(r"[^a-z0-9 \-]", "", key)
    return re.sub(r"[\s\-]+", "-", s.strip())


def page_url(slug, season, team=None):
    pick = PICKER.get("%s|%s" % (team, season), str(season + 1))
    return ("https://web.archive.org/web/%s/https://www.sports-reference.com"
            "/cfb/schools/%s/%d-schedule.html" % (pick, slug, season))


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
    if not title or not title.startswith(str(season)):
        return False
    tl = title.lower()
    for c in {team.lower(), slug.replace("-", " ")}:
        head = c.split()[0]
        if c in tl or (len(head) > 3 and head in tl):
            return True
    return False


def snapshot_unplayed(path, season, want_dates):
    """True when the snapshot predates the games we need.

    The <season+1> picker lands on whatever capture is closest, which for a few
    teams is a preseason page: every row is there but nothing has a score yet, so
    the championship-week row may be missing entirely or carry no result. Either
    way the snapshot cannot settle the suspect, so treat it as unusable.
    """
    try:
        h = open(path, encoding="utf-8", errors="replace").read()
    except OSError:
        return False
    tbl = extract_table(h)
    if not tbl:
        return False
    try:
        headers, rows = parse_rows(tbl)
    except Exception:
        return False
    if not rows:
        return False
    i_pts = hidx(headers, "Pts")
    for cells in rows:
        try:
            dcell, site, opp, notes = row_fields(headers, cells)
        except ValueError:
            continue
        if norm_date(dcell["text"], dcell.get("csk"), season) not in want_dates:
            continue
        if i_pts is None or len(cells) <= i_pts:
            return False
        return not cells[i_pts]["text"]
    return True


def do_fetch(limit=None, sleep_s=4.5):
    os.makedirs(CACHE, exist_ok=True)
    suspects = json.load(open(SUSPECTS))
    meta = json.load(open(META)) if os.path.exists(META) else {}
    pages, seen, dates = [], set(), {}
    for s in suspects:
        key = "%s|%d" % (s["away_team"], s["season"])
        dates.setdefault(key, set()).add(s["date"])
        if key not in seen:
            seen.add(key)
            pages.append((s["away_team"], s["season"]))
    n = 0
    for team, season in pages:
        key = "%s|%d" % (team, season)
        if key in SPECIAL:
            continue
        side = "home" if key in HOME_SIDE else "away"
        page_team = HOME_SIDE.get(key, team)
        slug = slugify(page_team)
        prev = meta.get(key) or {}
        max_attempts = int(os.environ.get("CCG_MAX_ATTEMPTS", "2"))
        if prev.get("ok") or len(prev.get("attempts", [])) >= max_attempts:
            continue
        if limit is not None and n >= limit:
            break
        n += 1
        url = page_url(slug, season, page_team)
        dest = cache_path(slug, season)
        code, eff, size = curl(url, dest)
        if code in ("429", "503", "502", "500"):
            print("backoff %s code=%s" % (key, code), flush=True)
            time.sleep(60)
            code, eff, size = curl(url, dest)
        title = get_title(dest)
        stale = code == "200" and snapshot_unplayed(dest, season, dates[key])
        ok = code == "200" and title_ok(title, page_team, slug, season) and not stale
        attempts = list(prev.get("attempts", []))
        attempts.append({"code": code, "effective_url": eff, "size": size,
                         "title": title, "stale": stale})
        meta[key] = {"team": team, "season": season, "slug": slug, "url": url,
                     "cache": dest, "ok": ok, "attempts": attempts,
                     "side": side, "page_team": page_team}
        json.dump(meta, open(META, "w"), indent=1)
        print(("OK  " if ok else "BAD ") + key + " code=" + code + " " + str(title)[:60],
              flush=True)
        time.sleep(sleep_s)
    print("fetched %d this run; %d ok / %d pages" %
          (n, sum(1 for v in meta.values() if v["ok"]), len(meta)), flush=True)


def extract_table(h):
    m = re.search(r'<table[^>]*id="schedule"[^>]*>(.*?)</table>', h, re.S)
    return m.group(1) if m else None


def parse_rows(tbl):
    headers = []
    hm = re.search(r"<thead>(.*?)</thead>", tbl, re.S)
    if hm:
        headers = [clean_text(c) for c in
                   re.findall(r"<th[^>]*>(.*?)</th>", hm.group(1), re.S)]
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
            return "%d-%02d-%02d" % (season if mo >= 7 else season + 1, mo, int(m.group(2)))
    return None


def hidx(headers, *names):
    for i, h in enumerate(headers):
        if h in names:
            return i
    return None


def row_fields(headers, cells):
    """Return (date_cell, site_marker, opp_text, notes_text) for one row."""
    stats = {c["stat"]: c for c in cells if c["stat"]}
    if "date_game" in stats and "opp_name" in stats:
        return (stats["date_game"],
                (stats.get("game_location") or {}).get("text", "") if stats.get("game_location") else "",
                stats["opp_name"]["text"],
                (stats.get("notes") or {}).get("text", "") if stats.get("notes") else "")
    i_date = hidx(headers, "Date")
    i_school = hidx(headers, "School", "Team")
    i_opp = hidx(headers, "Opponent")
    i_notes = hidx(headers, "Notes")
    if i_date is None or i_school is None or i_opp is None:
        raise ValueError("header map failed: %r" % (headers,))
    if len(cells) <= i_opp:
        raise ValueError("short row")
    site = cells[i_school + 1]["text"] if i_opp == i_school + 2 else cells[i_opp - 1]["text"]
    notes = cells[i_notes]["text"] if (i_notes is not None and len(cells) > i_notes) else ""
    return cells[i_date], site, cells[i_opp]["text"], notes


def norm_team(s):
    s = re.sub(r"^\(\d+\)\s*", "", s).strip().lower()
    s = re.sub(r"[^a-z0-9 ]", "", s)
    return re.sub(r"\s+", " ", s)


ALIASES = {
    "miami fl": {"miami fl", "miami florida", "miami"},
    "miami oh": {"miami oh", "miami ohio"},
    "ucf": {"ucf", "central florida"},
    "byu": {"byu", "brigham young"},
    "smu": {"smu", "southern methodist"},
    "lsu": {"lsu", "louisiana state"},
    "unlv": {"unlv", "nevada las vegas", "nevadalas vegas"},
    "southern miss": {"southern miss", "southern mississippi"},
    "louisiana": {"louisiana", "louisianalafayette", "louisiana lafayette"},
    "pittsburgh": {"pittsburgh", "pitt"},
    "uconn": {"uconn", "connecticut"},
    "texas am": {"texas am", "texas a m"},
    "hawaii": {"hawaii", "hawaii"},
    "appalachian state": {"appalachian state", "app state"},
    "usc": {"usc", "southern california"},
    "tcu": {"tcu", "texas christian"},
    "ole miss": {"ole miss", "mississippi"},
    "nc state": {"nc state", "north carolina state"},
}


def team_match(a, b):
    na, nb = norm_team(a), norm_team(b)
    if na == nb:
        return True
    for canon, alts in ALIASES.items():
        if na in alts | {canon} and nb in alts | {canon}:
            return True
    return na in nb or nb in na


def do_parse():
    suspects = json.load(open(SUSPECTS))
    meta = json.load(open(META)) if os.path.exists(META) else {}
    cache = {}
    out = []
    for s in suspects:
        key = "%s|%d" % (s["away_team"], s["season"])
        m = meta.get(key)
        row = {"date": s["date"], "away_team": s["away_team"],
               "home_team": s["home_team"], "season": s["season"],
               "verdict": "unresolved", "source_url": (m or {}).get("url", ""),
               "quote": "", "note": ""}
        if key in SPECIAL:
            row.update(SPECIAL[key])
            out.append(row)
            continue
        if not m or not m.get("ok"):
            last = ((m or {}).get("attempts") or [{}])[-1]
            row["note"] = "no usable Wayback snapshot (code=%s, title=%r)" % (
                last.get("code"), last.get("title"))
            out.append(row)
            continue
        path = m["cache"]
        if path not in cache:
            h = open(path, encoding="utf-8", errors="replace").read()
            tbl = extract_table(h)
            cache[path] = parse_rows(tbl) if tbl else None
        parsed = cache[path]
        if not parsed:
            row["note"] = "schedule table not found in snapshot"
            out.append(row)
            continue
        headers, rows = parsed
        hit = None
        for cells in rows:
            try:
                dcell, site, opp, notes = row_fields(headers, cells)
            except ValueError:
                continue
            d = norm_date(dcell["text"], dcell.get("csk"), s["season"])
            if d == s["date"]:
                hit = (cells, site, opp, notes)
                break
        if not hit:
            row["note"] = "no schedule row on %s for %s %d" % (
                s["date"], s["away_team"], s["season"])
            out.append(row)
            continue
        cells, site, opp, notes = hit
        side = m.get("side", "away")
        expect_opp = s["home_team"] if side == "away" else s["away_team"]
        road_marker = "@" if side == "away" else ""
        row["quote"] = " | ".join(c["text"] for c in cells)
        row["note"] = notes
        if side == "home":
            row["note"] = ("%s [read from the home team's page: %s %d — the away team's "
                           "own schedule page has no Wayback capture]" %
                           (notes or "(notes cell empty)", m.get("page_team"), s["season"]))
        if not team_match(opp, expect_opp):
            row["verdict"] = "unresolved"
            row["note"] = "row on %s names opponent %r, expected %s%s" % (
                s["date"], opp, expect_opp, (" [notes: %s]" % notes) if notes else "")
        elif site == road_marker:
            row["verdict"] = "road"
        elif site == "N":
            row["verdict"] = "neutral"
        else:
            row["verdict"] = "unresolved"
            row["note"] = "unexpected site marker %r on the %s team's page%s" % (
                site, side, (" [notes: %s]" % notes) if notes else "")
        out.append(row)

    json.dump(out, open(OUT_JSON, "w"), indent=1)
    write_notes(out)
    c = {v: sum(1 for r in out if r["verdict"] == v)
         for v in ("road", "neutral", "unresolved")}
    print("road=%d neutral=%d unresolved=%d total=%d" % (
        c["road"], c["neutral"], c["unresolved"], len(out)), flush=True)


def write_notes(out):
    c = {v: [r for r in out if r["verdict"] == v]
         for v in ("road", "neutral", "unresolved")}
    L = []
    L.append("# Championship-week neutral-site audit")
    L.append("")
    L.append("93 suspects from `data/research/ccg-suspects.json` — December games in")
    L.append("championship week (week 14+, `season_type` regular) whose venue field was empty")
    L.append("or looked like a campus stadium. Each one was checked against the AWAY team's")
    L.append("Sports-Reference season-schedule page served by the Wayback Machine. The")
    L.append("site-marker cell between the School and Opponent columns is the verdict:")
    L.append("`@` = SR agrees it was a true road game, `N` = SR calls it neutral.")
    L.append("")
    L.append("Campus-hosted championship games (the 2011 Pac-12 CG at Autzen, the CUSA /")
    L.append("AAC / MWC / Sun Belt title games at the higher seed) come back `@`, so they stay")
    L.append("road games. Only the seven below are neutral.")
    L.append("")
    L.append("## Counts")
    L.append("")
    L.append("| verdict | games |")
    L.append("| --- | --- |")
    L.append("| road (confirmed true road game, keep) | %d |" % len(c["road"]))
    L.append("| neutral (flag for exclusion) | %d |" % len(c["neutral"]))
    L.append("| unresolved | %d |" % len(c["unresolved"]))
    L.append("| **total** | **%d** |" % len(out))
    L.append("")

    L.append("## Neutral — ready to paste into `data/game-corrections.json`")
    L.append("")
    if not c["neutral"]:
        L.append("_None._")
    else:
        L.append("```json")
        entries = []
        for r in c["neutral"]:
            reason = r["note"] or "Sports-Reference marks this game 'N' (neutral site)"
            entries.append(
                '  {\n'
                '   "date": %s,\n'
                '   "away_team": %s,\n'
                '   "home_team": %s,\n'
                '   "action": "exclude",\n'
                '   "reason": %s\n'
                '  }' % (json.dumps(r["date"]), json.dumps(r["away_team"]),
                         json.dumps(r["home_team"]),
                         json.dumps("Sports-Reference lists this as a neutral-site game "
                                    "('N' site marker): %s" % reason)))
        L.append("[\n" + ",\n".join(entries) + "\n]")
        L.append("```")
        L.append("")
        L.append("### Neutral games, with the SR row behind each call")
        L.append("")
        for r in c["neutral"]:
            L.append("- **%s — %s at %s (%d)**" % (r["date"], r["away_team"],
                                                   r["home_team"], r["season"]))
            L.append("  - SR notes: %s" % (r["note"] or "_(notes cell empty)_"))
            L.append("  - row: `%s`" % r["quote"])
            L.append("  - source: %s" % r["source_url"])
    L.append("")

    if c["unresolved"]:
        L.append("## Unresolved")
        L.append("")
        for r in c["unresolved"]:
            L.append("- **%s — %s at %s (%d)**: %s" % (
                r["date"], r["away_team"], r["home_team"], r["season"], r["note"]))
            if r["quote"]:
                L.append("  - row: `%s`" % r["quote"])
            L.append("  - source: %s" % r["source_url"])
        L.append("")

    fallbacks = [r for r in out
                 if "read from the home team's page" in (r["note"] or "")
                 or "/cfb/years/" in r["source_url"]
                 or "/cfb/conferences/" in r["source_url"]
                 or "/cfb/boxscores/" in r["source_url"]]
    if fallbacks:
        L.append("## Sourcing exceptions")
        L.append("")
        L.append("%d of the 93 could not be read off the away team's own schedule page — the "
                 "Wayback" % len(fallbacks))
        L.append("Machine has no post-game capture of it (CDX returns zero snapshots, or only")
        L.append("preseason ones, and SR's season-summary snapshots carry no schedule table).")
        L.append("Each fell back to another Sports-Reference page that *is* captured. On the home")
        L.append("team's page, and on SR's conference / season schedule pages, an EMPTY site")
        L.append("marker means the named home team played at home — so the visitor was on the")
        L.append("road; `N` still means neutral.")
        L.append("")
        L.append("| date | game | verdict | fell back to |")
        L.append("| --- | --- | --- | --- |")
        for r in fallbacks:
            L.append("| %s | %s at %s | %s | %s |" % (
                r["date"], r["away_team"], r["home_team"], r["verdict"],
                r["source_url"].split("sports-reference.com")[-1] or r["source_url"]))
        L.append("")

    L.append("## Road — confirmed true road games, leave alone")
    L.append("")
    L.append("| date | away | home | SR notes |")
    L.append("| --- | --- | --- | --- |")
    for r in c["road"]:
        L.append("| %s | %s | %s | %s |" % (
            r["date"], r["away_team"], r["home_team"],
            (r["note"] or "").replace("|", "\\|") or "—"))
    L.append("")
    open(OUT_MD, "w").write("\n".join(L))


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "parse"
    if cmd == "fetch":
        only = None
        if "--only" in sys.argv:
            only = int(sys.argv[sys.argv.index("--only") + 1])
        do_fetch(limit=only, sleep_s=float(os.environ.get("CCG_SLEEP", "4.5")))
    elif cmd == "parse":
        do_parse()
    else:
        sys.exit("unknown command %r" % cmd)
