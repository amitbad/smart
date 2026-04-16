import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, Plus } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../components/ToastContainer';
import Dialog from '../components/Dialog';

export default function AddMember() {
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    designation: '',
    level: '',
    manager_id: ''
  });

  const [selectedSkills, setSelectedSkills] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [designationInput, setDesignationInput] = useState('');
  const [managers, setManagers] = useState([]);
  const [rmEnabled, setRmEnabled] = useState(false);
  const [rmQuery, setRmQuery] = useState('');
  const [rmOpen, setRmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSkillDialog, setShowSkillDialog] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');

  useEffect(() => {
    fetchSkills();
    fetchManagers();
    fetchDesignations();
  }, []);

  const fetchSkills = async () => {
    try {
      const response = await axios.get('/api/skills');
      setAvailableSkills(response.data);
    } catch (error) {
      toast.error('Failed to load skills');
    }
  };

  const fetchDesignations = async () => {
    try {
      const res = await axios.get('/api/designations');
      setDesignations(res.data || []);
    } catch (e) {
      // silent fail, still allow manual entry
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await axios.get('/api/members?limit=1000');
      setManagers(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load managers');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSkillToggle = (skillId) => {
    setSelectedSkills(prev =>
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const handleAddNewSkill = async () => {
    if (!newSkillName.trim()) {
      toast.error('Skill name cannot be empty');
      return;
    }

    try {
      const response = await axios.post('/api/skills', { name: newSkillName.trim() });
      setAvailableSkills(prev => [...prev, response.data]);
      setSelectedSkills(prev => [...prev, response.data.id]);
      setNewSkillName('');
      setShowSkillDialog(false);
      toast.success('Skill added successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add skill');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }

    setLoading(true);

    try {
      await axios.post('/api/members', {
        ...formData,
        level: formData.level || null,
        manager_id: rmEnabled && formData.manager_id ? formData.manager_id : null,
        skills: selectedSkills
      });

      toast.success('Member added successfully');
      navigate('/members');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="bg-black border-b border-gray-800 px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-cyan-400">Add Member</h2>
            <p className="text-xs text-gray-500 mt-0.5">Create a new team member</p>
          </div>
          <button
            onClick={() => navigate('/members')}
            className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded text-xs transition"
          >
            <X size={14} className="inline mr-1" />
            Cancel
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl">
          <form onSubmit={handleSubmit} className="bg-black rounded-lg border border-gray-800 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-600"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Designation</label>
                {designations.length > 0 ? (
                  <div className="flex gap-2">
                    <select
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-600"
                    >
                      <option value="">Select designation</option>
                      {designations.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-600"
                  />
                )}
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={designationInput}
                    onChange={(e) => setDesignationInput(e.target.value)}
                    placeholder="Add new designation"
                    className="flex-1 bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-600"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      const name = designationInput.trim();
                      if (!name) return;
                      try {
                        const resp = await axios.post('/api/designations', { name });
                        setDesignations(prev => {
                          const exists = prev.some(d => d.name.toLowerCase() === resp.data.name.toLowerCase());
                          return exists ? prev : [...prev, resp.data].sort((a, b) => a.name.localeCompare(b.name));
                        });
                        setFormData(prev => ({ ...prev, designation: resp.data.name }));
                        setDesignationInput('');
                        toast.success('Designation added');
                      } catch (err) {
                        toast.error(err.response?.data?.error || 'Failed to add designation');
                      }
                    }}
                    className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm"
                  >Add</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Level</label>
                <input
                  type="text"
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-600"
                  placeholder="e.g., A1, A2, 3, 10"
                />
              </div>

              <div className="col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Resource Manager (RM)</label>
                  <label className="text-xs flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rmEnabled}
                      onChange={(e) => {
                        setRmEnabled(e.target.checked);
                        if (!e.target.checked) {
                          setFormData(prev => ({ ...prev, manager_id: '' }));
                          setRmQuery('');
                          setRmOpen(false);
                        }
                      }}
                      className="rounded border-gray-700 text-cyan-600 focus:ring-cyan-600"
                    />
                    Assign RM
                  </label>
                </div>
                {rmEnabled && (
                  <div className="relative">
                    <input
                      type="text"
                      value={rmQuery}
                      onChange={(e) => { setRmQuery(e.target.value); setRmOpen(true); }}
                      onFocus={() => setRmOpen(true)}
                      placeholder="Search and select Resource Manager"
                      className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-600"
                    />
                    {rmOpen && (
                      <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded border border-gray-800 bg-black shadow-lg">
                        <div className="py-1">
                          {managers
                            .filter(m => {
                              const label = `${m.name}${m.designation ? ` (${m.designation})` : ''}`;
                              const q = rmQuery.toLowerCase();
                              return !q || label.toLowerCase().includes(q);
                            })
                            .slice(0, 100)
                            .map(m => {
                              const label = `${m.name}${m.designation ? ` (${m.designation})` : ''}`;
                              return (
                                <button
                                  type="button"
                                  key={m.id}
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, manager_id: m.id }));
                                    setRmQuery(label);
                                    setRmOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-900 ${formData.manager_id === m.id ? 'bg-gray-900' : ''}`}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          {managers.filter(m => {
                            const label = `${m.name}${m.designation ? ` (${m.designation})` : ''}`;
                            const q = rmQuery.toLowerCase();
                            return !q || label.toLowerCase().includes(q);
                          }).length === 0 && (
                              <div className="px-3 py-2 text-sm text-gray-500">No matches</div>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Primary Skills</label>
                  <button
                    type="button"
                    onClick={() => setShowSkillDialog(true)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <Plus size={12} />
                    Add New Skill
                  </button>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded p-3 max-h-48 overflow-y-auto">
                  {availableSkills.length === 0 ? (
                    <p className="text-sm text-gray-500">No skills available</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {availableSkills.map(skill => (
                        <label
                          key={skill.id}
                          className="flex items-center gap-2 cursor-pointer hover:bg-gray-800 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSkills.includes(skill.id)}
                            onChange={() => handleSkillToggle(skill.id)}
                            className="rounded border-gray-700 text-cyan-600 focus:ring-cyan-600"
                          />
                          <span className="text-sm">{skill.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-800">
              <button
                type="button"
                onClick={() => navigate('/members')}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded text-sm transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Member'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <Dialog
        isOpen={showSkillDialog}
        onClose={() => {
          setShowSkillDialog(false);
          setNewSkillName('');
        }}
        title="Add New Skill"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Skill Name</label>
            <input
              type="text"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-600"
              placeholder="e.g., React, Python, Leadership"
              onKeyPress={(e) => e.key === 'Enter' && handleAddNewSkill()}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowSkillDialog(false);
                setNewSkillName('');
              }}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition"
            >
              Cancel
            </button>
            <button
              onClick={handleAddNewSkill}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm transition"
            >
              Add Skill
            </button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
