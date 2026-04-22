import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Plus, X, Trash2, Edit, Info, Search } from 'lucide-react';
import Dialog, { ConfirmDialog } from '../components/Dialog';

export default function InterviewQuestions() {
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [catMap, setCatMap] = useState({}); // skillId -> categoryId
  const [addEditOpen, setAddEditOpen] = useState(false);
  const [form, setForm] = useState({ id: '', category_id: '', question_text: '', difficulty: 'Low' });
  const [confirmDel, setConfirmDel] = useState({ open: false, id: null });
  const [newCategory, setNewCategory] = useState('');
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkSkill, setBulkSkill] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [bulkParsed, setBulkParsed] = useState([]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const [bulkDefaultDiff, setBulkDefaultDiff] = useState('Low');

  const difficulties = ['Low', 'Medium', 'High'];

  useEffect(() => {
    (async () => {
      await loadCategories();
      await buildCategoryMap();
    })();
  }, []);

  useEffect(() => {
    // Rebuild map whenever skills change
    buildCategoryMap();
  }, [categories]);

  useEffect(() => {
    fetchQuestions();
  }, [page, limit, categoryFilter, search, diffFilter]);

  useEffect(() => {
    // live parse bulk text
    const lines = String(bulkText || '')
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);
    const re = /^Q\d+\.?\s*(.+?)(?:\s*\((Easy|Medium|High|Low|Hard)\))?\s*$/i;
    const items = [];
    for (const l of lines) {
      const m = l.match(re);
      if (!m) continue;
      const qt = m[1].trim();
      const diffRaw = (m[2] || bulkDefaultDiff).toLowerCase();
      let difficulty = 'Low';
      if (diffRaw === 'medium') difficulty = 'Medium';
      else if (diffRaw === 'high' || diffRaw === 'hard') difficulty = 'High';
      else difficulty = 'Low';
      if (qt) items.push({ question_text: qt, difficulty });
    }
    setBulkParsed(items);
  }, [bulkText, bulkDefaultDiff]);

  const loadCategories = async () => {
    try {
      // Load from Masters > Skills to keep Skills as the single source of truth
      const res = await axios.get('/api/skills');
      setCategories(res.data || []);
    } catch { }
  };

  const buildCategoryMap = async () => {
    try {
      const res = await axios.get('/api/interview-questions/categories');
      const existingCats = res.data || [];
      const byName = new Map(existingCats.map(c => [c.name.toLowerCase(), c.id]));
      const map = {};
      for (const s of categories) {
        if (s?.name) {
          const cid = byName.get(String(s.name).toLowerCase());
          if (cid) map[s.id] = cid;
        }
      }
      setCatMap(map);
    } catch { setCatMap({}); }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const category_id = categoryFilter ? catMap[categoryFilter] : '';
      const res = await axios.get('/api/interview-questions', { params: { page, limit, category_id, search, difficulty: diffFilter } });
      setQuestions(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 0);
      setTotalRecords(res.data.pagination?.totalRecords || 0);
    } catch {
      setQuestions([]);
      setTotalPages(0);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setForm({ id: '', category_id: '', question_text: '', difficulty: 'Low' });
    setAddEditOpen(true);
  };
  const openEdit = (q) => {
    // Map existing category name to a skill id if possible
    const name = (q?.category_id?.name || '').toLowerCase();
    let skillId = '';
    if (name) {
      const hit = categories.find(s => (s.name || '').toLowerCase() === name);
      if (hit) skillId = hit.id;
    }
    setForm({ id: q.id, category_id: skillId, question_text: q.question_text, difficulty: q.difficulty || 'Low' });
    setAddEditOpen(true);
  };
  const saveQuestion = async () => {
    if (!form.category_id || !form.question_text.trim()) return;
    // Resolve category id from selected skill id
    const skill = categories.find(s => s.id === form.category_id);
    let categoryId = catMap[form.category_id];
    if (!categoryId && skill?.name) {
      // Ensure a category exists with the same name (backend POST returns existing if found)
      const catRes = await axios.post('/api/interview-questions/categories', { name: skill.name });
      categoryId = catRes.data?.id;
      setCatMap(prev => ({ ...prev, [form.category_id]: categoryId }));
    }
    if (!categoryId) return;
    const payload = { category_id: categoryId, question_text: form.question_text.trim(), difficulty: form.difficulty };
    if (form.id) {
      await axios.put(`/api/interview-questions/${form.id}`, payload);
    } else {
      await axios.post(`/api/interview-questions`, payload);
    }
    setAddEditOpen(false);
    fetchQuestions();
  };
  const deleteQuestion = async (id) => {
    await axios.delete(`/api/interview-questions/${id}`);
    setConfirmDel({ open: false, id: null });
    fetchQuestions();
  };
  const addCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    const res = await axios.post('/api/interview-questions/categories', { name });
    setCategories((prev) => (prev.some((c) => c.id === res.data.id) ? prev : [...prev, res.data]).sort((a, b) => a.name.localeCompare(b.name)));
    setNewCategory('');
  };

  const getCategoryName = (q) => {
    if (!q.category_id) return '';
    if (typeof q.category_id === 'object' && q.category_id.name) return q.category_id.name;
    const id = typeof q.category_id === 'object' ? q.category_id.id : q.category_id;
    const found = categories.find((s) => s.id === id);
    return found?.name || '';
  };

  const exportCSV = async () => {
    try {
      setExporting(true);
      // fetch all (large limit) with current filter
      const exportCategoryId = categoryFilter ? catMap[categoryFilter] : '';
      const res = await axios.get('/api/interview-questions', { params: { page: 1, limit: 10000, category_id: exportCategoryId, search, difficulty: diffFilter } });
      const rows = res.data?.data || [];
      const header = ['Row', 'Skill', 'Question', 'Difficulty'];
      const csvRows = [header];
      rows.forEach((q, idx) => {
        const cat = getCategoryName(q) || '';
        const question = (q.question_text || '').replaceAll('"', '""');
        const diff = q.difficulty || '';
        csvRows.push([
          String(idx + 1),
          `"${cat.replaceAll('"', '""')}"`,
          `"${question}"`,
          `"${diff.replaceAll('"', '""')}"`
        ]);
      });
      const csv = csvRows.map(r => r.join(',')).join('\n');
      const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
      const blob = new Blob([bom, csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'interview-questions.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="bg-black rounded-lg border border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-cyan-400">Interview Questions</h2>
            <span className="text-xs text-gray-500">{totalRecords} total</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search question..." className="pl-7 pr-3 py-2 bg-gray-900 border border-gray-800 rounded text-sm focus:outline-none focus:border-cyan-600" />
            </div>
            <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-600">
              <option value="">All skills</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              {['', 'Low', 'Medium', 'High'].map(d => (
                <button key={d || 'All'} onClick={() => { setDiffFilter(d); setPage(1); }} className={`px-2 py-1 rounded text-xs border ${diffFilter === d ? 'bg-cyan-600/20 border-cyan-600 text-cyan-300' : 'bg-gray-900 border-gray-700 text-gray-400'}`}>
                  {d || 'All'}
                </button>
              ))}
            </div>
            <button onClick={openAdd} className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 rounded text-xs transition flex items-center gap-1">
              <Plus size={14} /> Add Question
            </button>
            <button onClick={() => setBulkOpen(true)} className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-700/40 rounded text-xs transition">
              Bulk add
            </button>
            <button onClick={exportCSV} disabled={exporting} className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded text-xs transition">
              {exporting ? 'Exporting…' : 'Export (Excel)'}
            </button>
          </div>
        </div>

        {/* Category add removed: manage in Masters > Skills */}

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr className="text-left text-xs text-gray-500">
                  <th className="px-3 py-2 font-semibold">Skill</th>
                  <th className="px-3 py-2 font-semibold">Question</th>
                  <th className="px-3 py-2 font-semibold">Difficulty</th>
                  <th className="px-3 py-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {questions.map(q => (
                  <tr key={q.id} className="hover:bg-gray-900 transition">
                    <td className="px-3 py-2 text-sm text-gray-300">{getCategoryName(q) || '-'}</td>
                    <td className="px-3 py-2 text-sm text-gray-200">{q.question_text}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${q.difficulty === 'High' ? 'bg-red-600/20 text-red-300 border border-red-600/30' : q.difficulty === 'Medium' ? 'bg-yellow-600/20 text-yellow-300 border border-yellow-600/30' : 'bg-green-600/20 text-green-300 border border-green-600/30'}`}>{q.difficulty}</span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(q)} className="text-gray-500 hover:text-white" title="Edit"><Edit size={16} /></button>
                        <button onClick={() => setConfirmDel({ open: true, id: q.id })} className="text-gray-500 hover:text-red-400" title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800 text-sm text-gray-400">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed">Prev</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
          </div>
        </div>
      </div>

      <Dialog isOpen={addEditOpen} onClose={() => setAddEditOpen(false)} title={`${form.id ? 'Edit' : 'Add'} Question`}>
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Skill</label>
            <select value={form.category_id} onChange={(e) => setForm(f => ({ ...f, category_id: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-600">
              <option value="">Select skill</option>
              {categories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Question</label>
            <textarea rows={4} value={form.question_text} onChange={(e) => setForm(f => ({ ...f, question_text: e.target.value }))} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-600" />
          </div>
          <div>
            <label className="block text-sm mb-1">Difficulty</label>
            <div className="flex gap-2">
              {difficulties.map(d => (
                <label key={d} className={`text-xs px-2 py-1 rounded border cursor-pointer ${form.difficulty === d ? 'bg-cyan-600/20 border-cyan-600 text-cyan-300' : 'bg-gray-900 border-gray-700 text-gray-400'}`}>
                  <input type="radio" name="difficulty" value={d} checked={form.difficulty === d} onChange={() => setForm(f => ({ ...f, difficulty: d }))} className="hidden" />
                  {d}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setAddEditOpen(false)} className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded text-xs">Cancel</button>
          <button onClick={saveQuestion} className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 rounded text-xs">{form.id ? 'Update' : 'Add'}</button>
        </div>
      </Dialog>

      <ConfirmDialog
        isOpen={confirmDel.open}
        onClose={() => setConfirmDel({ open: false, id: null })}
        onConfirm={() => deleteQuestion(confirmDel.id)}
        title="Delete Question?"
        message="Are you sure you want to delete this question? This cannot be undone."
        confirmText="Delete"
        type="danger"
      />

      <Dialog isOpen={bulkOpen} onClose={() => { if (!bulkSaving) setBulkOpen(false); }} title="Bulk add Questions" size="xl">
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Skill</label>
            <select disabled={bulkSaving} value={bulkSkill} onChange={(e) => setBulkSkill(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-600">
              <option value="">Select skill</option>
              {categories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm mb-1">Paste questions (e.g., Q1. ... (Easy))</label>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-400">Default difficulty:</span>
                <div className="flex gap-1">
                  {['Low', 'Medium', 'High'].map(d => (
                    <button key={d} type="button" onClick={() => setBulkDefaultDiff(d)} className={`px-2 py-0.5 rounded border ${bulkDefaultDiff === d ? 'bg-cyan-600/20 border-cyan-600 text-cyan-300' : 'bg-gray-900 border-gray-700 text-gray-400'}`}>{d}</button>
                  ))}
                </div>
              </div>
            </div>
            <textarea disabled={bulkSaving} rows={8} value={bulkText} onChange={(e) => setBulkText(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-600" />
          </div>
          <div className="text-xs text-gray-400">Detected {bulkParsed.length} question(s)</div>
          <div className="max-h-64 overflow-auto bg-gray-950 border border-gray-900 rounded">
            <table className="w-full text-xs">
              <thead className="bg-gray-900">
                <tr className="text-left text-gray-500">
                  <th className="px-3 py-1">#</th>
                  <th className="px-3 py-1">Question</th>
                  <th className="px-3 py-1">Difficulty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {bulkParsed.map((it, i) => (
                  <tr key={i}>
                    <td className="px-3 py-1 text-gray-500">{i + 1}</td>
                    <td className="px-3 py-1 text-gray-200">{it.question_text}</td>
                    <td className="px-3 py-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${it.difficulty === 'High' ? 'bg-red-600/20 text-red-300 border border-red-600/30' : it.difficulty === 'Medium' ? 'bg-yellow-600/20 text-yellow-300 border border-yellow-600/30' : 'bg-green-600/20 text-green-300 border border-green-600/30'}`}>{it.difficulty}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button disabled={bulkSaving} onClick={() => { setBulkError(''); setBulkOpen(false); }} className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded text-xs">Cancel</button>
          <button disabled={bulkSaving || !bulkSkill || bulkParsed.length === 0} onClick={async () => {
            try {
              setBulkSaving(true);
              const sk = categories.find(c => c.id === bulkSkill);
              await axios.post('/api/interview-questions/bulk', { skill_id: bulkSkill, skill_name: sk?.name, text: bulkText });
              setBulkOpen(false);
              setBulkText('');
              setBulkSkill('');
              fetchQuestions();
            } catch (e) {
              setBulkError(e?.response?.data?.error || 'Failed to bulk add questions');
            } finally {
              setBulkSaving(false);
            }
          }} className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 rounded text-xs">{bulkSaving ? 'Adding…' : 'Confirm add'}</button>
        </div>
        {bulkError ? <div className="mt-2 text-xs text-red-400">{bulkError}</div> : null}
      </Dialog>
    </div>
  );
}
