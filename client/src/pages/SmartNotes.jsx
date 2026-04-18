import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Plus, Save, FileText, Sparkles, Clock3 } from 'lucide-react';
import { useToast } from '../components/ToastContainer';

function parseDetectedActions(content) {
  return (content || '')
    .split(/\r?\n/)
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line.includes('@action_item'))
    .map(({ line, index }) => ({
      lineNumber: index + 1,
      text: line.replace(/@action_item/gi, '').trim()
    }))
    .filter(item => item.text);
}

export default function SmartNotes() {
  const toast = useToast();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    content: ''
  });

  const detectedActions = useMemo(() => parseDetectedActions(form.content), [form.content]);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/smart-notes');
      const loadedNotes = res.data || [];
      setNotes(loadedNotes);
      if (!selectedNoteId && loadedNotes.length > 0) {
        const first = loadedNotes[0];
        setSelectedNoteId(first.id);
        setForm({
          title: first.title || '',
          content: first.content || ''
        });
      }
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to load smart notes');
    } finally {
      setLoading(false);
    }
  };

  const resetEditor = () => {
    setSelectedNoteId(null);
    setForm({ title: '', content: '' });
  };

  const openNote = (note) => {
    setSelectedNoteId(note.id);
    setForm({
      title: note.title || '',
      content: note.content || ''
    });
  };

  const handleSave = async () => {
    if (!form.content.trim()) {
      toast.error('Please enter your meeting notes');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        content: form.content
      };
      const res = selectedNoteId
        ? await axios.put(`/api/smart-notes/${selectedNoteId}`, payload)
        : await axios.post('/api/smart-notes', payload);

      const saved = res.data;
      toast.success(selectedNoteId ? 'Smart note updated' : 'Smart note saved');
      await fetchNotes();
      setSelectedNoteId(saved.id);
      setForm({
        title: saved.title || '',
        content: saved.content || ''
      });
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to save smart note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-hidden">
      <header className="bg-black border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-cyan-400">Smart Notes</h2>
          <p className="text-xs text-gray-500 mt-0.5">Capture meeting notes and push tagged lines into Action Items</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={resetEditor} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs transition flex items-center gap-1">
            <Plus size={14} /> New Note
          </button>
          <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 rounded text-xs transition flex items-center gap-1 disabled:opacity-50">
            <Save size={14} /> {saving ? 'Saving...' : 'Save Note'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-[280px_minmax(0,1fr)] h-full">
        <aside className="border-r border-gray-800 bg-black overflow-y-auto">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-200">Recent Notes</div>
              <div className="text-xs text-gray-500">Latest 50 saved notes</div>
            </div>
          </div>
          {loading ? (
            <div className="p-4 text-sm text-gray-500">Loading...</div>
          ) : notes.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No notes saved yet</div>
          ) : (
            <div className="p-2 space-y-2">
              {notes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => openNote(note)}
                  className={`w-full text-left rounded-lg border px-3 py-3 transition ${selectedNoteId === note.id ? 'border-cyan-600 bg-cyan-600/10' : 'border-gray-800 bg-gray-950 hover:bg-gray-900'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-100 truncate">{note.title || 'Untitled Note'}</div>
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">{note.content}</div>
                    </div>
                    <FileText size={14} className="text-gray-500 flex-shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-center justify-between mt-3 text-[11px] text-gray-500">
                    <span>{new Date(note.note_date || note.created_at).toLocaleString()}</span>
                    <span>{note.detected_actions?.length || 0} action{(note.detected_actions?.length || 0) === 1 ? '' : 's'}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>

        <div className="overflow-y-auto p-6 bg-gray-950">
          <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Title (optional)</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm"
                  placeholder="e.g. Weekly design sync"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Meeting Notes</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                  rows={22}
                  className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-3 text-sm leading-6"
                  placeholder={`Type notes naturally...\n\nExamples:\nFinalize API scope with vendor @action_item\nFollow up with HR on hiring tracker @action_item`}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-black border border-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-cyan-400 mb-2">
                  <Sparkles size={16} />
                  <h3 className="text-sm font-semibold">Tag Rules</h3>
                </div>
                <div className="text-xs text-gray-400 leading-6">
                  <div>Use <span className="text-cyan-400">@action_item</span> anywhere in a line.</div>
                  <div>That full line will be pushed to Action Items.</div>
                  <div>Default save values: today, Medium priority, Not Started.</div>
                </div>
              </div>

              <div className="bg-black border border-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Sparkles size={16} />
                    <h3 className="text-sm font-semibold">Detected Action Items</h3>
                  </div>
                  <span className="text-xs text-gray-500">{detectedActions.length}</span>
                </div>
                {detectedActions.length === 0 ? (
                  <div className="text-xs text-gray-500">No `@action_item` lines detected yet.</div>
                ) : (
                  <div className="space-y-2 max-h-[360px] overflow-y-auto scrollbar-none">
                    {detectedActions.map((item) => (
                      <div key={`${item.lineNumber}-${item.text}`} className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2">
                        <div className="text-[11px] text-gray-500 mb-1">Line {item.lineNumber}</div>
                        <div className="text-sm text-gray-200">{item.text}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-black border border-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-cyan-400 mb-2">
                  <Clock3 size={16} />
                  <h3 className="text-sm font-semibold">Save Behavior</h3>
                </div>
                <div className="text-xs text-gray-400 leading-6">
                  <div>Saving stores the full note with timestamp.</div>
                  <div>Tagged lines create or update linked action items.</div>
                  <div>Removed tagged lines delete linked action items unless already completed.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
