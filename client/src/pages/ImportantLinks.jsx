import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, ExternalLink } from 'lucide-react';
import axios from 'axios';
import Dialog, { ConfirmDialog } from '../components/Dialog';
import { useToast } from '../components/ToastContainer';

export default function ImportantLinks() {
  const toast = useToast();
  const [links, setLinks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    link_name: '',
    link_url: '',
    purpose: '',
    created_by: ''
  });

  useEffect(() => {
    fetchLinks();
  }, [search]);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/important-links', { params: { search } });
      setLinks(res.data || []);
    } catch (e) {
      toast.error('Failed to load links');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ link_name: '', link_url: '', purpose: '', created_by: '' });
    setModalOpen(true);
  };

  const openEdit = (link) => {
    setEditing(link);
    setForm({
      link_name: link.link_name,
      link_url: link.link_url,
      purpose: link.purpose,
      created_by: link.created_by || ''
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.link_name || !form.link_url || !form.purpose) {
      toast.error('Link name, URL, and purpose are required');
      return;
    }

    try {
      const payload = {
        link_name: form.link_name,
        link_url: form.link_url,
        purpose: form.purpose,
        created_by: form.created_by || null
      };

      if (editing) {
        await axios.put(`/api/important-links/${editing.id}`, payload);
        toast.success('Link updated');
      } else {
        await axios.post('/api/important-links', payload);
        toast.success('Link added');
      }

      setModalOpen(false);
      fetchLinks();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Save failed');
    }
  };

  const requestDelete = (link) => {
    setToDelete(link);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await axios.delete(`/api/important-links/${toDelete.id}`);
      toast.success('Link deleted');
      fetchLinks();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <header className="bg-black border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-cyan-400">Important Links</h2>
          <p className="text-xs text-gray-500 mt-0.5">Manage important access links and resources</p>
        </div>
        <button onClick={openAdd} className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 rounded text-xs transition flex items-center gap-1">
          <Plus size={14} /> Add Link
        </button>
      </header>

      <div className="p-4 border-b border-gray-800 bg-black">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, purpose, or creator..."
          className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm text-gray-100 placeholder-gray-500"
        />
      </div>

      <div className="p-6 overflow-x-auto">
        {loading ? (
          <div className="text-gray-400">Loading...</div>
        ) : links.length === 0 ? (
          <div className="text-gray-500">No links found</div>
        ) : (
          <div className="bg-black border border-gray-800 rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-2 text-left">Link Name</th>
                  <th className="px-4 py-2 text-left">URL</th>
                  <th className="px-4 py-2 text-left">Purpose</th>
                  <th className="px-4 py-2 text-left">Created By</th>
                  <th className="px-4 py-2 text-left">Created</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {links.map((link) => (
                  <tr key={link.id} className="hover:bg-gray-900">
                    <td className="px-4 py-2 font-medium">{link.link_name}</td>
                    <td className="px-4 py-2">
                      <a
                        href={link.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                      >
                        <span className="max-w-xs truncate">{link.link_url}</span>
                        <ExternalLink size={12} />
                      </a>
                    </td>
                    <td className="px-4 py-2 max-w-md">
                      <div className="line-clamp-2" title={link.purpose}>
                        {link.purpose}
                      </div>
                    </td>
                    <td className="px-4 py-2">{link.created_by || <span className="text-xs text-gray-500">—</span>}</td>
                    <td className="px-4 py-2">{new Date(link.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(link)} className="text-gray-400 hover:text-white" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => requestDelete(link)} className="text-gray-400 hover:text-red-400" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Link' : 'Add Link'} size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Link Name</label>
            <input
              type="text"
              value={form.link_name}
              onChange={(e) => setForm((f) => ({ ...f, link_name: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm text-gray-100"
              placeholder="e.g., Production Dashboard"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Link URL</label>
            <input
              type="url"
              value={form.link_url}
              onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm text-gray-100"
              placeholder="https://example.com"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Purpose</label>
            <textarea
              value={form.purpose}
              onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm text-gray-100"
              rows="4"
              placeholder="Describe the purpose of this link..."
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Created By (optional)</label>
            <input
              type="text"
              value={form.created_by}
              onChange={(e) => setForm((f) => ({ ...f, created_by: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm text-gray-100"
              placeholder="Owner or creator name"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm">
              Close
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm">
              {editing ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        message={toDelete ? `Delete link "${toDelete.link_name}"?` : ''}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
}
