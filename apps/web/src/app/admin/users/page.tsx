"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/app/store";
import { UserX, UserCheck, Search, Plus, X, Edit, Trash2, Ban, ShieldCheck, Mail, Link as LinkIcon, Phone, FileText, Medal, ShieldAlert } from "lucide-react";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable";

export default function AdminUsersPage() {
  const { accessToken } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const [editForm, setEditForm] = useState<any>({});
  
  const [showBanConfirm, setShowBanConfirm] = useState(false);
  const [banReason, setBanReason] = useState("");
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchUsers = () => {
    if (!accessToken) return;
    setLoading(true);
    fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(res => res.json())
      .then(data => {
        setUsers(data.users || []);
        setLoading(false);
      });
  };

  const fetchUserActivity = async (userId: string) => {
    if (!accessToken) return;
    setLoadingLogs(true);
    try {
      const res = await fetch(`/api/admin/activity-logs?userId=${userId}&limit=20`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      setActivityLogs(data.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [accessToken]);

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    (u.signup_ip && u.signup_ip.includes(search))
  );

  const handleAction = async (action: string, payload: any) => {
    if (!accessToken) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ action, ...payload })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      
      if (action === "DELETE") setSelectedUser(null);
      if (action === "CREATE") setIsCreating(false);
      
      fetchUsers();
      
      // Update selectedUser if not deleted
      if (action !== "DELETE" && action !== "CREATE" && selectedUser) {
        if (action === "BAN") setSelectedUser({ ...selectedUser, is_banned: 1, ban_reason: payload.reason });
        if (action === "UNBAN") setSelectedUser({ ...selectedUser, is_banned: 0, ban_reason: null });
        if (action === "EDIT") {
          setSelectedUser({ ...selectedUser, ...payload });
          setIsEditing(false);
        }
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const openUser = (u: any) => {
    setSelectedUser(u);
    setIsEditing(false);
    setShowBanConfirm(false);
    setShowDeleteConfirm(false);
    setBanReason(u.ban_reason || "");
    fetchUserActivity(u.id);
  };

  const openCreate = () => {
    setIsCreating(true);
    setEditForm({
      email: "",
      password: "",
      plan: "FREE",
      role: "USER",
      name: "",
      phone: "",
      bio: "",
      chess_com_url: "",
      lichess_url: "",
      fide_elo: ""
    });
  };

  const startEdit = () => {
    setEditForm({ ...selectedUser });
    setIsEditing(true);
  };

  return (
    <div className="space-y-6 relative h-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-black">User Management</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search email or IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card border border-border rounded-xl py-2 pl-9 pr-4 text-sm outline-none focus:border-teal-500 transition-colors"
            />
          </div>
          <button 
            onClick={openCreate}
            className="flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-teal-500/20 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" /> New User
          </button>
        </div>
      </div>

      <ResponsiveTable
        headers={["Email", "Plan", "Role", "Joined", "Status"]}
        data={filteredUsers}
        keyExtractor={(u) => u.id}
        renderRow={(u, isMobile) => {
          const planClass = u.plan === 'FREE' ? 'bg-slate-500/10 text-slate-500' :
            u.plan === 'TIER1' ? 'bg-teal-500/10 text-teal-500' :
            'bg-amber-500/10 text-amber-500';
            
          const statusNode = u.is_banned ? (
            <span className="flex items-center gap-1 text-rose-500 text-xs font-bold">
              <UserX className="w-3 h-3" /> Banned
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
              <UserCheck className="w-3 h-3" /> Active
            </span>
          );

          if (isMobile) {
            return (
              <div 
                className="flex flex-col gap-2 cursor-pointer"
                onClick={() => openUser(u)}
              >
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="font-medium text-sm truncate pr-2">{u.email}</span>
                  {statusNode}
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Plan:</span>
                  <span className={`px-2 py-1 rounded-md font-bold ${planClass}`}>{u.plan}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Role:</span>
                  <span className="font-bold">{u.role}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
                  <span>Joined {new Date(u.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          }

          return (
            <>
              <td className="p-4 font-medium cursor-pointer" onClick={() => openUser(u)}>{u.email}</td>
              <td className="p-4 cursor-pointer" onClick={() => openUser(u)}>
                <span className={`px-2 py-1 rounded-md text-xs font-bold ${planClass}`}>
                  {u.plan}
                </span>
              </td>
              <td className="p-4 text-xs font-bold cursor-pointer" onClick={() => openUser(u)}>{u.role}</td>
              <td className="p-4 text-slate-500 cursor-pointer" onClick={() => openUser(u)}>{new Date(u.created_at).toLocaleDateString()}</td>
              <td className="p-4 cursor-pointer" onClick={() => openUser(u)}>
                {statusNode}
              </td>
            </>
          );
        }}
      />

      {/* User Details Centered Modal */}
      {(selectedUser || isCreating) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 md:p-8 !m-0">
          <div className="w-full max-w-2xl bg-card shadow-2xl border border-border rounded-2xl flex flex-col max-h-full overflow-hidden animate-in zoom-in-95">
            
            <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold">
                {isCreating ? "Create New User" : isEditing ? "Edit User" : "User Details"}
              </h2>
              <button 
                onClick={() => { setSelectedUser(null); setIsCreating(false); }}
                className="p-2 hover:bg-black/5 dark:hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              {(isEditing || isCreating) ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                    <input type="email" value={editForm.email || ""} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500" />
                  </div>
                  {isCreating && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                      <input type="text" value={editForm.password || ""} onChange={e => setEditForm({...editForm, password: e.target.value})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500" placeholder="Default: defaultPassword123" />
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Plan</label>
                      <select value={editForm.plan || "FREE"} onChange={e => setEditForm({...editForm, plan: e.target.value})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500">
                        <option value="FREE">FREE</option>
                        <option value="TIER1">TIER 1 (Pro)</option>
                        <option value="TIER2">TIER 2 (Elite)</option>
                        <option value="CUSTOM">CUSTOM</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
                      <select value={editForm.role || "USER"} onChange={e => setEditForm({...editForm, role: e.target.value})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500">
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label>
                    <input type="text" value={editForm.name || ""} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
                    <input type="text" value={editForm.phone || ""} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">FIDE ELO</label>
                    <input type="number" value={editForm.fide_elo || ""} onChange={e => setEditForm({...editForm, fide_elo: parseInt(e.target.value) || null})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Chess.com URL</label>
                    <input type="text" value={editForm.chess_com_url || ""} onChange={e => setEditForm({...editForm, chess_com_url: e.target.value})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lichess URL</label>
                    <input type="text" value={editForm.lichess_url || ""} onChange={e => setEditForm({...editForm, lichess_url: e.target.value})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bio</label>
                    <textarea value={editForm.bio || ""} onChange={e => setEditForm({...editForm, bio: e.target.value})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500 min-h-[100px]"></textarea>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* View Mode */}
                  <div className="flex items-center gap-4 bg-background p-4 rounded-xl border border-border">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-2xl font-black">
                      {selectedUser.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{selectedUser.name || "No Name"}</h3>
                      <p className="text-sm text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedUser.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-background border border-border rounded-xl">
                      <p className="text-xs font-bold text-slate-500 uppercase">Plan</p>
                      <p className="font-bold text-lg">{selectedUser.plan}</p>
                    </div>
                    <div className="p-4 bg-background border border-border rounded-xl">
                      <p className="text-xs font-bold text-slate-500 uppercase">Role</p>
                      <p className="font-bold text-lg">{selectedUser.role}</p>
                    </div>
                  </div>

                  {selectedUser.is_banned === 1 && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500">
                      <div className="flex items-center gap-2 font-bold mb-1">
                        <ShieldAlert className="w-4 h-4" /> Account Banned
                      </div>
                      <p className="text-sm">Reason: {selectedUser.ban_reason || "No reason provided."}</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h4 className="font-bold text-sm text-slate-500 uppercase border-b border-border pb-2">Profile Information</h4>
                    <p className="text-sm flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> {selectedUser.phone || "Not provided"}</p>
                    <p className="text-sm flex items-center gap-2"><Medal className="w-4 h-4 text-slate-400" /> FIDE ELO: {selectedUser.fide_elo || "N/A"}</p>
                    <p className="text-sm flex items-center gap-2"><LinkIcon className="w-4 h-4 text-slate-400" /> Chess.com: {selectedUser.chess_com_url || "N/A"}</p>
                    <p className="text-sm flex items-center gap-2"><LinkIcon className="w-4 h-4 text-slate-400" /> Lichess: {selectedUser.lichess_url || "N/A"}</p>
                    <div className="text-sm flex items-start gap-2">
                      <FileText className="w-4 h-4 text-slate-400 mt-1 shrink-0" /> 
                      <span className="text-slate-600 dark:text-slate-300">{selectedUser.bio || "No bio"}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-bold text-sm text-slate-500 uppercase border-b border-border pb-2">System Metadata</h4>
                    <p className="text-sm">User ID: <span className="font-mono text-xs">{selectedUser.id}</span></p>
                    <p className="text-sm">Signup IP: {selectedUser.signup_ip || "Unknown"}</p>
                    <p className="text-sm">Joined: {new Date(selectedUser.created_at).toLocaleString()}</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <h4 className="font-bold text-sm text-slate-500 uppercase">Recent Activity</h4>
                      <a href={`/admin/activity-logs?userId=${selectedUser.id}`} className="text-xs text-teal-500 hover:underline">View All</a>
                    </div>
                    {loadingLogs ? (
                      <p className="text-sm text-slate-500 text-center py-4">Loading activity...</p>
                    ) : activityLogs.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">No recent activity.</p>
                    ) : (
                      <div className="space-y-2">
                        {activityLogs.map((log) => (
                          <div key={log.id} className="text-sm bg-black/5 dark:bg-slate-800/50 p-3 rounded-lg border border-border">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-teal-600 dark:text-teal-400 capitalize">{log.activity_type.replace(/_/g, ' ')}</span>
                              <span className="text-xs text-slate-500">{new Date(log.created_at).toLocaleDateString()}</span>
                            </div>
                            {log.activity_name && <p className="text-slate-600 dark:text-slate-300 font-medium">{log.activity_name}</p>}
                            {log.details && Object.keys(JSON.parse(log.details)).length > 0 && (
                              <pre className="text-xs mt-1 text-slate-500 overflow-x-auto">
                                {JSON.stringify(JSON.parse(log.details), null, 2)}
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-border bg-black/5 dark:bg-slate-900 shrink-0">
              {isCreating ? (
                <div className="flex gap-3">
                  <button onClick={() => setIsCreating(false)} className="flex-1 py-2 rounded-lg font-bold text-sm border border-border hover:bg-black/5 dark:hover:bg-slate-800 transition">Cancel</button>
                  <button onClick={() => handleAction("CREATE", editForm)} className="flex-1 py-2 rounded-lg font-bold text-sm bg-teal-500 hover:bg-teal-600 text-white transition">Create User</button>
                </div>
              ) : isEditing ? (
                <div className="flex gap-3">
                  <button onClick={() => setIsEditing(false)} className="flex-1 py-2 rounded-lg font-bold text-sm border border-border hover:bg-black/5 dark:hover:bg-slate-800 transition">Cancel</button>
                  <button onClick={() => handleAction("EDIT", { userId: selectedUser.id, ...editForm })} className="flex-1 py-2 rounded-lg font-bold text-sm bg-teal-500 hover:bg-teal-600 text-white transition">Save Changes</button>
                </div>
              ) : showBanConfirm ? (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                  <h4 className="font-bold text-rose-500 flex items-center gap-2"><Ban className="w-4 h-4" /> Ban User</h4>
                  <input type="text" placeholder="Reason for banning (shown to user)..." value={banReason} onChange={e => setBanReason(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose-500" />
                  <div className="flex gap-3">
                    <button onClick={() => setShowBanConfirm(false)} className="flex-1 py-2 rounded-lg font-bold text-sm border border-border hover:bg-black/5 transition">Cancel</button>
                    <button onClick={() => handleAction("BAN", { userId: selectedUser.id, reason: banReason })} className="flex-1 py-2 rounded-lg font-bold text-sm bg-rose-500 hover:bg-rose-600 text-white transition">Confirm Ban</button>
                  </div>
                </div>
              ) : showDeleteConfirm ? (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-500 text-sm">
                    <strong>Warning:</strong> This will permanently delete this user and all their games, profiles, and data. This cannot be undone.
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 rounded-lg font-bold text-sm border border-border hover:bg-black/5 transition">Cancel</button>
                    <button onClick={() => handleAction("DELETE", { userId: selectedUser.id })} className="flex-1 py-2 rounded-lg font-bold text-sm bg-rose-500 hover:bg-rose-600 text-white transition">Delete Forever</button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={startEdit} className="flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm bg-blue-500 hover:bg-blue-600 text-white transition">
                    <Edit className="w-4 h-4" /> Edit
                  </button>
                  
                  {selectedUser.is_banned ? (
                    <button onClick={() => handleAction("UNBAN", { userId: selectedUser.id })} className="flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-white transition">
                      <ShieldCheck className="w-4 h-4" /> Unban
                    </button>
                  ) : (
                    <button onClick={() => setShowBanConfirm(true)} className="flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm border border-border hover:bg-rose-500/10 hover:text-rose-500 transition">
                      <Ban className="w-4 h-4" /> Ban
                    </button>
                  )}
                  
                  <button onClick={() => setShowDeleteConfirm(true)} className="col-span-2 flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white transition mt-2">
                    <Trash2 className="w-4 h-4" /> Hard Delete User
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
