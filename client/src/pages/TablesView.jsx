import { useState, useEffect } from 'react';
import { Eye, Edit, Trash2, Plus, Download } from 'lucide-react';
import axios from 'axios';

export default function TablesView() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/api/employees');
      setEmployees(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (employee) => {
    return 'bg-green-600/20 text-green-400';
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
          <div>
            <h2 className="text-xl font-bold text-cyan-400">Employee Directory</h2>
            <p className="text-xs text-gray-500 mt-0.5">Manage all team members</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded text-xs transition">
              <Download size={14} className="inline mr-1" />
              Export
            </button>
            <button className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 rounded text-xs transition">
              <Plus size={14} className="inline mr-1" />
              Add Employee
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="bg-black rounded-lg border border-gray-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Team Members ({employees.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr className="text-left text-xs text-gray-500">
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Role</th>
                  <th className="px-5 py-3 font-semibold">Manager</th>
                  <th className="px-5 py-3 font-semibold">Level</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-900 transition">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-full ${getLevelColor(
                            employee.level
                          )} flex items-center justify-center flex-shrink-0`}
                        >
                          <span className="text-xs font-bold">
                            {employee.name.charAt(0)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{employee.name}</p>
                          {employee.email && (
                            <p className="text-xs text-gray-500 truncate">
                              {employee.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">{employee.designation || '-'}</td>
                    <td className="px-5 py-3 text-gray-400">
                      {employee.manager_name || '-'}
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded text-xs">
                        L{employee.level || 0}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 ${getStatusColor(
                          employee
                        )} rounded text-xs inline-flex items-center gap-1`}
                      >
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                        Active
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button className="text-cyan-400 hover:text-cyan-300 transition">
                          <Eye size={14} />
                        </button>
                        <button className="text-gray-500 hover:text-white transition">
                          <Edit size={14} />
                        </button>
                        <button className="text-gray-500 hover:text-red-400 transition">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
