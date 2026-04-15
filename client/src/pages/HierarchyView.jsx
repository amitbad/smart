import { useState, useEffect } from 'react';
import { Filter, Plus, Maximize2, Minimize2 } from 'lucide-react';
import HierarchyNode from '../components/HierarchyNode';
import axios from 'axios';

export default function HierarchyView() {
  const [members, setMembers] = useState([]);
  const [hierarchyData, setHierarchyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandAll, setExpandAll] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await axios.get('/api/members?limit=1000');
      setMembers(response.data.data || []);
      buildHierarchy(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching members:', error);
      setLoading(false);
    }
  };

  const buildHierarchy = (data) => {
    const memberMap = {};
    data.forEach((member) => {
      memberMap[member.id] = { ...member, reportees: [] };
    });

    let root = null;
    data.forEach((member) => {
      if (member.manager_id === null) {
        root = memberMap[member.id];
      } else if (memberMap[member.manager_id]) {
        memberMap[member.manager_id].reportees.push(memberMap[member.id]);
      }
    });

    setHierarchyData(root);
  };

  const handleNodeClick = (member) => {
    console.log('Clicked member:', member);
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
            <h2 className="text-xl font-bold text-cyan-400">Hierarchy View</h2>
            <p className="text-xs text-gray-500 mt-0.5">Team structure visualization</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded text-xs transition">
              <Filter size={14} className="inline mr-1" />
              Filter
            </button>
            <button className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 rounded text-xs transition">
              <Plus size={14} className="inline mr-1" />
              Add
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="bg-black rounded-lg p-5 mb-5 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
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
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              Organization Map
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setExpandAll(true)}
                className="px-2 py-1 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded text-xs transition"
              >
                <Maximize2 size={12} className="inline mr-1" />
                Expand All
              </button>
              <button
                onClick={() => setExpandAll(false)}
                className="px-2 py-1 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded text-xs transition"
              >
                <Minimize2 size={12} className="inline mr-1" />
                Collapse
              </button>
            </div>
          </div>

          <div className="overflow-x-auto pb-3 scrollbar-hide">
            {hierarchyData ? (
              <div className="inline-flex">
                <HierarchyNode
                  employee={hierarchyData}
                  reportees={hierarchyData.reportees}
                  onNodeClick={handleNodeClick}
                />
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No hierarchy data available
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
