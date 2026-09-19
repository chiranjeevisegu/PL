import time
import requests
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pathlib import Path

app = FastAPI(title="FPL Explorer API")

FPL_BASE   = "https://fantasy.premierleague.com/api"
FPL_API    = f"{FPL_BASE}/bootstrap-static/"
FPL_FIX    = f"{FPL_BASE}/fixtures/"
POSITIONS  = {1: "GKP", 2: "DEF", 3: "MID", 4: "FWD"}
CACHE_TTL  = 600  # 10 minutes

_cache:    dict = {}
_fix_cache: dict = {}


# ── Raw data helpers ──────────────────────────────────────────────────────────

def _get_raw() -> dict:
    now = time.time()
    if "ts" in _cache and (now - _cache["ts"]) < CACHE_TTL:
        return _cache["data"]
    resp = requests.get(FPL_API, headers={"User-Agent": "Mozilla/5.0"}, timeout=20)
    resp.raise_for_status()
    _cache.update({"data": resp.json(), "ts": now})
    return _cache["data"]


def _get_fixtures() -> list:
    now = time.time()
    if "ts" in _fix_cache and (now - _fix_cache["ts"]) < CACHE_TTL:
        return _fix_cache["data"]
    resp = requests.get(FPL_FIX, headers={"User-Agent": "Mozilla/5.0"}, timeout=20)
    resp.raise_for_status()
    _fix_cache.update({"data": resp.json(), "ts": now})
    return _fix_cache["data"]


def _f(v, d: float = 0.0) -> float:
    try: return float(v) if v is not None else d
    except: return d


def _i(v, d: int = 0) -> int:
    try: return int(v) if v is not None else d
    except: return d


# ── Standings computation ─────────────────────────────────────────────────────

def _compute_standings(fixtures: list, team_map: dict) -> list:
    table = {
        tid: {"id": tid, "name": t["name"], "short_name": t["short_name"],
              "played": 0, "won": 0, "drawn": 0, "lost": 0,
              "gf": 0, "ga": 0, "gd": 0, "points": 0}
        for tid, t in team_map.items()
    }
    for f in fixtures:
        if not f.get("finished") or f.get("team_h_score") is None:
            continue
        h, a   = f["team_h"], f["team_a"]
        hs, as_ = _i(f["team_h_score"]), _i(f["team_a_score"])
        if h not in table or a not in table:
            continue
        for tid, gf, ga in [(h, hs, as_), (a, as_, hs)]:
            table[tid]["played"] += 1
            table[tid]["gf"]     += gf
            table[tid]["ga"]     += ga
        if hs > as_:
            table[h]["won"]    += 1; table[h]["points"] += 3; table[a]["lost"]  += 1
        elif hs < as_:
            table[a]["won"]    += 1; table[a]["points"] += 3; table[h]["lost"]  += 1
        else:
            table[h]["drawn"]  += 1; table[h]["points"] += 1
            table[a]["drawn"]  += 1; table[a]["points"] += 1
    for t in table.values():
        t["gd"] = t["gf"] - t["ga"]
    return sorted(table.values(), key=lambda t: (-t["points"], -t["gd"], -t["gf"], t["name"]))


# ── API Endpoints ─────────────────────────────────────────────────────────────

@app.get("/api/players")
def get_players():
    try:
        data     = _get_raw()
        team_map = {t["id"]: t for t in data["teams"]}
        result   = []
        for p in data["elements"]:
            team  = team_map.get(p["team"], {})
            price = p["now_cost"] / 10
            pts   = _i(p.get("total_points"))
            result.append({
                "id": p["id"], "name": p["web_name"],
                "first_name": p.get("first_name", ""), "last_name": p.get("second_name", ""),
                "team_name": team.get("name", ""), "team_short": team.get("short_name", ""),
                "position": POSITIONS.get(p["element_type"], ""), "element_type": p["element_type"],
                "price": price, "total_points": pts,
                "value_score": round(pts / price, 2) if price > 0 else 0,
                "form": _f(p.get("form")), "selected_by_percent": _f(p.get("selected_by_percent")),
                "points_per_game": _f(p.get("points_per_game")),
                "goals_scored": _i(p.get("goals_scored")), "assists": _i(p.get("assists")),
                "clean_sheets": _i(p.get("clean_sheets")), "minutes": _i(p.get("minutes")),
                "yellow_cards": _i(p.get("yellow_cards")), "red_cards": _i(p.get("red_cards")),
                "saves": _i(p.get("saves")), "bonus": _i(p.get("bonus")), "bps": _i(p.get("bps")),
                "influence": _f(p.get("influence")), "creativity": _f(p.get("creativity")),
                "threat": _f(p.get("threat")), "ict_index": _f(p.get("ict_index")),
                "expected_goals": _f(p.get("expected_goals")),
                "expected_assists": _f(p.get("expected_assists")),
                "expected_goal_involvements": _f(p.get("expected_goal_involvements")),
                "expected_goals_conceded": _f(p.get("expected_goals_conceded")),
                "status": p.get("status", "a"), "news": p.get("news", "") or "",
                "ep_next": _f(p.get("ep_next")),
                "transfers_in_event": _i(p.get("transfers_in_event")),
                "transfers_out_event": _i(p.get("transfers_out_event")),
                "cost_change_event": _i(p.get("cost_change_event")),
                "dreamteam_count": _i(p.get("dreamteam_count")),
                "photo": p.get("photo", ""),
            })
        return JSONResponse(content=result)
    except requests.RequestException as e:
        raise HTTPException(502, f"FPL API error: {e}")
    except Exception as e:
        raise HTTPException(500, str(e))


@app.get("/api/overview")
def get_overview():
    try:
        data    = _get_raw()
        events  = data["events"]
        current = next((e for e in events if e.get("is_current")), None)
        nxt     = next((e for e in events if e.get("is_next")), None)
        return JSONResponse(content={
            "current_gw": current["id"] if current else None,
            "gw_name":    current["name"] if current else "Pre-Season",
            "avg_score":  _i(current.get("average_entry_score")) if current else 0,
            "highest_score": _i(current.get("highest_score")) if current else 0,
            "total_players": _i(data.get("total_players")),
            "next_deadline": nxt.get("deadline_time") if nxt else None,
            "next_gw_name":  nxt.get("name") if nxt else None,
        })
    except Exception as e:
        raise HTTPException(500, str(e))


@app.get("/api/plnews")
def get_plnews():
    """Premier League news: standings, recent results, upcoming fixtures, top stats."""
    try:
        data     = _get_raw()
        fixtures = _get_fixtures()
        team_map = {t["id"]: t for t in data["teams"]}
        events   = data["events"]

        # Current / next GW
        current_gw = next((e["id"] for e in events if e.get("is_current")), None)
        prev_gw    = next((e["id"] for e in events if e.get("is_previous")), None)
        next_gw    = next((e["id"] for e in events if e.get("is_next")),    None)

        # Standings
        standings = _compute_standings(fixtures, team_map)

        # Recent results (previous GW)
        ref_gw  = prev_gw or current_gw
        recent  = [f for f in fixtures if f.get("event") == ref_gw and f.get("finished")]
        recent_out = []
        for f in recent:
            h = team_map.get(f["team_h"], {}); a = team_map.get(f["team_a"], {})
            recent_out.append({
                "home": h.get("short_name", "?"), "home_full": h.get("name", "?"),
                "away": a.get("short_name", "?"), "away_full": a.get("name", "?"),
                "home_score": _i(f["team_h_score"]), "away_score": _i(f["team_a_score"]),
                "kickoff": f.get("kickoff_time", ""),
            })

        # Upcoming fixtures (next GW)
        up_gw   = next_gw or current_gw
        upcoming = [f for f in fixtures if f.get("event") == up_gw and not f.get("finished")]
        upcoming_out = []
        for f in upcoming:
            h = team_map.get(f["team_h"], {}); a = team_map.get(f["team_a"], {})
            upcoming_out.append({
                "home": h.get("short_name", "?"), "home_full": h.get("name", "?"),
                "away": a.get("short_name", "?"), "away_full": a.get("name", "?"),
                "kickoff": f.get("kickoff_time", ""),
                "h_diff": _i(f.get("team_h_difficulty")), "a_diff": _i(f.get("team_a_difficulty")),
            })

        # Top stats from player data
        players = data["elements"]
        def top5(key):
            s = sorted(players, key=lambda p: _i(p.get(key)) if key in ["goals_scored","assists","clean_sheets","saves"] else _f(p.get(key)), reverse=True)[:5]
            return [{"name": p["web_name"], "team": team_map.get(p["team"],{}).get("short_name",""), "val": _f(p.get(key)) if key not in ["goals_scored","assists","clean_sheets","saves"] else _i(p.get(key))} for p in s]

        return JSONResponse(content={
            "standings":  standings,
            "recent":     recent_out,
            "upcoming":   upcoming_out,
            "top_scorers":  top5("goals_scored"),
            "top_assists":  top5("assists"),
            "top_form":     top5("form"),
            "prev_gw_name": f"Gameweek {ref_gw}" if ref_gw else "—",
            "next_gw_name": f"Gameweek {up_gw}"  if up_gw  else "—",
        })
    except Exception as e:
        raise HTTPException(500, str(e))


# ── Static files ──────────────────────────────────────────────────────────────

static_dir = Path(__file__).parent / "static"

@app.get("/")
def root():
    return FileResponse(str(static_dir / "index.html"))

app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")
