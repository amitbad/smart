import { Database, Server, Palette } from 'lucide-react';

export default function Settings() {
  return (
    <>
      <header className="bg-black border-b border-gray-800 px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-cyan-400">Settings</h2>
            <p className="text-xs text-gray-500 mt-0.5">Configure your application</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl space-y-6">
          <div className="bg-black rounded-lg border border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-cyan-600/20 flex items-center justify-center">
                <Database className="text-cyan-400" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Database Configuration</h3>
                <p className="text-xs text-gray-500">PostgreSQL connection settings</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Database Host</label>
                <input
                  type="text"
                  defaultValue="localhost"
                  className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Port</label>
                  <input
                    type="text"
                    defaultValue="5432"
                    className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Database Name</label>
                  <input
                    type="text"
                    defaultValue="smart_organizer"
                    className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Username</label>
                  <input
                    type="text"
                    defaultValue="demo"
                    className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <input
                    type="password"
                    defaultValue="demo"
                    className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-600"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black rounded-lg border border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                <Server className="text-purple-400" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Server Configuration</h3>
                <p className="text-xs text-gray-500">API server settings</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">API Port</label>
                <input
                  type="text"
                  defaultValue="3001"
                  className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Environment</label>
                <select className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-600">
                  <option>development</option>
                  <option>production</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-black rounded-lg border border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center">
                <Palette className="text-green-400" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Appearance</h3>
                <p className="text-xs text-gray-500">Customize the look and feel</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Theme</label>
                <select className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-600">
                  <option>Dark (Default)</option>
                  <option disabled>Light (Coming Soon)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button className="px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded text-sm transition">
              Cancel
            </button>
            <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm transition">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
