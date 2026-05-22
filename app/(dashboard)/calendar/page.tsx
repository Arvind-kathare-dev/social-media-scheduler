"use client";
import { useState } from "react";
import { useScheduler } from "../../context/SchedulerContext";

export default function CalendarPage() {
  const { store } = useScheduler();
  const [view, setView] = useState("Month");
  
  // Basic mock calendar generation for current month
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null); // padding
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getDayEvents = (day) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return store.briefs.filter(b => b.dueDate === dateStr);
  };

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const times = ["09:00", "12:00", "15:00", "18:00"];

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full">
      <div className="page-title mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold m-0">Calendar</h1>
          <p className="text-muted text-sm mt-1">Monthly planning and publishing controls.</p>
        </div>
        <div className="flex bg-panel-2 rounded-[7px] p-1 border border-line">
          <button 
            className={`px-4 py-1.5 rounded-[5px] text-sm font-medium ${view === 'Month' ? 'bg-panel shadow-sm text-text' : 'text-muted hover:text-text'}`}
            onClick={() => setView('Month')}
          >
            Month
          </button>
          <button 
            className={`px-4 py-1.5 rounded-[5px] text-sm font-medium ${view === 'Time' ? 'bg-panel shadow-sm text-text' : 'text-muted hover:text-text'}`}
            onClick={() => setView('Time')}
          >
            Time Slots
          </button>
        </div>
      </div>

      <div className="flex-1 bg-panel border border-line rounded-custom overflow-hidden flex flex-col">
        <div className="p-4 border-b border-line flex justify-between items-center bg-panel-2/50">
          <h2 className="text-lg font-bold m-0">{new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
          <div className="flex gap-2">
            <button className="btn ghost h-8 px-3 text-sm">&lt;</button>
            <button className="btn ghost h-8 px-3 text-sm">Today</button>
            <button className="btn ghost h-8 px-3 text-sm">&gt;</button>
          </div>
        </div>

        {view === 'Month' ? (
          <div className="grid grid-cols-7 flex-1">
            {weekdays.map(d => (
              <div key={d} className="p-2.5 font-bold text-muted text-xs uppercase tracking-wider bg-panel-2 border-b border-line text-center">
                {d}
              </div>
            ))}
            
            {days.map((day, i) => {
              const events = getDayEvents(day);
              return (
                <div key={i} className={`min-h-[120px] p-2 border-b border-r border-line bg-panel ${!day ? 'bg-panel-2/30' : ''}`}>
                  {day && (
                    <>
                      <div className={`text-xs font-bold mb-2 ${day === today.getDate() ? 'w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center' : 'text-muted'}`}>
                        {day}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {events.map(ev => (
                          <div key={ev.id} className="text-[11px] p-1.5 bg-primary/10 border-l-2 border-primary rounded-r text-text cursor-pointer hover:bg-primary/20 truncate">
                            {ev.title}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            {times.map(time => (
              <div key={time} className="grid grid-cols-[80px_minmax(0,1fr)] border-b border-line min-h-[80px]">
                <div className="p-3 text-xs text-muted font-bold bg-panel-2 border-r border-line">
                  {time}
                </div>
                <div className="p-3 flex gap-2">
                  {store.briefs.slice(0, Math.floor(Math.random() * 2)).map((ev, i) => (
                    <div key={i} className="w-[200px] text-xs p-2 bg-panel border border-line rounded-[7px] shadow-sm">
                      <strong className="block mb-1 truncate">{ev.title}</strong>
                      <span className="text-muted">{ev.platforms[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
