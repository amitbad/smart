import { useEffect, useMemo, useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import axios from 'axios';
import Dialog, { ConfirmDialog } from '../components/Dialog';
import { useToast } from '../components/ToastContainer';

const STATUSES = ['Active', 'Deferred', 'Completed'];
const SOURCES = ['Internal', 'External'];

function toDateInput(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export default function ImportantEvents() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', source: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const [form, setForm] = useState({
    event_name: '',
    subject_line: '',
    event_link: '',
    source: 'Internal',
    start_date: '',
    end_date: '',
    event_time: '',
    status: 'Active'
  });

  useEffect(() => {
    fetchItems();
  }, [filters]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/important-events', { params: filters });
      setItems(res.data || []);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to load important events');
    } finally {
      setLoading(false);
    }
  };

  const grouped = useMemo(() => {
    const byDate = items.reduce((acc, it) => {
      const key = toDateInput(it.start_date);
      (acc[key] = acc[key] || []).push(it);
      return acc;
    }, {});
    return Object.entries(byDate).sort((a, b) => new Date(a[0]) - new Date(b[0]));
  }, [items]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      event_name: '',
      subject_line: '',
      event_link: '',
      source: 'Internal',
      start_date: '',
      end_date: '',
      event_time: '',
      status: 'Active'
    });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      event_name: item.event_name || '',
      subject_line: item.subject_line || '',
      event_link: item.event_link || '',
      source: item.source || 'Internal',
      start_date: toDateInput(item.start_date),
      end_date: toDateInput(item.end_date),
      event_time: item.event_time || '',
      status: item.status || 'Active'
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.event_name.trim() || !form.start_date) {
      toast.error('Event name and start date are required');
      return;
    }

    if (form.end_date && form.end_date < form.start_date) {
      toast.error('End date cannot be before start date');
      return;
    }

    const payload = {
      event_name: form.event_name.trim(),
      subject_line: form.subject_line.trim(),
      event_link: form.event_link.trim(),
      source: form.source,
      start_date: form.start_date,
      end_date: form.end_date || null,
      event_time: form.event_time,
      status: form.status
    };

    try {
      if (editing) {
        await axios.put(`/api/important-events/${editing.id}`, payload);
        toast.success('Event updated');
      } else {
        await axios.post('/api/important-events', payload);
        toast.success('Event added');
      }
      setModalOpen(false);
      fetchItems();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Save failed');
    }
  };

  const requestDelete = (item) => {
    setToDelete(item);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await axios.delete(`/api/important-events/${toDelete.id}`);
      toast.success('Event deleted');
      fetchItems();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <header className="bg-black border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-cyan-400">Important Events</h2>
          <p className="text-xs text-gray-500 mt-0.5">Track webinars and multi-day learning events with reminder statuses</p>
        </div>
        <button onClick={openAdd} className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 rounded text-xs transition flex items-center gap-1">
          <Plus size={14} /> Add Event
        </button>
      </header>

      <div className="p-4 border-b border-gray-800 bg-black">
        <div className="grid grid-cols-2 gap-3 items-end max-w-2xl">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Status</label>
            <select value={filters.status} onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm">
              <option value="">All</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Source</label>
            <select value={filters.source} onChange={(e) => setFilters(f => ({ ...f, source: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm">
              <option value="">All</option>
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="p-6 overflow-x-auto">
        {loading ? (
          <div className="text-gray-400">Loading...</div>
        ) : grouped.length === 0 ? (
          <div className="text-gray-500">No important events found</div>
        ) : (
          grouped.map(([date, rows]) => (
            <div key={date} className="mb-6">
              <div className="text-sm text-gray-400 mb-2">{new Date(date).toDateString()}</div>
              <div className="bg-black border border-gray-800 rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900 text-xs text-gray-500">
                    <tr>
                      <th className="px-4 py-2 text-left">Event</th>
                      <th className="px-4 py-2 text-left">Subject Line</th>
                      <th className="px-4 py-2 text-left">Event Link</th>
                      <th className="px-4 py-2 text-left">Source</th>
                      <th className="px-4 py-2 text-left">Duration</th>
                      <th className="px-4 py-2 text-left">Time</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {rows.map(it => (
                      <tr key={it.id} className="hover:bg-gray-900">
                        <td className="px-4 py-2 max-w-[320px]">
                          <div className="truncate" title={it.event_name}>{it.event_name}</div>
                        </td>
                        <td className="px-4 py-2 max-w-[260px]">
                          <div className="truncate text-gray-300" title={it.subject_line || ''}>{it.subject_line || <span className="text-xs text-gray-500">—</span>}</div>
                        </td>
                        <td className="px-4 py-2 max-w-[280px]">
                          {it.event_link ? (
                            <a href={it.event_link} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300 truncate block" title={it.event_link}>
                              {it.event_link}
                            </a>
                          ) : (
                            <span className="text-xs text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2">{it.source}</td>
                        <td className="px-4 py-2">
                          {toDateInput(it.start_date)}
                          {it.end_date ? ` to ${toDateInput(it.end_date)}` : ''}
                        </td>
                        <td className="px-4 py-2">{it.event_time || <span className="text-xs text-gray-500">—</span>}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${it.status === 'Active' ? 'bg-cyan-600/20 text-cyan-400' : it.status === 'Deferred' ? 'bg-orange-600/20 text-orange-400' : 'bg-green-600/20 text-green-400'}`}>
                            {it.status}
                          </span>
                        </td>
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

      <Dialog isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Event' : 'Add Event'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Event Name</label>
              <input type="text" value={form.event_name} onChange={(e) => setForm(f => ({ ...f, event_name: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm mb-1">Subject Line (optional)</label>
              <input type="text" value={form.subject_line} onChange={(e) => setForm(f => ({ ...f, subject_line: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm mb-1">Event Link (optional)</label>
              <input type="url" value={form.event_link} onChange={(e) => setForm(f => ({ ...f, event_link: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm mb-1">Source</label>
              <select value={form.source} onChange={(e) => setForm(f => ({ ...f, source: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm">
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Start Date</label>
              <input type="date" value={form.start_date} onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm mb-1">End Date (optional)</label>
              <input type="date" value={form.end_date} onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm mb-1">Event Time (optional)</label>
              <input type="time" value={form.event_time} onChange={(e) => setForm(f => ({ ...f, event_time: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm" />
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
        title="Delete Event"
        message={toDelete ? `Are you sure you want to delete \"${toDelete.event_name}\"?` : ''}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
}
