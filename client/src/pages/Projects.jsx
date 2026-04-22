import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import Dialog, { ConfirmDialog } from '../components/Dialog';
import { useToast } from '../components/ToastContainer';

export default function Projects() {
  const toast = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [form, setForm] = useState({
    code: '',
    name: '',
    active: true
  });

  useEffect(() => {
    fetchProjects();
  }, [search]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.q = search.trim();
      const res = await axios.get('/api/projects', { params });
      const list = Array.isArray(res.data) ? res.data : [];
      // filter by name client-side when search is used
      const filtered = search.trim()
        ? list.filter(p => (p.name || '').toLowerCase().includes(search.trim().toLowerCase()) || (p.code || '').toLowerCase().includes(search.trim().toLowerCase()))
        : list;
      setProjects(filtered);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ code: '', name: '', active: true });
    setEditingId(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (project) => {
    setForm({
      code: project.code || '',
      name: project.name || '',
      active: project.active !== false
    });
    setEditingId(project.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim()) {
      toast.error('Project code is required');
      return;
    }
    if (!form.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      active: form.active
    };

    try {
      if (editingId) {
        await axios.put(`/api/projects/${editingId}`, payload);
        toast.success('Project updated');
      } else {
        await axios.post('/api/projects', payload);
        toast.success('Project created');
      }
      setDialogOpen(false);
      resetForm();
      fetchProjects();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to save project');
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`/api/projects/${deleteId}`);
      toast.success('Project deleted');
      setDeleteConfirmOpen(false);
      setDeleteId(null);
      fetchProjects();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to delete project');
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <header className="bg-gray-900 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-cyan-300">Projects</h2>
          <p className="text-xs text-gray-400 mt-0.5">Manage project codes and names</p>
        </div>
        <button onClick={openAddDialog} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm transition flex items-center gap-2">
          <Plus size={16} /> Add Project
        </button>
      </header>

      <div className="px-6 py-3 bg-gray-900 border-b border-gray-700 flex items-center gap-3">
        <div className="relative w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code or name"
            className="w-full bg-gray-800 border border-gray-700 rounded pl-9 pr-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="text-center text-gray-400 py-8">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No projects found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-900 border-b border-gray-700">
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Code</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Active</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} className="border-b border-gray-800 hover:bg-gray-900/50">
                    <td className="px-4 py-3 text-sm text-gray-300 font-mono">{project.code}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{project.name}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${project.active !== false ? 'bg-green-600/20 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                        {project.active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditDialog(project)}
                          className="text-blue-400 hover:text-blue-300"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => { setDeleteId(project.id); setDeleteConfirmOpen(true); }}
                          className="text-red-400 hover:text-red-300"
                          title="Delete"
                        >
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

      <Dialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingId ? 'Edit Project' : 'Add Project'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Project Code</label>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="e.g. PRJ-001"
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Project Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Project name"
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="w-4 h-4"
            />
            Active
          </label>

          <div className="flex justify-end gap-2 pt-4">
            <button onClick={() => setDialogOpen(false)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm">{editingId ? 'Update' : 'Create'}</button>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
}
