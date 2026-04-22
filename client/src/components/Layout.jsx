import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Network, Table, Settings, User, LogOut, Key, ListTodo, Layers, Mail, Briefcase, Bell, Link as LinkIcon, Target, Calendar, FileText, X, ClipboardList, Folder, ChevronDown, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useToast } from './ToastContainer';

export default function Layout({ children, user, onLogout }) {
  const toast = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [fieldsOpen, setFieldsOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const [todayCount, setTodayCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [todayActions, setTodayActions] = useState([]);
  const [todayEmails, setTodayEmails] = useState([]);
  const [activeEvents, setActiveEvents] = useState([]);
  const [dismissedActionIds, setDismissedActionIds] = useState(new Set());
  const [dismissedEmailIds, setDismissedEmailIds] = useState(new Set());
  const [eventsError, setEventsError] = useState(false);
  const [emailsError, setEmailsError] = useState(false);
  const [actionsError, setActionsError] = useState(false);
  const retryRef = useState({ events: null, emails: null, actions: null })[0];

  const formatEventRange = (event) => {
    const start = event?.start_date ? new Date(event.start_date).toLocaleDateString() : '';
    const end = event?.end_date ? new Date(event.end_date).toLocaleDateString() : '';
    if (start && end && start !== end) return `${start} - ${end}`;
    return start || end || 'No date';
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        // Action items (today)
        try {
          const ai = await axios.get('/api/action-items', { params: { date: today } });
          const a = Array.isArray(ai.data) ? ai.data : [];
          setTodayActions(a);
          if (actionsError) toast.success('Action items are back online');
          setActionsError(false);
        } catch (err) {
          setTodayActions([]);
          setActionsError(true);
          if (!retryRef.actions) {
            retryRef.actions = setTimeout(() => { retryRef.actions = null; fetchAll(); }, 15000);
          }
        }

        // Emails (today)
        try {
          const em = await axios.get('/api/emails', { params: { reply_by: today } });
          const e = Array.isArray(em.data) ? em.data : [];
          setTodayEmails(e);
          if (emailsError) toast.success('Emails are back online');
          setEmailsError(false);
        } catch (err) {
          setTodayEmails([]);
          setEmailsError(true);
          if (!retryRef.emails) {
            retryRef.emails = setTimeout(() => { retryRef.emails = null; fetchAll(); }, 15000);
          }
        }
        // Load important events with graceful degradation
        try {
          const eventsRes = await axios.get('/api/important-events', { params: { activeOnly: true } });
          const ev = Array.isArray(eventsRes.data) ? eventsRes.data : [];
          setActiveEvents(ev);
          if (eventsError) toast.success('Events are back online');
          setEventsError(false);
        } catch (err) {
          // Transient drop (e.g., Atlas free tier). Show message and schedule retry.
          setActiveEvents([]);
          setEventsError(true);
          if (!retryRef.events) {
            retryRef.events = setTimeout(() => {
              retryRef.events = null;
              fetchAll();
            }, 15000);
          }
        }

        const validActionIds = new Set(a.map(item => item.id));
        const validEmailIds = new Set(e.map(item => item.id));
        setDismissedActionIds(prev => {
          const next = new Set();
          prev.forEach(id => { if (validActionIds.has(id)) next.add(id); });
          return next;
        });
        setDismissedEmailIds(prev => {
          const next = new Set();
          prev.forEach(id => { if (validEmailIds.has(id)) next.add(id); });
          return next;
        });
      } catch {
        setTodayActions([]);
        setTodayEmails([]);
        setActiveEvents([]);
        setTodayCount(0);
      }
    };
    fetchAll();
    // Auto-refresh when network comes back online
    const handleOnline = () => fetchAll();
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
      if (retryRef.events) { clearTimeout(retryRef.events); retryRef.events = null; }
      if (retryRef.emails) { clearTimeout(retryRef.emails); retryRef.emails = null; }
      if (retryRef.actions) { clearTimeout(retryRef.actions); retryRef.actions = null; }
    };
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname.startsWith('/masters') || location.pathname.startsWith('/projects')) {
      setFieldsOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    const visibleActions = todayActions.filter(a => !dismissedActionIds.has(a.id));
    const visibleEmails = todayEmails.filter(e => !dismissedEmailIds.has(e.id));
    setTodayCount(visibleActions.length + visibleEmails.length);
  }, [todayActions, todayEmails, dismissedActionIds, dismissedEmailIds]);

  const dismissAction = (id) => {
    setDismissedActionIds(prev => new Set([...prev, id]));
  };

  const dismissEmail = (id) => {
    setDismissedEmailIds(prev => new Set([...prev, id]));
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950 text-gray-100">
      <aside
        className={`${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'
          } bg-black border-r border-gray-800 transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          {!sidebarCollapsed && (
            <h1 className="text-lg font-bold text-cyan-400">SMART</h1>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-gray-500 hover:text-white"
          >
            <Menu size={18} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <Link
            to="/"
            title="Hierarchy"
            aria-label="Hierarchy"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${isActive('/')
              ? 'bg-cyan-600 text-white'
              : 'text-gray-400 hover:bg-gray-900 hover:text-white'
              }`}
          >
            <Network size={16} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>Hierarchy</span>}
          </Link>

          <Link
            to="/emails"
            title="Emails"
            aria-label="Emails"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${isActive('/emails')
              ? 'bg-cyan-600 text-white'
              : 'text-gray-400 hover:bg-gray-900 hover:text-white'
              }`}
          >
            <Mail size={16} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>Emails</span>}
          </Link>

          <Link
            to="/bench"
            title="Bench"
            aria-label="Bench"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${isActive('/bench')
              ? 'bg-cyan-600 text-white'
              : 'text-gray-400 hover:bg-gray-900 hover:text-white'
              }`}
          >
            <Briefcase size={16} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>Bench</span>}
          </Link>

          <Link
            to="/important-links"
            title="Important Links"
            aria-label="Important Links"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${isActive('/important-links')
              ? 'bg-cyan-600 text-white'
              : 'text-gray-400 hover:bg-gray-900 hover:text-white'
              }`}
          >
            <LinkIcon size={16} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>Important Links</span>}
          </Link>

          <Link
            to="/important-events"
            title="Important Events"
            aria-label="Important Events"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${isActive('/important-events')
              ? 'bg-cyan-600 text-white'
              : 'text-gray-400 hover:bg-gray-900 hover:text-white'
              }`}
          >
            <Calendar size={16} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>Important Events</span>}
          </Link>

          <div className="space-y-1">
            <button
              onClick={() => setFieldsOpen(v => !v)}
              title="Fields"
              aria-label="Fields"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${fieldsOpen ? 'text-gray-200' : 'text-gray-400'} hover:bg-gray-900 hover:text-white`}
            >
              <Layers size={16} className="flex-shrink-0" />
              {!sidebarCollapsed && <span className="flex-1 text-left">Fields</span>}
              {!sidebarCollapsed && (fieldsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
            </button>
            {fieldsOpen && (
              <div className={`space-y-1 ${sidebarCollapsed ? 'pl-0' : 'pl-6'}`}>
                <Link
                  to="/masters"
                  title="Masters"
                  aria-label="Masters"
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${isActive('/masters')
                    ? 'bg-cyan-600 text-white'
                    : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                    }`}
                >
                  <Folder size={14} className="flex-shrink-0" />
                  {!sidebarCollapsed && <span>Masters</span>}
                </Link>
                <Link
                  to="/projects"
                  title="Projects"
                  aria-label="Projects"
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${isActive('/projects')
                    ? 'bg-cyan-600 text-white'
                    : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                    }`}
                >
                  <ClipboardList size={14} className="flex-shrink-0" />
                  {!sidebarCollapsed && <span>Projects</span>}
                </Link>
              </div>
            )}
          </div>

          <Link
            to="/action-items"
            title="Action Items"
            aria-label="Action Items"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${isActive('/action-items')
              ? 'bg-cyan-600 text-white'
              : 'text-gray-400 hover:bg-gray-900 hover:text-white'
              }`}
          >
            <ListTodo size={16} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>Action Items</span>}
          </Link>

          <Link
            to="/goals"
            title="Goals"
            aria-label="Goals"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${isActive('/goals')
              ? 'bg-cyan-600 text-white'
              : 'text-gray-400 hover:bg-gray-900 hover:text-white'
              }`}
          >
            <Target size={16} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>Goals</span>}
          </Link>

          <Link
            to="/smart-notes"
            title="Smart Notes"
            aria-label="Smart Notes"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${isActive('/smart-notes')
              ? 'bg-cyan-600 text-white'
              : 'text-gray-400 hover:bg-gray-900 hover:text-white'
              }`}
          >
            <FileText size={16} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>Smart Notes</span>}
          </Link>

          <Link
            to="/interview-questions"
            title="Questions"
            aria-label="Questions"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${isActive('/interview-questions')
              ? 'bg-cyan-600 text-white'
              : 'text-gray-400 hover:bg-gray-900 hover:text-white'
              }`}
          >
            <FileText size={16} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>Questions</span>}
          </Link>

          <Link
            to="/requirements"
            title="Requirements"
            aria-label="Requirements"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${isActive('/requirements')
              ? 'bg-cyan-600 text-white'
              : 'text-gray-400 hover:bg-gray-900 hover:text-white'
              }`}
          >
            <ClipboardList size={16} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>Requirements</span>}
          </Link>

          <Link
            to="/members"
            title="Members"
            aria-label="Members"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${isActive('/members') || location.pathname.startsWith('/members')
              ? 'bg-cyan-600 text-white'
              : 'text-gray-400 hover:bg-gray-900 hover:text-white'
              }`}
          >
            <Table size={16} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>Members</span>}
          </Link>

          <Link
            to="/settings"
            title="Settings"
            aria-label="Settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${isActive('/settings')
              ? 'bg-cyan-600 text-white'
              : 'text-gray-400 hover:bg-gray-900 hover:text-white'
              }`}
          >
            <Settings size={16} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>Settings</span>}
          </Link>

          <Link
            to="/change-password"
            title="Change Password"
            aria-label="Change Password"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${isActive('/change-password')
              ? 'bg-cyan-600 text-white'
              : 'text-gray-400 hover:bg-gray-900 hover:text-white'
              }`}
          >
            <Key size={16} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>Change Password</span>}
          </Link>
        </nav>

        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-2 px-3 py-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-cyan-600 flex items-center justify-center flex-shrink-0">
              <User size={14} />
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{user?.username || 'User'}</p>
                <p className="text-xs text-gray-500">{user?.role || 'USER'}</p>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-900 hover:text-red-400 transition"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-gray-950">
        <div className="h-12 flex items-center justify-between px-4 border-b border-gray-800 bg-black relative gap-3">
          <div className="flex items-center gap-2 min-w-0 overflow-hidden">
            <span className="text-[11px] text-gray-500 whitespace-nowrap">Important reminders</span>
            {activeEvents.length === 0 ? (
              eventsError ? (
                <div className="flex items-center gap-2 text-xs text-orange-300 whitespace-nowrap bg-orange-500/10 border border-orange-500/30 px-2 py-1 rounded">
                  <span>Events temporarily unavailable. Retrying…</span>
                  <button
                    onClick={() => {
                      if (retryRef.events) { clearTimeout(retryRef.events); retryRef.events = null; }
                      // Force a refresh attempt now
                      (async () => {
                        try {
                          const eventsRes = await axios.get('/api/important-events', { params: { activeOnly: true } });
                          const ev = Array.isArray(eventsRes.data) ? eventsRes.data : [];
                          setActiveEvents(ev);
                          if (eventsError) toast.success('Events are back online');
                          setEventsError(false);
                        } catch {
                          setEventsError(true);
                        }
                      })();
                    }}
                    className="px-2 py-0.5 rounded bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-200"
                  >
                    Retry now
                  </button>
                </div>
              ) : (
                <span className="text-xs text-gray-600 whitespace-nowrap">No active events</span>
              )
            ) : (
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                {activeEvents.slice(0, 3).map((event) => (
                  <button
                    key={event.id}
                    onClick={() => navigate('/important-events')}
                    className="flex items-center gap-1.5 px-2 py-1 rounded bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs whitespace-nowrap hover:bg-orange-500/20"
                    title={`${event.event_name} (${formatEventRange(event)})`}
                  >
                    <Calendar size={12} />
                    <span className="max-w-[200px] truncate">{event.event_name}</span>
                  </button>
                ))}
                {activeEvents.length > 3 && (
                  <button
                    onClick={() => navigate('/important-events')}
                    className="px-2 py-1 rounded bg-gray-800 text-gray-300 text-xs whitespace-nowrap hover:bg-gray-700"
                  >
                    +{activeEvents.length - 3} more
                  </button>
                )}
              </div>
            )}
          </div>
          <button onClick={() => setNotifOpen(v => !v)} className="relative p-2 rounded hover:bg-gray-900 text-gray-300" title="Today's Items">
            <Bell size={18} />
            {todayCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full">{todayCount}</span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-4 top-12 w-96 bg-gray-950 border border-gray-700 rounded-lg shadow-2xl ring-1 ring-gray-700/70 z-20 overflow-hidden">
              <div className="px-3 py-2 border-b border-gray-800 text-sm text-gray-300 flex items-center justify-between bg-gradient-to-b from-gray-900 to-gray-950">
                <span>Today's Overview</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setNotifOpen(false);
                  }}
                  className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800 transition"
                  title="Close notifications"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="max-h-80 overflow-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600/50 hover:scrollbar-thumb-gray-500/70">
                <div className="px-3 py-2 text-xs text-gray-500 font-semibold">Emails to reply today</div>
                {todayEmails.filter(em => !dismissedEmailIds.has(em.id)).length === 0 ? (
                  emailsError ? (
                    <div className="px-3 pb-2">
                      <div className="flex items-center gap-2 text-xs text-orange-300 whitespace-nowrap bg-orange-500/10 border border-orange-500/30 px-2 py-1 rounded">
                        <span>Emails temporarily unavailable. Retrying…</span>
                        <button
                          onClick={async () => {
                            if (retryRef.emails) { clearTimeout(retryRef.emails); retryRef.emails = null; }
                            try {
                              const today = new Date().toISOString().slice(0, 10);
                              const em = await axios.get('/api/emails', { params: { reply_by: today } });
                              const e = Array.isArray(em.data) ? em.data : [];
                              setTodayEmails(e);
                              if (emailsError) toast.success('Emails are back online');
                              setEmailsError(false);
                            } catch { setEmailsError(true); }
                          }}
                          className="px-2 py-0.5 rounded bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-200"
                        >
                          Retry now
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="px-3 pb-2 text-xs text-gray-600">None</div>
                  )
                ) : todayEmails.filter(em => !dismissedEmailIds.has(em.id)).map(em => (
                  <div key={em.id} className="px-3 py-2 hover:bg-gray-900/80 cursor-pointer border-b border-gray-900 last:border-b-0 group flex items-start gap-3" onClick={() => { setNotifOpen(false); navigate('/emails'); }}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-200 truncate" title={em.subject}>{em.subject}</div>
                      <div className="text-xs text-gray-500 truncate">{em.sender}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissEmail(em.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 p-1 rounded hover:bg-gray-800 flex-shrink-0 transition-all"
                      title="Dismiss notification"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <div className="px-3 pt-3 text-xs text-gray-500 font-semibold">Action items for today</div>
                {todayActions.filter(ai => !dismissedActionIds.has(ai.id)).length === 0 ? (
                  actionsError ? (
                    <div className="px-3 pb-3">
                      <div className="flex items-center gap-2 text-xs text-orange-300 whitespace-nowrap bg-orange-500/10 border border-orange-500/30 px-2 py-1 rounded">
                        <span>Action items temporarily unavailable. Retrying…</span>
                        <button
                          onClick={async () => {
                            if (retryRef.actions) { clearTimeout(retryRef.actions); retryRef.actions = null; }
                            try {
                              const today = new Date().toISOString().slice(0, 10);
                              const ai = await axios.get('/api/action-items', { params: { date: today } });
                              const a = Array.isArray(ai.data) ? ai.data : [];
                              setTodayActions(a);
                              if (actionsError) toast.success('Action items are back online');
                              setActionsError(false);
                            } catch { setActionsError(true); }
                          }}
                          className="px-2 py-0.5 rounded bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-200"
                        >
                          Retry now
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="px-3 pb-3 text-xs text-gray-600">None</div>
                  )
                ) : todayActions.filter(ai => !dismissedActionIds.has(ai.id)).map(ai => (
                  <div key={ai.id} className="px-3 py-2 hover:bg-gray-900/80 cursor-pointer border-b border-gray-900 last:border-b-0 group flex items-start gap-3" onClick={() => { setNotifOpen(false); navigate('/action-items'); }}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-200 truncate" title={ai.description}>{ai.description}</div>
                      <div className="text-xs text-gray-500">{ai.priority}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissAction(ai.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 p-1 rounded hover:bg-gray-800 flex-shrink-0 transition-all"
                      title="Dismiss notification"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {children}
      </main>
    </div>
  );
}
