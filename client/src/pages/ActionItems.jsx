import { useEffect, useMemo, useState, useRef } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, Filter, Copy, ExternalLink, Eye, MessageSquarePlus, MessageSquare, MoreVertical } from 'lucide-react';
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState(null);
  const [collapsedDates, setCollapsedDates] = useState(new Set());
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentingItem, setCommentingItem] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [savingComment, setSavingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [commentDeleteConfirmOpen, setCommentDeleteConfirmOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [editingPriorityId, setEditingPriorityId] = useState(null);
  const [editingStatusId, setEditingStatusId] = useState(null);

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
    const handleClickOutside = (e) => {
      if (openActionMenuId && !e.target.closest(`[data-menu-id="${openActionMenuId}"]`)) {
        setOpenActionMenuId(null);
      }
      if (editingPriorityId && !e.target.closest(`[data-priority-id="${editingPriorityId}"]`)) {
        setEditingPriorityId(null);
      }
      if (editingStatusId && !e.target.closest(`[data-status-id="${editingStatusId}"]`)) {
        setEditingStatusId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openActionMenuId, editingPriorityId, editingStatusId]);

  const startEditComment = (comment) => {
    const commentId = comment._id || comment.id;
    setEditingCommentId(commentId);
    setEditingCommentText(comment.text || '');
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleUpdateComment = async () => {
    if (!commentingItem || !editingCommentId || !editingCommentText.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    setSavingComment(true);
    try {
      const res = await axios.put(`/api/action-items/${commentingItem.id}/comments/${editingCommentId}`, {
        text: editingCommentText.trim()
      });
      const updated = res.data;
      setItems(prev => prev.map(it => it.id === updated.id ? updated : it));
      setCommentingItem(updated);
      setViewingItem(prev => prev?.id === updated.id ? updated : prev);
      setEditingCommentId(null);
      setEditingCommentText('');
      toast.success('Comment updated');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to update comment');
    } finally {
      setSavingComment(false);
    }
  };

  const requestDeleteComment = (comment) => {
    setCommentToDelete(comment);
    setCommentDeleteConfirmOpen(true);
  };

  const handleDeleteComment = async () => {
    if (!commentingItem || !commentToDelete) return;
    const commentId = commentToDelete._id || commentToDelete.id;
    try {
      const res = await axios.delete(`/api/action-items/${commentingItem.id}/comments/${commentId}`);
      const updated = res.data;
      setItems(prev => prev.map(it => it.id === updated.id ? updated : it));
      setCommentingItem(updated);
      setViewingItem(prev => prev?.id === updated.id ? updated : prev);
      setCommentDeleteConfirmOpen(false);
      setCommentToDelete(null);
      toast.success('Comment deleted');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to delete comment');
    }
  };

  const openComments = (it) => {
    setCommentingItem(it);
    setNewComment('');
    setEditingCommentId(null);
    setEditingCommentText('');
    setCommentsOpen(true);
  };

  const handleAddComment = async () => {
    if (!commentingItem || !newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    setSavingComment(true);
    try {
      const res = await axios.post(`/api/action-items/${commentingItem.id}/comments`, { text: newComment.trim() });
      const updated = res.data;
      setItems(prev => prev.map(it => it.id === updated.id ? updated : it));
      setCommentingItem(updated);
      setViewingItem(prev => prev?.id === updated.id ? updated : prev);
      setNewComment('');
      toast.success('Comment added');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to add comment');
    } finally {
      setSavingComment(false);
    }
  };

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

  const normalizeDateKey = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d)) return value; // fallback if already normalized
    return d.toISOString().slice(0, 10);
  };

  const grouped = useMemo(() => {
    const byDate = items.reduce((acc, it) => {
      const key = normalizeDateKey(it.action_date);
      (acc[key] = acc[key] || []).push(it);
      return acc;
    }, {});
    // sort dates desc and limit to last 5 working dates
    const sortedDates = Object.entries(byDate).sort((a, b) => new Date(b[0]) - new Date(a[0]));
    return sortedDates.slice(0, 5);
  }, [items]);

  // Initialize collapsed state: collapse all except today's date
  useEffect(() => {
    if (grouped.length > 0) {
      const collapsed = new Set();
      grouped.forEach(([date]) => {
        if (date !== today) {
          collapsed.add(date);
        }
      });
      setCollapsedDates(collapsed);
    }
  }, [grouped, today]);

  const toggleDateCollapse = (date) => {
    // Do not allow collapsing today's group
    if (date === today) return;
    setCollapsedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };


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
    try {
      await axios.put(`/api/action-items/${it.id}`, { [field]: value });
      fetchItems();
      if (field === 'priority') setEditingPriorityId(null);
      if (field === 'status') setEditingStatusId(null);
    } catch {
      toast.error('Update failed');
    }
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
        <button onClick={openAdd} className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 rounded text-xs transition flex items-center gap-1">
          <Plus size={14} /> Add Action Item
        </button>
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
          grouped.map(([date, rows]) => {
            const isCollapsed = collapsedDates.has(date);
            const isToday = date === today;
            return (
              <div key={date} className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => toggleDateCollapse(date)}
                    className={`text-gray-400 ${isToday ? 'cursor-default opacity-60' : 'hover:text-white'} transition-colors`}
                    title={isToday ? 'Today is always expanded' : (isCollapsed ? 'Expand' : 'Collapse')}
                    disabled={isToday}
                  >
                    {isCollapsed && !isToday ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                  </button>
                  <div className="text-sm text-gray-400">
                    {new Date(date).toDateString()}
                    {isToday && <span className="ml-2 text-xs bg-cyan-600/20 text-cyan-400 px-2 py-0.5 rounded">Today</span>}
                    <span className="ml-2 text-xs text-gray-500">({rows.length} items)</span>
                  </div>
                </div>
                {!isCollapsed && (
                  <div className="bg-black border border-gray-800 rounded overflow-visible">
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
                          <tr
                            key={it.id}
                            className={`hover:bg-gray-900 ${it.status === 'Completed' ? 'opacity-60' : ''}`}
                          >
                            <td className="px-4 py-2 max-w-[420px]">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openViewDetails(it)}
                                  className={`text-left truncate transition-colors flex-1 ${it.status === 'Completed' ? 'text-gray-500 hover:text-gray-400' : 'hover:text-cyan-400'}`}
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
                                {it.comments?.length > 0 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openComments(it);
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 bg-cyan-600/20 text-cyan-400 rounded text-xs hover:bg-cyan-600/30 flex-shrink-0"
                                    title={`${it.comments.length} ${it.comments.length === 1 ? 'note' : 'notes'} available`}
                                  >
                                    <MessageSquare size={14} />
                                    <span>{it.comments.length}</span>
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              {editingPriorityId === it.id ? (
                                <select
                                  autoFocus
                                  className="bg-gray-900 border border-gray-800 rounded px-2 py-1 text-xs"
                                  value={it.priority}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => updateQuick(it, 'priority', e.target.value)}
                                  onBlur={() => setEditingPriorityId(null)}
                                >
                                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Pill text={it.priority} kind="priority" />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingStatusId(null);
                                      setEditingPriorityId(it.id);
                                    }}
                                    className="text-gray-500 hover:text-white"
                                    title="Edit priority"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2 text-gray-300">
                              {it.dependency_member_ids?.length ? (() => {
                                const id = it.dependency_member_ids[0];
                                const m = members.find(mm => mm.id === id);
                                return <span>{m ? `${m.name}${m.designation ? ` (${m.designation})` : ''}` : `#${id}`}</span>;
                              })() : (
                                <span className="text-gray-500 text-xs">None</span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              {editingStatusId === it.id ? (
                                <select
                                  autoFocus
                                  className="bg-gray-900 border border-gray-800 rounded px-2 py-1 text-xs"
                                  value={it.status}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => updateQuick(it, 'status', e.target.value)}
                                  onBlur={() => setEditingStatusId(null)}
                                >
                                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Pill text={it.status} />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingPriorityId(null);
                                      setEditingStatusId(it.id);
                                    }}
                                    className="text-gray-500 hover:text-white"
                                    title="Edit status"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2 overflow-visible">
                              <div className="flex items-center gap-2">
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenActionMenuId(prev => prev === it.id ? null : it.id);
                                    }}
                                    className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800"
                                    title="More actions"
                                  >
                                    <MoreVertical size={16} />
                                  </button>
                                  {openActionMenuId === it.id && (
                                    <div
                                      className="absolute right-0 mt-1 w-44 bg-black border border-gray-800 rounded shadow-lg z-50 py-1"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button onClick={() => { setOpenActionMenuId(null); openViewDetails(it); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-900 flex items-center gap-2">
                                        <Eye size={14} />
                                        <span>View Item</span>
                                      </button>
                                      <button onClick={() => { setOpenActionMenuId(null); openEdit(it); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-900 flex items-center gap-2">
                                        <Edit2 size={14} />
                                        <span>Edit Item</span>
                                      </button>
                                      <button onClick={() => { setOpenActionMenuId(null); openComments(it); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-900 flex items-center gap-2">
                                        {it.comments?.length ? <MessageSquare size={14} /> : <MessageSquarePlus size={14} />}
                                        <span>Add Note</span>
                                      </button>
                                      <button onClick={() => { setOpenActionMenuId(null); handleDuplicate(it); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-900 flex items-center gap-2">
                                        <Copy size={14} />
                                        <span>Duplicate Item</span>
                                      </button>
                                      <button
                                        onClick={() => { setOpenActionMenuId(null); requestDelete(it); }}
                                        disabled={it.status === 'Completed'}
                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-900 flex items-center gap-2 ${it.status === 'Completed' ? 'opacity-40 cursor-not-allowed' : 'text-red-400 hover:text-red-300'}`}
                                      >
                                        <Trash2 size={14} />
                                        <span>Delete</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })
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

      <Dialog
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        title="Action Item Notes"
        size="lg"
      >
        <div className="space-y-4">
          {commentingItem && (
            <>
              <div className="bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm whitespace-pre-wrap">
                {commentingItem.description}
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {commentingItem.comments?.length ? (
                  commentingItem.comments
                    .slice()
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .map((comment, index) => {
                      const commentId = comment._id || comment.id || `${comment.created_at}-${index}`;
                      const isEditingComment = editingCommentId === commentId;
                      return (
                        <div key={`${comment.created_at}-${index}`} className="bg-gray-900 border border-gray-800 rounded p-3">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="text-xs text-gray-500">
                              {new Date(comment.created_at).toLocaleString()}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => startEditComment(comment)}
                                disabled={commentingItem.status === 'Completed'}
                                className={`text-gray-400 ${commentingItem.status === 'Completed' ? 'opacity-40 cursor-not-allowed' : 'hover:text-white'}`}
                                title={commentingItem.status === 'Completed' ? 'Notes cannot be edited for completed items' : 'Edit note'}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => requestDeleteComment(comment)}
                                disabled={commentingItem.status === 'Completed'}
                                className={`text-gray-400 ${commentingItem.status === 'Completed' ? 'opacity-40 cursor-not-allowed' : 'hover:text-red-400'}`}
                                title={commentingItem.status === 'Completed' ? 'Notes cannot be deleted for completed items' : 'Delete note'}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          {isEditingComment ? (
                            <div className="space-y-3">
                              <textarea
                                value={editingCommentText}
                                onChange={(e) => setEditingCommentText(e.target.value)}
                                rows={4}
                                className="w-full bg-black border border-gray-800 rounded px-3 py-2 text-sm"
                              />
                              <div className="flex justify-end gap-2">
                                <button onClick={cancelEditComment} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs">Cancel</button>
                                <button onClick={handleUpdateComment} disabled={savingComment} className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 rounded text-xs disabled:opacity-50">
                                  {savingComment ? 'Saving...' : 'Update'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm whitespace-pre-wrap">{comment.text}</div>
                          )}
                        </div>
                      );
                    })
                ) : (
                  <div className="text-sm text-gray-500 text-center py-6">No notes added yet</div>
                )}
              </div>

              <div>
                <label className="block text-sm mb-1">Add Note</label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={4}
                  className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm"
                  placeholder="Add your comment or update here..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={() => setCommentsOpen(false)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm">Close</button>
                <button onClick={handleAddComment} disabled={savingComment} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm disabled:opacity-50">
                  {savingComment ? 'Saving...' : 'Add Note'}
                </button>
              </div>
            </>
          )}
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

      <ConfirmDialog
        isOpen={commentDeleteConfirmOpen}
        onClose={() => {
          setCommentDeleteConfirmOpen(false);
          setCommentToDelete(null);
        }}
        onConfirm={handleDeleteComment}
        title="Delete Note"
        message={commentToDelete ? `Do you want to delete this note added on ${new Date(commentToDelete.created_at).toLocaleString()}? This action cannot be undone.` : ''}
        confirmText="Delete Note"
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
