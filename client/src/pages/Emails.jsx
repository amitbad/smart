import { useEffect, useMemo, useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import axios from 'axios';
import Dialog, { ConfirmDialog } from '../components/Dialog';
import { useToast } from '../components/ToastContainer';

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const REPLY_STATUSES = ['Not Replied', 'In Progress', 'Replied'];

export default function Emails() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ date: '', priority: '', status: '', sender: '' });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [editing, setEditing] = useState(null);

  const nowLocal = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };

  const [form, setForm] = useState({
    subject: '',
    sender: '',
    received_at: nowLocal(),
    priority: 'Medium',
    reply_by: '',
    status: 'Not Replied'
  });

  useEffect(() => { fetchItems(); }, [filters]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/emails', { params: filters });
      setItems(res.data || []);
    } catch (e) { toast.error('Failed to load emails'); }
    finally { setLoading(false); }
  };

  const grouped = useMemo(() => {
    const byDate = items.reduce((acc, it) => {
      const d = it.received_at?.slice(0, 10);
      (acc[d] = acc[d] || []).push(it);
      return acc;
    }, {});
    return Object.entries(byDate).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [items]);

  const openAdd = () => { setEditing(null); setForm({ subject: '', sender: '', received_at: nowLocal(), priority: 'Medium', reply_by: '', status: 'Not Replied' }); setModalOpen(true); };
  const openEdit = (it) => { setEditing(it); setForm({ subject: it.subject, sender: it.sender, received_at: it.received_at?.slice(0, 16), priority: it.priority, reply_by: it.reply_by || '', status: it.status }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.subject || !form.sender) { toast.error('Subject and Sender are required'); return; }
    try {
      const payload = {
        ...form,
        received_at: form.received_at ? new Date(form.received_at).toISOString() : null,
        reply_by: form.reply_by || null
      };
      if (editing) {
        await axios.put(`/api/emails/${editing.id}`, payload);
        toast.success('Email updated');
      } else {
        await axios.post('/api/emails', payload);
        toast.success('Email added');
      }
      setModalOpen(false);
      fetchItems();
    } catch (e) { toast.error(e.response?.data?.error || 'Save failed'); }
  };

  const requestDelete = (it) => { setToDelete(it); setConfirmOpen(true); };
  const confirmDelete = async () => {
    if (!toDelete) return;
    try { await axios.delete(`/api/emails/${toDelete.id}`); toast.success('Deleted'); fetchItems(); } catch (e) { toast.error(e.response?.data?.error || 'Delete failed'); }
  };

  return (
    <div className="flex-1 overflow-auto">
      <header className="bg-black border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-cyan-400">Emails</h2>
          <p className="text-xs text-gray-500 mt-0.5">Track incoming emails and replies</p>
        </div>
        <button onClick={openAdd} className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 rounded text-xs transition flex items-center gap-1">
          <Plus size={14} /> Add Email
        </button>
      </header>

      <div className="p-4 border-b border-gray-800 bg-black">
        <div className="grid grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Date</label>
            <input type="date" value={filters.date} onChange={(e) => setFilters(f => ({ ...f, date: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Sender</label>
            <input type="text" value={filters.sender} onChange={(e) => setFilters(f => ({ ...f, sender: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm" placeholder="Search sender" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Priority</label>
            <select value={filters.priority} onChange={(e) => setFilters(f => ({ ...f, priority: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm">
              <option value="">All</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Reply Status</label>
            <select value={filters.status} onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm">
              <option value="">All</option>
              {REPLY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Reply By</label>
            <input type="date" value={filters.reply_by || ''} onChange={(e) => setFilters(f => ({ ...f, reply_by: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm" />
          </div>
        </div>
      </div>

      <div className="p-6 overflow-x-auto">
        {loading ? (
          <div className="text-gray-400">Loading...</div>
        ) : grouped.length === 0 ? (
          <div className="text-gray-500">No emails</div>
        ) : (
          grouped.map(([date, rows]) => (
            <div key={date} className="mb-6">
              <div className="text-sm text-gray-400 mb-2">{new Date(date).toDateString()}</div>
              <div className="bg-black border border-gray-800 rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900 text-xs text-gray-500">
                    <tr>
                      <th className="px-4 py-2 text-left">Subject</th>
                      <th className="px-4 py-2 text-left">Sender</th>
                      <th className="px-4 py-2 text-left">Received</th>
                      <th className="px-4 py-2 text-left">Priority</th>
                      <th className="px-4 py-2 text-left">Reply By</th>
                      <th className="px-4 py-2 text-left">Reply Status</th>
                      <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {rows.map(it => (
                      <tr key={it.id} className="hover:bg-gray-900">
                        <td className="px-4 py-2 max-w-[420px] truncate" title={it.subject}>{it.subject}</td>
                        <td className="px-4 py-2">{it.sender}</td>
                        <td className="px-4 py-2">{new Date(it.received_at).toLocaleString()}</td>
                        <td className="px-4 py-2">{it.priority}</td>
                        <td className="px-4 py-2">{it.reply_by || <span className="text-xs text-gray-500">—</span>}</td>
                        <td className="px-4 py-2">{it.status}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEdit(it)} className="text-gray-400 hover:text-white" title="Edit"><Edit2 size={16} /></button>
                            <button onClick={() => requestDelete(it)} className="text-gray-400 hover:text-red-400" title="Delete"><Trash2 size={16} /></button>
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

      <Dialog isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Email' : 'Add Email'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Subject</label>
              <input type="text" value={form.subject} onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm mb-1">Sender</label>
              <input type="text" value={form.sender} onChange={(e) => setForm(f => ({ ...f, sender: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm mb-1">Received At</label>
              <input type="datetime-local" value={form.received_at} onChange={(e) => setForm(f => ({ ...f, received_at: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm mb-1">Priority</label>
              <select value={form.priority} onChange={(e) => setForm(f => ({ ...f, priority: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm">
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Reply By</label>
              <input type="date" value={form.reply_by} onChange={(e) => setForm(f => ({ ...f, reply_by: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm mb-1">Reply Status</label>
              <select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm">
                {REPLY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
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
        message={toDelete ? `Delete email: "${toDelete.subject}" from ${toDelete.sender}?` : ''}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
}
