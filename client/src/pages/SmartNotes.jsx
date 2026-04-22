import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Plus, Save, FileText, Sparkles, Clock3 } from 'lucide-react';
import { useToast } from '../components/ToastContainer';

function stripLeadingNumbering(text) {
  // Remove patterns like '1. ', '1) ', '1.abc', '2)abc', or multiple numbering tokens
  return (text || '').replace(/^\s*(\d+[\.)]\s*)+/, '').trim();
}

function parseDetectedActions(content) {
  return (content || '')
    .split(/\r?\n/)
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line.includes('@action_item'))
    .map(({ line, index }) => ({
      lineNumber: index + 1,
      text: stripLeadingNumbering(line.replace(/@action_item/gi, '').trim())
    }))
    .filter(item => item.text);
}

export default function SmartNotes() {
  const toast = useToast();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    content: ''
  });
  const editorRef = useRef(null);
  const highlighterRef = useRef(null);
  const [tagHint, setTagHint] = useState(null); // {suggest:string, from:number, to:number}
  const saveTimerRef = useRef(null);
  const lastSavedRef = useRef({ title: '', content: '', id: null });

  const detectedActions = useMemo(() => parseDetectedActions(form.content), [form.content]);

  const highlightedHtml = useMemo(() => {
    const escapeHtml = (s) => (s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const withEscapes = escapeHtml(form.content);
    // Highlight @action_item tokens
    const withTags = withEscapes.replace(/@action_item/gi, (m) => `<span class="text-cyan-400 font-semibold">${m}</span>`);
    return withTags;
  }, [form.content]);

  // Keep overlay scroll aligned whenever content changes
  useEffect(() => {
    handleScrollSync();
  }, [form.content]);

  useEffect(() => {
    fetchNotes();
  }, []);

  // Debounced auto-save when content/title changes
  useEffect(() => {
    const dirty =
      form.title !== lastSavedRef.current.title ||
      form.content !== lastSavedRef.current.content ||
      selectedNoteId !== lastSavedRef.current.id;
    if (!dirty) return;
    if (!form.content.trim()) return; // don't auto-save empty notes

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      autoSaveSilent();
    }, 1200);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [form.title, form.content, selectedNoteId]);

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

  const handleScrollSync = () => {
    if (editorRef.current && highlighterRef.current) {
      highlighterRef.current.scrollTop = editorRef.current.scrollTop;
      highlighterRef.current.scrollLeft = editorRef.current.scrollLeft;
    }
  };

  const ACTION_TAG = '@action_item';

  function getTokenAtPosition(text, pos) {
    if (!text || pos == null) return { start: pos, end: pos, token: '' };
    const isSpace = (ch) => /\s/.test(ch);
    let start = pos;
    while (start > 0 && !isSpace(text[start - 1])) start--;
    let end = pos;
    while (end < text.length && !isSpace(text[end])) end++;
    const token = text.slice(start, end);
    return { start, end, token };
  }

  const handleEditorKeyDown = (e) => {
    if (e.key === 'Tab' && editorRef.current) {
      const el = editorRef.current;
      const { selectionStart } = el;
      const { start, end, token } = getTokenAtPosition(el.value, selectionStart);
      const lower = token.toLowerCase();
      if (lower.startsWith('@') && ACTION_TAG.startsWith(lower)) {
        e.preventDefault();
        const before = el.value.slice(0, start);
        const after = el.value.slice(end);
        const insert = ACTION_TAG + ' ';
        const next = before + insert + after;
        setForm(prev => ({ ...prev, content: next }));
        // Place caret after inserted tag + space
        const nextPos = before.length + insert.length;
        requestAnimationFrame(() => {
          el.focus();
          el.setSelectionRange(nextPos, nextPos);
        });
        setTagHint(null);
      }
    }
  };

  const handleEditorChange = (e) => {
    const val = e.target.value;
    setForm(prev => ({ ...prev, content: val }));
    if (editorRef.current) {
      const { selectionStart } = editorRef.current;
      const { token } = getTokenAtPosition(val, selectionStart);
      const lower = (token || '').toLowerCase();
      if (lower.startsWith('@') && ACTION_TAG.startsWith(lower) && lower !== ACTION_TAG) {
        setTagHint({ suggest: ACTION_TAG.slice(lower.length) });
      } else {
        setTagHint(null);
      }
    }
  };

  const resetEditor = () => {
    setSelectedNoteId(null);
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setForm({ title: `Meeting - ${yyyy}-${mm}-${dd}`, content: '' });
  };

  const openNote = (note) => {
    setSelectedNoteId(note.id);
    setForm({
      title: note.title || '',
      content: note.content || ''
    });
    setTagHint(null);
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
      lastSavedRef.current = { title: saved.title || '', content: saved.content || '', id: saved.id };
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to save smart note');
    } finally {
      setSaving(false);
    }
  };

  const autoSaveSilent = async () => {
    try {
      setAutoSaving(true);
      const payload = { title: form.title, content: form.content };
      const res = selectedNoteId
        ? await axios.put(`/api/smart-notes/${selectedNoteId}`, payload)
        : await axios.post('/api/smart-notes', payload);
      const saved = res.data;
      if (!selectedNoteId) {
        setSelectedNoteId(saved.id);
        fetchNotes();
      }
      lastSavedRef.current = { title: saved.title || '', content: saved.content || '', id: saved.id };
    } catch (e) {
      // silent; we can surface a subtle indicator later
    } finally {
      setAutoSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-hidden">
      <header className="bg-gray-900 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-cyan-300">Smart Notes</h2>
          <p className="text-xs text-gray-400 mt-0.5">Capture meeting notes and push tagged lines into Action Items</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={resetEditor} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs transition flex items-center gap-1">
            <Plus size={14} /> New Note
          </button>
          <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 rounded text-xs transition flex items-center gap-1 disabled:opacity-50">
            <Save size={14} /> {saving ? 'Saving...' : 'Save Note'}
          </button>
          {autoSaving ? <span className="text-[11px] text-gray-400 ml-2">Auto-saving…</span> : null}
        </div>
      </header>

      <div className="grid grid-cols-[280px_minmax(0,1fr)] h-full">
        <aside className="border-r border-gray-700 bg-gray-900 overflow-y-auto">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-200">Recent Notes</div>
              <div className="text-xs text-gray-400">Latest 50 saved notes</div>
            </div>
          </div>
          {loading ? (
            <div className="p-4 text-sm text-gray-400">Loading...</div>
          ) : notes.length === 0 ? (
            <div className="p-4 text-sm text-gray-400">No notes saved yet</div>
          ) : (
            <div className="p-2 space-y-2">
              {notes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => openNote(note)}
                  className={`w-full text-left rounded-lg border px-3 py-3 transition ${selectedNoteId === note.id ? 'border-cyan-600 bg-cyan-600/10' : 'border-gray-700 bg-gray-900 hover:bg-gray-800'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-200 truncate">{note.title || 'Untitled Note'}</div>
                      <div className="text-xs text-gray-400 mt-1 line-clamp-2">{note.content}</div>
                    </div>
                    <FileText size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-center justify-between mt-3 text-[11px] text-gray-400">
                    <span>{new Date(note.note_date || note.created_at).toLocaleString()}</span>
                    <span>{note.detected_actions?.length || 0} action{(note.detected_actions?.length || 0) === 1 ? '' : 's'}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>

        <div className="overflow-y-auto p-6 bg-gray-900">
          <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Title (optional)</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                  placeholder="e.g. Weekly design sync"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Meeting Notes</label>
                <div className="relative">
                  {/* Highlighter layer */}
                  <pre
                    ref={highlighterRef}
                    className="absolute inset-0 pointer-events-none whitespace-pre-wrap break-words text-sm leading-6 px-3 py-3 rounded bg-gray-900 overflow-auto font-sans"
                    dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                  />
                  {/* Editable layer */}
                  <textarea
                    ref={editorRef}
                    value={form.content}
                    onChange={handleEditorChange}
                    onKeyDown={handleEditorKeyDown}
                    onScroll={handleScrollSync}
                    rows={22}
                    className="w-full bg-transparent border border-gray-700 rounded px-3 py-3 text-sm leading-6 text-transparent caret-white selection:bg-cyan-600/30 relative font-sans"
                    placeholder={`Type notes naturally...\n\nExamples:\nFinalize API scope with vendor @action_item\nFollow up with HR on hiring tracker @action_item`}
                    style={{ WebkitTextFillColor: 'transparent' }}
                  />
                </div>
                {tagHint && (
                  <div className="mt-1 text-[11px] text-gray-400">
                    <span className="text-cyan-300">@action_item</span> — press <span className="px-1 py-0.5 bg-gray-800 rounded border border-gray-700">Tab</span> to complete
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center gap-2 text-cyan-300/90 mb-2">
                  <Sparkles size={16} />
                  <h3 className="text-sm font-semibold">Tag Rules</h3>
                </div>
                <div className="text-xs text-gray-400 leading-6">
                  <div>Use <span className="text-cyan-300">@action_item</span> anywhere in a line.</div>
                  <div>That full line will be pushed to Action Items.</div>
                  <div>Default save values: today, Medium priority, Not Started.</div>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-cyan-300/90">
                    <Sparkles size={16} />
                    <h3 className="text-sm font-semibold">Detected Action Items</h3>
                  </div>
                  <span className="text-xs text-gray-400">{detectedActions.length}</span>
                </div>
                {detectedActions.length === 0 ? (
                  <div className="text-xs text-gray-400">No `@action_item` lines detected yet.</div>
                ) : (
                  <div className="space-y-2 max-h-[360px] overflow-y-auto scrollbar-none">
                    {detectedActions.map((item) => (
                      <div key={`${item.lineNumber}-${item.text}`} className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2">
                        <div className="text-[11px] text-gray-400 mb-1">Line {item.lineNumber}</div>
                        <div className="text-sm text-gray-300">{item.text}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center gap-2 text-cyan-300/90 mb-2">
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
