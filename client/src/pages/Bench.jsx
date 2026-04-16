import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import axios from 'axios';
import Dialog, { ConfirmDialog } from '../components/Dialog';
import { useToast } from '../components/ToastContainer';

const STATUSES = ['Working', 'Project Completed', 'Deferred'];

export default function Bench() {
  const toast = useToast();
  const [records, setRecords] = useState([]);
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({ member_id: '', project_id: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showExtension, setShowExtension] = useState(false);

  const [form, setForm] = useState({
    member_id: '',
    project_id: '',
    assigned_date: '',
    release_date: '',
    extension_date: '',
    status: 'Working'
  });

  useEffect(() => { fetchMembers(); fetchProjects(); }, []);
  useEffect(() => { fetchRecords(); }, [filters]);

  const fetchMembers = async () => {
    try { const res = await axios.get('/api/members?limit=1000'); setMembers(res.data.data || []); } catch { }
  };

  const fetchProjects = async () => {
    try { const res = await axios.get('/api/projects'); setProjects(res.data || []); } catch { }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/bench', { params: filters });
      setRecords(res.data || []);
    } catch (e) { toast.error('Failed to load bench records'); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ member_id: '', project_id: '', assigned_date: '', release_date: '', extension_date: '', status: 'Working' });
    setShowExtension(false);
    setModalOpen(true);
  };

  const openEdit = (rec) => {
    setEditing(rec);
    setForm({
      member_id: String(rec.member_id),
      project_id: rec.project_id ? String(rec.project_id) : '',
      assigned_date: rec.assigned_date ? String(rec.assigned_date).slice(0, 10) : '',
      release_date: rec.release_date ? String(rec.release_date).slice(0, 10) : '',
      extension_date: rec.extension_date ? String(rec.extension_date).slice(0, 10) : '',
      status: rec.status
    });
    setShowExtension(!!rec.extension_date);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.member_id || !form.assigned_date) { toast.error('Member and Assigned Date are required'); return; }
    // Validate date ordering
    const ad = form.assigned_date;
    const rd = form.release_date;
    const xd = showExtension ? form.extension_date : '';
    if (rd && rd <= ad) {
      toast.error('Release Date must be after Assigned Date');
      return;
    }
    if (showExtension && xd) {
      if (!rd) {
        toast.error('Please set a Release Date before adding Extension Date');
        return;
      }
      if (xd <= rd) {
        toast.error('Extension Date must be after Release Date');
        return;
      }
    }
    try {
      const payload = {
        member_id: parseInt(form.member_id, 10),
        project_id: form.project_id ? parseInt(form.project_id, 10) : null,
        assigned_date: form.assigned_date,
        release_date: form.release_date || null,
        extension_date: showExtension ? (form.extension_date || null) : null,
        status: form.status
      };
      if (editing) {
        await axios.put(`/api/bench/${editing.id}`, payload);
        toast.success('Bench record updated');
      } else {
        await axios.post('/api/bench', payload);
        toast.success('Bench record added');
      }
      setModalOpen(false);
      fetchRecords();
    } catch (e) { toast.error(e.response?.data?.error || 'Save failed'); }
  };

  const requestDelete = (rec) => {
    if (rec.status === 'Working' || rec.status === 'Project Completed') {
      toast.error(`Cannot delete a bench record with status "${rec.status}"`);
      return;
    }
    setToDelete(rec);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await axios.delete(`/api/bench/${toDelete.id}`);
      toast.success('Deleted');
      fetchRecords();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <header className="bg-black border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-cyan-400">Bench Management</h2>
          <p className="text-xs text-gray-500 mt-0.5">Track member project assignments and availability</p>
        </div>
        <button onClick={openAdd} className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 rounded text-xs transition flex items-center gap-1">
          <Plus size={14} /> Add Bench Record
        </button>
      </header>

      <div className="p-4 border-b border-gray-800 bg-black">
        <div className="grid grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Member</label>
            <select value={filters.member_id} onChange={(e) => setFilters(f => ({ ...f, member_id: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm">
              <option value="">All</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name} {m.designation ? `(${m.designation})` : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Project</label>
            <select value={filters.project_id} onChange={(e) => setFilters(f => ({ ...f, project_id: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm">
              <option value="">All</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Status</label>
            <select value={filters.status} onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm">
              <option value="">All</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="p-6 overflow-x-auto">
        {loading ? (
          <div className="text-gray-400">Loading...</div>
        ) : records.length === 0 ? (
          <div className="text-gray-500">No bench records</div>
        ) : (
          <div className="bg-black border border-gray-800 rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-2 text-left">Member</th>
                  <th className="px-4 py-2 text-left">Project</th>
                  <th className="px-4 py-2 text-left">Assigned Date</th>
                  <th className="px-4 py-2 text-left">Release Date</th>
                  <th className="px-4 py-2 text-left">Extension Date</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {records.map(rec => (
                  <tr key={rec.id} className="hover:bg-gray-900">
                    <td className="px-4 py-2">
                      <div>{rec.member_name}</div>
                      <div className="text-xs text-gray-500">{rec.designation} {rec.level ? `• L${rec.level}` : ''}</div>
                    </td>
                    <td className="px-4 py-2">{rec.project_code || <span className="text-xs text-gray-500">—</span>}</td>
                    <td className="px-4 py-2">{rec.assigned_date}</td>
                    <td className="px-4 py-2">{rec.release_date || <span className="text-xs text-gray-500">—</span>}</td>
                    <td className="px-4 py-2">{rec.extension_date || <span className="text-xs text-gray-500">—</span>}</td>
                    <td className="px-4 py-2">{rec.status}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(rec)} className="text-gray-400 hover:text-white" title="Edit"><Edit2 size={16} /></button>
                        <button onClick={() => requestDelete(rec)} className={`text-gray-400 hover:text-red-400 ${(rec.status === 'Working' || rec.status === 'Project Completed') ? 'opacity-40 cursor-not-allowed' : ''}`} disabled={rec.status === 'Working' || rec.status === 'Project Completed'} title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Bench Record' : 'Add Bench Record'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Member</label>
              <select value={form.member_id} onChange={(e) => setForm(f => ({ ...f, member_id: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm">
                <option value="">Select Member</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name} {m.designation ? `(${m.designation})` : ''} {m.level ? `• L${m.level}` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Project (optional)</label>
              <select value={form.project_id} onChange={(e) => setForm(f => ({ ...f, project_id: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm">
                <option value="">None</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Assigned Date</label>
              <input type="date" value={form.assigned_date} onChange={(e) => setForm(f => ({ ...f, assigned_date: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm mb-1">Release Date (optional)</label>
              <input type="date" value={form.release_date} onChange={(e) => setForm(f => ({ ...f, release_date: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={showExtension} onChange={(e) => setShowExtension(e.target.checked)} className="rounded border-gray-700 text-cyan-600 focus:ring-cyan-600" />
                <span>Add Extension</span>
              </label>
            </div>
          </div>
          {showExtension && (
            <div>
              <label className="block text-sm mb-1">Extension Date</label>
              <input type="date" value={form.extension_date} onChange={(e) => setForm(f => ({ ...f, extension_date: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm" />
            </div>
          )}
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
        message={toDelete ? `Delete bench record for ${toDelete.member_name} (Status: ${toDelete.status})?` : ''}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
}
