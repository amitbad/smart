import { useEffect, useMemo, useState, useRef } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, Filter, Bell, Copy, ExternalLink, Eye } from 'lucide-react';
import axios from 'axios';
import Dialog, { ConfirmDialog } from '../components/Dialog';
import { useToast } from '../components/ToastContainer';

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['Not Started', 'In Progress', 'Completed', 'Deferred', 'Put On Hold'];

function Pill({ text, kind }) {
  const color = kind === 'priority'
    ? (text === 'Critical' ? 'bg-red-600/20 text-red-400' : text === 'High' ? 'bg-orange-600/20 text-orange-400' : text === 'Medium' ? 'bg-cyan-600/20 text-cyan-400' : 'bg-gray-700 text-gray-300')
    : (text === 'Completed' ? 'bg-green-600/20 text-green-400' : text === 'In Progress' ? 'bg-cyan-600/20 text-cyan-400' : text === 'Deferred' ? 'bg-orange-600/20 text-orange-400' : text === 'Put On Hold' ? 'bg-purple-600/20 text-purple-400' : 'bg-gray-700 text-gray-300');
  return <span className={`px-2 py-0.5 rounded text-xs ${color}`}>{text}</span>;
}

export default function ActionItems() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ date: '', priority: '', status: '', dependency: '' });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [lockModal, setLockModal] = useState(true);
  const [members, setMembers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState(null);

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    action_date: today,
    description: '',
    priority: 'Medium',
    status: 'Not Started',
    dependency_member_ids: [],
    reference_link: ''
  });

  useEffect(() => { fetchMembers(); }, []);
  useEffect(() => { fetchItems(); }, [filters]);
  useEffect(() => {
    const onClick = (e) => {
      if (notifOpen && notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, [notifOpen]);

  const fetchMembers = async () => {
    try { const res = await axios.get('/api/members?limit=1000'); setMembers(res.data.data || []); } catch { }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/action-items', { params: filters });
      setItems(res.data || []);
    } catch (e) { toast.error('Failed to load action items'); }
    finally { setLoading(false); }
  };

  const grouped = useMemo(() => {
    const byDate = items.reduce((acc, it) => {
      (acc[it.action_date] = acc[it.action_date] || []).push(it);
      return acc;
    }, {});
    // sort dates desc
    return Object.entries(byDate).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [items]);

  const todaysItems = useMemo(() => items.filter(it => it.action_date === today), [items, today]);

  const openAdd = () => { setEditing(null); setForm({ action_date: today, description: '', priority: 'Medium', status: 'Not Started', dependency_member_ids: [], reference_link: '' }); setModalOpen(true); setLockModal(true); };
  const openEdit = (it) => {
    setEditing(it);
    setForm({
      action_date: it.action_date ? new Date(it.action_date).toISOString().slice(0, 10) : today,
      description: it.description,
      priority: it.priority,
      status: it.status,
      dependency_member_ids: it.dependency_member_ids || [],
      reference_link: it.reference_link || ''
    });
    setModalOpen(true);
    setLockModal(true);
  };

  const openViewDetails = (it) => {
    setViewingItem(it);
    setViewDetailsOpen(true);
  };

  const handleSave = async () => {
    if (!form.action_date || !form.description) { toast.error('Date and Action Item are required'); return; }
    try {
      const payload = {
        action_date: form.action_date,
        description: form.description,
        priority: form.priority,
        status: form.status,
        // server expects single dependency_member_id; send first selected or null
        dependency_member_id: form.dependency_member_ids?.[0] || null,
        reference_link: form.reference_link || null
      };
      if (editing) {
        await axios.put(`/api/action-items/${editing.id}`, payload);
        toast.success('Action item updated');
      } else {
        await axios.post('/api/action-items', payload);
        toast.success('Action item added');
      }
      setModalOpen(false);
      fetchItems();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Save failed');
    }
  };

  const requestDelete = (it) => {
    if (it.status === 'Completed') {
      toast.error('Cannot delete a Completed action');
      return;
    }
    setToDelete(it);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await axios.delete(`/api/action-items/${toDelete.id}`);
      toast.success('Deleted');
      fetchItems();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Delete failed');
    }
  };

  const updateQuick = async (it, field, value) => {
    try { await axios.put(`/api/action-items/${it.id}`, { [field]: value }); fetchItems(); } catch { toast.error('Update failed'); }
  };

  const handleDuplicate = async (it) => {
    try {
      const payload = {
        action_date: it.action_date,
        description: it.description,
        priority: it.priority,
        status: it.status,
        dependency_member_ids: it.dependency_member_ids || [],
        reference_link: it.reference_link || null
      };
      await axios.post('/api/action-items', payload);
      toast.success('Action item duplicated');
      fetchItems();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Duplicate failed');
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <header className="bg-black border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-cyan-400">Action Items</h2>
          <p className="text-xs text-gray-500 mt-0.5">Track and manage your daily action items</p>
        </div>
        <div className="flex items-center gap-3" ref={notifRef}>
          <div className="relative">
            <button onClick={(e) => { e.stopPropagation(); setNotifOpen(v => !v); }} className="p-2 rounded hover:bg-gray-900 text-gray-300 relative" title="Today's Action Items">
              <Bell size={18} />
              {todaysItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full">{todaysItems.length}</span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-96 bg-black border border-gray-800 rounded shadow-lg z-20">
                <div className="px-3 py-2 border-b border-gray-800 text-sm text-gray-400">Today's Action Items</div>
                <div className="max-h-72 overflow-auto">
                  {todaysItems.length === 0 ? (
                    <div className="px-4 py-6 text-center text-gray-500 text-sm">No action items for today</div>
                  ) : (
                    todaysItems.map(it => (
                      <div key={it.id} className="px-3 py-2 flex items-start gap-2 hover:bg-gray-900 cursor-pointer" title={it.description} onClick={() => { setNotifOpen(false); openEdit(it); }}>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-200 truncate">{it.description}</div>
                          <div className="mt-1"><Pill text={it.priority} kind="priority" /></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <button onClick={openAdd} className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 rounded text-xs transition flex items-center gap-1">
            <Plus size={14} /> Add Action Item
          </button>
        </div>
      </header>

      <div className="p-4 border-b border-gray-800 bg-black">
        <div className="grid grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Date</label>
            <input type="date" value={filters.date} onChange={(e) => setFilters(f => ({ ...f, date: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Priority</label>
            <select value={filters.priority} onChange={(e) => setFilters(f => ({ ...f, priority: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm">
              <option value="">All</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Status</label>
            <select value={filters.status} onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm">
              <option value="">All</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Dependency</label>
            <select value={filters.dependency} onChange={(e) => setFilters(f => ({ ...f, dependency: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm">
              <option value="">All</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}{m.designation ? ` (${m.designation})` : ''}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="p-6 overflow-x-auto">
        {loading ? (
          <div className="text-gray-400">Loading...</div>
        ) : grouped.length === 0 ? (
          <div className="text-gray-500">No action items</div>
        ) : (
          grouped.map(([date, rows]) => (
            <div key={date} className="mb-6">
              <div className="text-sm text-gray-400 mb-2">{new Date(date).toDateString()}</div>
              <div className="bg-black border border-gray-800 rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900 text-xs text-gray-500">
                    <tr>
                      <th className="px-4 py-2 text-left">Action Item</th>
                      <th className="px-4 py-2 text-left">Priority</th>
                      <th className="px-4 py-2 text-left">Dependency On</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {rows.map(it => (
                      <tr key={it.id} className="hover:bg-gray-900">
                        <td className="px-4 py-2 max-w-[420px]">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openViewDetails(it)}
                              className="text-left truncate hover:text-cyan-400 transition-colors flex-1"
                              title="Click to view details"
                            >
                              {it.description}
                            </button>
                            {it.reference_link && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(it.reference_link, '_blank', 'noopener,noreferrer');
                                }}
                                className="text-cyan-400 hover:text-cyan-300 flex-shrink-0"
                                title="Open reference link"
                              >
                                <ExternalLink size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2"><Pill text={it.priority} kind="priority" /></td>
                        <td className="px-4 py-2 text-gray-300">
                          {it.dependency_member_ids?.length ? (() => {
                            const id = it.dependency_member_ids[0];
                            const m = members.find(mm => mm.id === id);
                            return <span>{m ? `${m.name}${m.designation ? ` (${m.designation})` : ''}` : `#${id}`}</span>;
                          })() : (
                            <span className="text-gray-500 text-xs">None</span>
                          )}
                        </td>
                        <td className="px-4 py-2"><Pill text={it.status} /></td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEdit(it)} className="text-gray-400 hover:text-white" title="Edit"><Edit2 size={16} /></button>
                            <div className="relative inline-block">
                              <button className="text-gray-400 hover:text-white flex items-center gap-1" title="Update Priority">
                                <Filter size={16} /><ChevronDown size={14} />
                              </button>
                              <div className="absolute hidden group-hover:block"></div>
                              <div className="absolute mt-1 bg-black border border-gray-800 rounded shadow-lg z-10 hidden"></div>
                            </div>
                            <select className="bg-gray-900 border border-gray-800 rounded px-2 py-1 text-xs"
                              value={it.priority} onChange={(e) => updateQuick(it, 'priority', e.target.value)}>
                              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <select className="bg-gray-900 border border-gray-800 rounded px-2 py-1 text-xs"
                              value={it.status} onChange={(e) => updateQuick(it, 'status', e.target.value)}>
                              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <button onClick={() => handleDuplicate(it)} className="text-gray-400 hover:text-white" title="Duplicate"><Copy size={16} /></button>
                            <button onClick={() => requestDelete(it)} className={`text-gray-400 hover:text-red-400 ${it.status === 'Completed' ? 'opacity-40 cursor-not-allowed' : ''}`} disabled={it.status === 'Completed'} title="Delete"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog isOpen={modalOpen} onClose={() => { if (!lockModal) setModalOpen(false); }} title={editing ? 'Edit Action Item' : 'Add Action Item'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Date</label>
              <input type="date" value={form.action_date} onChange={(e) => setForm(f => ({ ...f, action_date: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm mb-1">Priority</label>
              <select value={form.priority} onChange={(e) => setForm(f => ({ ...f, priority: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm">
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Dependency On (optional)</label>
              <select
                value={form.dependency_member_ids[0] || ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm(f => ({ ...f, dependency_member_ids: v ? [v] : [] }));
                }}
                className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm"
              >
                <option value="">None</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}{m.designation ? ` (${m.designation})` : ''}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Action Item</label>
            <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={4} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm" placeholder="Describe the action" />
          </div>
          <div>
            <label className="block text-sm mb-1">Reference Link (optional)</label>
            <input
              type="url"
              value={form.reference_link}
              onChange={(e) => setForm(f => ({ ...f, reference_link: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm"
              placeholder="https://example.com/reference"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm">Close</button>
            <button onClick={handleSave} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm">{editing ? 'Update' : 'Add'}</button>
          </div>
        </div>
      </Dialog>
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        message={toDelete ? `This action is currently "${toDelete.status}". Do you want to delete this item dated ${toDelete.action_date}?` : ''}
        confirmText="Delete"
        type="danger"
      />

      {/* View Details Modal (Read-Only) */}
      <Dialog
        isOpen={viewDetailsOpen}
        onClose={() => setViewDetailsOpen(false)}
        title="Action Item Details"
        size="lg"
      >
        {viewingItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                <div className="bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm">
                  {new Date(viewingItem.action_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Priority</label>
                <div className="bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm">
                  <Pill text={viewingItem.priority} kind="priority" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                <div className="bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm">
                  <Pill text={viewingItem.status} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Dependency On</label>
                <div className="bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm text-gray-300">
                  {viewingItem.dependency_member_ids?.length ? (() => {
                    const id = viewingItem.dependency_member_ids[0];
                    const m = members.find(mm => mm.id === id);
                    return m ? `${m.name}${m.designation ? ` (${m.designation})` : ''}` : `#${id}`;
                  })() : (
                    <span className="text-gray-500">None</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Action Item</label>
              <div className="bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm whitespace-pre-wrap">
                {viewingItem.description}
              </div>
            </div>

            {viewingItem.reference_link && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Reference Link</label>
                <div className="bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm">
                  <a
                    href={viewingItem.reference_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
                  >
                    <ExternalLink size={16} />
                    <span className="truncate">{viewingItem.reference_link}</span>
                  </a>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-gray-800">
              <div className="text-xs text-gray-500">
                Created: {new Date(viewingItem.created_at || viewingItem.action_date).toLocaleString()}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setViewDetailsOpen(false);
                    openEdit(viewingItem);
                  }}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm flex items-center gap-2"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
                <button
                  onClick={() => setViewDetailsOpen(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
