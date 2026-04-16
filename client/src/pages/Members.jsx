import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../components/ToastContainer';
import { ConfirmDialog } from '../components/Dialog';

export default function Members() {
  const navigate = useNavigate();
  const toast = useToast();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalRecords: 0,
    totalPages: 0
  });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, member: null });
  const [rmConfirm, setRmConfirm] = useState({ isOpen: false, member: null, dependents: 0 });

  useEffect(() => {
    fetchMembers();
  }, [pagination.page, search, levelFilter]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/members', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search,
          level: levelFilter
        }
      });
      setMembers(response.data.data);
      setPagination(prev => ({
        ...prev,
        ...response.data.pagination
      }));
    } catch (error) {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearch(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleLevelFilter = (value) => {
    setLevelFilter(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (member) => {
    try {
      await axios.delete(`/api/members/${member.id}`);
      toast.success('Member deleted successfully');
      fetchMembers();
    } catch (error) {
      const status = error.response?.status;
      if (status === 409) {
        const dependents = error.response?.data?.dependents || 0;
        setRmConfirm({ isOpen: true, member, dependents });
      } else {
        toast.error(error.response?.data?.error || 'Failed to delete member');
      }
    }
  };

  const handleUnassignAndDelete = async (member) => {
    try {
      await axios.delete(`/api/members/${member.id}`, { params: { unassign: true } });
      toast.success('Unassigned dependents and deleted member');
      setRmConfirm({ isOpen: false, member: null, dependents: 0 });
      fetchMembers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to unassign and delete');
    }
  };

  const getLevelColor = (level) => {
    const colors = {
      1: 'bg-cyan-600',
      2: 'bg-blue-600',
      3: 'bg-purple-600',
      4: 'bg-green-600',
      5: 'bg-orange-600',
    };
    return colors[level] || 'bg-gray-600';
  };

  return (
    <>
      <header className="bg-black border-b border-gray-800 px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-cyan-400">Team Members</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {pagination.totalRecords} member{pagination.totalRecords !== 1 ? 's' : ''} total
            </p>
          </div>
          <button
            onClick={() => navigate('/members/add')}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 rounded text-xs transition"
          >
            <Plus size={14} className="inline mr-1" />
            Add Member
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="bg-black rounded-lg border border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by name, email, or designation..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-cyan-600"
                />
              </div>
              <select
                value={levelFilter}
                onChange={(e) => handleLevelFilter(e.target.value)}
                className="bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-600"
              >
                <option value="">All Levels</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                  <option key={level} value={level}>Level {level}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400">Loading...</div>
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-400 mb-4">No members found</p>
              <button
                onClick={() => navigate('/members/add')}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm transition"
              >
                <Plus size={16} className="inline mr-1" />
                Add First Member
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900">
                    <tr className="text-left text-xs text-gray-500">
                      <th className="px-5 py-3 font-semibold">Name</th>
                      <th className="px-5 py-3 font-semibold">Designation</th>
                      <th className="px-5 py-3 font-semibold">Manager</th>
                      <th className="px-5 py-3 font-semibold">Level</th>
                      <th className="px-5 py-3 font-semibold">Skills</th>
                      <th className="px-5 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {members.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-900 transition">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-8 h-8 rounded-full ${getLevelColor(
                                member.level
                              )} flex items-center justify-center flex-shrink-0`}
                            >
                              <span className="text-xs font-bold">
                                {member.name.charAt(0)}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm">{member.name}</p>
                              <p className="text-xs text-gray-500 truncate">
                                {member.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">{member.designation || '-'}</td>
                        <td className="px-5 py-3 text-gray-400">
                          {member.manager_name || '-'}
                        </td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded text-xs">
                            L{member.level || 0}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1">
                            {member.skills && member.skills.length > 0 ? (
                              member.skills.slice(0, 3).map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-cyan-600/20 text-cyan-400 rounded text-xs"
                                >
                                  {skill.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-500 text-xs">No skills</span>
                            )}
                            {member.skills && member.skills.length > 3 && (
                              <span className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded text-xs">
                                +{member.skills.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/members/${member.id}`)}
                              className="text-cyan-400 hover:text-cyan-300 transition"
                              title="View"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => navigate(`/members/${member.id}/edit`)}
                              className="text-gray-500 hover:text-white transition"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteDialog({ isOpen: true, member })}
                              className="text-gray-500 hover:text-red-400 transition"
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

              <div className="flex items-center justify-between p-4 border-t border-gray-800">
                <div className="text-sm text-gray-400">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.totalRecords)} of{' '}
                  {pagination.totalRecords} members
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm text-gray-400">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, member: null })}
        onConfirm={() => handleDelete(deleteDialog.member)}
        title="Delete Member"
        message={`Are you sure you want to delete ${deleteDialog.member?.name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      <ConfirmDialog
        isOpen={rmConfirm.isOpen}
        onClose={() => setRmConfirm({ isOpen: false, member: null, dependents: 0 })}
        onConfirm={() => handleUnassignAndDelete(rmConfirm.member)}
        title="Unassign RM & Delete?"
        message={`${rmConfirm.member?.name} is assigned as RM to ${rmConfirm.dependents} member(s). Do you want to unassign this RM from all associated members and delete this member?`}
        confirmText="Unassign RM & Delete"
        cancelText="Cancel"
        type="warning"
      />
    </>
  );
}
