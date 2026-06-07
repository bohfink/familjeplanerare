import { useState, useEffect } from "react";

// ── Colour palette per family member ──────────────────────────────────────────
const MEMBERS = [
  { id: "all",    name: "Alla",    color: "#6b7280", light: "#f3f4f6" },
  { id: "anna",   name: "Anna",   color: "#e85d75", light: "#fde8ec" },
  { id: "erik",   name: "Erik",   color: "#3b82f6", light: "#dbeafe" },
  { id: "maja",   name: "Maja",   color: "#f59e0b", light: "#fef3c7" },
  { id: "lucas",  name: "Lucas",  color: "#10b981", light: "#d1fae5" },
];

// ── Sample events ──────────────────────────────────────────────────────────────
const today = new Date();
const d = (offset, h, m) => {
  const dt = new Date(today);
  dt.setDate(today.getDate() + offset);
  dt.setHours(h, m, 0, 0);
  return dt;
};

const EVENTS = [
  { id: 1, title: "Frukost tillsammans",   member: "all",   start: d(0, 7, 30), end: d(0, 8, 15), icon: "🥞" },
  { id: 2, title: "Annas yogaklass",       member: "anna",  start: d(0, 9, 0),  end: d(0, 10, 0), icon: "🧘" },
  { id: 3, title: "Eriks jobbmöte",        member: "erik",  start: d(0, 10, 0), end: d(0, 11, 30), icon: "💼" },
  { id: 4, title: "Majas fotbollsträning", member: "maja",  start: d(0, 15, 0), end: d(0, 16, 30), icon: "⚽" },
  { id: 5, title: "Lucas piano",           member: "lucas", start: d(0, 16, 0), end: d(0, 17, 0),  icon: "🎹" },
  { id: 6, title: "Familjemiddag",         member: "all",   start: d(0, 18, 30), end: d(0, 20, 0), icon: "🍝" },
  { id: 7, title: "Annas läkarbesök",      member: "anna",  start: d(1, 9, 30), end: d(1, 10, 30), icon: "🏥" },
  { id: 8, title: "Eriks gym",             member: "erik",  start: d(1, 7, 0),  end: d(1, 8, 0),   icon: "🏋️" },
  { id: 9, title: "Majas kalas",           member: "maja",  start: d(2, 14, 0), end: d(2, 17, 0),  icon: "🎂" },
  { id: 10, title: "Familjeutflykt",       member: "all",   start: d(3, 10, 0), end: d(3, 16, 0),  icon: "🌲" },
  { id: 11, title: "Eriks föräldramöte",   member: "erik",  start: d(4, 18, 0), end: d(4, 19, 30), icon: "🏫" },
  { id: 12, title: "Lucas match",          member: "lucas", start: d(5, 11, 0), end: d(5, 13, 0),  icon: "🏅" },
  { id: 13, title: "Familjefilm",          member: "all",   start: d(6, 19, 0), end: d(6, 21, 0),  icon: "🎬" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const memberById = (id) => MEMBERS.find((m) => m.id === id);
const fmt = (dt) => dt.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();
const DAYS_SV = ["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör"];
const MONTHS_SV = ["Januari","Februari","Mars","April","Maj","Juni","Juli","Augusti","September","Oktober","November","December"];

function eventsForDay(date, filter) {
  return EVENTS.filter(
    (e) => sameDay(e.start, date) && (filter === "all" || e.member === filter)
  ).sort((a, b) => a.start - b.start);
}

// ── EventPill ──────────────────────────────────────────────────────────────────
function EventPill({ event, dark, onClick }) {
  const m = memberById(event.member);
  return (
    <button
      onClick={() => onClick(event)}
      style={{
        background: dark ? m.color + "33" : m.light,
        borderLeft: `3px solid ${m.color}`,
        color: dark ? "#f1f5f9" : "#1e293b",
      }}
      className="event-pill"
    >
      <span className="event-icon">{event.icon}</span>
      <span className="event-body">
        <span className="event-title">{event.title}</span>
        <span className="event-time">{fmt(event.start)} – {fmt(event.end)}</span>
      </span>
      <span className="event-member" style={{ color: m.color }}>{m.name}</span>
    </button>
  );
}

// ── DayView ────────────────────────────────────────────────────────────────────
function DayView({ date, filter, dark, onEventClick }) {
  const events = eventsForDay(date, filter);
  const label = date.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="view-section">
      <h2 className="view-heading" style={{ textTransform: "capitalize" }}>{label}</h2>
      {events.length === 0 ? (
        <div className="empty-state">🌿 Inga aktiviteter denna dag</div>
      ) : (
        <div className="event-list">
          {events.map((e) => (
            <EventPill key={e.id} event={e} dark={dark} onClick={onEventClick} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── WeekView ───────────────────────────────────────────────────────────────────
function WeekView({ date, filter, dark, onEventClick }) {
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));

  return (
    <div className="week-grid">
      {Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const events = eventsForDay(d, filter);
        const isToday = sameDay(d, today);
        return (
          <div
            key={i}
            className={`week-col ${isToday ? "week-col--today" : ""}`}
            style={isToday ? { outline: `2px solid ${dark ? "#60a5fa" : "#3b82f6"}` } : {}}
          >
            <div className="week-day-label">
              <span className="week-day-name">{DAYS_SV[d.getDay()]}</span>
              <span className={`week-day-num ${isToday ? "today-badge" : ""}`}
                style={isToday ? { background: "#3b82f6", color: "#fff" } : {}}>
                {d.getDate()}
              </span>
            </div>
            <div className="week-events">
              {events.length === 0
                ? <div className="week-empty">—</div>
                : events.map((e) => {
                    const m = memberById(e.member);
                    return (
                      <button
                        key={e.id}
                        onClick={() => onEventClick(e)}
                        className="week-pill"
                        style={{ background: m.color, color: "#fff" }}
                        title={e.title}
                      >
                        {e.icon} {e.title}
                      </button>
                    );
                  })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── MonthView ─────────────────────────────────────────────────────────────────
function MonthView({ date, filter, dark, onEventClick }) {
  const year = date.getFullYear(), month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(new Date(year, month, i));

  return (
    <div className="month-wrap">
      <h2 className="view-heading">{MONTHS_SV[month]} {year}</h2>
      <div className="month-header">
        {["Mån","Tis","Ons","Tor","Fre","Lör","Sön"].map((d) => (
          <div key={d} className="month-header-cell">{d}</div>
        ))}
      </div>
      <div className="month-grid">
        {cells.map((cellDate, i) => {
          if (!cellDate) return <div key={`e${i}`} className="month-cell month-cell--empty" />;
          const isToday = sameDay(cellDate, today);
          const events = eventsForDay(cellDate, filter);
          return (
            <div
              key={i}
              className={`month-cell ${isToday ? "month-cell--today" : ""}`}
              style={isToday ? { background: dark ? "#1e3a5f" : "#dbeafe" } : {}}
            >
              <span className={`month-day-num ${isToday ? "today-badge" : ""}`}
                style={isToday ? { background: "#3b82f6", color: "#fff" } : {}}>
                {cellDate.getDate()}
              </span>
              <div className="month-dots">
                {events.slice(0, 3).map((e) => {
                  const m = memberById(e.member);
                  return (
                    <button
                      key={e.id}
                      className="month-dot-pill"
                      style={{ background: m.color }}
                      onClick={() => onEventClick(e)}
                      title={e.title}
                    >
                      {e.icon}
                    </button>
                  );
                })}
                {events.length > 3 && (
                  <span className="month-more">+{events.length - 3}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── EventModal ─────────────────────────────────────────────────────────────────
function EventModal({ event, dark, onClose }) {
  if (!event) return null;
  const m = memberById(event.member);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{ background: dark ? "#1e293b" : "#fff", borderTop: `4px solid ${m.color}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-icon">{event.icon}</div>
        <h3 className="modal-title">{event.title}</h3>
        <div className="modal-meta" style={{ color: m.color }}>
          {m.name}
        </div>
        <div className="modal-time">
          {event.start.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" })}
          <br />
          {fmt(event.start)} – {fmt(event.end)}
        </div>
        <button className="modal-close" onClick={onClose} style={{ background: m.color }}>
          Stäng
        </button>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function FamilyPlanner() {
  const [view, setView] = useState("day");
  const [filter, setFilter] = useState("all");
  const [dark, setDark] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date(today));

  const navigate = (dir) => {
    const next = new Date(currentDate);
    if (view === "day") next.setDate(next.getDate() + dir);
    else if (view === "week") next.setDate(next.getDate() + dir * 7);
    else next.setMonth(next.getMonth() + dir);
    setCurrentDate(next);
  };

  const bg = dark ? "#0f172a" : "#f8fafc";
  const surface = dark ? "#1e293b" : "#ffffff";
  const text = dark ? "#f1f5f9" : "#0f172a";
  const subtext = dark ? "#94a3b8" : "#64748b";
  const border = dark ? "#334155" : "#e2e8f0";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fraunces:wght@700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Nunito', sans-serif; }

        .app {
          min-height: 100vh;
          background: ${bg};
          color: ${text};
          transition: background 0.3s, color 0.3s;
          font-family: 'Nunito', sans-serif;
        }

        /* HEADER */
        .header {
          background: ${surface};
          border-bottom: 1px solid ${border};
          padding: 0 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          height: 64px;
          position: sticky;
          top: 0;
          z-index: 50;
          box-shadow: 0 1px 8px ${dark ? "#00000044" : "#0000000a"};
        }
        .logo {
          font-family: 'Fraunces', serif;
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #e85d75, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          white-space: nowrap;
        }
        .header-spacer { flex: 1; }
        .view-tabs {
          display: flex;
          gap: 4px;
          background: ${dark ? "#0f172a" : "#f1f5f9"};
          border-radius: 10px;
          padding: 3px;
        }
        .view-tab {
          padding: 5px 14px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-family: 'Nunito', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          transition: all 0.2s;
          background: transparent;
          color: ${subtext};
        }
        .view-tab.active {
          background: ${surface};
          color: ${text};
          box-shadow: 0 1px 4px ${dark ? "#00000066" : "#00000015"};
        }
        .dark-toggle {
          width: 36px; height: 36px;
          border-radius: 50%;
          border: 1px solid ${border};
          background: ${dark ? "#334155" : "#f1f5f9"};
          cursor: pointer;
          font-size: 1.1rem;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s;
        }

        /* MEMBER BAR */
        .member-bar {
          display: flex;
          gap: 8px;
          padding: 1rem 1.5rem 0.5rem;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .member-bar::-webkit-scrollbar { display: none; }
        .member-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 999px;
          border: 2px solid transparent;
          cursor: pointer;
          font-family: 'Nunito', sans-serif;
          font-weight: 800;
          font-size: 0.85rem;
          transition: all 0.2s;
          white-space: nowrap;
          background: ${dark ? "#1e293b" : "#f1f5f9"};
          color: ${text};
        }
        .member-btn.active {
          border-color: var(--mc);
          background: var(--mb);
          color: ${dark ? "#fff" : "#1e293b"};
        }
        .member-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--mc);
        }

        /* NAV ROW */
        .nav-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0.5rem 1.5rem 1rem;
        }
        .nav-btn {
          width: 32px; height: 32px;
          border-radius: 8px;
          border: 1px solid ${border};
          background: ${surface};
          cursor: pointer;
          font-size: 1rem;
          display: flex; align-items: center; justify-content: center;
          color: ${text};
          transition: background 0.15s;
        }
        .nav-btn:hover { background: ${dark ? "#334155" : "#f1f5f9"}; }
        .nav-label {
          font-weight: 700;
          font-size: 0.95rem;
          color: ${subtext};
          text-transform: capitalize;
        }

        /* MAIN */
        .main { padding: 0 1.5rem 2rem; }

        /* DAY VIEW */
        .view-section {}
        .view-heading {
          font-family: 'Fraunces', serif;
          font-size: 1.4rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: ${text};
        }
        .event-list { display: flex; flex-direction: column; gap: 8px; }
        .event-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .event-pill:hover { transform: translateX(4px); box-shadow: 0 2px 12px ${dark ? "#00000055" : "#00000015"}; }
        .event-icon { font-size: 1.3rem; flex-shrink: 0; }
        .event-body { flex: 1; min-width: 0; }
        .event-title { display: block; font-weight: 800; font-size: 0.95rem; }
        .event-time { display: block; font-size: 0.78rem; opacity: 0.7; margin-top: 1px; }
        .event-member { font-size: 0.75rem; font-weight: 800; white-space: nowrap; }
        .empty-state {
          text-align: center;
          padding: 3rem;
          color: ${subtext};
          font-size: 1rem;
        }

        /* WEEK VIEW */
        .week-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
          overflow-x: auto;
          min-width: 0;
        }
        .week-col {
          background: ${surface};
          border-radius: 12px;
          padding: 8px 6px;
          min-width: 0;
          border: 1px solid ${border};
        }
        .week-col--today {}
        .week-day-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 6px;
          gap: 2px;
        }
        .week-day-name { font-size: 0.7rem; font-weight: 800; color: ${subtext}; text-transform: uppercase; }
        .week-day-num {
          width: 26px; height: 26px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.85rem;
          font-weight: 800;
        }
        .today-badge { border-radius: 50%; }
        .week-events { display: flex; flex-direction: column; gap: 4px; }
        .week-pill {
          display: block;
          width: 100%;
          text-align: left;
          border: none;
          border-radius: 6px;
          padding: 3px 5px;
          font-size: 0.65rem;
          font-family: 'Nunito', sans-serif;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: opacity 0.15s;
        }
        .week-pill:hover { opacity: 0.8; }
        .week-empty { text-align: center; color: ${subtext}; font-size: 0.7rem; padding: 4px 0; }

        /* MONTH VIEW */
        .month-wrap {}
        .month-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          margin-bottom: 4px;
        }
        .month-header-cell {
          text-align: center;
          font-size: 0.72rem;
          font-weight: 800;
          color: ${subtext};
          text-transform: uppercase;
          padding: 4px 0;
        }
        .month-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }
        .month-cell {
          background: ${surface};
          border-radius: 8px;
          border: 1px solid ${border};
          padding: 4px;
          min-height: 70px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .month-cell--empty { background: transparent; border-color: transparent; }
        .month-day-num {
          font-size: 0.78rem;
          font-weight: 800;
          width: 22px; height: 22px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 50%;
          align-self: flex-start;
        }
        .month-dots { display: flex; flex-direction: column; gap: 2px; }
        .month-dot-pill {
          border: none;
          border-radius: 4px;
          padding: 1px 4px;
          font-size: 0.65rem;
          cursor: pointer;
          color: #fff;
          text-align: left;
          font-family: 'Nunito', sans-serif;
          font-weight: 700;
          transition: opacity 0.15s;
          white-space: nowrap;
          overflow: hidden;
        }
        .month-dot-pill:hover { opacity: 0.8; }
        .month-more { font-size: 0.6rem; color: ${subtext}; font-weight: 700; padding-left: 2px; }

        /* MODAL */
        .modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 100;
          padding: 1rem;
        }
        .modal-card {
          border-radius: 20px;
          padding: 2rem;
          max-width: 360px;
          width: 100%;
          text-align: center;
          box-shadow: 0 24px 60px rgba(0,0,0,0.3);
          animation: popIn 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes popIn {
          from { transform: scale(0.8); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        .modal-icon { font-size: 3rem; margin-bottom: 0.5rem; }
        .modal-title {
          font-family: 'Fraunces', serif;
          font-size: 1.4rem;
          font-weight: 700;
          margin-bottom: 0.4rem;
          color: ${text};
        }
        .modal-meta { font-weight: 800; font-size: 0.9rem; margin-bottom: 0.8rem; }
        .modal-time { font-size: 0.9rem; color: ${subtext}; line-height: 1.6; margin-bottom: 1.5rem; }
        .modal-close {
          border: none;
          border-radius: 10px;
          padding: 10px 28px;
          color: #fff;
          font-family: 'Nunito', sans-serif;
          font-weight: 800;
          font-size: 1rem;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .modal-close:hover { opacity: 0.85; }

        /* GOOGLE CONNECT BANNER */
        .gcal-banner {
          margin: 1.5rem 1.5rem 0;
          background: ${dark ? "#1e3a5f" : "#eff6ff"};
          border: 1px dashed ${dark ? "#3b82f6" : "#93c5fd"};
          border-radius: 14px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .gcal-text { flex: 1; font-size: 0.85rem; color: ${dark ? "#93c5fd" : "#1d4ed8"}; font-weight: 700; }
        .gcal-btn {
          background: #3b82f6;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 6px 14px;
          font-family: 'Nunito', sans-serif;
          font-weight: 800;
          font-size: 0.8rem;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s;
        }
        .gcal-btn:hover { background: #2563eb; }

        @media (max-width: 640px) {
          .week-grid { grid-template-columns: repeat(7, minmax(80px, 1fr)); }
          .month-cell { min-height: 55px; }
          .logo { font-size: 1.2rem; }
        }
      `}</style>

      <div className="app">
        {/* HEADER */}
        <header className="header">
          <span className="logo">🏡 Familjen</span>
          <div className="header-spacer" />
          <div className="view-tabs">
            {[["day","Dag"],["week","Vecka"],["month","Månad"]].map(([v,l]) => (
              <button
                key={v}
                className={`view-tab ${view === v ? "active" : ""}`}
                onClick={() => setView(v)}
              >{l}</button>
            ))}
          </div>
          <button className="dark-toggle" onClick={() => setDark(!dark)}>
            {dark ? "☀️" : "🌙"}
          </button>
        </header>

        {/* GOOGLE CALENDAR BANNER */}
        <div className="gcal-banner">
          <span style={{ fontSize: "1.2rem" }}>📅</span>
          <span className="gcal-text">Koppla in Google Kalender för riktiga händelser</span>
          <button className="gcal-btn" onClick={() => alert("Google OAuth-integration — koppla ditt Google-konto här!")}>
            Anslut
          </button>
        </div>

        {/* MEMBER FILTER */}
        <div className="member-bar">
          {MEMBERS.map((m) => (
            <button
              key={m.id}
              className={`member-btn ${filter === m.id ? "active" : ""}`}
              style={{ "--mc": m.color, "--mb": dark ? m.color + "44" : m.light }}
              onClick={() => setFilter(m.id)}
            >
              <span className="member-dot" />
              {m.name}
            </button>
          ))}
        </div>

        {/* NAV ROW */}
        <div className="nav-row">
          <button className="nav-btn" onClick={() => navigate(-1)}>‹</button>
          <button className="nav-btn" onClick={() => { setCurrentDate(new Date(today)); }}>Idag</button>
          <button className="nav-btn" onClick={() => navigate(1)}>›</button>
          <span className="nav-label">
            {view === "day" && currentDate.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" })}
            {view === "week" && (() => {
              const mon = new Date(currentDate);
              mon.setDate(currentDate.getDate() - ((currentDate.getDay()+6)%7));
              const sun = new Date(mon); sun.setDate(mon.getDate()+6);
              return `${mon.getDate()} ${MONTHS_SV[mon.getMonth()].slice(0,3)} – ${sun.getDate()} ${MONTHS_SV[sun.getMonth()].slice(0,3)} ${sun.getFullYear()}`;
            })()}
            {view === "month" && `${MONTHS_SV[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
          </span>
        </div>

        {/* VIEWS */}
        <main className="main">
          {view === "day" && <DayView date={currentDate} filter={filter} dark={dark} onEventClick={setSelectedEvent} />}
          {view === "week" && <WeekView date={currentDate} filter={filter} dark={dark} onEventClick={setSelectedEvent} />}
          {view === "month" && <MonthView date={currentDate} filter={filter} dark={dark} onEventClick={setSelectedEvent} />}
        </main>
      </div>

      {/* EVENT MODAL */}
      <EventModal event={selectedEvent} dark={dark} onClose={() => setSelectedEvent(null)} />
    </>
  );
}
