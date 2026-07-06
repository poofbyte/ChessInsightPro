"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/app/store";
import { UserX, UserCheck, Search } from "lucide-react";

export default function AdminUsersPage() {
  const { accessToken } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(res => res.json())
      .then(data => {
        setUsers(data.users || []);
        setLoading(false);
      });
  }, [accessToken]);

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    (u.signup_ip && u.signup_ip.includes(search))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">User Management</h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search email or IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-xl py-2 pl-9 pr-4 text-sm outline-none focus:border-teal-500 transition-colors"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/5 dark:bg-slate-900 border-b border-border">
              <tr>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Email</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Plan</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Role</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Joined</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">No users found.</td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-black/5 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-medium">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                        u.plan === 'FREE' ? 'bg-slate-500/10 text-slate-500' :
                        u.plan === 'TIER1' ? 'bg-teal-500/10 text-teal-500' :
                        'bg-rose-500/10 text-rose-500'
                      }`}>
                        {u.plan}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-bold">{u.role}</td>
                    <td className="p-4 text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="p-4">
                      {u.is_banned ? (
                        <span className="flex items-center gap-1 text-rose-500 text-xs font-bold">
                          <UserX className="w-3 h-3" /> Banned
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
                          <UserCheck className="w-3 h-3" /> Active
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
