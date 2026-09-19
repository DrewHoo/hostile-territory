#!/usr/bin/env python3
"""Receipts slice 3: fetch Sports-Reference season-schedule pages via the Wayback
Machine and extract a verbatim schedule row for each worklist game.

Phase "fetch"   -- download+cache each host-season page (politeness sleep, retry)
Phase "extract" -- parse the cache, verify each game, write receipts-3.json

See data/research/receipts-README.md for the spec.
"""
import html as htmllib
import json
import os
import re
import subprocess
import sys
import time

ROOT = "/Users/drewhoo/Projects/hostile-territory"
SCRATCH = "/private/tmp/claude-501/-Users-drewhoo-Projects/f889b103-352a-4124-b722-462bf0ec7390/scratchpad/slice3"
CACHE = os.path.join(SCRATCH, "html")
WORKLIST = os.path.join(ROOT, "data/research/receipts-worklist-3.json")
OUT = os.path.join(ROOT, "data/research/receipts-3.json")

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

# name aliases for comparing worklist team names against SR's rendering
ALIASES = {
    "lsu": {"lsu", "louisiana state"},
    "usc": {"usc", "southern california"},
    "ole miss": {"ole miss", "mississippi"},
    "tcu": {"tcu", "texas christian"},
    "smu": {"smu", "southern methodist"},
    "byu": {"byu", "brigham young"},
    "ucf": {"ucf", "central florida"},
    "pitt": {"pitt", "pittsburgh"},
    "nc state": {"nc state", "north carolina state"},
    "uconn": {"uconn", "connecticut"},
    "miami (fl)": {"miami (fl)", "miami fl", "miami"},
    "miami (oh)": {"miami (oh)", "miami oh"},
    "texas a&m": {"texas a&m", "texas am"},
    "penn state": {"penn state", "penn st"},
    "uab": {"uab", "alabama-birmingham", "alabama birmingham"},
    "unlv": {"unlv", "nevada-las vegas", "nevada las vegas"},
    "hawaii": {"hawaii", "hawai'i"},
    "florida international": {"florida international", "fiu"},
    "central michigan": {"central michigan"},
}


def slug_for(team):
    if team in SLUG_EXCEPTIONS:
        return SLUG_EXCEPTIONS[team]
    s = team.lower()
    s = re.sub(r"[^a-z0-9 ]", "", s)
    return re.sub(r"\s+", "-", s.strip())


# The bare `<season+1>` year picker sometimes resolves to a snapshot taken BEFORE
# that season finished (blank result cells). For those pages we pin an explicit
# post-season timestamp instead.
TIMESTAMP_OVERRIDES = {
    # earliest post-season captures per the Wayback CDX index
    ("Michigan", 2017): "20210119",
    ("Nebraska", 2010): "20141204",
}


def wayback_url(team, season):
    stamp = TIMESTAMP_OVERRIDES.get((team, season), str(season + 1))
    return (
        "https://web.archive.org/web/%s/https://www.sports-reference.com/cfb/schools/%s/%d-schedule.html"
        % (stamp, slug_for(team), season)
    )


def cache_path(team, season):
    return os.path.join(CACHE, "%s-%d.html" % (slug_for(team), season))


def norm(s):
    s = htmllib.unescape(s or "").lower().strip()
    s = s.replace("&amp;", "&")
    return re.sub(r"\s+", " ", s)


def names_match(a, b):
    na, nb = norm(a), norm(b)
    if na == nb:
        return True
    sa = ALIASES.get(na, {na}) | {re.sub(r"[^a-z0-9 ]", "", na)}
    sb = ALIASES.get(nb, {nb}) | {re.sub(r"[^a-z0-9 ]", "", nb)}
    return bool(sa & sb)


# ---------------------------------------------------------------- fetch phase

def title_of(text):
    m = re.search(r"<title>(.*?)</title>", text, re.S | re.I)
    return norm(m.group(1)) if m else ""


def title_ok(text, team, season):
    t = title_of(text)
    if str(season) not in t:
        return False
    if "schedule" not in t:
        return False
    cands = {norm(team), norm(slug_for(team).replace("-", " "))}
    cands |= ALIASES.get(norm(team), set())
    # SR renders these hosts with the long name in the title
    cands.add(norm(team).replace("(fl)", "fl").replace("(oh)", "oh"))
    for c in cands:
        c = re.sub(r"[^a-z0-9 ]", "", c)
        if c and c in re.sub(r"[^a-z0-9 ]", "", t):
            return True
    return False


def fetch(team, season, force=False):
    path = cache_path(team, season)
    if os.path.exists(path) and not force and os.path.getsize(path) > 5000:
        return path, "cached"
    url = wayback_url(team, season)
    for attempt in (1, 2):
        p = subprocess.run(
            ["curl", "-sL", "--max-time", "120", "-w", "%{http_code}", "-o", path + ".tmp", url],
            capture_output=True, text=True,
        )
        code = (p.stdout or "").strip()[-3:]
        if code == "200":
            body = open(path + ".tmp", encoding="utf-8", errors="replace").read()
            if title_ok(body, team, season):
                os.replace(path + ".tmp", path)
                return path, "ok"
            os.replace(path + ".tmp", path + ".bad")
            return None, "title-mismatch:%s" % title_of(body)[:90]
        if attempt == 1:
            time.sleep(60)
    return None, "http-%s" % code


def do_fetch(work):
    log = []
    for i, page in enumerate(work, 1):
        team, season = page["home_team"], page["season"]
        path, why = fetch(team, season)
        log.append("%3d/%d %-16s %d  %s" % (i, len(work), team, season, why))
        print(log[-1], flush=True)
        if why != "cached":
            time.sleep(4.5)
    open(os.path.join(SCRATCH, "fetch.log"), "w").write("\n".join(log) + "\n")


# -------------------------------------------------------------- extract phase

TAGS = re.compile(r"<[^>]+>")


def cell_text(td_html):
    s = td_html.replace("&nbsp;", " ")
    s = TAGS.sub("", s)
    s = htmllib.unescape(s)
    return re.sub(r"\s+", " ", s).strip()


MONTHS = {m: i + 1 for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"])}


def parse_date_text(t):
    m = re.match(r"([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),\s*(\d{4})", t.strip())
    if not m:
        return None
    mo = MONTHS.get(m.group(1).lower())
    if not mo:
        return None
    return "%s-%02d-%02d" % (m.group(3), mo, int(m.group(2)))


def rows_of(text):
    """Yield (iso_date_or_None, [cell_html...], [cell_text...]) for schedule rows."""
    # the schedule table; take every <tr> that has a boxscore/date-ish cell
    out = []
    for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", text, re.S):
        tds = re.findall(r"<t[dh][^>]*>.*?</t[dh]>|<t[dh][^>]*/>", tr, re.S)
        if len(tds) < 8:
            continue
        texts = [cell_text(td) for td in tds]
        iso = None
        mk = re.search(r'csk="(\d{4}-\d{2}-\d{2})"', tr)
        if mk:
            iso = mk.group(1)
        else:
            for t in texts[:4]:
                iso = parse_date_text(t)
                if iso:
                    break
        if iso is None:
            continue
        out.append((iso, tds, texts))
    return out


RANKED = re.compile(r"^\((\d+)\)\s*(.*)$")


def split_rank(t):
    m = RANKED.match(t.strip())
    if m:
        return int(m.group(1)), m.group(2).strip()
    return None, t.strip()


def locate(texts, home_team, away_team):
    """Return (i_school, i_site, i_opp, i_result) indices, or None."""
    i_school = None
    for i, t in enumerate(texts):
        _, name = split_rank(t)
        if names_match(name, home_team):
            i_school = i
            break
    if i_school is None:
        return None
    i_site, i_opp = i_school + 1, i_school + 2
    if i_opp >= len(texts):
        return None
    # result cell: first W/L/T at or after i_opp+1
    i_result = None
    for i in range(i_opp + 1, min(i_opp + 5, len(texts))):
        if texts[i].strip() in ("W", "L", "T"):
            i_result = i
            break
    return (i_school, i_site, i_opp, i_result)


def as_int(t):
    t = t.strip()
    return int(t) if re.fullmatch(r"-?\d+", t) else None


def extract(work):
    results = []
    for page in work:
        team, season = page["home_team"], page["season"]
        url = wayback_url(team, season)
        path = cache_path(team, season)
        text = None
        if os.path.exists(path) and os.path.getsize(path) > 5000:
            text = open(path, encoding="utf-8", errors="replace").read()
        rows = rows_of(text) if text else []
        for g in page["games"]:
            base = {
                "date": g["date"], "away_team": g["away_team"], "home_team": team,
                "season": season, "source_url": url,
            }
            if not text:
                results.append(dict(base, quote=None, sr_home_rank=None, sr_away_rank=None,
                                    sr_home_points=None, sr_away_points=None, site_marker=None,
                                    status="page_missing",
                                    note="No usable Wayback snapshot for %s %d schedule page." % (team, season)))
                continue
            cand = [r for r in rows if r[0] == g["date"]]
            note_bits = []
            if not cand:
                # fall back: same opponent elsewhere in the season
                alt = []
                for r in rows:
                    loc = locate(r[2], team, g["away_team"])
                    if loc and loc[2] is not None:
                        _, oname = split_rank(r[2][loc[2]])
                        if names_match(oname, g["away_team"]):
                            alt.append(r)
                if not alt:
                    results.append(dict(base, quote=None, sr_home_rank=None, sr_away_rank=None,
                                        sr_home_points=None, sr_away_points=None, site_marker=None,
                                        status="discrepancy",
                                        note="No schedule row on %s for date %s, and no row vs %s anywhere in the season." % (team, g["date"], g["away_team"])))
                    continue
                cand = alt[:1]
                note_bits.append("SR dates this game %s, worklist says %s" % (cand[0][0], g["date"]))
            iso, tds, texts = cand[0]
            loc = locate(texts, team, g["away_team"])
            if loc is None:
                results.append(dict(base, quote=" | ".join(texts), sr_home_rank=None, sr_away_rank=None,
                                    sr_home_points=None, sr_away_points=None, site_marker=None,
                                    status="discrepancy",
                                    note="Row found for %s but could not locate the %s school cell; row: %s" % (g["date"], team, " | ".join(texts))))
                continue
            i_school, i_site, i_opp, i_result = loc
            home_rank, _ = split_rank(texts[i_school])
            away_rank, opp_name = split_rank(texts[i_opp])
            site = texts[i_site].strip()
            res = texts[i_result].strip() if i_result is not None else None
            pts = as_int(texts[i_result + 1]) if i_result is not None and i_result + 1 < len(texts) else None
            opp_pts = as_int(texts[i_result + 2]) if i_result is not None and i_result + 2 < len(texts) else None

            if not names_match(opp_name, g["away_team"]):
                note_bits.append("SR opponent is %r, worklist says %r" % (opp_name, g["away_team"]))
            if home_rank != g["home_rank_ap"]:
                note_bits.append("SR home rank %s, worklist home_rank_ap %s" % (home_rank, g["home_rank_ap"]))
            if away_rank != g.get("away_rank_ap"):
                note_bits.append("SR away rank %s, worklist away_rank_ap %s" % (away_rank, g.get("away_rank_ap")))
            if site != "":
                note_bits.append("site marker cell is %r, not empty (SR does not call this a true road game for %s)" % (site, g["away_team"]))
            # result is from the home side: home W == visitor L
            want_home_res = {"W": "L", "L": "W", "T": "T"}[g["result"]]
            if res != want_home_res:
                note_bits.append("SR home result %r, worklist visitor result %r (expected home %r)" % (res, g["result"], want_home_res))
            if pts != g["home_points"]:
                note_bits.append("SR home points %s, worklist home_points %s" % (pts, g["home_points"]))
            if opp_pts != g["away_points"]:
                note_bits.append("SR opp points %s, worklist away_points %s" % (opp_pts, g["away_points"]))

            row = dict(base,
                       quote=" | ".join(texts),
                       sr_home_rank=home_rank, sr_away_rank=away_rank,
                       sr_home_points=pts, sr_away_points=opp_pts,
                       site_marker=site,
                       status="confirmed" if not note_bits else "discrepancy")
            if note_bits:
                row["note"] = "; ".join(note_bits)
            results.append(row)
    return results


def main():
    work = json.load(open(WORKLIST))["work"]
    phase = sys.argv[1] if len(sys.argv) > 1 else "all"
    if phase in ("fetch", "all"):
        do_fetch(work)
    if phase in ("extract", "all"):
        rows = extract(work)
        json.dump(rows, open(OUT, "w"), indent=2)
        open(OUT, "a").write("\n")
        from collections import Counter
        c = Counter(r["status"] for r in rows)
        print("rows=%d %s" % (len(rows), dict(c)))
        for r in rows:
            if r["status"] != "confirmed":
                print("  [%s] %s %s at %s %d :: %s" % (r["status"], r["date"], r["away_team"],
                                                       r["home_team"], r["season"], r.get("note")))


if __name__ == "__main__":
    main()
