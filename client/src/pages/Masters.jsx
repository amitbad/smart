import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '../components/ToastContainer';
import { ConfirmDialog } from '../components/Dialog';

function Section({ title, items, onAdd, onUpdate, onDelete, renderExtra }) {
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState('');

  return (
    <div className="bg-black border border-gray-800 rounded p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-cyan-400">{title}</h3>
        <div className="flex items-center gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={`Add ${title.slice(0, -1)}`} className="bg-gray-900 border border-gray-800 rounded px-3 py-1.5 text-sm" />
          <button onClick={() => { if (name.trim()) { onAdd(name.trim()); setName(''); } }} className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 rounded text-xs flex items-center gap-1"><Plus size={14} />Add</button>
        </div>
      </div>
      <ul className="divide-y divide-gray-800">
        {items.map(it => (
          <li key={it.id} className="flex items-center justify-between py-2">
            {editing === it.id ? (
              <div className="flex items-center gap-2">
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-gray-900 border border-gray-800 rounded px-3 py-1.5 text-sm" />
                <button onClick={() => { onUpdate(it.id, editName.trim()); setEditing(null); }} className="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 rounded text-xs">Save</button>
                <button onClick={() => { setEditing(null); }} className="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs">Cancel</button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm">{it.name}</span>
                <button onClick={() => { setEditing(it.id); setEditName(it.name); }} className="text-gray-400 hover:text-white" title="Edit"><Pencil size={16} /></button>
                <button onClick={() => onDelete(it.id)} className="text-gray-400 hover:text-red-400" title="Delete"><Trash2 size={16} /></button>
              </div>
            )}
            {renderExtra ? renderExtra(it) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Masters() {
  const toast = useToast();
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Custom confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState({ type: null, id: null, title: '', message: '' });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [dsg, dep, pro, mem] = await Promise.all([
        axios.get('/api/designations'),
        axios.get('/api/departments'),
        axios.get('/api/projects'),
        axios.get('/api/members?limit=1000')
      ]);
      setDesignations(dsg.data || []);
      setDepartments(dep.data || []);
      setProjects(pro.data || []);
      setMembers(mem.data?.data || []);
    } catch (e) {
      toast.error('Failed to load masters');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, []);

  // handlers
  const addDesignation = async (name) => { try { await axios.post('/api/designations', { name }); loadAll(); toast.success('Designation added'); } catch (e) { toast.error(e.response?.data?.error || 'Failed'); } };
  const updateDesignation = async (id, name) => { try { await axios.put(`/api/designations/${id}`, { name }); loadAll(); toast.success('Designation updated'); } catch (e) { toast.error(e.response?.data?.error || 'Failed'); } };
  const deleteDesignation = async (id) => {
    setPendingDelete({ type: 'designation', id, title: 'Delete Designation?', message: 'Are you sure you want to delete this designation? This action cannot be undone.' });
    setConfirmOpen(true);
  };

  const addDepartment = async (name) => { try { await axios.post('/api/departments', { name }); loadAll(); toast.success('Department added'); } catch (e) { toast.error(e.response?.data?.error || 'Failed'); } };
  const updateDepartment = async (id, name) => { try { await axios.put(`/api/departments/${id}`, { name }); loadAll(); toast.success('Department updated'); } catch (e) { toast.error(e.response?.data?.error || 'Failed'); } };
  const deleteDepartment = async (id) => {
    setPendingDelete({ type: 'department', id, title: 'Delete Department?', message: 'Are you sure you want to delete this department? This action cannot be undone.' });
    setConfirmOpen(true);
  };

  // Projects handlers
  const addProject = async ({ code, delivery_manager_id }) => { try { await axios.post('/api/projects', { code, delivery_manager_id }); loadAll(); toast.success('Project added'); } catch (e) { toast.error(e.response?.data?.error || 'Failed'); } };
  const updateProject = async (id, { code, delivery_manager_id }) => { try { await axios.put(`/api/projects/${id}`, { code, delivery_manager_id }); loadAll(); toast.success('Project updated'); } catch (e) { toast.error(e.response?.data?.error || 'Failed'); } };
  const deleteProject = async (id) => {
    setPendingDelete({ type: 'project', id, title: 'Delete Project?', message: 'Are you sure you want to delete this project? This action cannot be undone.' });
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    const { type, id } = pendingDelete;
    try {
      if (type === 'designation') {
        await axios.delete(`/api/designations/${id}`);
        toast.success('Designation deleted');
      } else if (type === 'department') {
        await axios.delete(`/api/departments/${id}`);
        toast.success('Department deleted');
      } else if (type === 'project') {
        await axios.delete(`/api/projects/${id}`);
        toast.success('Project deleted');
      }
      await loadAll();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed');
    }
  };

  return (
    <>
      <div className="flex-1 overflow-auto">
        <header className="bg-black border-b border-gray-800 px-6 py-3">
          <h2 className="text-xl font-bold text-cyan-400">Masters</h2>
          <p className="text-xs text-gray-500 mt-0.5">Manage master data used across the app</p>
        </header>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <div className="text-gray-400">Loading...</div>
          ) : (
            <>
              <Section title="Designations" items={designations} onAdd={addDesignation} onUpdate={updateDesignation} onDelete={deleteDesignation} />
              <Section title="Departments" items={departments} onAdd={addDepartment} onUpdate={updateDepartment} onDelete={deleteDepartment} />
              <ProjectsSection
                items={projects}
                members={members}
                onAdd={addProject}
                onUpdate={updateProject}
                onDelete={deleteProject}
              />
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title={pendingDelete.title}
        message={pendingDelete.message}
        confirmText="Delete"
        type="danger"
      />
    </>
  );
}

function ProjectsSection({ items, members, onAdd, onUpdate, onDelete }) {
  const [code, setCode] = useState('');
  const [dm, setDm] = useState('');
  const [editing, setEditing] = useState(null);
  const [editCode, setEditCode] = useState('');
  const [editDm, setEditDm] = useState('');

  return (
    <div className="bg-black border border-gray-800 rounded p-4 md:col-span-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-cyan-400">Projects</h3>
        <div className="flex items-center gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Project Code (unique)" className="bg-gray-900 border border-gray-800 rounded px-3 py-1.5 text-sm" />
          <select value={dm} onChange={(e) => setDm(e.target.value)} className="bg-gray-900 border border-gray-800 rounded px-3 py-1.5 text-sm">
            <option value="">Delivery Manager (optional)</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}{m.designation ? ` (${m.designation})` : ''}</option>)}
          </select>
          <button onClick={() => { if (code.trim()) { onAdd({ code: code.trim(), delivery_manager_id: dm || null }); setCode(''); setDm(''); } }} className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 rounded text-xs flex items-center gap-1"><Plus size={14} />Add</button>
        </div>
      </div>
      <ul className="divide-y divide-gray-800">
        {items.map(it => (
          <li key={it.id} className="flex items-center justify-between py-2">
            {editing === it.id ? (
              <div className="flex items-center gap-2">
                <input value={editCode} onChange={(e) => setEditCode(e.target.value)} className="bg-gray-900 border border-gray-800 rounded px-3 py-1.5 text-sm" />
                <select value={editDm} onChange={(e) => setEditDm(e.target.value)} className="bg-gray-900 border border-gray-800 rounded px-3 py-1.5 text-sm">
                  <option value="">Delivery Manager (optional)</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}{m.designation ? ` (${m.designation})` : ''}</option>)}
                </select>
                <button onClick={() => { onUpdate(it.id, { code: editCode.trim(), delivery_manager_id: editDm || null }); setEditing(null); }} className="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 rounded text-xs">Save</button>
                <button onClick={() => { setEditing(null); }} className="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs">Cancel</button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm">{it.code}</span>
                <span className="text-xs text-gray-500">{renderDM(members, it.delivery_manager_id)}</span>
                <button onClick={() => { setEditing(it.id); setEditCode(it.code); setEditDm(it.delivery_manager_id || ''); }} className="text-gray-400 hover:text-white" title="Edit"><Pencil size={16} /></button>
                <button onClick={() => onDelete(it.id)} className="text-gray-400 hover:text-red-400" title="Delete"><Trash2 size={16} /></button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function renderDM(members, id) {
  if (!id) return '—';
  const m = members.find(mm => mm.id === id);
  return m ? `${m.name}${m.designation ? ` (${m.designation})` : ''}` : `#${id}`;
}
