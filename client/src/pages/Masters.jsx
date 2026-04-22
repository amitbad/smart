import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '../components/ToastContainer';
import { ConfirmDialog } from '../components/Dialog';

function Section({ title, items, onAdd, onUpdate, onDelete, renderExtra }) {
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState('');
  const itemColumns = [];
  for (let i = 0; i < items.length; i += 4) {
    itemColumns.push(items.slice(i, i + 4));
  }

  return (
    <div className="bg-black border border-gray-800 rounded p-4 h-[220px] flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-cyan-400">{title}</h3>
        <div className="flex items-center gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={`Add ${title.slice(0, -1)}`} className="bg-gray-900 border border-gray-800 rounded px-3 py-1.5 text-sm" />
          <button onClick={() => { if (name.trim()) { onAdd(name.trim()); setName(''); } }} className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 rounded text-xs flex items-center gap-1"><Plus size={14} />Add</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 overflow-y-auto pr-1 flex-1 scrollbar-none">
        {itemColumns.map((columnItems, columnIndex) => (
          <ul key={columnIndex} className="min-w-0">
            {columnItems.map(it => (
              <li key={it.id} className="flex items-center justify-between py-2 border-b border-gray-800 min-w-0">
                {editing === it.id ? (
                  <div className="flex items-center gap-2 min-w-0">
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-gray-900 border border-gray-800 rounded px-3 py-1.5 text-sm" />
                    <button onClick={() => { onUpdate(it.id, editName.trim()); setEditing(null); }} className="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 rounded text-xs">Save</button>
                    <button onClick={() => { setEditing(null); }} className="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs">Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm truncate">{it.name}</span>
                    <button onClick={() => { setEditing(it.id); setEditName(it.name); }} className="text-gray-400 hover:text-white" title="Edit"><Pencil size={16} /></button>
                    <button onClick={() => onDelete(it.id)} className="text-gray-400 hover:text-red-400" title="Delete"><Trash2 size={16} /></button>
                  </div>
                )}
                {renderExtra ? renderExtra(it) : null}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

export default function Masters() {
  const toast = useToast();
  const [designations, setDesignations] = useState([]);
  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [skills, setSkills] = useState([]);
  const [goalCategories, setGoalCategories] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Custom confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState({ type: null, id: null, title: '', message: '' });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [dsg, loc, dep, skl, gcat, mem] = await Promise.all([
        axios.get('/api/designations'),
        axios.get('/api/locations'),
        axios.get('/api/departments'),
        axios.get('/api/skills'),
        axios.get('/api/goal-categories'),
        axios.get('/api/members?limit=1000')
      ]);
      setDesignations(dsg.data || []);
      setLocations(loc.data || []);
      setDepartments(dep.data || []);
      setSkills(skl.data || []);
      setGoalCategories(gcat.data || []);
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

  const addLocation = async (name) => { try { await axios.post('/api/locations', { name }); loadAll(); toast.success('Location added'); } catch (e) { toast.error(e.response?.data?.error || 'Failed'); } };
  const updateLocation = async (id, name) => { try { await axios.put(`/api/locations/${id}`, { name }); loadAll(); toast.success('Location updated'); } catch (e) { toast.error(e.response?.data?.error || 'Failed'); } };
  const deleteLocation = async (id) => {
    setPendingDelete({ type: 'location', id, title: 'Delete Location?', message: 'Are you sure you want to delete this location? Members using this city will be unassigned.' });
    setConfirmOpen(true);
  };

  const addDepartment = async (name) => { try { await axios.post('/api/departments', { name }); loadAll(); toast.success('Department added'); } catch (e) { toast.error(e.response?.data?.error || 'Failed'); } };
  const updateDepartment = async (id, name) => { try { await axios.put(`/api/departments/${id}`, { name }); loadAll(); toast.success('Department updated'); } catch (e) { toast.error(e.response?.data?.error || 'Failed'); } };
  const deleteDepartment = async (id) => {
    try {
      // Check if department is assigned to members
      const response = await axios.get(`/api/departments/${id}/assignments`);
      const { isAssigned, count } = response.data;

      let message = 'Are you sure you want to delete this department?';
      if (isAssigned) {
        message = `This department is assigned to ${count} member${count > 1 ? 's' : ''}. Deleting this will unassign this department from all members. Do you want to continue?`;
      }

      setPendingDelete({
        type: 'department',
        id,
        title: 'Delete Department?',
        message
      });
      setConfirmOpen(true);
    } catch (e) {
      toast.error('Failed to check department assignments');
    }
  };


  // Skills handlers
  const addSkill = async (name) => { try { await axios.post('/api/skills', { name }); loadAll(); toast.success('Skill added'); } catch (e) { toast.error(e.response?.data?.error || 'Failed'); } };
  const updateSkill = async (id, name) => { try { await axios.put(`/api/skills/${id}`, { name }); loadAll(); toast.success('Skill updated'); } catch (e) { toast.error(e.response?.data?.error || 'Failed'); } };
  const deleteSkill = async (id) => {
    try {
      // Check if skill is assigned to members
      const response = await axios.get(`/api/skills/${id}/assignments`);
      const { isAssigned, count } = response.data;

      let message = 'Are you sure you want to delete this skill?';
      if (isAssigned) {
        message = `This skill is assigned to ${count} member${count > 1 ? 's' : ''}. Deleting this will unassign this skill from all members. Do you want to continue?`;
      }

      setPendingDelete({
        type: 'skill',
        id,
        title: 'Delete Skill?',
        message
      });
      setConfirmOpen(true);
    } catch (e) {
      toast.error('Failed to check skill assignments');
    }
  };

  // Goal Categories handlers
  const addGoalCategory = async (name) => { try { await axios.post('/api/goal-categories', { name }); loadAll(); toast.success('Category added'); } catch (e) { toast.error(e.response?.data?.error || 'Failed'); } };
  const updateGoalCategory = async (id, name) => { try { await axios.put(`/api/goal-categories/${id}`, { name }); loadAll(); toast.success('Category updated'); } catch (e) { toast.error(e.response?.data?.error || 'Failed'); } };
  const deleteGoalCategory = async (id) => {
    try {
      // Check if goal category is assigned to goals
      const response = await axios.get(`/api/goal-categories/${id}/assignments`);
      const { isAssigned, count } = response.data;

      let message = 'Are you sure you want to delete this category?';
      if (isAssigned) {
        message = `This category is assigned to ${count} goal${count > 1 ? 's' : ''}. Deleting this will remove it from all goals. Do you want to continue?`;
      }

      setPendingDelete({
        type: 'goalCategory',
        id,
        title: 'Delete Category?',
        message
      });
      setConfirmOpen(true);
    } catch (e) {
      toast.error('Failed to check category assignments');
    }
  };

  const confirmDelete = async () => {
    const { type, id } = pendingDelete;
    try {
      if (type === 'designation') {
        await axios.delete(`/api/designations/${id}`);
        toast.success('Designation deleted');
      } else if (type === 'location') {
        await axios.delete(`/api/locations/${id}`);
        toast.success('Location deleted');
      } else if (type === 'department') {
        await axios.delete(`/api/departments/${id}`);
        toast.success('Department deleted');
      } else if (type === 'skill') {
        await axios.delete(`/api/skills/${id}`);
        toast.success('Skill deleted');
      } else if (type === 'goalCategory') {
        await axios.delete(`/api/goal-categories/${id}`);
        toast.success('Category deleted');
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
              <Section title="Locations" items={locations} onAdd={addLocation} onUpdate={updateLocation} onDelete={deleteLocation} />
              <Section title="Departments" items={departments} onAdd={addDepartment} onUpdate={updateDepartment} onDelete={deleteDepartment} />
              <Section title="Skills" items={skills} onAdd={addSkill} onUpdate={updateSkill} onDelete={deleteSkill} />
              <Section title="Goal Categories" items={goalCategories} onAdd={addGoalCategory} onUpdate={updateGoalCategory} onDelete={deleteGoalCategory} />
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
