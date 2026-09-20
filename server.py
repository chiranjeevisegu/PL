import time
import requests
import sqlite3
import hashlib
import hmac
import secrets
import json
import re
from pathlib import Path
from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# ── Database Setup ────────────────────────────────────────────────────────────

DB_PATH = Path(__file__).parent / "pl_app.db"
SECRET_KEY = "pl-intelligence-hub-2024-secure"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        avatar_color TEXT DEFAULT '#38003c',
        email TEXT DEFAULT '',
        fpl_team_id INTEGER DEFAULT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT,
        detail TEXT,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )''')
    # Seed demo admin account
    password_hash = hashlib.sha256("admin".encode()).hexdigest()
    c.execute("INSERT OR IGNORE INTO users (username, password_hash, avatar_color, email) VALUES (?, ?, ?, ?)",
              ("admin", password_hash, "#38003c", "admin@pl-hub.com"))
    conn.commit()
    conn.close()

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token(user_id: int, username: str) -> str:
    nonce = secrets.token_hex(8)
    payload = f"{user_id}:{username}:{nonce}"
    sig = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}:{sig}"

def verify_token(token: str):
    try:
        *parts, sig = token.split(":")
        payload = ":".join(parts)
        expected = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
        if hmac.compare_digest(sig, expected):
            uid_str, uname, _ = payload.split(":", 2)
            return {"id": int(uid_str), "username": uname}
    except Exception:
        pass
    return None

def log_activity(user_id: int, action: str, detail: str = ""):
    try:
        conn = get_db()
        conn.execute(
            "INSERT INTO activity_log (user_id, action, detail) VALUES (?, ?, ?)",
            (user_id, action, detail)
        )
        conn.commit()
        conn.close()
    except Exception:
        pass

# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app_instance):
    init_db()
    yield

app = FastAPI(title="PL Intelligence Hub API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)



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
                "home_id": f["team_h"], "away_id": f["team_a"],
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
                "home_id": f["team_h"], "away_id": f["team_a"],
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


# Auth Endpoints

@app.post("/api/auth/register")
async def register(request: Request):
    body = await request.json()
    username = body.get("username", "").strip()
    password = body.get("password", "").strip()
    if not username or not password:
        raise HTTPException(400, "Username and password required")
    if len(username) < 3:
        raise HTTPException(400, "Username must be at least 3 characters")
    conn = get_db()
    existing = conn.execute("SELECT id FROM users WHERE username=?", (username,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(409, "Username already taken")
    colors = ["#38003c", "#1e3a5f", "#3b1f5c", "#1a3a2a", "#3d1a00"]
    color = colors[len(username) % len(colors)]
    conn.execute("INSERT INTO users (username, password_hash, avatar_color) VALUES (?,?,?)",
                 (username, hash_password(password), color))
    conn.commit()
    user_row = conn.execute("SELECT id, username, avatar_color, email FROM users WHERE username=?", (username,)).fetchone()
    user = dict(user_row)
    token = generate_token(user["id"], user["username"])
    log_activity(user["id"], "Registered", "New account created")
    conn.close()
    return JSONResponse({"token": token, "user": user})


@app.post("/api/auth/login")
async def login(request: Request):
    body = await request.json()
    username = body.get("username", "").strip()
    password = body.get("password", "").strip()
    if not username or not password:
        raise HTTPException(400, "Username and password required")
    conn = get_db()
    row = conn.execute("SELECT id, username, password_hash, avatar_color, email FROM users WHERE username=?", (username,)).fetchone()
    if not row or row["password_hash"] != hash_password(password):
        conn.close()
        raise HTTPException(401, "Invalid username or password")
    user = {"id": row["id"], "username": row["username"], "avatar_color": row["avatar_color"], "email": row["email"] or ""}
    token = generate_token(user["id"], user["username"])
    log_activity(user["id"], "Logged in", "Session started")
    conn.close()
    return JSONResponse({"token": token, "user": user})


@app.get("/api/auth/me")
def auth_me(token: str = ""):
    user = verify_token(token)
    if not user:
        raise HTTPException(401, "Invalid or expired token")
    conn = get_db()
    row = conn.execute("SELECT id, username, avatar_color, email FROM users WHERE id=?", (user["id"],)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "User not found")
    return JSONResponse({"user": dict(row)})


@app.get("/api/auth/history")
def auth_history(token: str = ""):
    user = verify_token(token)
    if not user:
        raise HTTPException(401, "Invalid or expired token")
    conn = get_db()
    rows = conn.execute(
        "SELECT action, detail, timestamp FROM activity_log WHERE user_id=? ORDER BY timestamp DESC LIMIT 20",
        (user["id"],)
    ).fetchall()
    conn.close()
    return JSONResponse({"history": [dict(r) for r in rows]})


@app.post("/api/auth/activity")
async def log_user_activity(request: Request):
    body = await request.json()
    token = body.get("token", "")
    user = verify_token(token)
    if not user:
        raise HTTPException(401, "Invalid token")
    log_activity(user["id"], body.get("action", ""), body.get("detail", ""))
    return JSONResponse({"ok": True})


# H2H Endpoint

@app.get("/api/h2h/{home_id}/{away_id}")
def get_h2h(home_id: int, away_id: int):
    try:
        data = _get_raw()
        fixtures = _get_fixtures()
        team_map = {t["id"]: t for t in data["teams"]}
        home_short = team_map.get(home_id, {}).get("short_name", "?")
        away_short = team_map.get(away_id, {}).get("short_name", "?")

        meetings = []
        for f in fixtures:
            h, a = f.get("team_h"), f.get("team_a")
            if not f.get("finished"):
                continue
            if (h == home_id and a == away_id) or (h == away_id and a == home_id):
                ht = team_map.get(h, {})
                at = team_map.get(a, {})
                meetings.append({
                    "gw": f.get("event"),
                    "kickoff": f.get("kickoff_time"),
                    "home_team": ht.get("short_name", "?"),
                    "away_team": at.get("short_name", "?"),
                    "home_score": _i(f.get("team_h_score")),
                    "away_score": _i(f.get("team_a_score")),
                })
        meetings = sorted(meetings, key=lambda x: x["kickoff"] or "", reverse=True)[:5]

        home_wins = sum(1 for m in meetings
            if (m["home_team"] == home_short and m["home_score"] > m["away_score"])
            or (m["away_team"] == home_short and m["away_score"] > m["home_score"]))
        away_wins = sum(1 for m in meetings
            if (m["home_team"] == away_short and m["home_score"] > m["away_score"])
            or (m["away_team"] == away_short and m["away_score"] > m["home_score"]))
        draws = len(meetings) - home_wins - away_wins

        return JSONResponse({
            "home_team": team_map.get(home_id, {}).get("name", "?"),
            "away_team": team_map.get(away_id, {}).get("name", "?"),
            "meetings": meetings,
            "summary": {"home_wins": home_wins, "draws": draws, "away_wins": away_wins},
        })
    except Exception as e:
        raise HTTPException(500, str(e))


# Captain Advisor

@app.get("/api/captain-advisor")
def captain_advisor():
    try:
        data = _get_raw()
        team_map = {t["id"]: t for t in data["teams"]}
        players = data["elements"]
        candidates = []
        for p in players:
            if _i(p.get("minutes")) < 60:
                continue
            form = _f(p.get("form"))
            ict  = _f(p.get("ict_index"))
            pts  = _i(p.get("total_points"))
            own  = _f(p.get("selected_by_percent"))
            ep   = _f(p.get("ep_next"))
            form_score = min(form * 1.2, 10)
            ict_score  = min(ict / 8, 10)
            pts_score  = min(pts / 20, 10)
            own_score  = min(own / 10, 10)
            score = (form_score * 0.35 + ict_score * 0.30 + pts_score * 0.20 + own_score * 0.15)
            team = team_map.get(p["team"], {})
            reasoning = (
                f"{p['web_name']} scores {score:.1f}/10 based on "
                f"form ({form}), ICT ({ict:.0f}), {own:.1f}% ownership."
                + (f" EP next GW: {ep:.1f} pts." if ep > 0 else "")
            )
            candidates.append({
                "name": p["web_name"],
                "team": team.get("name", ""),
                "position": POSITIONS.get(p["element_type"], ""),
                "price": p["now_cost"] / 10,
                "form": form, "ict": ict, "ownership": own, "total_points": pts,
                "score": round(score, 2),
                "form_score": round(form_score, 2), "ict_score": round(ict_score, 2),
                "pts_score": round(pts_score, 2), "own_score": round(own_score, 2),
                "ep_next": ep, "reasoning": reasoning,
            })
        top5 = sorted(candidates, key=lambda x: x["score"], reverse=True)[:5]
        return JSONResponse({"picks": top5})
    except Exception as e:
        raise HTTPException(500, str(e))


# FPL Team Sync

@app.get("/api/fpl-team/{team_id}")
def get_fpl_team(team_id: int):
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        entry_res = requests.get(f"{FPL_BASE}/entry/{team_id}/", headers=headers, timeout=15)
        if entry_res.status_code == 404:
            raise HTTPException(404, "FPL team not found. Check your Team ID.")
        entry_res.raise_for_status()
        entry = entry_res.json()
        data = _get_raw()
        events = data["events"]
        team_map_full = {t["id"]: t for t in data["teams"]}
        player_map = {p["id"]: p for p in data["elements"]}
        current_gw = next((e["id"] for e in events if e.get("is_current")), None)
        prev_gw    = next((e["id"] for e in events if e.get("is_previous")), None)
        gw = current_gw or prev_gw
        picks_out = []
        if gw:
            picks_res = requests.get(f"{FPL_BASE}/entry/{team_id}/event/{gw}/picks/", headers=headers, timeout=15)
            if picks_res.ok:
                for pick in picks_res.json().get("picks", []):
                    p = player_map.get(pick["element"], {})
                    if p:
                        picks_out.append({
                            "id": pick["element"],
                            "name": p.get("web_name", ""),
                            "team": team_map_full.get(p.get("team"), {}).get("short_name", ""),
                            "position": POSITIONS.get(p.get("element_type"), ""),
                            "price": p.get("now_cost", 0) / 10,
                            "is_captain": pick.get("is_captain", False),
                            "is_vice_captain": pick.get("is_vice_captain", False),
                        })
        return JSONResponse({
            "name": entry.get("name", ""),
            "player_name": f"{entry.get('player_first_name', '')} {entry.get('player_last_name', '')}".strip(),
            "summary_overall_points": entry.get("summary_overall_points"),
            "summary_overall_rank": entry.get("summary_overall_rank"),
            "last_deadline_value": entry.get("last_deadline_value", 0) / 10,
            "picks": picks_out,
        })
    except HTTPException:
        raise
    except requests.RequestException as e:
        raise HTTPException(502, f"FPL API unreachable: {e}")
    except Exception as e:
        raise HTTPException(500, str(e))


# Chatbot

@app.post("/api/chatbot")
async def chatbot(request: Request):
    body = await request.json()
    msg = body.get("message", "").lower()
    kb = [
        (["top scorer", "golden boot", "most goals"], "Alan Shearer holds the PL record with 260 goals. Haaland broke the single-season record with 36 in 2022-23."),
        (["invincible", "unbeaten", "arsenal 2004"], "Arsenal's 2003-04 Invincibles went 38 games undefeated (26W 12D). Unique in PL history."),
        (["leicester", "5000", "miracle"], "Leicester City won the 2015-16 title at 5000-1 odds - sport's greatest ever upset."),
        (["aguero", "93:20"], "Aguero scored at 93:20 on the final day of 2011-12 to give City the title on goal difference."),
        (["fpl", "captain", "fantasy"], "Top FPL tip: captain form players with easy fixtures and high ICT. Save chips for Double Gameweeks."),
        (["founded", "1992", "history"], "The Premier League was founded on 20 Feb 1992 and began in the 1992-93 season."),
        (["relegation", "bottom"], "The bottom 3 clubs at the end of the season are relegated to the Championship."),
    ]
    for keys, ans in kb:
        if any(k in msg for k in keys):
            return JSONResponse({"reply": ans})
    return JSONResponse({"reply": "Try asking about PL history, clubs, FPL tips, records, or fixtures!"})

# ── Home Feed Endpoint (History, News, Transfers, Injuries) ─────────────────

@app.get("/api/home-feed")
def get_home_feed():
    """Home page curated data: PL history, breaking news, transfers, and live injury/momentum radar."""
    try:
        data     = _get_raw()
        team_map = {t["id"]: t for t in data["teams"]}
        players  = data["elements"]

        # 1. Live Injury & Player News from API
        injuries = []
        for p in players:
            if p.get("news"):
                status_label = {
                    "d": "Doubtful",
                    "i": "Injured",
                    "s": "Suspended",
                    "u": "Unavailable",
                    "a": "Available"
                }.get(p.get("status"), "Doubtful")
                chance = p.get("chance_of_playing_next_round")
                injuries.append({
                    "id": p["id"],
                    "name": p["web_name"],
                    "full_name": f"{p.get('first_name', '')} {p.get('second_name', '')}".strip(),
                    "team": team_map.get(p["team"], {}).get("name", "Unknown"),
                    "team_short": team_map.get(p["team"], {}).get("short_name", ""),
                    "status": status_label,
                    "chance": f"{chance}%" if chance is not None else "Unknown",
                    "news": p["news"],
                    "price": p["now_cost"] / 10,
                    "position": POSITIONS.get(p["element_type"], ""),
                })
        injuries = sorted(injuries, key=lambda x: x["price"], reverse=True)[:18]

        # 2. Transfer Momentum (Gameweek trends)
        top_in = sorted(players, key=lambda p: _i(p.get("transfers_in_event")), reverse=True)[:8]
        top_out = sorted(players, key=lambda p: _i(p.get("transfers_out_event")), reverse=True)[:8]

        transfers_in_list = [{
            "id": p["id"],
            "name": p["web_name"],
            "team": team_map.get(p["team"], {}).get("short_name", ""),
            "count": _i(p.get("transfers_in_event")),
            "price": p["now_cost"] / 10,
            "form": _f(p.get("form")),
            "pts": _i(p.get("total_points"))
        } for p in top_in]

        transfers_out_list = [{
            "id": p["id"],
            "name": p["web_name"],
            "team": team_map.get(p["team"], {}).get("short_name", ""),
            "count": _i(p.get("transfers_out_event")),
            "price": p["now_cost"] / 10,
            "status": p.get("status", "a"),
            "news": p.get("news", "")
        } for p in top_out]

        # 3. Marquee Transfers Radar (Verified Premier League Moves)
        recent_transfers = [
            {
                "player": "Dominic Solanke",
                "from_team": "Bournemouth",
                "to_team": "Tottenham Hotspur",
                "fee": "£65M",
                "type": "Permanent",
                "role": "Striker (Target Man)",
                "date": "Summer Window",
                "impact": "High"
            },
            {
                "player": "Pedro Neto",
                "from_team": "Wolves",
                "to_team": "Chelsea",
                "fee": "£54M",
                "type": "Permanent",
                "role": "Winger",
                "date": "Summer Window",
                "impact": "High"
            },
            {
                "player": "Riccardo Calafiori",
                "from_team": "Bologna",
                "to_team": "Arsenal",
                "fee": "£42M",
                "type": "Permanent",
                "role": "Left-Back / Centre-Back",
                "date": "Summer Window",
                "impact": "Very High"
            },
            {
                "player": "Leny Yoro",
                "from_team": "Lille",
                "to_team": "Manchester United",
                "fee": "£52M",
                "type": "Permanent",
                "role": "Centre-Back",
                "date": "Summer Window",
                "impact": "High"
            },
            {
                "player": "Savinho",
                "from_team": "Troyes / Girona",
                "to_team": "Manchester City",
                "fee": "£33.6M",
                "type": "Permanent",
                "role": "Right Winger",
                "date": "Summer Window",
                "impact": "Very High"
            },
            {
                "player": "Federico Chiesa",
                "from_team": "Juventus",
                "to_team": "Liverpool",
                "fee": "£12.5M",
                "type": "Permanent",
                "role": "Forward / Winger",
                "date": "Summer Window",
                "impact": "Medium"
            },
            {
                "player": "Manuel Ugarte",
                "from_team": "PSG",
                "to_team": "Manchester United",
                "fee": "£42M",
                "type": "Permanent",
                "role": "Defensive Midfield",
                "date": "Summer Window",
                "impact": "High"
            },
            {
                "player": "Raheem Sterling",
                "from_team": "Chelsea",
                "to_team": "Arsenal",
                "fee": "Season Loan",
                "type": "Season Loan",
                "role": "Winger",
                "date": "Deadline Day",
                "impact": "Medium"
            },
            {
                "player": "Jadon Sancho",
                "from_team": "Manchester United",
                "to_team": "Chelsea",
                "fee": "Loan + Obligation",
                "type": "Loan to Buy",
                "role": "Winger",
                "date": "Deadline Day",
                "impact": "High"
            },
            {
                "player": "Matthijs de Ligt",
                "from_team": "Bayern Munich",
                "to_team": "Manchester United",
                "fee": "£38.5M",
                "type": "Permanent",
                "role": "Centre-Back",
                "date": "Summer Window",
                "impact": "High"
            },
            {
                "player": "Ilkay Gündoğan",
                "from_team": "Barcelona",
                "to_team": "Manchester City",
                "fee": "Free Transfer",
                "type": "Permanent Return",
                "role": "Central Midfielder",
                "date": "Summer Window",
                "impact": "Very High"
            },
            {
                "player": "Mikel Merino",
                "from_team": "Real Sociedad",
                "to_team": "Arsenal",
                "fee": "£31.6M",
                "type": "Permanent",
                "role": "Box-to-Box Midfielder",
                "date": "Summer Window",
                "impact": "High"
            }
        ]

        # 4. Premier League History & Heritage Data
        pl_history = {
            "founded": 1992,
            "intro": "Formed on 20 February 1992 following the decision of clubs in the Football League First Division to break away from the Football League, the Premier League has evolved into the most competitive and watched sporting spectacle on Earth, broadcasting to over 1 billion homes worldwide.",
            "milestones": [
                {
                    "year": "1992",
                    "title": "Inaugural Season Kickoff",
                    "desc": "22 clubs contested the inaugural 1992-93 season. Brian Deane scored the first-ever Premier League goal for Sheffield United against Manchester United."
                },
                {
                    "year": "2003-04",
                    "title": "Arsenal's 49-Game Invincibles",
                    "desc": "Arsène Wenger's Arsenal made world history by completing an entire 38-game season undefeated (26 wins, 12 draws), anchored by Thierry Henry and Patrick Vieira."
                },
                {
                    "year": "2011-12",
                    "title": "The 'AGÜEROOOOO' 93:20 Climax",
                    "desc": "Sergio Agüero scored at 93:20 on the final day against QPR to snatch Manchester City's first title on goal difference ahead of rivals Manchester United."
                },
                {
                    "year": "2015-16",
                    "title": "Leicester City's 5000-1 Fairy Tale",
                    "desc": "Under Claudio Ranieri, relegation candidates Leicester City stunned global sports by winning the title, spearheaded by Jamie Vardy, Riyad Mahrez, and N'Golo Kanté."
                },
                {
                    "year": "2017-18",
                    "title": "Manchester City's 100-Point Centurions",
                    "desc": "Pep Guardiola's Manchester City smashed all-time records with 100 points, 32 wins, and 106 goals in a single season."
                },
                {
                    "year": "2023-24",
                    "title": "Historic Four-In-A-Row",
                    "desc": "Manchester City became the first team in the 136-year history of English top-flight football to capture four consecutive league titles."
                }
            ],
            "hall_of_fame_records": [
                {"record": "All-Time Top Scorer", "holder": "Alan Shearer", "stat": "260 Goals", "club": "Blackburn / Newcastle"},
                {"record": "Most Premier League Titles", "holder": "Ryan Giggs", "stat": "13 Titles", "club": "Manchester United"},
                {"record": "All-Time Clean Sheets", "holder": "Petr Čech", "stat": "202 Clean Sheets", "club": "Chelsea / Arsenal"},
                {"record": "Most Assists Single Season", "holder": "Thierry Henry & Kevin De Bruyne", "stat": "20 Assists", "club": "Arsenal / Man City"},
                {"record": "Most Goals Single Season", "holder": "Erling Haaland", "stat": "36 Goals", "club": "Manchester City"},
                {"record": "Most Managerial Titles", "holder": "Sir Alex Ferguson", "stat": "13 Titles (810 Matches)", "club": "Manchester United"}
            ]
        }

        # 5. Editorial & League News
        editorial_news = [
            {
                "id": "news-1",
                "tag": "Title Race",
                "tag_color": "#00ff87",
                "title": "Tactical Masterclass: How the Top 3 Are Dictating Midfield Control",
                "summary": "An in-depth statistical examination of inverted fullbacks, high turnovers, and defensive block resilience across the league leaders.",
                "author": "Premier League Tactical Analysis Unit",
                "time": "3 hours ago",
                "read_time": "4 min read"
            },
            {
                "id": "news-2",
                "tag": "Transfer Radar",
                "tag_color": "#04f5ff",
                "title": "Inside the Scouting Data: Why Premier League Clubs Prioritize Pressing Metrics",
                "summary": "Analysing how data analytics and expected goal involvements (xGI) are revolutionising multi-million pound transfer negotiations.",
                "author": "Market Intelligence Desk",
                "time": "6 hours ago",
                "read_time": "5 min read"
            },
            {
                "id": "news-3",
                "tag": "Injury Watch",
                "tag_color": "#e90052",
                "title": "Gameweek Rotation Hazards: Key Absentees and Formations to Watch",
                "summary": "Physio department alerts, expected return schedules, and tactical adjustments for the upcoming fixtures.",
                "author": "FPL Medical & Scouting Hub",
                "time": "12 hours ago",
                "read_time": "3 min read"
            },
            {
                "id": "news-4",
                "tag": "Iconic Legacy",
                "tag_color": "#e2b714",
                "title": "30+ Years of Wonder: From First Kick in 1992 to Modern Super League Powerhouse",
                "summary": "Reflecting on three decades of drama, record-breaking attendances, iconic managers, and global broadcast milestones.",
                "author": "Heritage Archive",
                "time": "1 day ago",
                "read_time": "6 min read"
            }
        ]

        return JSONResponse(content={
            "history": pl_history,
            "editorial_news": editorial_news,
            "transfers": recent_transfers,
            "injuries": injuries,
            "momentum_in": transfers_in_list,
            "momentum_out": transfers_out_list,
        })
    except Exception as e:
        raise HTTPException(500, str(e))


# ── Static files & Frontend Serving ──────────────────────────────────────────

frontend_dist = Path(__file__).parent / "frontend" / "dist"
static_dir    = Path(__file__).parent / "static"

@app.get("/")
def root():
    if frontend_dist.exists() and (frontend_dist / "index.html").exists():
        return FileResponse(str(frontend_dist / "index.html"))
    return FileResponse(str(static_dir / "index.html"))

if (frontend_dist / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")
