import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2, Circle, CheckCircle, Clock, PauseCircle } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../components/ToastContainer';
import { ConfirmDialog } from '../components/Dialog';

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-yellow-400', label: 'Pending' },
  inprogress: { icon: Circle, color: 'text-blue-400', label: 'In Progress' },
  complete: { icon: CheckCircle, color: 'text-green-400', label: 'Complete' },
  deferred: { icon: PauseCircle, color: 'text-gray-400', label: 'Deferred' }
};

export default function Goals() {
  const toast = useToast();
  const [goals, setGoals] = useState([]);
  const [members, setMembers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMember, setSelectedMember] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    member_id: '',
    year: new Date().getFullYear(),
    goal_text: '',
    description: '',
    status: 'pending',
    category_ids: []
  });

  // Category multi-select state
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState(null);

  useEffect(() => {
    fetchGoals();
    fetchMembers();
    fetchCategories();
  }, [selectedYear, selectedMember]);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const params = { year: selectedYear };
      if (selectedMember) params.member_id = selectedMember;
      const response = await axios.get('/api/goals', { params });
      setGoals(response.data || []);
    } catch (error) {
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await axios.get('/api/members?limit=1000');
      setMembers(response.data?.data || []);
    } catch (error) {
      toast.error('Failed to load members');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/goal-categories');
      setCategories(response.data || []);
    } catch (error) {
      toast.error('Failed to load categories');
    }
  };

  const openModal = (goal = null) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        member_id: goal.member_id,
        year: goal.year,
        goal_text: goal.goal_text,
        description: goal.description || '',
        status: goal.status,
        category_ids: goal.category_ids || []
      });
    } else {
      setEditingGoal(null);
      setFormData({
        member_id: '',
        year: new Date().getFullYear(),
        goal_text: '',
        description: '',
        status: 'pending',
        category_ids: []
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingGoal(null);
    setFormData({
      member_id: '',
      year: new Date().getFullYear(),
      goal_text: '',
      description: '',
      status: 'pending',
      category_ids: []
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingGoal) {
        await axios.put(`/api/goals/${editingGoal.id}`, formData);
        toast.success('Goal updated');
      } else {
        await axios.post('/api/goals', formData);
        toast.success('Goal added');
      }
      closeModal();
      fetchGoals();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save goal');
    }
  };

  const requestDelete = (goal) => {
    setGoalToDelete(goal);
    setConfirmDelete(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/goals/${goalToDelete.id}`);
      toast.success('Goal deleted');
      setConfirmDelete(false);
      setGoalToDelete(null);
      fetchGoals();
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Cannot delete this goal');
      } else {
        toast.error('Failed to delete goal');
      }
    }
  };

  const toggleCategory = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...prev.category_ids, categoryId]
    }));
  };

  const getStatusIcon = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = config.icon;
    return <Icon size={16} className={config.color} />;
  };

  const getMemberName = (memberId) => {
    const member = members.find(m => m.id === memberId);
    return member ? member.name : 'Unknown';
  };

  const getCategoryNames = (categoryIds) => {
    if (!categoryIds || categoryIds.length === 0) return null;
    return categoryIds.map(id => {
      const cat = categories.find(c => c.id === id);
      return cat ? cat.name : null;
    }).filter(Boolean).join(', ');
  };

  return (
    <>
      <div className="flex-1 overflow-auto">
        <header className="bg-black border-b border-gray-800 px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-cyan-400">OKR/Goals</h2>
              <p className="text-xs text-gray-500 mt-0.5">Track team member goals and objectives</p>
            </div>
            <button
              onClick={() => openModal()}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm flex items-center gap-2"
            >
              <Plus size={16} />
              Add Goal
            </button>
          </div>
        </header>

        <div className="p-6">
          {/* Filters */}
          <div className="mb-6 flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-600"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Member</label>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-600"
              >
                <option value="">All Members</option>
                {members.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Goals List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-cyan-400" />
            </div>
          ) : goals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No goals found for the selected criteria.
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map(goal => (
                <div
                  key={goal.id}
                  className="bg-black border border-gray-800 rounded p-4 hover:border-gray-700 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(goal.status)}
                          <span className="text-sm text-gray-400">
                            {STATUS_CONFIG[goal.status]?.label || goal.status}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {getMemberName(goal.member_id)} • {goal.year}
                        </span>
                      </div>
                      <h3 className="text-lg font-medium mb-1">{goal.goal_text}</h3>
                      {goal.description && (
                        <p className="text-sm text-gray-400 mb-2">{goal.description}</p>
                      )}
                      {getCategoryNames(goal.category_ids) && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {goal.category_ids.map(catId => {
                            const cat = categories.find(c => c.id === catId);
                            return cat ? (
                              <span
                                key={catId}
                                className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded"
                              >
                                {cat.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => openModal(goal)}
                        className="text-gray-400 hover:text-white p-1"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => requestDelete(goal)}
                        className="text-gray-400 hover:text-red-400 p-1"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black border border-gray-800 rounded-lg w-full max-w-lg mx-4">
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold text-cyan-400">
                {editingGoal ? 'Edit Goal' : 'Add Goal'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Member *</label>
                <select
                  required
                  value={formData.member_id}
                  onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-600"
                >
                  <option value="">Select member</option>
                  {members.map(member => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Year *</label>
                <select
                  required
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-600"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Goal *</label>
                <input
                  required
                  type="text"
                  value={formData.goal_text}
                  onChange={(e) => setFormData({ ...formData, goal_text: e.target.value })}
                  placeholder="Enter goal text"
                  className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter goal description"
                  rows={3}
                  className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-600"
                >
                  <option value="pending">Pending</option>
                  <option value="inprogress">In Progress</option>
                  <option value="complete">Complete</option>
                  <option value="deferred">Deferred</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Categories (Optional)</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                    className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm text-left flex items-center justify-between hover:border-cyan-600 focus:outline-none focus:border-cyan-600"
                  >
                    <span className="text-gray-400">Select categories...</span>
                    <Plus size={16} className="text-gray-500" />
                  </button>
                  {categoryDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded border border-gray-800 bg-black shadow-lg">
                      <div className="py-1">
                        {categories.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">No categories available. Add in Masters page.</div>
                        ) : (
                          categories.map(category => (
                            <button
                              type="button"
                              key={category.id}
                              onClick={() => toggleCategory(category.id)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-900 flex items-center gap-2"
                            >
                              <span className={formData.category_ids.includes(category.id) ? 'text-cyan-400' : 'text-gray-400'}>
                                {formData.category_ids.includes(category.id) ? '✓' : '○'}
                              </span>
                              {category.name}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                  {formData.category_ids.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.category_ids.map(catId => {
                        const cat = categories.find(c => c.id === catId);
                        return cat ? (
                          <span
                            key={catId}
                            className="px-2 py-1 bg-cyan-600/20 text-cyan-400 text-xs rounded flex items-center gap-1"
                          >
                            {cat.name}
                            <button
                              type="button"
                              onClick={() => toggleCategory(catId)}
                              className="hover:text-cyan-300"
                            >
                              ✕
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm"
                >
                  {editingGoal ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => {
          setConfirmDelete(false);
          setGoalToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Goal?"
        message={`Are you sure you want to delete this goal? ${goalToDelete?.status === 'complete' || goalToDelete?.status === 'inprogress' ? 'Note: This goal is ' + goalToDelete?.status + '. Only pending or deferred goals can be deleted.' : ''}`}
        confirmText="Delete"
        type="danger"
      />
    </>
  );
}
