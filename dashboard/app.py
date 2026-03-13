"""
dashboard/app.py
----------------
Streamlit analytics dashboard for the FabLab ETL pipeline.

Reads directly from the PostgreSQL database and presents three pages:
  1. Enrollment Overview  — registration KPIs, trend charts, recent table
  2. Material Usage       — material KPIs, usage charts, cost breakdown
  3. Data Quality         — data-health metrics and flagged records

Run locally:
    streamlit run dashboard/app.py

Or via Docker:
    docker compose up dashboard
"""

import os

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st
from sqlalchemy import create_engine, text

# ── Page config ────────────────────────────────────────────────────────────────

st.set_page_config(
    page_title="Fablab Data Dashboard",
    page_icon="🔧",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Database connection ────────────────────────────────────────────────────────

@st.cache_resource
def get_engine():
    db_url = os.getenv(
        "DATABASE_URL",
        "postgresql://fablab_user:fablab_password@localhost:5432/fablab_db",
    )
    return create_engine(db_url)


@st.cache_data(ttl=60)
def query(sql: str) -> pd.DataFrame:
    """Execute SQL and return a DataFrame. Results are cached for 60 s."""
    engine = get_engine()
    try:
        with engine.connect() as conn:
            return pd.read_sql(text(sql), conn)
    except Exception as e:
        st.error(f"Database error: {e}")
        return pd.DataFrame()


# ── Shared styles ──────────────────────────────────────────────────────────────

PURPLE = "#7C3AED"
PURPLE_LIGHT = "#EDE9FE"
STATUS_COLORS = {
    "confirmed": "#10b981",
    "incomplete": "#f59e0b",
    "cancelled": "#ef4444",
}


def kpi_card(label: str, value: str, delta: str | None = None, icon: str = "") -> None:
    delta_html = f"<p style='color:#6b7280;font-size:12px;margin:0'>{delta}</p>" if delta else ""
    st.markdown(
        f"""
        <div style='background:#fff;padding:20px 24px;border-radius:10px;
                    border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,.07)'>
          <p style='color:#6b7280;font-size:13px;font-weight:600;
                    text-transform:uppercase;letter-spacing:.05em;margin:0 0 6px'>{icon} {label}</p>
          <p style='color:#111827;font-size:28px;font-weight:700;margin:0'>{value}</p>
          {delta_html}
        </div>
        """,
        unsafe_allow_html=True,
    )


def status_badge(status: str) -> str:
    color = STATUS_COLORS.get(status, "#6b7280")
    bg = color + "20"
    return f"<span style='background:{bg};color:{color};padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600'>{status.title()}</span>"


# ── Sidebar navigation ─────────────────────────────────────────────────────────

with st.sidebar:
    st.markdown(
        f"""
        <div style='background:{PURPLE};padding:20px;border-radius:10px;margin-bottom:16px'>
          <h2 style='color:white;margin:0;font-size:20px'>🔧 Fablab</h2>
          <p style='color:#c4b5fd;margin:4px 0 0;font-size:13px'>Data Dashboard</p>
        </div>
        """,
        unsafe_allow_html=True,
    )
    page = st.radio(
        "Navigation",
        ["📋 Enrollment Overview", "🧰 Material Usage", "🔍 Data Quality"],
        label_visibility="collapsed",
    )
    st.markdown("---")
    st.caption("ETL Pipeline Reporting")
    if st.button("🔄 Refresh data"):
        st.cache_data.clear()
        st.rerun()


# ══════════════════════════════════════════════════════════════════════════════
# PAGE 1 — ENROLLMENT OVERVIEW
# ══════════════════════════════════════════════════════════════════════════════

if page == "📋 Enrollment Overview":
    st.title("Enrollment Overview")
    st.markdown("Registration trends and class participation across all FabLab programs.")
    st.markdown("---")

    # ── KPIs ──────────────────────────────────────────────────────────────────
    totals = query("""
        SELECT
            COUNT(*)                                                          AS total,
            SUM(CASE WHEN status = 'confirmed'  THEN 1 ELSE 0 END)           AS confirmed,
            SUM(CASE WHEN status = 'incomplete' THEN 1 ELSE 0 END)           AS incomplete,
            SUM(CASE WHEN status = 'cancelled'  THEN 1 ELSE 0 END)           AS cancelled
        FROM enrollments
    """)

    active_classes = query(
        "SELECT COUNT(*) AS n FROM classes WHERE status = 'active'"
    )

    if not totals.empty and totals["total"].iloc[0]:
        total = int(totals["total"].iloc[0] or 0)
        confirmed = int(totals["confirmed"].iloc[0] or 0)
        incomplete = int(totals["incomplete"].iloc[0] or 0)
        cancelled = int(totals["cancelled"].iloc[0] or 0)
        completion_rate = round(confirmed / total * 100, 1) if total > 0 else 0
        n_classes = int(active_classes["n"].iloc[0]) if not active_classes.empty else 0

        c1, c2, c3, c4 = st.columns(4)
        with c1:
            kpi_card("Total Registrations", str(total), icon="📝")
        with c2:
            kpi_card("Active Classes", str(n_classes), icon="🏫")
        with c3:
            kpi_card("Completion Rate", f"{completion_rate}%", f"{confirmed} confirmed", icon="✅")
        with c4:
            kpi_card("Incomplete / Cancelled", f"{incomplete} / {cancelled}", icon="⚠️")
    else:
        st.info("No enrollment data found. Run `python etl/run_pipeline.py --seed` first.")

    st.markdown("<br>", unsafe_allow_html=True)

    # ── Registrations per class (horizontal bar) ───────────────────────────────
    per_class = query("""
        SELECT c.name AS class_name, COUNT(*) AS registrations
        FROM enrollments e
        JOIN classes c ON e."classId" = c.id
        GROUP BY c.name
        ORDER BY registrations DESC
    """)

    # ── Registrations over time (line) ─────────────────────────────────────────
    over_time = query("""
        SELECT DATE_TRUNC('week', "registrationDate") AS week, COUNT(*) AS registrations
        FROM enrollments
        WHERE "registrationDate" IS NOT NULL
        GROUP BY week
        ORDER BY week
    """)

    col_left, col_right = st.columns(2)

    with col_left:
        st.subheader("Registrations per Class")
        if not per_class.empty:
            fig = px.bar(
                per_class,
                x="registrations",
                y="class_name",
                orientation="h",
                color_discrete_sequence=[PURPLE],
                labels={"registrations": "Registrations", "class_name": ""},
            )
            fig.update_layout(
                margin=dict(l=0, r=0, t=10, b=0),
                height=320,
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                yaxis={"categoryorder": "total ascending"},
            )
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No data yet.")

    with col_right:
        st.subheader("Registrations Over Time")
        if not over_time.empty:
            fig2 = px.line(
                over_time,
                x="week",
                y="registrations",
                color_discrete_sequence=[PURPLE],
                labels={"week": "Week", "registrations": "Registrations"},
                markers=True,
            )
            fig2.update_layout(
                margin=dict(l=0, r=0, t=10, b=0),
                height=320,
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
            )
            st.plotly_chart(fig2, use_container_width=True)
        else:
            st.info("No time-series data yet.")

    st.markdown("---")

    # ── Recent registrations table ─────────────────────────────────────────────
    st.subheader("Recent Registrations")
    recent = query("""
        SELECT
            s.name         AS student,
            c.name         AS class,
            e.status,
            e."registrationDate" AS registered
        FROM enrollments e
        JOIN students s ON e."studentId" = s.id
        JOIN classes  c ON e."classId"   = c.id
        ORDER BY e."registrationDate" DESC NULLS LAST
        LIMIT 50
    """)

    if not recent.empty:
        recent["registered"] = pd.to_datetime(recent["registered"]).dt.strftime("%b %d, %Y")
        recent["status_badge"] = recent["status"].apply(status_badge)

        st.markdown(
            recent[["student", "class", "registered", "status_badge"]]
            .rename(columns={"status_badge": "status"})
            .to_html(escape=False, index=False),
            unsafe_allow_html=True,
        )
    else:
        st.info("No recent registrations.")


# ══════════════════════════════════════════════════════════════════════════════
# PAGE 2 — MATERIAL USAGE
# ══════════════════════════════════════════════════════════════════════════════

elif page == "🧰 Material Usage":
    st.title("Material Usage")
    st.markdown("Consumable materials used across FabLab sessions and estimated costs.")
    st.markdown("---")

    # ── KPIs ──────────────────────────────────────────────────────────────────
    UNIT_COSTS = {
        "PLA Filament": 0.05,
        "Resin": 0.08,
        "Acrylic Sheets": 3.00,
        "Plywood Sheets": 2.50,
        "Drone Batteries": 12.00,
        "Sphero Robots": 0.00,
        "Chocolate Molds": 2.00,
        "Chocolate": 0.02,
        "Slime Glue": 0.02,
        "Slime Activator": 0.03,
        "Drawing Tablets": 0.00,
    }

    mat_summary = query("""
        SELECT "materialName", unit, SUM("quantityUsed") AS total_qty, COUNT(*) AS sessions
        FROM material_usage
        GROUP BY "materialName", unit
        ORDER BY total_qty DESC
    """)

    if not mat_summary.empty:
        mat_summary["unit_cost"] = mat_summary["materialName"].map(UNIT_COSTS).fillna(0)
        mat_summary["estimated_cost"] = mat_summary["total_qty"] * mat_summary["unit_cost"]
        total_cost = mat_summary["estimated_cost"].sum()
        top_material = mat_summary.iloc[0]["materialName"]
        total_sessions = int(mat_summary["sessions"].sum())

        c1, c2, c3 = st.columns(3)
        with c1:
            kpi_card("Total Material Records", str(total_sessions), icon="📦")
        with c2:
            kpi_card("Estimated Total Cost", f"${total_cost:,.2f}", icon="💰")
        with c3:
            kpi_card("Most Used Material", top_material, icon="⭐")
    else:
        st.info("No material usage data found. Run the ETL pipeline first.")

    st.markdown("<br>", unsafe_allow_html=True)

    # ── Charts ─────────────────────────────────────────────────────────────────
    by_class = query("""
        SELECT c.name AS class_name, SUM(mu."quantityUsed") AS total_qty
        FROM material_usage mu
        JOIN classes c ON mu."classId" = c.id
        GROUP BY c.name
        ORDER BY total_qty DESC
    """)

    col_left, col_right = st.columns(2)

    with col_left:
        st.subheader("Usage by Class")
        if not by_class.empty:
            fig = px.bar(
                by_class,
                x="class_name",
                y="total_qty",
                color_discrete_sequence=[PURPLE],
                labels={"class_name": "", "total_qty": "Total Quantity"},
            )
            fig.update_layout(
                margin=dict(l=0, r=0, t=10, b=0),
                height=300,
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                xaxis_tickangle=-30,
            )
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No data yet.")

    with col_right:
        st.subheader("Material Distribution")
        if not mat_summary.empty:
            fig2 = px.pie(
                mat_summary,
                names="materialName",
                values="total_qty",
                color_discrete_sequence=px.colors.sequential.Purples_r,
                hole=0.4,
            )
            fig2.update_layout(
                margin=dict(l=0, r=0, t=10, b=0),
                height=300,
                paper_bgcolor="rgba(0,0,0,0)",
            )
            st.plotly_chart(fig2, use_container_width=True)
        else:
            st.info("No data yet.")

    st.markdown("---")
    st.subheader("Material Usage Detail")

    detail = query("""
        SELECT
            c.name          AS class,
            mu."materialName" AS material,
            mu.unit,
            mu."quantityUsed"  AS quantity,
            mu."sessionDate"   AS date,
            mu.instructor
        FROM material_usage mu
        JOIN classes c ON mu."classId" = c.id
        ORDER BY mu."sessionDate" DESC NULLS LAST
    """)

    if not detail.empty:
        detail["date"] = pd.to_datetime(detail["date"]).dt.strftime("%b %d, %Y")
        st.dataframe(detail, use_container_width=True, height=400)
    else:
        st.info("No detail records found.")


# ══════════════════════════════════════════════════════════════════════════════
# PAGE 3 — DATA QUALITY
# ══════════════════════════════════════════════════════════════════════════════

elif page == "🔍 Data Quality":
    st.title("Data Quality")
    st.markdown("Records flagged during the ETL transform step for follow-up.")
    st.markdown("---")

    counts = query("""
        SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN status = 'confirmed'  THEN 1 ELSE 0 END) AS confirmed,
            SUM(CASE WHEN status = 'incomplete' THEN 1 ELSE 0 END) AS incomplete,
            SUM(CASE WHEN status = 'cancelled'  THEN 1 ELSE 0 END) AS cancelled
        FROM enrollments
    """)

    if not counts.empty and counts["total"].iloc[0]:
        total     = int(counts["total"].iloc[0] or 0)
        confirmed = int(counts["confirmed"].iloc[0] or 0)
        incomplete = int(counts["incomplete"].iloc[0] or 0)
        cancelled  = int(counts["cancelled"].iloc[0] or 0)
        health_pct = round(confirmed / total * 100, 1) if total else 0

        c1, c2, c3, c4 = st.columns(4)
        with c1:
            kpi_card("Total Records", str(total), icon="📊")
        with c2:
            kpi_card("Clean (Confirmed)", str(confirmed), f"{health_pct}% of total", icon="✅")
        with c3:
            kpi_card("Incomplete", str(incomplete), "Missing email or phone", icon="⚠️")
        with c4:
            kpi_card("Cancelled", str(cancelled), icon="❌")
    else:
        st.info("No data found. Run the ETL pipeline first.")

    st.markdown("<br>", unsafe_allow_html=True)

    # ── Flagged records table ──────────────────────────────────────────────────
    st.subheader("Flagged Registrations (Incomplete)")
    st.caption("These records are missing an email address or phone number — a program manager should follow up.")

    flagged = query("""
        SELECT
            s.name     AS student,
            s.email,
            s.phone,
            c.name     AS class,
            e.status,
            e."registrationDate" AS registered
        FROM enrollments e
        JOIN students s ON e."studentId" = s.id
        JOIN classes  c ON e."classId"   = c.id
        WHERE e.status = 'incomplete'
        ORDER BY e."registrationDate" DESC NULLS LAST
    """)

    if not flagged.empty:
        flagged["registered"] = pd.to_datetime(flagged["registered"]).dt.strftime("%b %d, %Y")
        flagged["status"] = flagged["status"].apply(status_badge)
        st.markdown(
            flagged.to_html(escape=False, index=False),
            unsafe_allow_html=True,
        )
        st.caption(f"{len(flagged)} incomplete record(s) found.")
    else:
        st.success("No incomplete records — data looks clean!")

    st.markdown("---")
    st.subheader("Cancelled Registrations")

    cancelled_df = query("""
        SELECT
            s.name AS student,
            c.name AS class,
            e."registrationDate" AS registered
        FROM enrollments e
        JOIN students s ON e."studentId" = s.id
        JOIN classes  c ON e."classId"   = c.id
        WHERE e.status = 'cancelled'
        ORDER BY e."registrationDate" DESC NULLS LAST
    """)

    if not cancelled_df.empty:
        cancelled_df["registered"] = pd.to_datetime(cancelled_df["registered"]).dt.strftime("%b %d, %Y")
        st.dataframe(cancelled_df, use_container_width=True)
    else:
        st.info("No cancelled registrations.")
