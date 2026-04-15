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
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSkillDialog, setShowSkillDialog] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');

  useEffect(() => {
    fetchSkills();
    fetchManagers();
  }, []);

  const fetchSkills = async () => {
    try {
      const response = await axios.get('/api/skills');
      setAvailableSkills(response.data);
    } catch (error) {
      toast.error('Failed to load skills');
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await axios.get('/api/members');
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
        level: formData.level ? parseInt(formData.level) : null,
        manager_id: formData.manager_id || null,
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
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Level</label>
                <input
                  type="number"
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  min="1"
                  max="10"
                  className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Manager</label>
                <select
                  name="manager_id"
                  value={formData.manager_id}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-600"
                >
                  <option value="">No Manager</option>
                  {managers.map(manager => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name} - {manager.designation || 'N/A'}
                    </option>
                  ))}
                </select>
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
