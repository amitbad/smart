import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Mail, User, Briefcase, TrendingUp, Users } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../components/ToastContainer';
import { ConfirmDialog } from '../components/Dialog';

export default function ViewMember() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [member, setMember] = useState(null);
  const [reportees, setReportees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState(false);

  useEffect(() => {
    fetchMember();
    fetchReportees();
  }, [id]);

  const fetchMember = async () => {
    try {
      const response = await axios.get(`/api/members/${id}`);
      setMember(response.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load member');
      navigate('/members');
    }
  };

  const fetchReportees = async () => {
    try {
      const response = await axios.get(`/api/members/${id}/reportees`);
      setReportees(response.data);
    } catch (error) {
      console.error('Failed to load reportees');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/members/${id}`);
      toast.success('Member deleted successfully');
      navigate('/members');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete member');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <header className="bg-black border-b border-gray-800 px-6 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/members')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Back to Members</span>
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/members/${id}/edit`)}
              className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded text-xs transition flex items-center gap-1"
            >
              <Edit size={14} />
              Edit
            </button>
            <button
              onClick={() => setDeleteDialog(true)}
              className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 text-red-400 rounded text-xs transition flex items-center gap-1"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl space-y-6">
          <div className="bg-black rounded-lg border border-gray-800 p-6">
            <div className="flex items-start gap-6">
              <div
                className={`w-20 h-20 rounded-full ${getLevelColor(
                  member.level
                )} flex items-center justify-center flex-shrink-0`}
              >
                <span className="text-2xl font-bold">
                  {member.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-1">{member.name}</h2>
                <p className="text-gray-400 mb-4">{member.designation || 'No designation'}</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Mail size={16} />
                    <span>{member.email}</span>
                  </div>
                  {member.level && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <TrendingUp size={16} />
                      <span>Level {member.level}</span>
                    </div>
                  )}
                  {member.manager_name && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <User size={16} />
                      <span>Reports to: {member.manager_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black rounded-lg border border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
              <Briefcase size={18} />
              Primary Skills
            </h3>
            {member.skills && member.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {member.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-cyan-600/20 text-cyan-400 border border-cyan-600/30 rounded-lg text-sm"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No skills added</p>
            )}
          </div>

          {reportees.length > 0 && (
            <div className="bg-black rounded-lg border border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                <Users size={18} />
                Direct Reports ({reportees.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {reportees.map((reportee) => (
                  <div
                    key={reportee.id}
                    onClick={() => navigate(`/members/${reportee.id}`)}
                    className="flex items-center gap-3 p-3 bg-gray-900 hover:bg-gray-800 rounded-lg cursor-pointer transition border border-gray-800"
                  >
                    <div
                      className={`w-10 h-10 rounded-full ${getLevelColor(
                        reportee.level
                      )} flex items-center justify-center flex-shrink-0`}
                    >
                      <span className="text-sm font-bold">
                        {reportee.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{reportee.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {reportee.designation || 'No designation'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Created At</p>
                <p className="text-gray-300">
                  {new Date(member.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Last Updated</p>
                <p className="text-gray-300">
                  {new Date(member.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Member"
        message={`Are you sure you want to delete ${member.name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
}
