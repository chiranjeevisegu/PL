import requests
import pandas as pd
import streamlit as st
import plotly.express as px

API_URL = "https://fantasy.premierleague.com/api/bootstrap-static/"
POSITIONS = {1: "GKP", 2: "DEF", 3: "MID", 4: "FWD"}
SQUAD_QUOTA = {"GKP": 2, "DEF": 5, "MID": 5, "FWD": 3}

st.set_page_config(page_title="FPL Player Explorer", page_icon="⚽", layout="wide")


# ---------- 1. LOAD + CLEAN DATA ----------
@st.cache_data(ttl=600)  # cache for 10 minutes so we don't spam the API
def load_data():
    resp = requests.get(API_URL, headers={"User-Agent": "Mozilla/5.0"}, timeout=20)
    resp.raise_for_status()
    data = resp.json()

    players = pd.DataFrame(data["elements"])
    teams = pd.DataFrame(data["teams"])[["id", "name"]].rename(
        columns={"id": "team", "name": "team_name"}
    )
    df = players.merge(teams, on="team", how="left")

    df["position"] = df["element_type"].map(POSITIONS)
    df["price"] = df["now_cost"] / 10  # API stores price in tenths of a million
    df["name"] = df["web_name"]

    for col in ["form", "selected_by_percent", "points_per_game"]:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    # value score = total points per £1m
    df["value_score"] = (df["total_points"] / df["price"]).round(2)

    # current gameweek info
    events = pd.DataFrame(data["events"])
    current = events[events["is_current"]]
    gw = int(current["id"].iloc[0]) if not current.empty else None

    return df, gw


# ---------- 2. SQUAD BUILDER (greedy, respects budget/positions/club cap) ----------
def build_squad(df, budget=100.0, sort_by="total_points"):
    min_price = df.groupby("position")["price"].min().to_dict()
    need = SQUAD_QUOTA.copy()
    club_count, squad, spent = {}, [], 0.0

    for _, p in df.sort_values(sort_by, ascending=False).iterrows():
        pos = p["position"]
        if need[pos] == 0 or club_count.get(p["team_name"], 0) >= 3:
            continue
        # make sure we can still afford the cheapest players for the remaining slots
        remaining_slots = {k: v for k, v in need.items()}
        remaining_slots[pos] -= 1
        reserve = sum(min_price[k] * v for k, v in remaining_slots.items())
        if spent + p["price"] + reserve > budget:
            continue
        squad.append(p)
        spent += p["price"]
        need[pos] -= 1
        club_count[p["team_name"]] = club_count.get(p["team_name"], 0) + 1
        if sum(need.values()) == 0:
            break
    return pd.DataFrame(squad), spent


# ---------- 3. UI ----------
try:
    df, gw = load_data()
except Exception as e:
    st.error(f"Could not load FPL data: {e}")
    st.stop()

st.title("⚽ FPL Player Explorer")
if gw:
    st.caption(f"Live data from the official Fantasy Premier League API · Current gameweek: {gw}")

# Sidebar filters
st.sidebar.header("Filters")
pos_sel = st.sidebar.multiselect("Position", list(POSITIONS.values()), default=list(POSITIONS.values()))
team_sel = st.sidebar.multiselect("Team", sorted(df["team_name"].unique()))
pmin, pmax = float(df["price"].min()), float(df["price"].max())
price_range = st.sidebar.slider("Price (£m)", pmin, pmax, (pmin, pmax), step=0.1)
min_minutes = st.sidebar.slider("Minimum minutes played", 0, int(df["minutes"].max()), 0, step=90)
search = st.sidebar.text_input("Search player name")

f = df[df["position"].isin(pos_sel)]
if team_sel:
    f = f[f["team_name"].isin(team_sel)]
f = f[f["price"].between(*price_range) & (f["minutes"] >= min_minutes)]
if search:
    f = f[f["name"].str.contains(search, case=False, na=False)]

# KPI row
c1, c2, c3, c4 = st.columns(4)
c1.metric("Players shown", len(f))
if len(f):
    c2.metric("Top scorer", f.loc[f["total_points"].idxmax(), "name"], int(f["total_points"].max()))
    c3.metric("Best form", f.loc[f["form"].idxmax(), "name"], float(f["form"].max()))
    c4.metric("Best value", f.loc[f["value_score"].idxmax(), "name"], float(f["value_score"].max()))

tab1, tab2, tab3 = st.tabs(["📋 Players", "📊 Charts", "🧩 Squad Builder"])

with tab1:
    sort_col = st.selectbox(
        "Sort by",
        ["total_points", "value_score", "form", "price", "selected_by_percent", "goals_scored", "assists"],
    )
    show = f.sort_values(sort_col, ascending=False)[
        ["name", "team_name", "position", "price", "total_points", "value_score",
         "form", "selected_by_percent", "goals_scored", "assists", "minutes"]
    ].rename(columns={
        "name": "Player", "team_name": "Team", "position": "Pos", "price": "Price £m",
        "total_points": "Points", "value_score": "Value", "form": "Form",
        "selected_by_percent": "Owned %", "goals_scored": "Goals",
        "assists": "Assists", "minutes": "Mins",
    })
    st.dataframe(show, use_container_width=True, hide_index=True)
    st.download_button("Download CSV", show.to_csv(index=False), "fpl_players.csv", "text/csv")

with tab2:
    if f.empty:
        st.info("No players match your filters.")
    else:
        left, right = st.columns(2)
        with left:
            fig = px.scatter(
                f, x="price", y="total_points", color="position",
                hover_name="name", hover_data=["team_name", "form"],
                title="Price vs Total Points",
            )
            st.plotly_chart(fig, use_container_width=True)
        with right:
            top_form = f.nlargest(10, "form").sort_values("form")
            fig2 = px.bar(top_form, x="form", y="name", orientation="h",
                          color="position", title="Top 10 by Form")
            st.plotly_chart(fig2, use_container_width=True)

        top_value = f[f["minutes"] > 180].nlargest(10, "value_score").sort_values("value_score")
        fig3 = px.bar(top_value, x="value_score", y="name", orientation="h",
                      color="position", title="Top 10 by Value (points per £m, 180+ mins)")
        st.plotly_chart(fig3, use_container_width=True)

with tab3:
    st.write("Auto-build a 15-man squad: 2 GKP, 5 DEF, 5 MID, 3 FWD, max 3 per club.")
    budget = st.number_input("Budget (£m)", 80.0, 120.0, 100.0, step=0.5)
    metric = st.selectbox("Optimise for", ["total_points", "form", "value_score"])
    available_only = st.checkbox("Only fit players (status = available)", value=True)
    pool = df[df["status"] == "a"] if available_only else df
    if st.button("Build squad"):
        squad, spent = build_squad(pool, budget, metric)
        if len(squad) < 15:
            st.warning("Could not fill a full squad with these settings. Try a bigger budget.")
        st.success(f"Squad cost: £{spent:.1f}m · Total points: {int(squad['total_points'].sum())}")
        order = {"GKP": 0, "DEF": 1, "MID": 2, "FWD": 3}
        squad = squad.sort_values("position", key=lambda s: s.map(order))
        st.dataframe(
            squad[["name", "team_name", "position", "price", "total_points", "form"]],
            use_container_width=True, hide_index=True,
        )
