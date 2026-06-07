import { useState, useEffect } from "react";

const CLIENT_ID = "355111249721-kdna1rclcdjtkvis09au3oijslhdqoip.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

const DEFAULT_MEMBERS = [
  { id: "m1", name: "Anna",  color: "#e85d75", light: "#fde8ec" },
  { id: "m2", name: "Erik",  color: "#3b82f6", light: "#dbeafe" },
  { id: "m3", name: "Maja",  color: "#f59e0b", light: "#fef3c7" },
  { id: "m4", name: "Lucas", color: "#10b981", light: "#d1fae5" },
];

const ALL_MEMBER = { id: "all", name: "Alla", color: "#6b7280", light: "#f3f4f6" };
const COLORS = ["#e85d75","#3b82f6","#f59e0b","#10b981","#8b5cf6","#f97316","#06b6d4","#ec4899"];
const DAYS_SV = ["Sön","Mån","Tis","Ons","Tor","Fre","Lör"];
const MONTHS_SV = ["Januari","Februari","Mars","April","Maj","Juni","Juli","Augusti","September","Oktober","November","December"];
const today = new Date();

const memberById = (members, id) => members.find((m) => m.id === id) || ALL_MEMBER;
const fmt = (dt) => dt.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
const sameDay = (a, b) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();

function guessMember(members, title) {
  const t = title.toLowerCase();
  for (const m of members) {
    if (t.includes(m.name.toLowerCase())) return m.id;
  }
  return "all";
}

function parseGoogleEvents(items, members) {
  return items.filter((e) => e.start).map((e, i) => {
    const start = new Date(e.start.dateTime || e.start.date);
    const end = new Date(e.end.dateTime || e.end.date);
    return { id: e.id||i, title: e.summary||"Händelse", member: guessMember(members, e.summary||""), start, end, icon: "📅" };
  });
}

function eventsForDay(events, date, filter) {
  return events.filter((e) => sameDay(e.start, date) && (filter==="all" || e.member===filter)).sort((a,b)=>a.start-b.start);
}

function EventPill({ event, members, dark, onClick }) {
  const m = memberById(members, event.member);
  return (
    <button onClick={() => onClick(event)}
      style={{ background: dark ? m.color+"33" : m.light, borderLeft: `3px solid ${m.color}`, color: dark?"#f1f5f9":"#1e293b" }}
      className="event-pill">
      <span className="event-icon">{event.icon}</span>
      <span className="event-body">
        <span className="event-title">{event.title}</span>
        <span className="event-time">{fmt(event.start)} – {fmt(event.end)}</span>
      </span>
      <span className="event-member" style={{ color: m.color }}>{m.name}</span>
    </button>
  );
}

function DayView({ events, date, filter, dark, members, onEventClick }) {
  const dayEvents = eventsForDay(events, date, filter);
  const label = date.toLocaleDateString("sv-SE", { weekday:"long", day:"numeric", month:"long" });
  return (
    <div className="view-section">
      <h2 className="view-heading" style={{ textTransform:"capitalize" }}>{label}</h2>
      {dayEvents.length===0 ? <div className="empty-state">🌿 Inga aktiviteter denna dag</div>
        : <div className="event-list">{dayEvents.map((e)=><EventPill key={e.id} event={e} members={members} dark={dark} onClick={onEventClick}/>)}</div>}
    </div>
  );
}

function WeekView({ events, date, filter, dark, members, onEventClick }) {
  const monday = new Date(date);
  monday.setDate(date.getDate()-((date.getDay()+6)%7));
  return (
    <div className="week-grid">
      {Array.from({length:7}).map((_,i)=>{
        const d = new Date(monday); d.setDate(monday.getDate()+i);
        const dayEvents = eventsForDay(events, d, filter);
        const isToday = sameDay(d, today);
        return (
          <div key={i} className={`week-col ${isToday?"week-col--today":""}`}
            style={isToday?{outline:`2px solid ${dark?"#60a5fa":"#3b82f6"}`}:{}}>
            <div className="week-day-label">
              <span className="week-day-name">{DAYS_SV[d.getDay()]}</span>
              <span className={`week-day-num ${isToday?"today-badge":""}`}
                style={isToday?{background:"#3b82f6",color:"#fff"}:{}}>{d.getDate()}</span>
            </div>
            <div className="week-events">
              {dayEvents.length===0 ? <div className="week-empty">—</div>
                : dayEvents.map((e)=>{
                  const m = memberById(members, e.member);
                  return <button key={e.id} onClick={()=>onEventClick(e)} className="week-pill"
                    style={{background:m.color,color:"#fff"}} title={e.title}>{e.icon} {e.title}</button>;
                })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MonthView({ events, date, filter, dark, members, onEventClick }) {
  const year=date.getFullYear(), month=date.getMonth();
  const startOffset=(new Date(year,month,1).getDay()+6)%7;
  const daysInMonth=new Date(year,month+1,0).getDate();
  const cells=[];
  for(let i=0;i<startOffset;i++) cells.push(null);
  for(let i=1;i<=daysInMonth;i++) cells.push(new Date(year,month,i));
  return (
    <div className="month-wrap">
      <h2 className="view-heading">{MONTHS_SV[month]} {year}</h2>
      <div className="month-header">{["Mån","Tis","Ons","Tor","Fre","Lör","Sön"].map((d)=><div key={d} className="month-header-cell">{d}</div>)}</div>
      <div className="month-grid">
        {cells.map((cellDate,i)=>{
          if(!cellDate) return <div key={`e${i}`} className="month-cell month-cell--empty"/>;
          const isToday=sameDay(cellDate,today);
          const dayEvents=eventsForDay(events,cellDate,filter);
          return (
            <div key={i} className={`month-cell ${isToday?"month-cell--today":""}`}
              style={isToday?{background:dark?"#1e3a5f":"#dbeafe"}:{}}>
              <span className={`month-day-num ${isToday?"today-badge":""}`}
                style={isToday?{background:"#3b82f6",color:"#fff"}:{}}>{cellDate.getDate()}</span>
              <div className="month-dots">
                {dayEvents.slice(0,3).map((e)=>{
                  const m=memberById(members,e.member);
                  return <button key={e.id} className="month-dot-pill" style={{background:m.color}}
                    onClick={()=>onEventClick(e)} title={e.title}>{e.icon}</button>;
                })}
                {dayEvents.length>3 && <span className="month-more">+{dayEvents.length-3}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventModal({ event, members, dark, onClose }) {
  if(!event) return null;
  const m = memberById(members, event.member);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{background:dark?"#1e293b":"#fff",borderTop:`4px solid ${m.color}`}}
        onClick={(e)=>e.stopPropagation()}>
        <div className="modal-icon">{event.icon}</div>
        <h3 className="modal-title">{event.title}</h3>
        <div className="modal-meta" style={{color:m.color}}>{m.name}</div>
        <div className="modal-time">
          {event.start.toLocaleDateString("sv-SE",{weekday:"long",day:"numeric",month:"long"})}<br/>
          {fmt(event.start)} – {fmt(event.end)}
        </div>
        <button className="modal-close" onClick={onClose} style={{background:m.color}}>Stäng</button>
      </div>
    </div>
  );
}

function SettingsPage({ members, setMembers, dark, loggedIn, onLogin, onLogout, calendars, enabledCalendars, setEnabledCalendars }) {
  const [editingId, setEditingId] = useState(null);

  const addMember = () => {
    const id = "m" + Date.now();
    setMembers([...members, { id, name: "Ny medlem", color: COLORS[members.length % COLORS.length], light: "#f3f4f6" }]);
  };

  const removeMember = (id) => setMembers(members.filter((m) => m.id !== id));
  const updateMember = (id, key, val) => setMembers(members.map((m) => m.id===id ? {...m,[key]:val} : m));
  const toggleCalendar = (calId) => {
    setEnabledCalendars(prev =>
      prev.includes(calId) ? prev.filter(id => id !== calId) : [...prev, calId]
    );
  };

  const surface = dark?"#1e293b":"#ffffff";
  const border = dark?"#334155":"#e2e8f0";
  const text = dark?"#f1f5f9":"#0f172a";
  const subtext = dark?"#94a3b8":"#64748b";

  return (
    <div className="settings-page">

      {/* Google Kalender */}
      <div className="settings-section" style={{background:surface,border:`1px solid ${border}`}}>
        <h3 className="settings-title" style={{color:text}}>📅 Google Kalender</h3>
        {loggedIn ? (
          <div className="settings-row">
            <span style={{color:subtext,fontSize:"0.9rem"}}>✅ Ansluten</span>
            <button className="settings-btn settings-btn--danger" onClick={onLogout}>Logga ut</button>
          </div>
        ) : (
          <div className="settings-row">
            <span style={{color:subtext,fontSize:"0.9rem"}}>Inte ansluten</span>
            <button className="settings-btn settings-btn--primary" onClick={onLogin}>Anslut Google</button>
          </div>
        )}
      </div>

      {/* Kalenderval */}
      {loggedIn && calendars.length > 0 && (
        <div className="settings-section" style={{background:surface,border:`1px solid ${border}`}}>
          <h3 className="settings-title" style={{color:text}}>📋 Välj kalendrar</h3>
          <p className="settings-desc" style={{color:subtext}}>Välj vilka Google-kalendrar som ska visas i appen.</p>
          <div className="calendar-list">
            {calendars.map((cal) => (
              <div key={cal.id} className="calendar-row" style={{border:`1px solid ${border}`}}>
                <div className="cal-dot" style={{background: cal.backgroundColor || "#3b82f6"}}/>
                <span className="cal-name" style={{color:text}}>{cal.summary}</span>
                <button
                  className={`cal-toggle ${enabledCalendars.includes(cal.id) ? "cal-toggle--on" : "cal-toggle--off"}`}
                  style={{background: enabledCalendars.includes(cal.id) ? "#3b82f6" : (dark?"#334155":"#e2e8f0")}}
                  onClick={() => toggleCalendar(cal.id)}>
                  {enabledCalendars.includes(cal.id) ? "På" : "Av"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Familjemedlemmar */}
      <div className="settings-section" style={{background:surface,border:`1px solid ${border}`}}>
        <h3 className="settings-title" style={{color:text}}>👨‍👩‍👧‍👦 Familjemedlemmar</h3>
        <p className="settings-desc" style={{color:subtext}}>Händelser som innehåller ett namn kopplas automatiskt till den personen.</p>
        <div className="member-list">
          {members.map((m) => (
            <div key={m.id} className="member-row" style={{border:`1px solid ${border}`}}>
              <div className="member-colors">
                {COLORS.map((c) => (
                  <button key={c} className="color-swatch"
                    style={{background:c, outline:m.color===c?`2px solid ${c}`:"none", outlineOffset:"2px"}}
                    onClick={() => updateMember(m.id, "color", c)}/>
                ))}
              </div>
              {editingId===m.id ? (
                <input className="member-name-input" style={{color:text,background:dark?"#0f172a":"#f8fafc",border:`1px solid ${border}`}}
                  value={m.name} onChange={(e)=>updateMember(m.id,"name",e.target.value)}
                  onBlur={()=>setEditingId(null)} autoFocus/>
              ) : (
                <span className="member-name" style={{color:text}} onClick={()=>setEditingId(m.id)}>{m.name} ✏️</span>
              )}
              <button className="remove-btn" onClick={()=>removeMember(m.id)}>✕</button>
            </div>
          ))}
        </div>
        <button className="settings-btn settings-btn--primary" onClick={addMember}>+ Lägg till medlem</button>
      </div>

      {/* iPad tips */}
      <div className="settings-section" style={{background:surface,border:`1px solid ${border}`}}>
        <h3 className="settings-title" style={{color:text}}>📱 Lägg till på hemskärmen</h3>
        <p className="settings-desc" style={{color:subtext}}>På iPad: tryck på dela-ikonen i Safari och välj <strong>"Lägg till på hemskärmen"</strong> — då fungerar appen som en native app utan webbläsarens adressfält.</p>
      </div>
    </div>
  );
}

export default function FamilyPlanner() {
  const [view, setView] = useState("day");
  const [page, setPage] = useState("home");
  const [filter, setFilter] = useState("all");
  const [dark, setDark] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date(today));
  const [events, setEvents] = useState([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);
  const [calendars, setCalendars] = useState([]);
  const [enabledCalendars, setEnabledCalendars] = useState(() => {
    try { return JSON.parse(localStorage.getItem("enabledCalendars")) || []; } catch { return []; }
  });
  const [members, setMembers] = useState(() => {
    try { return JSON.parse(localStorage.getItem("familyMembers")) || DEFAULT_MEMBERS; } catch { return DEFAULT_MEMBERS; }
  });

  useEffect(() => { localStorage.setItem("familyMembers", JSON.stringify(members)); }, [members]);
  useEffect(() => { localStorage.setItem("enabledCalendars", JSON.stringify(enabledCalendars)); }, [enabledCalendars]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = () => {
      const tc = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (resp) => { if(resp.access_token) fetchEvents(resp.access_token); },
      });
      setTokenClient(tc);
    };
    document.body.appendChild(script);
  }, []);

  const fetchEvents = async (token) => {
    setLoading(true);
    try {
      const calRes = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList",
        { headers: { Authorization: `Bearer ${token}` } });
      const calData = await calRes.json();
      const allCals = calData.items || [];
      setCalendars(allCals);

      const activeCals = enabledCalendars.length > 0
        ? allCals.filter(c => enabledCalendars.includes(c.id))
        : allCals;

      if(enabledCalendars.length === 0) {
        setEnabledCalendars(allCals.map(c => c.id));
      }

      const now = new Date();
      const max = new Date(); max.setMonth(now.getMonth()+2);

      const allEvents = await Promise.all(
        activeCals.map(async (cal) => {
          const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?timeMin=${now.toISOString()}&timeMax=${max.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=100`;
          const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
          const data = await res.json();
          return data.items || [];
        })
      );

      const merged = allEvents.flat();
      const unique = merged.filter((e,i,arr) => arr.findIndex(x=>x.id===e.id)===i);
      setEvents(parseGoogleEvents(unique, members));
      setLoggedIn(true);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const handleLogin = () => { if(tokenClient) tokenClient.requestAccessToken(); };
  const handleLogout = () => { setLoggedIn(false); setEvents([]); setCalendars([]); };

  const navigate = (dir) => {
    const next = new Date(currentDate);
    if(view==="day") next.setDate(next.getDate()+dir);
    else if(view==="week") next.setDate(next.getDate()+dir*7);
    else next.setMonth(next.getMonth()+dir);
    setCurrentDate(next);
  };

  const allMembers = [ALL_MEMBER, ...members];
  const bg = dark?"#0f172a":"#f8fafc";
  const surface = dark?"#1e293b":"#ffffff";
  const text = dark?"#f1f5f9":"#0f172a";
  const subtext = dark?"#94a3b8":"#64748b";
  const border = dark?"#334155":"#e2e8f0";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fraunces:wght@700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Nunito',sans-serif;}
        .app{min-height:100vh;background:${bg};color:${text};transition:background 0.3s,color 0.3s;}
        .header{background:${surface};border-bottom:1px solid ${border};padding:0 1rem;display:flex;align-items:center;gap:1rem;height:64px;position:sticky;top:0;z-index:50;box-shadow:0 1px 8px ${dark?"#00000044":"#0000000a"};}
        .logo{font-family:'Fraunces',serif;font-size:1.5rem;font-weight:700;background:linear-gradient(135deg,#e85d75,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;white-space:nowrap;}
        .header-spacer{flex:1;}
        .view-tabs{display:flex;gap:4px;background:${dark?"#0f172a":"#f1f5f9"};border-radius:10px;padding:3px;}
        .view-tab{padding:5px 14px;border-radius:8px;border:none;cursor:pointer;font-family:'Nunito',sans-serif;font-weight:700;font-size:0.85rem;transition:all 0.2s;background:transparent;color:${subtext};}
        .view-tab.active{background:${surface};color:${text};box-shadow:0 1px 4px ${dark?"#00000066":"#00000015"};}
        .dark-toggle,.settings-toggle{width:36px;height:36px;border-radius:50%;border:1px solid ${border};background:${dark?"#334155":"#f1f5f9"};cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;}
        .gcal-banner{background:${dark?"#1e3a5f":"#eff6ff"};border-bottom:1px solid ${dark?"#3b82f6":"#93c5fd"};padding:10px 1rem;display:flex;align-items:center;gap:10px;}
        .gcal-text{flex:1;font-size:0.85rem;color:${dark?"#93c5fd":"#1d4ed8"};font-weight:700;}
        .gcal-btn{background:#3b82f6;color:#fff;border:none;border-radius:8px;padding:6px 14px;font-family:'Nunito',sans-serif;font-weight:800;font-size:0.8rem;cursor:pointer;}
        .member-bar{display:flex;gap:8px;padding:1rem 1rem 0.5rem;overflow-x:auto;scrollbar-width:none;}
        .member-bar::-webkit-scrollbar{display:none;}
        .member-btn{display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:999px;border:2px solid transparent;cursor:pointer;font-family:'Nunito',sans-serif;font-weight:800;font-size:0.85rem;transition:all 0.2s;white-space:nowrap;background:${dark?"#1e293b":"#f1f5f9"};color:${text};}
        .member-btn.active{border-color:var(--mc);background:var(--mb);color:${dark?"#fff":"#1e293b"};}
        .member-dot{width:8px;height:8px;border-radius:50%;background:var(--mc);}
        .nav-row{display:flex;align-items:center;gap:8px;padding:0.5rem 1rem 1rem;}
        .nav-btn{width:32px;height:32px;border-radius:8px;border:1px solid ${border};background:${surface};cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;color:${text};}
        .nav-label{font-weight:700;font-size:0.95rem;color:${subtext};text-transform:capitalize;}
        .main{padding:0 1rem 2rem;}
        .view-heading{font-family:'Fraunces',serif;font-size:1.4rem;font-weight:700;margin-bottom:1rem;color:${text};}
        .event-list{display:flex;flex-direction:column;gap:8px;}
        .event-pill{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:12px;border:none;cursor:pointer;text-align:left;width:100%;transition:transform 0.15s;}
        .event-pill:hover{transform:translateX(4px);}
        .event-icon{font-size:1.3rem;flex-shrink:0;}
        .event-body{flex:1;min-width:0;}
        .event-title{display:block;font-weight:800;font-size:0.95rem;}
        .event-time{display:block;font-size:0.78rem;opacity:0.7;margin-top:1px;}
        .event-member{font-size:0.75rem;font-weight:800;white-space:nowrap;}
        .empty-state{text-align:center;padding:3rem;color:${subtext};font-size:1rem;}
        .loading{text-align:center;padding:3rem;color:${subtext};}
        .week-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;}
        .week-col{background:${surface};border-radius:12px;padding:8px 6px;border:1px solid ${border};}
        .week-day-label{display:flex;flex-direction:column;align-items:center;margin-bottom:6px;gap:2px;}
        .week-day-name{font-size:0.7rem;font-weight:800;color:${subtext};text-transform:uppercase;}
        .week-day-num{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.85rem;font-weight:800;}
        .week-events{display:flex;flex-direction:column;gap:4px;}
        .week-pill{display:block;width:100%;text-align:left;border:none;border-radius:6px;padding:3px 5px;font-size:0.65rem;font-family:'Nunito',sans-serif;font-weight:700;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .week-empty{text-align:center;color:${subtext};font-size:0.7rem;padding:4px 0;}
        .month-wrap{}
        .month-header{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:4px;}
        .month-header-cell{text-align:center;font-size:0.72rem;font-weight:800;color:${subtext};text-transform:uppercase;padding:4px 0;}
        .month-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;}
        .month-cell{background:${surface};border-radius:8px;border:1px solid ${border};padding:4px;min-height:70px;display:flex;flex-direction:column;gap:2px;}
        .month-cell--empty{background:transparent;border-color:transparent;}
        .month-day-num{font-size:0.78rem;font-weight:800;width:22px;height:22px;display:flex;align-items:center;justify-content:center;border-radius:50%;}
        .month-dots{display:flex;flex-direction:column;gap:2px;}
        .month-dot-pill{border:none;border-radius:4px;padding:1px 4px;font-size:0.65rem;cursor:pointer;color:#fff;text-align:left;font-family:'Nunito',sans-serif;font-weight:700;white-space:nowrap;overflow:hidden;}
        .month-more{font-size:0.6rem;color:${subtext};font-weight:700;}
        .modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:100;padding:1rem;}
        .modal-card{border-radius:20px;padding:2rem;max-width:360px;width:100%;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,0.3);animation:popIn 0.2s cubic-bezier(0.34,1.56,0.64,1);}
        @keyframes popIn{from{transform:scale(0.8);opacity:0;}to{transform:scale(1);opacity:1;}}
        .modal-icon{font-size:3rem;margin-bottom:0.5rem;}
        .modal-title{font-family:'Fraunces',serif;font-size:1.4rem;font-weight:700;margin-bottom:0.4rem;color:${text};}
        .modal-meta{font-weight:800;font-size:0.9rem;margin-bottom:0.8rem;}
        .modal-time{font-size:0.9rem;color:${subtext};line-height:1.6;margin-bottom:1.5rem;}
        .modal-close{border:none;border-radius:10px;padding:10px 28px;color:#fff;font-family:'Nunito',sans-serif;font-weight:800;font-size:1rem;cursor:pointer;}
        .settings-page{padding:1rem;display:flex;flex-direction:column;gap:1rem;}
        .settings-section{border-radius:16px;padding:1.25rem;display:flex;flex-direction:column;gap:1rem;}
        .settings-title{font-family:'Fraunces',serif;font-size:1.1rem;font-weight:700;}
        .settings-desc{font-size:0.85rem;line-height:1.5;}
        .settings-row{display:flex;align-items:center;justify-content:space-between;gap:1rem;}
        .settings-btn{padding:8px 18px;border-radius:10px;border:none;font-family:'Nunito',sans-serif;font-weight:800;font-size:0.85rem;cursor:pointer;}
        .settings-btn--primary{background:#3b82f6;color:#fff;}
        .settings-btn--danger{background:#ef4444;color:#fff;}
        .calendar-list{display:flex;flex-direction:column;gap:8px;}
        .calendar-row{border-radius:12px;padding:10px 12px;display:flex;align-items:center;gap:10px;}
        .cal-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0;}
        .cal-name{flex:1;font-weight:700;font-size:0.9rem;}
        .cal-toggle{border:none;border-radius:20px;padding:4px 12px;font-family:'Nunito',sans-serif;font-weight:800;font-size:0.8rem;cursor:pointer;color:#fff;transition:background 0.2s;}
        .member-list{display:flex;flex-direction:column;gap:8px;}
        .member-row{border-radius:12px;padding:10px 12px;display:flex;align-items:center;gap:10px;}
        .member-colors{display:flex;gap:4px;flex-wrap:wrap;}
        .color-swatch{width:18px;height:18px;border-radius:50%;border:none;cursor:pointer;}
        .member-name{flex:1;font-weight:800;font-size:0.95rem;cursor:pointer;}
        .member-name-input{flex:1;font-family:'Nunito',sans-serif;font-weight:800;font-size:0.95rem;padding:2px 6px;border-radius:6px;outline:none;}
        .remove-btn{background:none;border:none;cursor:pointer;font-size:1rem;color:#ef4444;opacity:0.7;}
        @media(max-width:640px){.week-grid{grid-template-columns:repeat(7,minmax(80px,1fr));overflow-x:auto;}.month-cell{min-height:55px;}}
      `}</style>

      <div className="app">
        <header className="header">
          <span className="logo">🏡 Familjen</span>
          <div className="header-spacer"/>
          {page==="home" && (
            <div className="view-tabs">
              {[["day","Dag"],["week","Vecka"],["month","Månad"]].map(([v,l])=>(
                <button key={v} className={`view-tab ${view===v?"active":""}`} onClick={()=>setView(v)}>{l}</button>
              ))}
            </div>
          )}
          <button className="dark-toggle" onClick={()=>setDark(!dark)}>{dark?"☀️":"🌙"}</button>
          <button className="settings-toggle" onClick={()=>setPage(page==="home"?"settings":"home")}>
            {page==="settings"?"✕":"⚙️"}
          </button>
        </header>

        {page==="settings" ? (
          <SettingsPage members={members} setMembers={setMembers} dark={dark}
            loggedIn={loggedIn} onLogin={handleLogin} onLogout={handleLogout}
            calendars={calendars} enabledCalendars={enabledCalendars} setEnabledCalendars={setEnabledCalendars}/>
        ) : (
          <>
            {!loggedIn && (
              <div className="gcal-banner">
                <span style={{fontSize:"1.2rem"}}>📅</span>
                <span className="gcal-text">Koppla in Google Kalender för riktiga händelser</span>
                <button className="gcal-btn" onClick={handleLogin}>{loading?"Laddar...":"Anslut"}</button>
              </div>
            )}
            <div className="member-bar">
              {allMembers.map((m)=>(
                <button key={m.id} className={`member-btn ${filter===m.id?"active":""}`}
                  style={{"--mc":m.color,"--mb":dark?m.color+"44":m.light}}
                  onClick={()=>setFilter(m.id)}>
                  <span className="member-dot"/>
                  {m.name}
                </button>
              ))}
            </div>
            <div className="nav-row">
              <button className="nav-btn" onClick={()=>navigate(-1)}>‹</button>
              <button className="nav-btn" onClick={()=>setCurrentDate(new Date(today))}>Idag</button>
              <button className="nav-btn" onClick={()=>navigate(1)}>›</button>
              <span className="nav-label">
                {view==="day" && currentDate.toLocaleDateString("sv-SE",{weekday:"long",day:"numeric",month:"long"})}
                {view==="week" && (()=>{
                  const mon=new Date(currentDate);
                  mon.setDate(currentDate.getDate()-((currentDate.getDay()+6)%7));
                  const sun=new Date(mon); sun.setDate(mon.getDate()+6);
                  return `${mon.getDate()} ${MONTHS_SV[mon.getMonth()].slice(0,3)} – ${sun.getDate()} ${MONTHS_SV[sun.getMonth()].slice(0,3)} ${sun.getFullYear()}`;
                })()}
                {view==="month" && `${MONTHS_SV[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
              </span>
            </div>
            <main className="main">
              {loading ? <div className="loading">⏳ Hämtar kalenderhändelser...</div> : <>
                {view==="day" && <DayView events={events} date={currentDate} filter={filter} dark={dark} members={members} onEventClick={setSelectedEvent}/>}
                {view==="week" && <WeekView events={events} date={currentDate} filter={filter} dark={dark} members={members} onEventClick={setSelectedEvent}/>}
                {view==="month" && <MonthView events={events} date={currentDate} filter={filter} dark={dark} members={members} onEventClick={setSelectedEvent}/>}
              </>}
            </main>
          </>
        )}
      </div>

      <EventModal event={selectedEvent} members={members} dark={dark} onClose={()=>setSelectedEvent(null)}/>
    </>
  );
}