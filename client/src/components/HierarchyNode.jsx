import { useState } from 'react';
import { ChevronDown, ChevronRight, User, Users, Mail } from 'lucide-react';

export default function HierarchyNode({ employee, reportees, onNodeClick, level = 0 }) {
  const [isExpanded, setIsExpanded] = useState(level < 2);

  const hasReportees = reportees && reportees.length > 0;

  const getLevelColor = (lvl) => {
    const colors = {
      1: 'bg-cyan-600 border-cyan-500',
      2: 'bg-blue-600 border-blue-500',
      3: 'bg-purple-600 border-purple-500',
      4: 'bg-green-600 border-green-500',
      5: 'bg-orange-600 border-orange-500',
    };
    return colors[lvl] || 'bg-gray-600 border-gray-500';
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    if (onNodeClick) {
      onNodeClick(employee);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className={`bg-gray-900 border ${
          level === 0 ? 'border-cyan-600' : 'border-gray-700'
        } rounded-lg p-3 min-w-[180px] hover:border-cyan-600 cursor-pointer transition-all`}
        onClick={handleToggle}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-500 uppercase">
            {employee.designation || 'Employee'}
          </span>
          {hasReportees && (
            <button className="text-gray-600 hover:text-white">
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 mb-2">
          <div
            className={`w-7 h-7 rounded-full ${getLevelColor(
              employee.level
            )} flex items-center justify-center flex-shrink-0`}
          >
            <User size={14} />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{employee.name}</p>
            {employee.email && (
              <p className="text-xs text-gray-500 truncate">{employee.email}</p>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          {hasReportees && (
            <div className="flex items-center gap-1">
              <Users size={12} />
              <span>{reportees.length} Report{reportees.length !== 1 ? 's' : ''}</span>
            </div>
          )}
          {employee.level && (
            <div className="flex items-center gap-1">
              <span className="text-gray-600">Level:</span>
              <span>{employee.level}</span>
            </div>
          )}
        </div>
      </div>

      {hasReportees && isExpanded && (
        <>
          <div className="w-px h-6 bg-gray-700"></div>
          <div className="flex gap-3 flex-wrap justify-center">
            {reportees.map((reportee) => (
              <HierarchyNode
                key={reportee.id}
                employee={reportee}
                reportees={reportee.reportees}
                onNodeClick={onNodeClick}
                level={level + 1}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
