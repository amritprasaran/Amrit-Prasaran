import { useState, useEffect } from 'react';
import { UserPlus, Trash2, ShieldCheck, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ADMIN_EMAIL } from '../../firebase';
import {
  subscribeEditorInvites,
  upsertEditorInviteInCloud,
  deleteEditorInviteInCloud,
} from '../../services/cloudSync';
import { logAdminActivity } from '../../services/dataService';
import { EditorInvite } from '../../types';

export default function EditorManagement() {
  const { user, isSuperAdmin } = useAuth();
  const [invites, setInvites] = useState<EditorInvite[]>([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'editor' | 'admin'>('editor');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSuperAdmin) return;
    return subscribeEditorInvites(setInvites);
  }, [isSuperAdmin]);

  if (!isSuperAdmin) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-lg text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-700 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Super Admin Only</h1>
        <p className="text-sm text-slate-600">
          Only the primary owner (<strong>{ADMIN_EMAIL}</strong>) can grant or revoke editor and correspondent access.
        </p>
      </div>
    );
  }

  const handleAddEditor = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid Google email address.');
      return;
    }
    if (!cleanName) {
      setError('Please enter the correspondent or editor name.');
      return;
    }
    if (cleanEmail === ADMIN_EMAIL.toLowerCase()) {
      setError(`${ADMIN_EMAIL} already has permanent Super Admin access.`);
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const invite: EditorInvite = {
        email: cleanEmail,
        name: cleanName,
        role,
        addedBy: user?.email || ADMIN_EMAIL,
        addedAt: new Date().toISOString(),
      };
      await upsertEditorInviteInCloud(invite);
      logAdminActivity(`Granted ${role} access to ${cleanName} (${cleanEmail})`);
      setEmail('');
      setName('');
      setRole('editor');
    } catch {
      setError('Could not save editor invite. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (invite: EditorInvite) => {
    await deleteEditorInviteInCloud(invite.email);
    logAdminActivity(`Revoked editor access for ${invite.email}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Reporters &amp; Editors Team
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Grant verified Google accounts CMS access so J&amp;K correspondents can publish stories and upload E-Papers without touching code.
        </p>
      </div>

      {/* Super Admin Badge */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{ADMIN_EMAIL}</p>
            <p className="text-xs text-slate-500">Primary Super Admin (Protected)</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 text-xs font-semibold shrink-0">
          Owner
        </span>
      </div>

      {/* Add New Editor / Reporter Form */}
      <form
        onSubmit={e => void handleAddEditor(e)}
        className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 space-y-4"
      >
        <h2 className="font-bold text-slate-900 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-red-700" />
          <span>Add Correspondent or Editor</span>
        </h2>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="editor-name" className="block text-xs font-medium text-slate-600 mb-1">
              Correspondent Name
            </label>
            <input
              id="editor-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={100}
              placeholder="e.g. Rajouri Bureau"
              className="w-full p-2.5 text-sm border border-slate-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label htmlFor="editor-email" className="block text-xs font-medium text-slate-600 mb-1">
              Google Email Address
            </label>
            <input
              id="editor-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              maxLength={150}
              placeholder="reporter@gmail.com"
              className="w-full p-2.5 text-sm border border-slate-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label htmlFor="editor-role" className="block text-xs font-medium text-slate-600 mb-1">
              Role
            </label>
            <select
              id="editor-role"
              value={role}
              onChange={e => setRole(e.target.value === 'admin' ? 'admin' : 'editor')}
              className="w-full p-2.5 text-sm border border-slate-300 rounded-lg bg-white"
            >
              <option value="editor">Reporter / Desk Editor</option>
              <option value="admin">Co-Admin</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {saving ? 'Saving...' : 'Grant Editor Access'}
        </button>
      </form>

      {/* Active Invited Team */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="p-3 sm:p-4 text-left font-semibold text-slate-700">Name</th>
              <th className="p-3 sm:p-4 text-left font-semibold text-slate-700">Google Email</th>
              <th className="p-3 sm:p-4 text-left font-semibold text-slate-700">Role</th>
              <th className="p-3 sm:p-4 text-left font-semibold text-slate-700">Added</th>
              <th className="p-3 sm:p-4 text-left font-semibold text-slate-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {invites.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-500">
                  No additional correspondents or editors added yet.
                </td>
              </tr>
            ) : (
              invites.map(inv => (
                <tr key={inv.email} className="border-b border-slate-100 last:border-0">
                  <td className="p-3 sm:p-4 font-semibold text-slate-900">{inv.name}</td>
                  <td className="p-3 sm:p-4 text-slate-600">{inv.email}</td>
                  <td className="p-3 sm:p-4">
                    <span className="px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-semibold capitalize">
                      {inv.role}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4 text-slate-500 text-xs tabular-nums">
                    {new Date(inv.addedAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="p-3 sm:p-4">
                    <button
                      type="button"
                      onClick={() => void handleRevoke(inv)}
                      className="inline-flex items-center gap-1 text-red-600 hover:underline text-xs font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Revoke
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
