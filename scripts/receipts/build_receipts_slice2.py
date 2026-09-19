#!/usr/bin/env python3
"""Build data/research/receipts-2.json from Wayback snapshots of Sports-Reference
season-schedule pages (slice 2: hosts Florida through Kansas State).

Spec: data/research/receipts-README.md

Phase 1 (--fetch): pull each host/season schedule page from the Wayback Machine
into a local HTML cache (politeness sleep between requests, backoff on 429/5xx).
Phase 2 (--build): parse each cached page, locate each worklist game's row by
date, verify it against the worklist, and emit one receipt row per game.

Usage:
  python3 scripts/receipts/build_receipts_slice2.py --fetch --cache <dir>
  python3 scripts/receipts/build_receipts_slice2.py --build --cache <dir>
"""

import argparse
import html as htmllib
import json
import os
import re
import subprocess
import sys
import time

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
WORKLIST = os.path.join(REPO, "data", "research", "receipts-worklist-2.json")
OUT_JSON = os.path.join(REPO, "data", "research", "receipts-2.json")

SLUG_EXCEPTIONS = {
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


def slug(team):
    if team in SLUG_EXCEPTIONS:
        return SLUG_EXCEPTIONS[team]
    s = team.lower()
    s = re.sub(r"[^a-z0-9 ]", "", s)
    s = re.sub(r"\s+", "-", s.strip())
    return s


# SR schedule pages sometimes spell an opponent differently from our worklist.
# Each entry maps worklist name -> extra acceptable SR spellings.
NAME_ALIASES = {
    "Ole Miss": {"Mississippi"},
    "Pitt": {"Pittsburgh"},
    "NC State": {"North Carolina State"},
    "UConn": {"Connecticut"},
    "UCF": {"Central Florida"},
    "USC": {"Southern California"},
    "LSU": {"Louisiana State"},
    "TCU": {"Texas Christian"},
    "SMU": {"Southern Methodist"},
    "BYU": {"Brigham Young"},
    "Texas A&M": {"Texas A&M", "Texas AM"},
    "Miami (FL)": {"Miami FL", "Miami (Fla.)", "Miami"},
    "Miami (OH)": {"Miami OH", "Miami (Ohio)"},
    "UAB": {"Alabama-Birmingham", "Alabama Birmingham"},
    "Southern Miss": {"Southern Mississippi"},
    "Florida International": {"FIU"},
    "Texas State": {"Southwest Texas State", "Texas State-San Marcos"},
    "Louisiana-Monroe": {"Northeast Louisiana"},
}

# SR display nicknames, used only as a soft sanity check on the page title.
def wayback_url(team, season):
    return (
        "https://web.archive.org/web/%d/https://www.sports-reference.com/cfb/schools/%s/%d-schedule.html"
        % (season + 1, slug(team), season)
    )


def cache_path(cache_dir, team, season):
    return os.path.join(cache_dir, "%s-%d.html" % (slug(team), season))


def curl(url, dest):
    """Fetch url to dest. Returns (http_code, effective_url)."""
    proc = subprocess.run(
        ["curl", "-sL", "--max-time", "120", "-o", dest, "-w", "%{http_code}\t%{url_effective}", url],
        capture_output=True,
        text=True,
    )
    if proc.returncode != 0:
        return (0, "")
    parts = proc.stdout.strip().split("\t")
    code = int(parts[0]) if parts and parts[0].isdigit() else 0
    eff = parts[1] if len(parts) > 1 else ""
    return (code, eff)


def fetch_all(work, cache_dir, sleep_s=4.5):
    os.makedirs(cache_dir, exist_ok=True)
    meta_path = os.path.join(cache_dir, "_fetch-meta.json")
    meta = {}
    if os.path.exists(meta_path):
        meta = json.load(open(meta_path))

    for idx, page in enumerate(work, 1):
        team, season = page["home_team"], page["season"]
        key = "%s|%d" % (team, season)
        dest = cache_path(cache_dir, team, season)
        if key in meta and meta[key].get("ok") and os.path.exists(dest):
            continue
        url = wayback_url(team, season)
        code, eff = 0, ""
        http_failures = 0   # 429/5xx: spec says back off 60s, two in a row means give up
        transport_tries = 0  # curl exit 7 etc: Wayback refusing the connection, retry quickly
        while True:
            code, eff = curl(url, dest)
            if code == 200:
                break
            if code == 0:
                transport_tries += 1
                if transport_tries > 6:
                    break
                sys.stderr.write("  retry %s %d (curl transport failure %d)\n"
                                 % (team, season, transport_tries))
                time.sleep(6)
                continue
            if code == 429 or code >= 500:
                http_failures += 1
                if http_failures >= 2:
                    break
                sys.stderr.write("  backoff %s %d (code %s)\n" % (team, season, code))
                time.sleep(60)
                continue
            break
        ok = code == 200 and os.path.exists(dest) and os.path.getsize(dest) > 2000
        meta[key] = {"url": url, "code": code, "effective": eff, "ok": ok}
        sys.stderr.write("[%3d/%d] %s %d -> %s %s\n" % (idx, len(work), team, season, code, "ok" if ok else "MISS"))
        json.dump(meta, open(meta_path, "w"), indent=1)
        time.sleep(sleep_s)
    json.dump(meta, open(meta_path, "w"), indent=1)
    return meta


TAG_RE = re.compile(r"<[^>]+>")


def celltext(cell_html):
    t = cell_html.replace("&nbsp;", " ")
    t = TAG_RE.sub("", t)
    t = htmllib.unescape(t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


CELL_RE = re.compile(r"<(t[dh])\b([^>]*)>(.*?)</\1>", re.S | re.I)
ROW_RE = re.compile(r"<tr\b[^>]*>(.*?)</tr>", re.S | re.I)
DATASTAT_RE = re.compile(r'data-stat="([^"]+)"')
CSK_RE = re.compile(r'csk="([^"]+)"')
RANK_RE = re.compile(r"^\((\d+)\)\s*")
MONTHS = {m: i + 1 for i, m in enumerate(
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"])}


def parse_schedule_rows(page_html):
    """Return a list of dicts, one per schedule tbody row."""
    i = page_html.find('id="schedule"')
    if i < 0:
        return []
    tstart = page_html.rfind("<table", 0, i)
    tend = page_html.find("</table>", i)
    if tstart < 0 or tend < 0:
        return []
    table = page_html[tstart:tend]
    tb = table.find("<tbody")
    if tb >= 0:
        body = table[tb:]
    else:
        body = table
    rows = []
    for rm in ROW_RE.finditer(body):
        inner = rm.group(1)
        cells = []
        for cm in CELL_RE.finditer(inner):
            attrs, chtml = cm.group(2), cm.group(3)
            ds = DATASTAT_RE.search(attrs)
            csk = CSK_RE.search(attrs)
            cells.append({
                "stat": ds.group(1) if ds else None,
                "csk": csk.group(1) if csk else None,
                "text": celltext(chtml),
            })
        if not cells:
            continue
        if all(c["stat"] is None for c in cells) and len(cells) < 6:
            continue
        rows.append(cells)
    return rows


def row_date(cells):
    for c in cells:
        if c["stat"] == "date_game":
            if c["csk"] and re.match(r"^\d{4}-\d{2}-\d{2}$", c["csk"]):
                return c["csk"]
            return parse_date_text(c["text"])
    # positional fallback: first cell whose csk is a date, else first date-looking text
    for c in cells:
        if c["csk"] and re.match(r"^\d{4}-\d{2}-\d{2}$", c["csk"]):
            return c["csk"]
    for c in cells:
        d = parse_date_text(c["text"])
        if d:
            return d
    return None


def parse_date_text(t):
    m = re.match(r"^([A-Z][a-z]{2})\w*\s+(\d{1,2}),\s*(\d{4})$", t)
    if not m:
        return None
    mon = MONTHS.get(m.group(1))
    if not mon:
        return None
    return "%s-%02d-%02d" % (m.group(3), mon, int(m.group(2)))


def locate_game_cells(cells, host_team):
    """Return dict with school/site/opp/conf/result/pts/opp_pts cell texts."""
    by_stat = {c["stat"]: c for c in cells if c["stat"]}
    needed = ("school_name", "game_location", "opp_name", "game_result", "points", "opp_points")
    if all(k in by_stat for k in needed):
        return {
            "school": by_stat["school_name"]["text"],
            "site": by_stat["game_location"]["text"],
            "opp": by_stat["opp_name"]["text"],
            "result": by_stat["game_result"]["text"],
            "pts": by_stat["points"]["text"],
            "opp_pts": by_stat["opp_points"]["text"],
        }
    # positional: find the cell naming the host school, then walk right.
    hostnames = {host_team} | NAME_ALIASES.get(host_team, set())
    norm_hosts = {norm(n) for n in hostnames}
    for i, c in enumerate(cells):
        stripped = RANK_RE.sub("", c["text"])
        if norm(stripped) in norm_hosts:
            if i + 5 >= len(cells):
                return None
            return {
                "school": c["text"],
                "site": cells[i + 1]["text"],
                "opp": cells[i + 2]["text"],
                "result": cells[i + 4]["text"],
                "pts": cells[i + 5]["text"],
                "opp_pts": cells[i + 6]["text"] if i + 6 < len(cells) else "",
            }
    return None


def norm(s):
    s = htmllib.unescape(s or "")
    s = s.lower().replace("&", "and")
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def names_match(worklist_name, sr_name):
    a = norm(worklist_name)
    b = norm(sr_name)
    if a == b:
        return True
    for alt in NAME_ALIASES.get(worklist_name, set()):
        if norm(alt) == b:
            return True
    return False


def rank_of(cell_text):
    m = RANK_RE.match(cell_text)
    return int(m.group(1)) if m else None


def to_int(t):
    t = (t or "").strip()
    return int(t) if re.match(r"^-?\d+$", t) else None


def day_offset(a, b):
    """Signed day difference b - a for two YYYY-MM-DD strings."""
    import datetime
    fmt = "%Y-%m-%d"
    try:
        da = datetime.datetime.strptime(a, fmt).date()
        db = datetime.datetime.strptime(b, fmt).date()
    except ValueError:
        return None
    return (db - da).days


def title_of(page_html):
    m = re.search(r"<title>(.*?)</title>", page_html, re.S)
    return re.sub(r"\s+", " ", htmllib.unescape(m.group(1))).strip() if m else ""


# A handful of rows needed a second opinion: the snapshot the spec's year picker
# lands on can be stale relative to SR's current data. Keyed (home_team, season,
# date) -> text appended to that row's note. Findings only; nothing is repaired.
CROSSCHECK = {
    ("Georgia", 2017, "2017-11-18"):
        "cross-checked against a later snapshot of the same page "
        "(web/20251213231945) which reads '(7) Georgia' for this row and matches "
        "the worklist, so the '(2)' above is a stale rank in the post-2017-season "
        "snapshot rather than a real SR/worklist disagreement",
    ("Kansas State", 2003, "2003-08-23"):
        "cross-checked against a later snapshot (web/2025) which also reads "
        "W 42-28, so SR is consistent and the worklist's 10-7 is the outlier; "
        "SR's notes cell calls this the BCA Classic (Kansas City, MO) yet still "
        "leaves the site marker empty, i.e. SR books it as a Kansas State home game",
    ("Fresno State", 2001, "2001-10-18"):
        "cross-checked against a later snapshot (web/2025) which also dates this "
        "Friday-night game Oct 19, 2001, so SR is consistent and the worklist date "
        "is off by one day; rank and score otherwise match",
}


def build(work, cache_dir):
    meta_path = os.path.join(cache_dir, "_fetch-meta.json")
    meta = json.load(open(meta_path)) if os.path.exists(meta_path) else {}
    out = []
    problems = []
    for page in work:
        team, season = page["home_team"], page["season"]
        key = "%s|%d" % (team, season)
        url = wayback_url(team, season)
        dest = cache_path(cache_dir, team, season)
        info = meta.get(key, {})
        page_html = ""
        if os.path.exists(dest):
            page_html = open(dest, encoding="utf-8", errors="replace").read()
        title = title_of(page_html)
        eff = info.get("effective", "")
        want_path = "/cfb/schools/%s/%d-schedule.html" % (slug(team), season)
        page_ok = bool(page_html) and want_path in eff and str(season) in title
        rows = parse_schedule_rows(page_html) if page_ok else []
        if not rows:
            page_ok = False
        if not page_ok:
            reason = "no Wayback snapshot for %s (curl code %s, effective %s, title %r)" % (
                url, info.get("code"), eff or "-", title)
            problems.append(("page_missing", team, season, reason))
            for g in page["games"]:
                out.append({
                    "date": g["date"], "away_team": g["away_team"], "home_team": team,
                    "season": season, "source_url": url, "quote": "",
                    "sr_home_rank": None, "sr_away_rank": None,
                    "sr_home_points": None, "sr_away_points": None,
                    "site_marker": None, "status": "page_missing",
                    "note": reason,
                })
            continue

        by_date = {}
        for cells in rows:
            d = row_date(cells)
            if d:
                by_date.setdefault(d, []).append(cells)

        for g in page["games"]:
            date = g["date"]
            cand = by_date.get(date, [])
            notes = []   # substantive: forces "discrepancy"
            soft = []    # cosmetic (spelling, duplicate-date tiebreak): still "confirmed"
            if not cand:
                # SR occasionally dates a Thu/Fri night game one day off from our
                # worklist. Accept a neighbouring date only if the opponent matches,
                # and record it as a discrepancy (we do not silently repair dates).
                for delta in (1, -1):
                    for d2, rows2 in by_date.items():
                        if day_offset(date, d2) != delta:
                            continue
                        for c in rows2:
                            pr = locate_game_cells(c, team)
                            if pr and names_match(g["away_team"], RANK_RE.sub("", pr["opp"]).strip()):
                                cand = [c]
                                notes.append("SR dates this game %s, worklist says %s" % (d2, date))
                                break
                        if cand:
                            break
                    if cand:
                        break
            if not cand:
                out.append({
                    "date": date, "away_team": g["away_team"], "home_team": team,
                    "season": season, "source_url": url, "quote": "",
                    "sr_home_rank": None, "sr_away_rank": None,
                    "sr_home_points": None, "sr_away_points": None,
                    "site_marker": None, "status": "discrepancy",
                    "note": "no schedule row on the %s %d page dated %s" % (team, season, date),
                })
                problems.append(("discrepancy", team, season,
                                 "%s vs %s: no row dated %s" % (date, g["away_team"], date)))
                continue
            cells = cand[0]
            if len(cand) > 1:
                for c in cand:
                    parsed = locate_game_cells(c, team)
                    if parsed and names_match(g["away_team"], RANK_RE.sub("", parsed["opp"])):
                        cells = c
                        break
                soft.append("%d schedule rows share date %s; matched on opponent" % (len(cand), date))
            quote = " | ".join(c["text"] for c in cells)
            parsed = locate_game_cells(cells, team)
            if not parsed:
                out.append({
                    "date": date, "away_team": g["away_team"], "home_team": team,
                    "season": season, "source_url": url, "quote": quote,
                    "sr_home_rank": None, "sr_away_rank": None,
                    "sr_home_points": None, "sr_away_points": None,
                    "site_marker": None, "status": "discrepancy",
                    "note": "could not identify the school/site/opponent cells in the row",
                })
                problems.append(("discrepancy", team, season, "%s: unparseable row" % date))
                continue

            sr_home_rank = rank_of(parsed["school"])
            sr_away_rank = rank_of(parsed["opp"])
            sr_school = RANK_RE.sub("", parsed["school"]).strip()
            sr_opp = RANK_RE.sub("", parsed["opp"]).strip()
            site = parsed["site"]
            sr_home_points = to_int(parsed["pts"])
            sr_away_points = to_int(parsed["opp_pts"])
            sr_result = parsed["result"].strip().upper()[:1]

            if not names_match(team, sr_school):
                notes.append("school cell reads %r, expected %s" % (sr_school, team))
            if not names_match(g["away_team"], sr_opp):
                notes.append("opponent cell reads %r, expected %s" % (sr_opp, g["away_team"]))
            elif norm(sr_opp) != norm(g["away_team"]):
                soft.append("SR spells the opponent %r; worklist calls it %s (same school)"
                            % (sr_opp, g["away_team"]))
            if site != "":
                notes.append("site marker is %r, not empty: SR does not treat this as a true road game for %s"
                             % (site, g["away_team"]))
            if sr_home_rank != g["home_rank_ap"]:
                notes.append("home rank is %s, worklist says %s" % (sr_home_rank, g["home_rank_ap"]))
            if sr_away_rank != g["away_rank_ap"]:
                notes.append("away rank is %s, worklist says %s" % (sr_away_rank, g["away_rank_ap"]))
            if sr_home_points != g["home_points"]:
                notes.append("home points %s, worklist says %s" % (sr_home_points, g["home_points"]))
            if sr_away_points != g["away_points"]:
                notes.append("away points %s, worklist says %s" % (sr_away_points, g["away_points"]))
            expect_home_result = {"W": "L", "L": "W", "T": "T"}.get(g["result"])
            if sr_result != expect_home_result:
                notes.append("home-side result %r; worklist visitor result %s implies home %s"
                             % (parsed["result"], g["result"], expect_home_result))

            unplayed = (sr_home_points is None and sr_away_points is None
                        and sr_result == "" and site in ("", "@", "N"))
            hard = notes
            if unplayed:
                status = "page_missing"
                notes = ["the only Wayback snapshot of this page predates the game: "
                         "the row is present but its rank, result and score cells are "
                         "still empty, so no receipt could be taken"]
                hard = []
                soft = []
            else:
                status = "confirmed" if not hard else "discrepancy"
            row = {
                "date": date, "away_team": g["away_team"], "home_team": team,
                "season": season, "source_url": url, "quote": quote,
                "sr_home_rank": sr_home_rank, "sr_away_rank": sr_away_rank,
                "sr_home_points": sr_home_points, "sr_away_points": sr_away_points,
                "site_marker": site, "status": status,
            }
            extra = CROSSCHECK.get((team, season, date))
            if extra:
                soft = soft + [extra]
            all_notes = notes + soft
            if all_notes:
                row["note"] = "; ".join(all_notes)
            out.append(row)
            if status != "confirmed":
                problems.append((status, team, season,
                                 "%s %s at %s: %s" % (date, g["away_team"], team,
                                                      "; ".join(hard or notes))))
    return out, problems


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cache", required=True)
    ap.add_argument("--fetch", action="store_true")
    ap.add_argument("--build", action="store_true")
    ap.add_argument("--sleep", type=float, default=4.5)
    args = ap.parse_args()

    wl = json.load(open(WORKLIST))
    work = wl["work"]

    if args.fetch:
        fetch_all(work, args.cache, args.sleep)
    if args.build:
        out, problems = build(work, args.cache)
        json.dump(out, open(OUT_JSON, "w"), indent=2)
        counts = {}
        for r in out:
            counts[r["status"]] = counts.get(r["status"], 0) + 1
        print("rows: %d" % len(out))
        for k in ("confirmed", "discrepancy", "page_missing"):
            print("  %s: %d" % (k, counts.get(k, 0)))
        print("--- problems ---")
        for p in problems:
            print("%s | %s %s | %s" % p)


if __name__ == "__main__":
    main()
