import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, FileText, X, Check, ChevronDown } from 'lucide-react';
import Dialog, { ConfirmDialog } from '../components/Dialog';
import { useToast } from '../components/ToastContainer';

export default function Requirements() {
  const toast = useToast();
  const [requirements, setRequirements] = useState([]);
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [memberQuery, setMemberQuery] = useState('');
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const memberDropdownRef = useRef(null);
  const [projectQuery, setProjectQuery] = useState('');
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const projectDropdownRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [piModalOpen, setPiModalOpen] = useState(false);
  const [ciModalOpen, setCiModalOpen] = useState(false);
  const [statusLogModalOpen, setStatusLogModalOpen] = useState(false);
  const [logsViewerOpen, setLogsViewerOpen] = useState(false);
  const [viewingLogs, setViewingLogs] = useState([]);

  const [logEditIndex, setLogEditIndex] = useState(null);
  const [logDeleteIndex, setLogDeleteIndex] = useState(null);
  const [logDeleteConfirmOpen, setLogDeleteConfirmOpen] = useState(false);
  const [logDeleteType, setLogDeleteType] = useState(null);

  const [form, setForm] = useState({
    status: 'Pending',
    engagement_start_date: '',
    engagement_end_date: '',
    member_id: '',
    project_id: '',
    pi_done: false,
    pi_date: '',
    pi_result: '',
    ci_done: false,
    ci_date: '',
    ci_result: '',
    requirement_link: ''
  });

  const [statusLogForm, setStatusLogForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: ''
  });

  const [piForm, setPiForm] = useState({ date: '', result: '' });
  const [ciForm, setCiForm] = useState({ date: '', result: '' });

  const [editingLogForm, setEditingLogForm] = useState({ date: '', description: '' });

  const statuses = ['Pending', 'Propose', 'Approved', 'Rejected', 'Booked'];

  useEffect(() => {
    fetchRequirements();
    fetchMembers();
    fetchProjects();
  }, [page, statusFilter]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (memberDropdownOpen && memberDropdownRef.current && !memberDropdownRef.current.contains(e.target)) {
        setMemberDropdownOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [memberDropdownOpen]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (projectDropdownOpen && projectDropdownRef.current && !projectDropdownRef.current.contains(e.target)) {
        setProjectDropdownOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [projectDropdownOpen]);

  useEffect(() => {
    if (!dialogOpen) return;
    if (!form.member_id) {
      if (!memberDropdownOpen) setMemberQuery('');
      return;
    }
    const memberObj = members.find(m => m.id === form.member_id || m._id === form.member_id);
    if (memberObj && !memberDropdownOpen) {
      setMemberQuery(`${memberObj.name} (${memberObj.level || 'N/A'})`);
    }
  }, [dialogOpen, form.member_id, members, memberDropdownOpen]);

  useEffect(() => {
    if (!dialogOpen) return;
    if (!form.project_id) {
      if (!projectDropdownOpen) setProjectQuery('');
      return;
    }
    const projectObj = projects.find(p => p.id === form.project_id || p._id === form.project_id);
    if (projectObj && !projectDropdownOpen) {
      setProjectQuery(projectObj.code || '');
    }
  }, [dialogOpen, form.project_id, projects, projectDropdownOpen]);

  const fetchRequirements = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;

      const res = await axios.get('/api/requirements', { params });
      setRequirements(res.data.requirements || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to load requirements');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await axios.get('/api/members');
      const arr = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      setMembers(arr);
    } catch (e) {
      console.error('Failed to load members:', e);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await axios.get('/api/projects');
      const arr = Array.isArray(res.data) ? res.data : [];
      setProjects(arr);
    } catch (e) {
      console.error('Failed to load projects:', e);
    }
  };

  const resetForm = () => {
    setForm({
      status: 'Pending',
      engagement_start_date: '',
      engagement_end_date: '',
      member_id: '',
      project_id: '',
      pi_done: false,
      pi_date: '',
      pi_result: '',
      ci_done: false,
      ci_date: '',
      ci_result: '',
      requirement_link: ''
    });
    setEditingId(null);
  };

  const openAddDialog = () => {
    resetForm();
    setMemberQuery('');
    setMemberDropdownOpen(false);
    setProjectQuery('');
    setProjectDropdownOpen(false);
    setDialogOpen(true);
  };

  const openEditDialog = (req) => {
    setForm({
      status: req.status || 'Pending',
      engagement_start_date: req.engagement_start_date ? new Date(req.engagement_start_date).toISOString().slice(0, 10) : '',
      engagement_end_date: req.engagement_end_date ? new Date(req.engagement_end_date).toISOString().slice(0, 10) : '',
      member_id: req.member_id || '',
      project_id: req.project_id || '',
      pi_done: req.pi_done || false,
      pi_date: req.pi_date ? new Date(req.pi_date).toISOString().slice(0, 10) : '',
      pi_result: req.pi_result || '',
      ci_done: req.ci_done || false,
      ci_date: req.ci_date ? new Date(req.ci_date).toISOString().slice(0, 10) : '',
      ci_result: req.ci_result || '',
      requirement_link: req.requirement_link || ''
    });
    setMemberQuery('');
    setMemberDropdownOpen(false);
    setProjectQuery('');
    setProjectDropdownOpen(false);
    setEditingId(req.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (form.status === 'Booked') {
        if (!form.engagement_start_date || !form.engagement_end_date) {
          toast.error('Engagement dates are required when status is Booked');
          return;
        }
        if (new Date(form.engagement_end_date) <= new Date(form.engagement_start_date)) {
          toast.error('End date must be after start date');
          return;
        }
      }

      const payload = { ...form };

      if (editingId) {
        await axios.put(`/api/requirements/${editingId}`, payload);
        toast.success('Requirement updated');
      } else {
        await axios.post('/api/requirements', payload);
        toast.success('Requirement created');
      }

      setDialogOpen(false);
      resetForm();
      fetchRequirements();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to save requirement');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/requirements/${deleteId}`);
      toast.success('Requirement deleted');
      setDeleteConfirmOpen(false);
      setDeleteId(null);
      fetchRequirements();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to delete requirement');
    }
  };

  const handlePiCheck = (req) => {
    if (!req.pi_done) {
      setEditingId(req.id);
      setPiForm({ date: '', result: '' });
      setPiModalOpen(true);
    } else {
      // Uncheck
      updateRequirement(req.id, { pi_done: false, pi_date: null, pi_result: null });
    }
  };

  const handleCiCheck = (req) => {
    if (!req.ci_done) {
      setEditingId(req.id);
      setCiForm({ date: '', result: '' });
      setCiModalOpen(true);
    } else {
      // Uncheck
      updateRequirement(req.id, { ci_done: false, ci_date: null, ci_result: null });
    }
  };

  const savePi = async () => {
    try {
      await axios.put(`/api/requirements/${editingId}`, {
        pi_done: true,
        pi_date: piForm.date || null,
        pi_result: piForm.result || null
      });
      toast.success('PI marked as done');
      setPiModalOpen(false);
      fetchRequirements();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to update PI');
    }
  };

  const saveCi = async () => {
    try {
      await axios.put(`/api/requirements/${editingId}`, {
        ci_done: true,
        ci_date: ciForm.date || null,
        ci_result: ciForm.result || null
      });
      toast.success('CI marked as done');
      setCiModalOpen(false);
      fetchRequirements();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to update CI');
    }
  };

  const handleStatusChange = (req, newStatus) => {
    setEditingId(req.id);
    setForm({ ...form, status: newStatus });
    setStatusLogForm({ date: new Date().toISOString().slice(0, 10), description: '' });
    setStatusLogModalOpen(true);
  };

  const saveStatusChange = async () => {
    if (!statusLogForm.date || !statusLogForm.description.trim()) {
      toast.error('Date and description are required for status change');
      return;
    }

    try {
      await axios.put(`/api/requirements/${editingId}`, {
        status: form.status,
        status_log: statusLogForm
      });
      toast.success('Status updated');
      setStatusLogModalOpen(false);
      fetchRequirements();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to update status');
    }
  };

  const updateRequirement = async (id, data) => {
    try {
      await axios.put(`/api/requirements/${id}`, data);
      fetchRequirements();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to update requirement');
    }
  };

  const viewLogs = (req) => {
    const statusLogs = Array.isArray(req.status_logs) ? req.status_logs : [];
    const combined = [];

    if (req.pi_done) {
      combined.push({
        type: 'PI',
        date: req.pi_date || null,
        description: req.pi_result || '',
        created_at: req.pi_date || req.updated_at
      });
    }

    if (req.ci_done) {
      combined.push({
        type: 'CI',
        date: req.ci_date || null,
        description: req.ci_result || '',
        created_at: req.ci_date || req.updated_at
      });
    }

    statusLogs.forEach((log, index) => {
      combined.push({
        ...log,
        type: 'Status',
        statusIndex: index
      });
    });

    combined.sort((a, b) => {
      const aDate = a.date ? new Date(a.date).getTime() : 0;
      const bDate = b.date ? new Date(b.date).getTime() : 0;
      return bDate - aDate;
    });

    setViewingLogs(combined);
    setEditingId(req.id);
    setLogsViewerOpen(true);
  };

  const startEditLog = (index) => {
    const log = viewingLogs[index];
    setEditingLogForm({
      date: log.date ? new Date(log.date).toISOString().slice(0, 10) : '',
      description: log.description || ''
    });
    setLogEditIndex(index);
  };

  const saveLogEdit = async () => {
    try {
      const log = viewingLogs[logEditIndex];
      if (!log) return;

      if (log.type === 'Status') {
        await axios.put(`/api/requirements/${editingId}/logs/${log.statusIndex}`, editingLogForm);
        toast.success('Log updated');
      } else if (log.type === 'PI') {
        await axios.put(`/api/requirements/${editingId}`, {
          pi_done: true,
          pi_date: editingLogForm.date || null,
          pi_result: editingLogForm.description || null
        });
        toast.success('PI log updated');
      } else if (log.type === 'CI') {
        await axios.put(`/api/requirements/${editingId}`, {
          ci_done: true,
          ci_date: editingLogForm.date || null,
          ci_result: editingLogForm.description || null
        });
        toast.success('CI log updated');
      }

      setLogEditIndex(null);
      const res = await axios.get(`/api/requirements/${editingId}`);
      viewLogs(res.data);
      fetchRequirements();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to update log');
    }
  };

  const deleteLog = async () => {
    try {
      const log = viewingLogs[logDeleteIndex];
      if (!log) return;

      if (log.type === 'Status') {
        await axios.delete(`/api/requirements/${editingId}/logs/${log.statusIndex}`);
        toast.success('Log deleted');
      } else if (log.type === 'PI') {
        await axios.put(`/api/requirements/${editingId}`, {
          pi_done: false,
          pi_date: null,
          pi_result: null
        });
        toast.success('PI log deleted');
      } else if (log.type === 'CI') {
        await axios.put(`/api/requirements/${editingId}`, {
          ci_done: false,
          ci_date: null,
          ci_result: null
        });
        toast.success('CI log deleted');
      }

      setLogDeleteConfirmOpen(false);
      setLogDeleteIndex(null);
      setLogDeleteType(null);
      const res = await axios.get(`/api/requirements/${editingId}`);
      viewLogs(res.data);
      fetchRequirements();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to delete log');
    }
  };

  const getMemberDisplay = (memberId) => {
    const member = members.find(m => m.id === memberId);
    return member ? `${member.name} (${member.level || 'N/A'})` : 'N/A';
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <header className="bg-gray-900 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-cyan-300">Requirements</h2>
          <p className="text-xs text-gray-400 mt-0.5">Manage consultancy requirements and proposals</p>
        </div>
        <button onClick={openAddDialog} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm transition flex items-center gap-2">
          <Plus size={16} /> Add Requirement
        </button>
      </header>

      <div className="px-6 py-3 bg-gray-900 border-b border-gray-700 flex items-center gap-3">
        <label className="text-sm text-gray-400">Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm"
        >
          <option value="">All</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="text-center text-gray-400 py-8">Loading...</div>
        ) : requirements.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No requirements found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-900 border-b border-gray-700">
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Req #</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Member</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Engagement Dates</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-gray-300">PI</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-gray-300">CI</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-gray-300">Logs</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requirements.map((req) => (
                  <tr key={req.id} className="border-b border-gray-800 hover:bg-gray-900/50">
                    <td className="px-4 py-3 text-sm text-gray-300">#{req.requirement_number}</td>
                    <td className="px-4 py-3">
                      <select
                        value={req.status}
                        onChange={(e) => handleStatusChange(req, e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs"
                      >
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{getMemberDisplay(req.member_id)}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {req.status === 'Booked' && req.engagement_start_date && req.engagement_end_date
                        ? `${new Date(req.engagement_start_date).toLocaleDateString()} - ${new Date(req.engagement_end_date).toLocaleDateString()}`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={req.pi_done || false}
                        onChange={() => handlePiCheck(req)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={req.ci_done || false}
                        onChange={() => handleCiCheck(req)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {(req.status_logs && req.status_logs.length > 0) || req.pi_done || req.ci_done ? (
                        <button
                          onClick={() => viewLogs(req)}
                          className="text-cyan-400 hover:text-cyan-300"
                          title="View logs"
                        >
                          <FileText size={16} />
                        </button>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditDialog(req)}
                          className="text-blue-400 hover:text-blue-300"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => { setDeleteId(req.id); setDeleteConfirmOpen(true); }}
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

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-gray-800 rounded text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 bg-gray-800 rounded text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingId ? 'Edit Requirement' : 'Add Requirement'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
              >
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Member</label>
              <div className="relative" ref={memberDropdownRef}>
                <input
                  type="text"
                  value={memberQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMemberQuery(val);
                    setMemberDropdownOpen(true);
                    if (!val) {
                      setForm(prev => ({ ...prev, member_id: '' }));
                    }
                  }}
                  onFocus={() => setMemberDropdownOpen(true)}
                  placeholder="Select Member"
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm pr-8"
                />
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                {memberDropdownOpen && (
                  <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded border border-gray-800 bg-black shadow-lg">
                    <div className="py-1">
                      {members
                        .filter(m => {
                          const label = `${m.name} (${m.level || 'N/A'})`;
                          const q = memberQuery.trim().toLowerCase();
                          return !q || label.toLowerCase().includes(q);
                        })
                        .slice(0, 100)
                        .map(m => {
                          const label = `${m.name} (${m.level || 'N/A'})`;
                          return (
                            <button
                              type="button"
                              key={m.id}
                              onClick={() => {
                                setForm(prev => ({ ...prev, member_id: m.id }));
                                setMemberQuery(label);
                                setMemberDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-900 ${form.member_id === m.id ? 'bg-gray-900' : ''}`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      {members.filter(m => {
                        const label = `${m.name} (${m.level || 'N/A'})`;
                        const q = memberQuery.trim().toLowerCase();
                        return !q || label.toLowerCase().includes(q);
                      }).length === 0 && (
                          <div className="px-3 py-2 text-sm text-gray-500">No matches</div>
                        )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">Project</label>
              <div className="relative" ref={projectDropdownRef}>
                <input
                  type="text"
                  value={projectQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProjectQuery(val);
                    setProjectDropdownOpen(true);
                    if (!val) {
                      setForm(prev => ({ ...prev, project_id: '' }));
                    }
                  }}
                  onFocus={() => setProjectDropdownOpen(true)}
                  placeholder="Select Project"
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm pr-8"
                />
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                {projectDropdownOpen && (
                  <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded border border-gray-800 bg-black shadow-lg">
                    <div className="py-1">
                      {projects
                        .filter(p => {
                          const label = `${p.code} ${p.name || ''}`;
                          const q = projectQuery.trim().toLowerCase();
                          return !q || label.toLowerCase().includes(q);
                        })
                        .slice(0, 100)
                        .map(p => {
                          const projectId = p.id || p._id;
                          return (
                            <button
                              type="button"
                              key={projectId}
                              onClick={() => {
                                setForm(prev => ({ ...prev, project_id: projectId }));
                                setProjectQuery(p.code || '');
                                setProjectDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-900 ${form.project_id === projectId ? 'bg-gray-900' : ''}`}
                            >
                              <div className="text-sm text-gray-200">{p.code}</div>
                              <div className="text-xs text-gray-500">({p.name || 'Unnamed'})</div>
                            </button>
                          );
                        })}
                      {projects.filter(p => {
                        const label = `${p.code} ${p.name || ''}`;
                        const q = projectQuery.trim().toLowerCase();
                        return !q || label.toLowerCase().includes(q);
                      }).length === 0 && (
                          <div className="px-3 py-2 text-sm text-gray-500">No matches</div>
                        )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {form.status === 'Booked' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Engagement Start Date</label>
                <input
                  type="date"
                  value={form.engagement_start_date}
                  onChange={(e) => setForm({ ...form, engagement_start_date: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Engagement End Date</label>
                <input
                  type="date"
                  value={form.engagement_end_date}
                  onChange={(e) => setForm({ ...form, engagement_end_date: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm mb-1">Requirement Link (optional)</label>
            <input
              type="url"
              value={form.requirement_link}
              onChange={(e) => setForm({ ...form, requirement_link: e.target.value })}
              placeholder="https://..."
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.pi_done}
                onChange={(e) => setForm({ ...form, pi_done: e.target.checked })}
                className="w-4 h-4"
              />
              PI Done
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.ci_done}
                onChange={(e) => setForm({ ...form, ci_done: e.target.checked })}
                className="w-4 h-4"
              />
              CI Done
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => setDialogOpen(false)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm"
            >
              {editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Dialog>

      {/* PI Modal */}
      <Dialog isOpen={piModalOpen} onClose={() => setPiModalOpen(false)} title="Project Interview (PI)" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Date (optional)</label>
            <input
              type="date"
              value={piForm.date}
              onChange={(e) => setPiForm({ ...piForm, date: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Result (optional)</label>
            <textarea
              value={piForm.result}
              onChange={(e) => setPiForm({ ...piForm, result: e.target.value })}
              rows={3}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
              placeholder="Enter result..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setPiModalOpen(false)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm">Cancel</button>
            <button onClick={savePi} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm">Save</button>
          </div>
        </div>
      </Dialog>

      {/* CI Modal */}
      <Dialog isOpen={ciModalOpen} onClose={() => setCiModalOpen(false)} title="Client Interview (CI)" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Date (optional)</label>
            <input
              type="date"
              value={ciForm.date}
              onChange={(e) => setCiForm({ ...ciForm, date: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Result (optional)</label>
            <textarea
              value={ciForm.result}
              onChange={(e) => setCiForm({ ...ciForm, result: e.target.value })}
              rows={3}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
              placeholder="Enter result..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setCiModalOpen(false)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm">Cancel</button>
            <button onClick={saveCi} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm">Save</button>
          </div>
        </div>
      </Dialog>

      {/* Status Change Log Modal */}
      <Dialog isOpen={statusLogModalOpen} onClose={() => setStatusLogModalOpen(false)} title="Status Change Log" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Date</label>
            <input
              type="date"
              value={statusLogForm.date}
              onChange={(e) => setStatusLogForm({ ...statusLogForm, date: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Description</label>
            <textarea
              value={statusLogForm.description}
              onChange={(e) => setStatusLogForm({ ...statusLogForm, description: e.target.value })}
              rows={3}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
              placeholder="Describe the status change..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setStatusLogModalOpen(false)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm">Cancel</button>
            <button onClick={saveStatusChange} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm">Save</button>
          </div>
        </div>
      </Dialog>

      {/* Logs Viewer Modal */}
      <Dialog isOpen={logsViewerOpen} onClose={() => setLogsViewerOpen(false)} title="Status Change Logs" size="md">
        <div className="space-y-3">
          {viewingLogs.length === 0 ? (
            <div className="text-sm text-gray-400 text-center py-4">No logs available</div>
          ) : (
            viewingLogs.map((log, index) => (
              <div key={index} className="bg-gray-900/50 border border-gray-700 rounded-lg p-3">
                {logEditIndex === index ? (
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={editingLogForm.date}
                      onChange={(e) => setEditingLogForm({ ...editingLogForm, date: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs"
                    />
                    <textarea
                      value={editingLogForm.description}
                      onChange={(e) => setEditingLogForm({ ...editingLogForm, description: e.target.value })}
                      rows={2}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs"
                    />
                    <div className="flex gap-2">
                      <button onClick={saveLogEdit} className="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 rounded text-xs flex items-center gap-1">
                        <Check size={12} /> Save
                      </button>
                      <button onClick={() => setLogEditIndex(null)} className="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs flex items-center gap-1">
                        <X size={12} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="text-xs text-gray-400 mb-1">
                          {log.type === 'Status'
                            ? `${log.from_status ? `${log.from_status} → ` : ''}${log.status || 'Status'} • ${log.date ? new Date(log.date).toLocaleDateString() : 'No date'}`
                            : `${log.type} • ${log.date ? new Date(log.date).toLocaleDateString() : 'No date'}`}
                        </div>
                        <div className="text-sm text-gray-300">{log.description || 'No description'}</div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEditLog(index)}
                          className="text-blue-400 hover:text-blue-300 p-1"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => { setLogDeleteIndex(index); setLogDeleteType(log.type); setLogDeleteConfirmOpen(true); }}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </Dialog>

      {/* Delete Requirement Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Requirement"
        message="Are you sure you want to delete this requirement? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />

      {/* Delete Log Confirmation */}
      <ConfirmDialog
        isOpen={logDeleteConfirmOpen}
        onClose={() => {
          setLogDeleteConfirmOpen(false);
          setLogDeleteIndex(null);
          setLogDeleteType(null);
        }}
        onConfirm={deleteLog}
        title={logDeleteType ? `Delete ${logDeleteType} Log?` : 'Delete Log Entry'}
        message={logDeleteType
          ? `Are you sure you want to delete this ${logDeleteType} log entry? This action cannot be undone.`
          : 'Are you sure you want to delete this log entry? This action cannot be undone.'}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
}
