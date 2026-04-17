import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, Plus } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../components/ToastContainer';
import Dialog, { ConfirmDialog } from '../components/Dialog';

export default function AddMember() {
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    designation: '',
    level: '',
    manager_id: '',
    location_id: ''
  });

  const [selectedSkills, setSelectedSkills] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [locations, setLocations] = useState([]);
  const [designationInput, setDesignationInput] = useState('');
  const [managers, setManagers] = useState([]);
  const [rmEnabled, setRmEnabled] = useState(false);
  const [rmQuery, setRmQuery] = useState('');
  const [rmOpen, setRmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSkillDialog, setShowSkillDialog] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [skillDropdownOpen, setSkillDropdownOpen] = useState(false);
  const [confirmRemoveSkill, setConfirmRemoveSkill] = useState(false);
  const [skillToRemove, setSkillToRemove] = useState(null);
  const skillDropdownRef = useRef(null);

  useEffect(() => {
    fetchSkills();
    fetchManagers();
    fetchDesignations();
    fetchLocations();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (skillDropdownOpen && skillDropdownRef.current && !skillDropdownRef.current.contains(e.target)) {
        setSkillDropdownOpen(false);
      }
    };

    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [skillDropdownOpen]);

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

  const fetchLocations = async () => {
    try {
      const res = await axios.get('/api/locations');
      setLocations(res.data || []);
    } catch (e) {
      toast.error('Failed to load locations');
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

  const handleSkillAdd = (skillId) => {
    if (!selectedSkills.includes(skillId)) {
      setSelectedSkills(prev => [...prev, skillId]);
    }
    setSkillDropdownOpen(true);
  };

  const requestRemoveSkill = (skillId) => {
    setSkillToRemove(skillId);
    setConfirmRemoveSkill(true);
  };

  const confirmSkillRemoval = () => {
    if (skillToRemove) {
      setSelectedSkills(prev => prev.filter(id => id !== skillToRemove));
      setSkillToRemove(null);
    }
    setConfirmRemoveSkill(false);
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
        location_id: formData.location_id || null,
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
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Member Details */}
          <div className="lg:col-span-2 bg-black rounded-lg border border-gray-800 p-6">
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

              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <select
                  name="location_id"
                  value={formData.location_id}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-600"
                >
                  <option value="">Select city</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>{location.name}</option>
                  ))}
                </select>
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

            </div>
          </div>

          {/* Right Column - Skills */}
          <div className="lg:col-span-1 bg-black rounded-lg border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-cyan-400">Primary Skills</h3>
              <span className="text-xs text-gray-500">{selectedSkills.length} selected</span>
            </div>

            {/* Multi-select Dropdown */}
            <div className="relative mb-4" ref={skillDropdownRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSkillDropdownOpen(!skillDropdownOpen);
                }}
                className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm text-left flex items-center justify-between hover:border-cyan-600 focus:outline-none focus:border-cyan-600"
              >
                <span className="text-gray-400">Add skills...</span>
                <Plus size={16} className="text-gray-500" />
              </button>

              {skillDropdownOpen && (
                <div
                  className="absolute z-20 mt-2 w-full max-h-60 overflow-auto rounded-md border border-gray-700 bg-gray-950 shadow-xl ring-1 ring-gray-700/60"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <div className="py-1">
                    {availableSkills.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">No skills available. Add skills in Masters page.</div>
                    ) : (
                      availableSkills
                        .filter(skill => !selectedSkills.includes(skill.id))
                        .map(skill => (
                          <button
                            type="button"
                            key={skill.id}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleSkillAdd(skill.id)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-800 focus:bg-gray-800"
                          >
                            {skill.name}
                          </button>
                        ))
                    )}
                    {availableSkills.filter(skill => !selectedSkills.includes(skill.id)).length === 0 && selectedSkills.length > 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500">All skills selected</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Skills List */}
            {selectedSkills.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No skills selected
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {selectedSkills.map(skillId => {
                  const skill = availableSkills.find(s => s.id === skillId);
                  return skill ? (
                    <div
                      key={skillId}
                      className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800 rounded hover:border-cyan-600 transition"
                    >
                      <span className="text-sm">{skill.name}</span>
                      <button
                        type="button"
                        onClick={() => requestRemoveSkill(skillId)}
                        className="text-gray-400 hover:text-red-400 transition"
                        title="Remove skill"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="lg:col-span-3">
            <div className="bg-black rounded-lg border border-gray-800 p-4">
              <div className="flex items-center justify-end gap-3">
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
            </div>
          </div>
        </form>
      </div>

      <ConfirmDialog
        isOpen={confirmRemoveSkill}
        onClose={() => {
          setConfirmRemoveSkill(false);
          setSkillToRemove(null);
        }}
        onConfirm={confirmSkillRemoval}
        title="Remove Skill?"
        message={`Are you sure you want to unassign this skill from the member? This will only remove the skill assignment, not delete the skill itself.`}
        confirmText="Remove"
        type="danger"
      />
    </>
  );
}
