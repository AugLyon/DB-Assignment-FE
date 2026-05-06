import React, { useState, useEffect } from "react";

const BOARD_ID = 1;
const USER_ID = 6;
const BASE_URL = "http://localhost:3000/api";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getProgressColor(pct) {
  if (pct >= 75) return "bg-emerald-500";
  if (pct >= 40) return "bg-blue-500";
  return "bg-amber-400";
}
function Toast({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <div className="flex items-start gap-3 bg-red-600 text-white rounded-xl shadow-2xl px-5 py-4 border border-red-400/40 backdrop-blur-sm">
        <div className="mt-0.5 flex-shrink-0">
          <svg className="w-5 h-5 text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-red-100 leading-snug">Backend Error</p>
          <p className="text-sm text-white/90 mt-0.5 break-words">{message}</p>
        </div>
        <button onClick={onDismiss} className="flex-shrink-0 ml-2 text-red-200 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
}

function ProgressBar({ cardId, onError, refreshTrigger }) {
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchProgress() {
      try {
        const res = await fetch(`${BASE_URL}/cards/${cardId}/progress`);
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setProgress(parseFloat(data.progress) || 0);
      } catch (err) {
        if (!cancelled) onError(err.message);
      }
    }
    fetchProgress();
    return () => { cancelled = true; };
  }, [cardId, onError, refreshTrigger]);

  if (progress === null) return <div className="h-2 rounded-full bg-slate-200 animate-pulse w-full" />;

  const pct = Math.min(100, Math.max(0, progress));
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-slate-500">Progress</span>
        <span className="text-xs font-bold text-slate-600">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-2 rounded-full transition-all duration-700 ${getProgressColor(pct)}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function CardItem({ card, assignments, onEdit, onError, onRefresh, refreshTrigger }) {
  const [deleting, setDeleting] = useState(false);
  const [assignUserId, setAssignUserId] = useState("");
  const [assigning, setAssigning] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`${BASE_URL}/cards/${card.Card_ID}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      onRefresh();
    } catch (err) {
      onError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  async function handleAssign() {
    if (!assignUserId) return;
    setAssigning(true);
    try {
      const res = await fetch(`${BASE_URL}/cards/${card.Card_ID}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: parseInt(assignUserId, 10) }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      setAssignUserId("");
      onRefresh(); 
    } catch (err) {
      onError(err.message);
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 p-4 group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="mt-0.5 w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 ring-2 ring-blue-100" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-800 truncate leading-snug">
              {card.Card_Title || `Card #${card.Card_ID}`}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">ID: {card.Card_ID}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(card)} className="text-xs px-3 py-1.5 rounded-lg font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors">
            Edit
          </button>
          <button onClick={handleDelete} disabled={deleting} className="text-xs px-3 py-1.5 rounded-lg font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-40">
            {deleting ? "..." : "Delete"}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
          <span className="text-xs text-slate-500">Due <span className="font-medium text-slate-700">{formatDate(card.Due_Date)}</span></span>
        </div>
        {card.Duration !== null && card.Duration !== undefined && (
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-xs text-slate-500"><span className="font-medium text-slate-700">{card.Duration}d</span> duration</span>
          </div>
        )}
        {card.List_Name && (
          <span className="text-xs px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 border border-violet-200 font-medium">
            List: {card.List_Name}
          </span>
        )}
      </div>
      
      {assignments && assignments.length > 0 && (
        <div className="flex -space-x-2 overflow-hidden mb-3">
          {assignments.map(user => (
            <img key={user.User_ID} className="inline-block h-7 w-7 rounded-full ring-2 ring-white shadow-sm" src={`https://ui-avatars.com/api/?name=${user.First_Name}&background=random`} alt={user.First_Name} title={`${user.First_Name} ${user.Last_Name} (ID: ${user.User_ID})`} />
          ))}
        </div>
      )}
      <ProgressBar cardId={card.Card_ID} onError={onError} refreshTrigger={refreshTrigger} />

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs font-medium text-slate-500">Assign:</span>
        <input type="number" placeholder="User ID" value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)} className="w-20 text-xs px-2 py-1 rounded border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-400" />
        <button onClick={handleAssign} disabled={assigning || !assignUserId} className="text-xs px-3 py-1 bg-slate-800 text-white rounded hover:bg-slate-700 transition-colors disabled:opacity-50">{assigning ? "..." : "Add"}</button>
      </div>
    </div>
  );
}

function AddCardForm({onRefresh, onError }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", desc: "", startDate: "", dueDate: "", listId: "" });
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit() {
    if (!form.title.trim() || !form.listId) { onError("Title and List ID are required."); return; }
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),      
          description: form.desc || "",
          startDate: form.startDate || null,
          dueDate: form.dueDate || null,
          listId: parseInt(form.listId, 10),
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      onRefresh();
      setForm({title: "", desc: "", startDate: "", dueDate: "", listId: ""});
      setOpen(false);
    } catch (err) {
      onError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 text-slate-500 hover:text-blue-600 transition-all duration-200 text-sm font-medium group">
      <svg className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg> Add New Card
    </button>
  );

  return (
    <div className="bg-white rounded-xl border border-blue-200 shadow-md p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">New Card</h3>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
      </div>
      <div className="space-y-2.5">
        <input type="text" placeholder="Card title *" value={form.title} onChange={set("title")} className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder:text-slate-400" />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Start Date</label>
            <input type="date" value={form.startDate} onChange={set("startDate")} className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Due Date</label>
            <input type="date" value={form.dueDate} onChange={set("dueDate")} className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
          </div>
        </div>
        <textarea placeholder="Description" value={form.desc} onChange={set("desc")} className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <input type="number" placeholder="List ID *" value={form.listId} onChange={set("listId")} className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder:text-slate-400" />
        <button onClick={handleSubmit} disabled={saving} className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm">
          {saving ? "Creating..." : "Create Card"}
        </button>
      </div>
    </div>
  );
}

function EditModal({ card, onClose, onRefresh, onError }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: card.Card_Title || "",
    dueDate: card.Due_Date ? card.Due_Date.split("T")[0] : "",
    isComplete: card.Is_Due_Complete === 1 || card.Is_Due_Complete === true
  });
  const [checklist, setChecklist] = useState([]);
  const [newItemText, setNewItemText] = useState("");
  
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  
  useEffect(() => {
    async function fetchChecklist() {
      try {
        const res = await fetch(`${BASE_URL}/cards/${card.Card_ID}/checklists`);
        if (res.ok) setChecklist(await res.json());
      } catch (err) {
        console.error("Checklist fetch error", err);
      }
    }
    fetchChecklist();
  }, [card.Card_ID]);

  async function toggleChecklistItem(itemId, currentStatus, Checklist_Id) {
    try {
      const newStatus = !currentStatus;
      
      const nextChecklist = checklist.map(item => 
        item.Item_ID === itemId ? { ...item, Is_Completed: newStatus } : item
      );
      setChecklist(nextChecklist);
      
      const allDone = nextChecklist.length > 0 && nextChecklist.every(item => item.Is_Completed === 1 || item.Is_Completed === true);
      setForm(f => ({ ...f, isComplete: allDone }));
      
      const res = await fetch(`${BASE_URL}/checklists/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({checklistId: Checklist_Id ,cardId: card.Card_ID, isComplete: newStatus }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP Error ${res.status}: Failed to toggle item`);
      }
      onRefresh(); 
    } catch (err) {
      onError(err.message);
    }
  }

  async function addChecklistItem() {
    if (!newItemText.trim()) return;
    try {
      const targetChecklistId = checklist.length > 0 ? checklist[0].Checklist_ID : 1;
      const res = await fetch(`${BASE_URL}/cards/${card.Card_ID}/checklists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: newItemText,
          checklistId: targetChecklistId
         }),
      });
      if (!res.ok) throw new Error("Failed to add item");
      setNewItemText("");
      const updatedRes = await fetch(`${BASE_URL}/cards/${card.Card_ID}/checklists`);
      setChecklist(await updatedRes.json());
      onRefresh();
    } catch (err) {
      onError(err.message);
    }
  }

  async function handleSave() {
    if (!form.title.trim()) { onError("Title cannot be empty."); return; }
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/cards/${card.Card_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title.trim(), dueDate: form.dueDate || null, isComplete: form.isComplete }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      onRefresh();
      onClose();
    } catch (err) {
      onError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div><h2 className="text-base font-semibold text-slate-800">Edit Card</h2><p className="text-xs text-slate-400 mt-0.5">Card ID: {card.Card_ID}</p></div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="px-6 py-5 space-y-6 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">Title</label>
              <input type="text" value={form.title} onChange={set("title")} className="w-full text-sm px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mt-6 cursor-pointer">
                  <input type="checkbox" checked={form.isComplete} onChange={(e) => setForm(f => ({ ...f, isComplete: e.target.checked }))} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                  Mark as Complete
                </label>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">Due Date</label>
                <input type="date" value={form.dueDate} onChange={set("dueDate")} className="w-full text-sm px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg> Checklist
            </h3>
            <div className="space-y-2 mb-3">
              {checklist.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No checklist items yet.</p>
              ) : (
                checklist.map(item => (
                  <div key={item.Item_ID} className="flex items-center gap-3 group">
                    <input 
                      type="checkbox" 
                      checked={item.Is_Completed === 1 || item.Is_Completed === true} 
                      onChange={() => toggleChecklistItem(item.Item_ID, item.Is_Completed, item.Checklist_ID)} 
                      className="w-4 h-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer" 
                    />
                    <span className={`text-sm ${item.Is_Completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.Content}</span>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="Add an item..." value={newItemText} onChange={(e) => setNewItemText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()} className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <button onClick={addChecklistItem} disabled={!newItemText.trim()} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-50 text-sm font-medium transition-colors">Add</button>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-2.5 flex-shrink-0 rounded-b-2xl">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-white transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm">{saving ? "Saving..." : "Save Changes"}</button>
        </div>
      </div>
    </div>
  );
}

function ListStatsSidebar({ boardId, onError }) {
  const [stats, setStats] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minCards, setMinCards] = useState("");
  const [inputVal, setInputVal] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const statsUrl = minCards !== "" && minCards !== null ? `${BASE_URL}/boards/${boardId}/statistics?minCards=${minCards}` : `${BASE_URL}/boards/${boardId}/statistics`;
        const [statsRes, memRes] = await Promise.all([fetch(statsUrl), fetch(`${BASE_URL}/boards/${boardId}/members`)]);
        if (!statsRes.ok) throw new Error((await statsRes.json().catch(() => ({}))).error || "Stats Error");
        if (!memRes.ok) throw new Error((await memRes.json().catch(() => ({}))).error || "Members Error");
        
        const statsData = await statsRes.json();
        const memData = await memRes.json();
        if (isMounted) {
          setStats(Array.isArray(statsData) ? statsData : []);
          setMembers(Array.isArray(memData) ? memData : []);
        }
      } catch (err) {
        if (isMounted) onError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [boardId, minCards, onError]);

  const maxCards = stats.length > 0 ? Math.max(...stats.map((s) => s.Total_Cards)) : 1;

  return (
    <aside className="w-72 flex-shrink-0 space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
          </div>
          <div><p className="text-xs text-slate-400">Current Context</p><p className="text-sm font-semibold text-slate-700">Sprint 42</p></div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Board Team</h2>
        <div className="flex flex-wrap gap-2">
          {members.map(m => (
            <div key={m.User_ID} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full pr-3 pl-1 py-1 cursor-help" title={`Role: ${m.Role || 'Member'}`}>
               <img src={`https://ui-avatars.com/api/?name=${m.First_Name}&background=random`} alt={m.First_Name} className="w-6 h-6 rounded-full shadow-sm" />
               <span className="text-xs font-medium text-slate-600">
                 {m.First_Name} <span className="text-slate-400 font-normal">(ID: {m.User_ID})</span>
               </span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          </div>
          <div><h2 className="text-sm font-semibold text-slate-700">List Statistics</h2><p className="text-xs text-slate-400">SQL HAVING clause filter</p></div>
        </div>
        <div className="flex gap-2 mb-4">
          <input type="number" min="0" placeholder="Min cards" value={inputVal} onChange={(e) => setInputVal(e.target.value)} className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <button onClick={() => setMinCards(inputVal)} className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">Filter</button>
        </div>
        {loading ? (
          <div className="space-y-3">{[1, 2].map((i) => (<div key={i} className="animate-pulse"><div className="h-3.5 bg-slate-100 rounded-full w-3/4 mb-1.5" /><div className="h-2 bg-slate-100 rounded-full w-full" /></div>))}</div>
        ) : (
          <div className="space-y-3">
            {stats.map((list) => (
              <div key={list.List_ID}>
                <div className="flex items-center justify-between mb-1.5"><span className="text-xs font-medium text-slate-700 truncate">{list.List_Name}</span><span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{list.Total_Cards}</span></div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-1.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" style={{ width: `${(list.Total_Cards / maxCards) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        )}
        {minCards !== "" && <button onClick={() => { setMinCards(""); setInputVal(""); }} className="mt-3 w-full text-xs text-slate-500 hover:text-slate-700 py-1">✕ Clear filter</button>}
      </div>
    </aside>
  );
}

function Header({ onError, refreshTrigger }) {
  const [efficiency, setEfficiency] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEfficiency() {
      try {
        const res = await fetch(`${BASE_URL}/users/${USER_ID}/boards/${BOARD_ID}/efficiency`);
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
        const data = await res.json();
        setEfficiency(data.efficiencyScore ?? data.efficiency_score ?? null);
      } catch (err) {
        onError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchEfficiency();
  }, [onError, refreshTrigger]);

  const score = efficiency !== null ? Math.round(efficiency) : null;
  const scoreColor = score === null ? "text-slate-400" : score >= 75 ? "text-emerald-600" : score >= 40 ? "text-blue-600" : "text-amber-500";
  const ring = score === null ? "stroke-slate-200" : score >= 75 ? "stroke-emerald-500" : score >= 40 ? "stroke-blue-500" : "stroke-amber-400";
  const dash = score !== null ? ((score / 100) * (2 * Math.PI * 28)).toFixed(1) : "0";

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm px-6 py-4">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-md"><svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg></div>
          <div><h1 className="text-base font-bold text-slate-800 leading-none">TaskFlow</h1><p className="text-xs text-slate-400 mt-0.5">Enterprise Dashboard</p></div>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5">
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="28" fill="none" stroke="#e2e8f0" strokeWidth="6" />
              <circle cx="36" cy="36" r="28" fill="none" className={`${ring} transition-all duration-700`} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${dash} ${2 * Math.PI * 28}`} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">{loading ? <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> : <span className={`text-sm font-bold ${scoreColor}`}>{score ?? "—"}</span>}</div>
          </div>
          <div>
            <p className="text-xs text-slate-500 leading-none mb-0.5">Efficiency Score</p>
            {score !== null && !loading && <div className={`mt-1 text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${score >= 75 ? "bg-emerald-100 text-emerald-700" : score >= 40 ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>{score >= 75 ? "Excellent" : score >= 40 ? "Good" : "Needs Work"}</div>}
          </div>
        </div>
      </div>
    </header>
  );
}

function CardsSection({ boardId, onError, onGlobalRefresh, refreshTrigger }) {
  const [cards, setCards] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editCard, setEditCard] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const isMounted = true;
    async function loadBoardData() {
      setLoading(true);
      try {
        const [cardsRes, assignsRes] = await Promise.all([
          fetch(`${BASE_URL}/boards/${boardId}/cards`),
          fetch(`${BASE_URL}/boards/${boardId}/assignments`)
        ]);
        if (!cardsRes.ok) throw new Error((await cardsRes.json().catch(() => ({}))).error || "Cards Error");
        if (!assignsRes.ok) throw new Error((await assignsRes.json().catch(() => ({}))).error || "Assignments Error");
        
        const cardsData = await cardsRes.json();
        const assignsData = await assignsRes.json();
        
        if (isMounted) {
          setCards(Array.isArray(cardsData) ? cardsData : []);
          setAssignments(Array.isArray(assignsData) ? assignsData : []);
        }
      } catch (err) {
        if (isMounted) onError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadBoardData();
  }, [boardId, refreshTrigger, onError]);

  const filtered = search.trim() ? cards.filter((c) => (c.Card_Title || "").toLowerCase().includes(search.toLowerCase())) : cards;

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm"><svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg></div>
          <div><h2 className="text-sm font-semibold text-slate-800">Board Cards</h2><p className="text-xs text-slate-400">{filtered.length} card(s)</p></div>
        </div>
        <div className="flex items-center gap-2">
          <input type="text" placeholder="Search cards..." value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 w-44" />
          <button onClick={onGlobalRefresh} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100" title="Refresh"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
        </div>
      </div>

      <AddCardForm onRefresh={onGlobalRefresh} onError={onError} />

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => (<div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse"><div className="h-3.5 bg-slate-100 rounded-full w-2/3 mb-3" /><div className="h-2 bg-slate-100 rounded-full w-full" /></div>))}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((card) => (
            <CardItem
              key={card.Card_ID}
              card={card}
              assignments={assignments.filter(a => a.Card_ID === card.Card_ID)}
              onEdit={setEditCard}
              onError={onError}
              onRefresh={onGlobalRefresh}
              refreshTrigger={refreshTrigger} 
            />
          ))}
        </div>
      )}
      {editCard && <EditModal card={editCard} onClose={() => setEditCard(null)} onRefresh={onGlobalRefresh} onError={onError} />}
    </div>
  );
}

export default function App() {
  const [error, setError] = useState(null);

  const [globalRefreshToggle, setGlobalRefreshToggle] = useState(false);
  const triggerGlobalRefresh = () => setGlobalRefreshToggle(prev => !prev);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Toast message={error} onDismiss={() => setError(null)} />
      <Header onError={setError} refreshTrigger={globalRefreshToggle} />
      
      <main className="max-w-screen-xl mx-auto px-4 py-6 flex gap-6 items-start">
        <ListStatsSidebar boardId={BOARD_ID} onError={setError} />
        <CardsSection 
          boardId={BOARD_ID} 
          onError={setError} 
          onGlobalRefresh={triggerGlobalRefresh} 
          refreshTrigger={globalRefreshToggle} 
        />
      </main>
      
      <footer className="border-t border-slate-200 bg-white mt-8 py-4 px-6">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <p className="text-xs text-slate-400">TaskFlow Dashboard · Board <span className="font-medium text-slate-500">#{BOARD_ID}</span> · User <span className="font-medium text-slate-500">#{USER_ID}</span></p>
          <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /><span className="text-xs text-slate-400">Connected to MySQL Backend</span></div>
        </div>
      </footer>
    </div>
  );
}