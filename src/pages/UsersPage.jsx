import { useState, useEffect, useRef } from 'react';
import {
  Users,
  UserPlus,
  Pencil,
  Trash2,
  X,
  Check,
  Eye,
  EyeOff,
  AlertTriangle,
  Search,
  ChevronDown,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { api } from '../api';
import { useAuth, ROLE_LABELS } from '../context/AuthContext';

// Ordered list of all possible role values for the role selector dropdown
const ROLES = ['president', 'vice_president', 'general_manager', 'manager', 'supervisor', 'staff', 'viewer', 'admin'];

// Available department options shown in the user form dropdown
const DEPARTMENTS = [
  'HSE', 'Quality Control', 'Operations', 'Maintenance', 'Environment',
  'Engineering', 'Administration', 'Management', 'Logistics', 'Production',
];

// Available division options shown in the user form dropdown
const DIVISIONS = [
  'Management', 'Production', 'Engineering', 'Administration', 'HSE', 'Logistics',
];

// Blank/default state for the Add/Edit user form
const EMPTY_FORM = {
  name:       '',
  username:   '',
  password:   '',       // empty string = keep existing password when editing
  role:       'viewer', // default to least-privileged role
  department: '',
  division:   '',
  position:   '',
  email:      '',
};

/**
 * Derive 1–2 uppercase initials from a full name for the avatar bubble.
 * @param {string} name - User's display name
 */
function getInitials(name) {
  return (name || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// ─── UserModal ────────────────────────────────────────────────────────────────
/**
 * UserModal — a shared modal for both creating new users and editing existing ones.
 * Determines its mode based on whether editUser is provided.
 *
 * Props:
 *   editUser    The user object to edit (undefined/null = create mode)
 *   currentUser The currently logged-in admin (used to prevent self-demotion, etc.)
 *   onClose     Callback to close the modal without saving
 *   onSaved     Callback called with (savedUser, isEdit) after a successful save
 */
function UserModal({ editUser, currentUser, onClose, onSaved }) {
  const isEdit = !!editUser; // true = editing an existing user, false = creating new

  // Pre-fill form with existing data when editing; clear password field for security
  const [form, setForm] = useState(
    isEdit ? { ...editUser, password: '' } : EMPTY_FORM,
  );
  const [showPw, setShowPw] = useState(false);  // toggle password visibility
  const [saving, setSaving] = useState(false);  // true while API request is in flight
  const [error, setError]   = useState('');     // validation or API error message

  // Focus the first input when the modal opens
  const firstRef = useRef(null);
  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  /**
   * Update a single field in the form and clear any existing error.
   * @param {string} k - Field name
   * @param {any} v - New value
   */
  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setError('');
  };

  /**
   * Validate and submit the form.
   * When editing, if the password field is left empty, the field is omitted
   * from the payload so the existing password is not overwritten.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Client-side validation
    if (!form.name.trim())     return setError('Name is required');
    if (!form.username.trim()) return setError('Username is required');
    if (!isEdit && !form.password.trim()) return setError('Password is required for new accounts');
    if (!form.role)            return setError('Role is required');

    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      // Don't send an empty password on edit — keep the server's existing hash
      if (isEdit && !payload.password.trim()) delete payload.password;
      const saved = isEdit
        ? await api.updateUser(editUser.id, payload)
        : await api.createUser(payload);
      onSaved(saved, isEdit); // parent updates the local user list
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  // Role badge colors for the role selector preview
  const roleInfo = ROLE_LABELS[form.role];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700">
          <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
            <UserPlus size={18} className="text-indigo-400" />
            {isEdit ? 'Edit User' : 'Add New User'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 max-h-[70vh] overflow-y-auto"
        >
          {/* Name + Username */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Full Name *</label>
              <input
                ref={firstRef}
                className="input"
                placeholder="Ahmad Fauzi"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Username *</label>
              <input
                className="input"
                placeholder="ahmad.f"
                value={form.username}
                onChange={(e) => set('username', e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="label">
              Password{' '}
              {isEdit && (
                <span className="text-gray-600 font-normal normal-case">
                  (leave blank to keep unchanged)
                </span>
              )}
              {!isEdit && <span className="text-red-400">*</span>}
            </label>
            <div className="flex items-center gap-2 input-wrap">
              <input
                className="bg-transparent border-none outline-none text-sm text-gray-200 w-full placeholder-gray-600"
                type={showPw ? 'text' : 'password'}
                placeholder={isEdit ? '••••••••' : 'Min. 6 characters'}
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="text-gray-600 hover:text-gray-400 transition shrink-0"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="label">Role *</label>
            <div className="relative">
              <select
                className="input appearance-none pr-8 cursor-pointer"
                value={form.role}
                onChange={(e) => set('role', e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r].label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={15}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
              />
            </div>
            {form.role && (
              <p
                className="mt-1.5 text-xs px-2 py-1 rounded-lg inline-block font-medium"
                style={{
                  background: roleInfo.color + '20',
                  color: roleInfo.color,
                }}
              >
                {roleInfo.label}
              </p>
            )}
          </div>

          {/* Department + Division */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Department</label>
              <input
                className="input"
                list="dept-list"
                placeholder="HSE"
                value={form.department}
                onChange={(e) => set('department', e.target.value)}
              />
              <datalist id="dept-list">
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="label">Division</label>
              <input
                className="input"
                list="div-list"
                placeholder="Produksi"
                value={form.division}
                onChange={(e) => set('division', e.target.value)}
              />
              <datalist id="div-list">
                {DIVISIONS.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Position + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Position</label>
              <input
                className="input"
                placeholder="HSE Manager"
                value={form.position}
                onChange={(e) => set('position', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="nama@cpin.co.id"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </div>
          </div>

          {/* Self-demotion warning */}
          {isEdit &&
            editUser.id === currentUser.id &&
            form.role !== 'admin' && (
              <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
                <AlertTriangle
                  size={15}
                  className="text-amber-400 shrink-0 mt-0.5"
                />
                <p className="text-xs text-amber-400">
                  You are changing your own account role. Make sure there is
                  still another admin.
                </p>
              </div>
            )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <AlertTriangle size={14} className="text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-dark-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:text-indigo-400 text-white text-sm font-semibold rounded-xl transition"
          >
            {saving ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check size={15} />
                {isEdit ? 'Save Changes' : 'Create Account'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete confirm ───────────────────────────────────────────────────────────
function DeleteConfirm({ target, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto">
          <Trash2 size={26} className="text-red-400" />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-100">Delete User?</h3>
          <p className="text-sm text-gray-400 mt-1">
            Account{' '}
            <span className="text-gray-200 font-semibold">{target.name}</span>{' '}
            (@{target.username}) will be permanently deleted.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold text-gray-400 hover:text-gray-200 bg-dark-900 border border-dark-700 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-xl transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Trash2 size={15} />
            )}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function extractError(err) {
  return err.message || 'An error occurred';
}

// ─── Main Page ────────────────────────────────────────────────────────────────
/**
 * UsersPage — the user management screen (admin only).
 *
 * Lists all registered users with their role, department, and division.
 * Allows the admin to create, edit, or delete users.
 * Access is enforced by ProtectedRoute in App.jsx (only 'admin' role can reach this page).
 */
export default function UsersPage() {
  const { user: currentUser } = useAuth(); // the logged-in admin

  // ── State ──────────────────────────────────────────────────────────────────
  const [users, setUsers]       = useState([]);    // full list of registered users
  const [loading, setLoading]   = useState(true);  // true during initial fetch
  const [search, setSearch]     = useState('');    // text search (name, username, dept, position)
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' or a specific role value
  const [modal, setModal]       = useState(null);  // null | 'create' | { user } (edit)
  const [delTarget, setDelTarget] = useState(null); // user object pending deletion, or null
  const [delLoading, setDelLoading] = useState(false); // true while delete request is in flight

  /** Fetch the full user list from the API */
  const load = async () => {
    try {
      setUsers(await api.getUsers());
    } catch {
      // Silently fail — the empty list state is shown
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  // Apply text search and role filter to the user list
  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.department?.toLowerCase().includes(q) ||
      u.position?.toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  /**
   * Called by UserModal after a successful save.
   * Updates the local users list without a full refetch.
   * @param {object} saved - The saved user object returned by the API
   * @param {boolean} isEdit - true = update existing; false = append new
   */
  const handleSaved = (saved, isEdit) => {
    if (isEdit)
      setUsers((us) => us.map((u) => (u.id === saved.id ? saved : u)));
    else
      setUsers((us) => [...us, saved]);
    setModal(null);
  };

  /**
   * Execute the user deletion after the admin confirms in the dialog.
   * Removes the user from the local list on success.
   */
  const handleDelete = async () => {
    if (!delTarget) return;
    setDelLoading(true);
    try {
      await api.deleteUser(delTarget.id);
      setUsers((us) => us.filter((u) => u.id !== delTarget.id));
      setDelTarget(null);
    } catch (err) {
      alert('Failed to delete: ' + (err.message || 'error'));
    } finally {
      setDelLoading(false);
    }
  };

  // Count admins — used to warn before deleting the last admin account
  const adminCount = users.filter((u) => u.role === 'admin').length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-100 tracking-tight flex items-center gap-3">
            <Users size={28} className="text-indigo-400" />
            User Management
          </h1>
          <p className="text-base text-gray-400 mt-1">
            Manage user accounts, roles, and system access
          </p>
        </div>
        <button
          onClick={() => setModal('create')}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-indigo-500/20"
        >
          <UserPlus size={17} />
          Add User
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {ROLES.map((r) => {
          const info = ROLE_LABELS[r];
          const count = users.filter((u) => u.role === r).length;
          return (
            <button
              key={r}
              onClick={() => setRoleFilter((v) => (v === r ? 'all' : r))}
              className={`px-4 py-3 rounded-xl border text-left transition ${roleFilter === r ? 'border-opacity-60' : 'border-dark-700 bg-dark-800 hover:bg-dark-700'}`}
              style={
                roleFilter === r
                  ? {
                      borderColor: info.color + '60',
                      background: info.color + '12',
                    }
                  : {}
              }
            >
              <p
                className="text-xl font-extrabold"
                style={{ color: info.color }}
              >
                {count}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{info.label}</p>
            </button>
          );
        })}
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-3 bg-dark-800 border border-dark-700 rounded-xl px-4 py-1 focus-within:border-indigo-500/50 transition">
        <Search size={17} className="text-gray-500 shrink-0" />
        <input
          className="bg-transparent border-none outline-none text-sm text-gray-200 w-full placeholder-gray-600"
          placeholder="Search name, username, department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-gray-600 hover:text-gray-400 transition"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-500">
            <Loader2 size={28} className="animate-spin mr-3" />
            Loading users...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Users size={44} className="mx-auto mb-3 opacity-25" />
            <p>No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3.5 text-left font-bold">User</th>
                  <th className="px-4 py-3.5 text-left font-bold">Username</th>
                  <th className="px-4 py-3.5 text-left font-bold">Role</th>
                  <th className="px-4 py-3.5 text-left font-bold hidden md:table-cell">
                    Department
                  </th>
                  <th className="px-4 py-3.5 text-left font-bold hidden lg:table-cell">
                    Position
                  </th>
                  <th className="px-4 py-3.5 text-left font-bold hidden lg:table-cell">
                    Email
                  </th>
                  <th className="px-4 py-3.5 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/60">
                {filtered.map((u) => {
                  const info = ROLE_LABELS[u.role] || ROLE_LABELS.viewer;
                  const isSelf = u.id === currentUser.id;
                  const isLastAdmin = u.role === 'admin' && adminCount <= 1;
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-dark-700/40 transition group"
                    >
                      {/* Name + avatar */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                            style={{
                              background: info.color + '25',
                              color: info.color,
                            }}
                          >
                            {getInitials(u.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-200 flex items-center gap-1.5">
                              {u.name}
                              {isSelf && (
                                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-medium">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              {u.division || '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      {/* Username */}
                      <td className="px-4 py-3.5">
                        <code className="text-xs bg-dark-900 px-2 py-1 rounded-lg text-gray-400">
                          @{u.username}
                        </code>
                      </td>
                      {/* Role badge */}
                      <td className="px-4 py-3.5">
                        <span
                          className="text-xs font-bold px-2.5 py-1 rounded-lg"
                          style={{
                            background: info.color + '20',
                            color: info.color,
                          }}
                        >
                          {info.label}
                        </span>
                      </td>
                      {/* Department */}
                      <td className="px-4 py-3.5 text-gray-400 hidden md:table-cell">
                        {u.department || '—'}
                      </td>
                      {/* Position */}
                      <td className="px-4 py-3.5 text-gray-400 hidden lg:table-cell">
                        {u.position || '—'}
                      </td>
                      {/* Email */}
                      <td className="px-4 py-3.5 text-gray-500 text-xs hidden lg:table-cell">
                        {u.email || '—'}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setModal({ user: u })}
                            className="p-2 rounded-lg text-gray-600 hover:text-indigo-400 hover:bg-indigo-500/10 transition"
                            title="Edit user"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setDelTarget(u)}
                            disabled={isSelf || isLastAdmin}
                            className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
                            title={
                              isSelf
                                ? 'Cannot delete your own account'
                                : isLastAdmin
                                  ? 'At least one admin must remain'
                                  : 'Delete user'
                            }
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-dark-700/60 text-xs text-gray-600">
            Showing {filtered.length} of {users.length} users
          </div>
        )}
      </div>

      {/* Role legend */}
      <div className="bg-dark-800 border border-dark-700 rounded-2xl p-5">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <ShieldCheck size={14} /> Role Descriptions & Access Rights
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {[
            {
              role: 'president',
              desc: 'Top executive. View all data, costs, archive, add discussions.',
            },
            {
              role: 'vice_president',
              desc: 'Deputy executive. View all data, costs, archive, add discussions.',
            },
            {
              role: 'general_manager',
              desc: 'Create/edit findings, manage costs & archive, upload guidelines.',
            },
            {
              role: 'manager',
              desc: 'Create/edit findings, manage costs, upload guidelines, view archive.',
            },
            {
              role: 'supervisor',
              desc: 'Create/edit findings, view costs & archive, add discussions.',
            },
            {
              role: 'staff',
              desc: 'Create findings, add discussions. Cannot edit or delete.',
            },
            {
              role: 'viewer',
              desc: 'Read only. Cannot create or modify anything.',
            },
            {
              role: 'admin',
              desc: 'System administrator. Full access including user management.',
            },
          ].map(({ role, desc }) => {
            const info = ROLE_LABELS[role];
            return (
              <div
                key={role}
                className="bg-dark-900 rounded-xl p-3 border border-dark-700"
              >
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-lg mb-2 inline-block"
                  style={{ background: info.color + '20', color: info.color }}
                >
                  {info.label}
                </span>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {modal === 'create' && (
        <UserModal
          currentUser={currentUser}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
      {modal?.user && (
        <UserModal
          editUser={modal.user}
          currentUser={currentUser}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
      {delTarget && (
        <DeleteConfirm
          target={delTarget}
          loading={delLoading}
          onClose={() => setDelTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
