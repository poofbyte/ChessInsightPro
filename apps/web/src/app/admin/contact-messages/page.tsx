"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/app/store";
import { CONTACT_CATEGORIES } from "@/app/api/contact/schema";
import { Search, Eye, X, Loader2, Send, RefreshCw, ShieldAlert, Archive, ArchiveRestore, Reply, CheckCircle } from "lucide-react";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "replied", label: "Replied" },
  { value: "closed", label: "Closed" },
] as const;

const ARCHIVE_OPTIONS = [
  { value: "", label: "Active" },
  { value: "1", label: "Archived" },
  { value: "all", label: "All" },
] as const;

const STATUS_BADGES: Record<string, string> = {
  new: "bg-orange-500/10 text-orange-500",
  read: "bg-blue-500/10 text-blue-500",
  replied: "bg-teal-500/10 text-teal-500",
  closed: "bg-slate-500/10 text-slate-500",
};

const CATEGORY_COLORS: Record<string, string> = {
  general_question: "bg-purple-500/10 text-purple-500",
  bug_report: "bg-rose-500/10 text-rose-500",
  feature_request: "bg-amber-500/10 text-amber-500",
  billing: "bg-emerald-500/10 text-emerald-500",
  account: "bg-cyan-500/10 text-cyan-500",
  other: "bg-slate-500/10 text-slate-500",
};

function getStatusLabel(value: string) {
  const opt = STATUS_OPTIONS.find((s) => s.value === value);
  return opt ? opt.label : value;
}

function getCategoryLabel(value: string) {
  const cat = CONTACT_CATEGORIES.find((c) => c.id === value);
  return cat ? cat.label : value;
}

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

interface ContactReply {
  id: string;
  message_id: string;
  body: string;
  sent_by: string | null;
  status: string;
  created_at: string;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
  status: string;
  admin_notes: string | null;
  archived_at: string | null;
  reply_count: number;
  created_at: string;
}

export default function AdminContactMessagesPage() {
  const { accessToken } = useAuthStore();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [archiveFilter, setArchiveFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [replies, setReplies] = useState<ContactReply[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const debouncedSearch = useDebounce(search, 300);

  const fetchMessages = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      if (archiveFilter) params.set("archived", archiveFilter);
      params.set("page", String(page));

      const res = await fetch(`/api/admin/contact-messages?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      } else {
        setError(data.error || "Failed to load messages");
      }
    } catch {
      setError("Failed to load contact messages");
    }
    setLoading(false);
  }, [accessToken, debouncedSearch, statusFilter, categoryFilter, archiveFilter, page]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, categoryFilter, archiveFilter]);

  const fetchReplies = useCallback(async (messageId: string) => {
    setRepliesLoading(true);
    try {
      const res = await fetch(`/api/admin/contact-messages?replies=${messageId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setReplies(data.replies || []);
      }
    } catch {
      // ignore
    }
    setRepliesLoading(false);
  }, [accessToken]);

  const openDetail = (msg: ContactMessage) => {
    setSelected(msg);
    setNewStatus(msg.status);
    setAdminNotes(msg.admin_notes || "");
    setReplyBody("");
    setActionError("");
    setActionSuccess("");
    setReplies([]);
    fetchReplies(msg.id);
  };

  const handleUpdateStatus = async () => {
    if (!selected || !accessToken) return;
    setSavingStatus(true);
    setActionError("");
    setActionSuccess("");
    try {
      const res = await fetch("/api/admin/contact-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ messageId: selected.id, action: "updateStatus", status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }
      const updated = { ...selected, status: newStatus };
      setSelected(updated);
      setMessages((prev) => prev.map((m) => (m.id === selected.id ? { ...m, status: newStatus } : m)));
      setActionSuccess("Status updated");
    } catch (err: any) {
      setActionError(err.message);
    }
    setSavingStatus(false);
  };

  const handleSaveNotes = async () => {
    if (!selected || !accessToken) return;
    setSavingNotes(true);
    setActionError("");
    setActionSuccess("");
    try {
      const res = await fetch("/api/admin/contact-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ messageId: selected.id, action: "updateNotes", adminNotes }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save notes");
      }
      const updated = { ...selected, admin_notes: adminNotes };
      setSelected(updated);
      setMessages((prev) => prev.map((m) => (m.id === selected.id ? { ...m, admin_notes: adminNotes } : m)));
      setActionSuccess("Notes saved");
    } catch (err: any) {
      setActionError(err.message);
    }
    setSavingNotes(false);
  };

  const handleSendReply = async () => {
    if (!selected || !accessToken || !replyBody.trim()) return;
    setSendingReply(true);
    setActionError("");
    setActionSuccess("");
    try {
      const res = await fetch("/api/admin/contact-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ messageId: selected.id, action: "reply", replyBody: replyBody.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send reply");
      }
      setReplyBody("");
      setActionSuccess("Reply sent");
      const updated = { ...selected, status: "replied", reply_count: selected.reply_count + 1 };
      setSelected(updated);
      setMessages((prev) => prev.map((m) => (m.id === selected.id ? updated : m)));
      fetchReplies(selected.id);
    } catch (err: any) {
      setActionError(err.message);
    }
    setSendingReply(false);
  };

  const handleArchive = async () => {
    if (!selected || !accessToken) return;
    setArchiving(true);
    setActionError("");
    setActionSuccess("");
    const isArchived = !!selected.archived_at;
    try {
      const res = await fetch("/api/admin/contact-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ messageId: selected.id, action: isArchived ? "unarchive" : "archive" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to archive/unarchive");
      }
      const updated = { ...selected, archived_at: isArchived ? null : new Date().toISOString() };
      setSelected(updated);
      setMessages((prev) => prev.map((m) => (m.id === selected.id ? updated : m)));
      setActionSuccess(isArchived ? "Unarchived" : "Archived");
    } catch (err: any) {
      setActionError(err.message);
    }
    setArchiving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">Contact Messages</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{total} total messages</p>
        </div>
        <button onClick={fetchMessages} className="p-2.5 bg-card border border-border rounded-xl hover:bg-black/5 dark:hover:bg-slate-800 transition">
          <RefreshCw className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, email, subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-xl py-2 pl-9 pr-4 text-sm outline-none focus:border-teal-500 transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-card border border-border rounded-xl text-sm outline-none focus:border-teal-500"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-card border border-border rounded-xl text-sm outline-none focus:border-teal-500"
        >
          <option value="">All Categories</option>
          {CONTACT_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
        <select
          value={archiveFilter}
          onChange={(e) => setArchiveFilter(e.target.value)}
          className="px-3 py-2 bg-card border border-border rounded-xl text-sm outline-none focus:border-teal-500"
        >
          {ARCHIVE_OPTIONS.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
      </div>

      <ResponsiveTable
        headers={["Name", "Email", "Subject", "Category", "Status", "Replies", "Date", "Actions"]}
        data={messages}
        keyExtractor={(msg) => msg.id}
        renderRow={(msg, isMobile) => {
          const categoryBadge = (
            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${CATEGORY_COLORS[msg.category] || "bg-slate-500/10 text-slate-500"}`}>
              {getCategoryLabel(msg.category)}
            </span>
          );
          
          const statusBadge = (
            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${STATUS_BADGES[msg.status] || "bg-slate-500/10 text-slate-500"}`}>
              {getStatusLabel(msg.status)}
            </span>
          );
          
          const actionBtn = (
            <button
              onClick={() => openDetail(msg)}
              className="p-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-500 rounded-lg transition"
              title="View message"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          );

          if (isMobile) {
            return (
              <div className="flex flex-col gap-3 w-full">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm truncate">{msg.subject}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{msg.name} &middot; {msg.email}</p>
                  </div>
                  <div className="shrink-0">{statusBadge}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {categoryBadge}
                    <span className="text-xs text-slate-500">{new Date(msg.created_at).toLocaleDateString()}</span>
                    {msg.reply_count > 0 && (
                      <span className="text-xs text-teal-500">{msg.reply_count} replies</span>
                    )}
                  </div>
                  {actionBtn}
                </div>
              </div>
            );
          }

          return (
            <>
              <td className="p-4 font-medium">{msg.name}</td>
              <td className="p-4 text-slate-500 text-xs">{msg.email}</td>
              <td className="p-4 font-medium max-w-[200px] truncate">{msg.subject}</td>
              <td className="p-4">{categoryBadge}</td>
              <td className="p-4">{statusBadge}</td>
              <td className="p-4 text-xs text-slate-500">{msg.reply_count}</td>
              <td className="p-4 text-xs text-slate-500">{new Date(msg.created_at).toLocaleDateString()}</td>
              <td className="p-4 flex items-center gap-2">{actionBtn}</td>
            </>
          );
        }}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm font-bold disabled:opacity-40 hover:bg-black/5 dark:hover:bg-slate-800 transition"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm font-bold disabled:opacity-40 hover:bg-black/5 dark:hover:bg-slate-800 transition"
          >
            Next
          </button>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 !m-0" onClick={() => setSelected(null)}>
          <div className="bg-card border border-border rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-black">Message Details</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleArchive}
                  disabled={archiving}
                  className={`p-2 rounded-full transition flex items-center gap-1.5 text-xs font-bold ${
                    selected.archived_at
                      ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                      : "bg-slate-500/10 text-slate-500 hover:bg-slate-500/20"
                  }`}
                  title={selected.archived_at ? "Unarchive" : "Archive"}
                >
                  {archiving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : selected.archived_at ? (
                    <ArchiveRestore className="w-3.5 h-3.5" />
                  ) : (
                    <Archive className="w-3.5 h-3.5" />
                  )}
                  {selected.archived_at ? "Unarchive" : "Archive"}
                </button>
                <button onClick={() => setSelected(null)} className="p-2 bg-black/5 dark:bg-slate-800 rounded-full hover:bg-black/10 dark:hover:bg-slate-700 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {actionError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl">{actionError}</div>
              )}
              {actionSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {actionSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-black/5 dark:bg-slate-900 rounded-2xl">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Name</p>
                  <p className="font-bold">{selected.name}</p>
                </div>
                <div className="p-4 bg-black/5 dark:bg-slate-900 rounded-2xl">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Email</p>
                  <p className="font-bold text-sm break-all">{selected.email}</p>
                </div>
                <div className="p-4 bg-black/5 dark:bg-slate-900 rounded-2xl">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Subject</p>
                  <p className="font-bold">{selected.subject}</p>
                </div>
                <div className="p-4 bg-black/5 dark:bg-slate-900 rounded-2xl">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Category</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold ${CATEGORY_COLORS[selected.category] || "bg-slate-500/10 text-slate-500"}`}>
                    {getCategoryLabel(selected.category)}
                  </span>
                </div>
                <div className="p-4 bg-black/5 dark:bg-slate-900 rounded-2xl">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold ${STATUS_BADGES[selected.status] || "bg-slate-500/10 text-slate-500"}`}>
                    {getStatusLabel(selected.status)}
                  </span>
                </div>
                <div className="p-4 bg-black/5 dark:bg-slate-900 rounded-2xl">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Date</p>
                  <p className="text-sm">{new Date(selected.created_at).toLocaleString()}</p>
                </div>
              </div>

              {selected.archived_at && (
                <div className="p-3 bg-slate-500/10 border border-slate-500/20 text-slate-400 text-xs font-bold rounded-xl flex items-center gap-2">
                  <Archive className="w-3.5 h-3.5" />
                  Archived on {new Date(selected.archived_at).toLocaleString()}
                </div>
              )}

              <div className="p-4 bg-black/5 dark:bg-slate-900 border border-border rounded-2xl">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Message</p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{selected.message}</p>
              </div>

              {/* Reply History */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                  Replies ({replies.length})
                </p>
                {repliesLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Loading replies...
                  </div>
                ) : replies.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No replies yet.</p>
                ) : (
                  <div className="space-y-3">
                    {replies.map((reply) => (
                      <div key={reply.id} className="p-4 bg-teal-500/5 border border-teal-500/10 rounded-2xl">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <Reply className="w-3.5 h-3.5 text-teal-500" />
                            <span className="text-xs font-bold text-teal-500">Sent</span>
                            <span className="text-xs text-slate-500">
                              {new Date(reply.created_at).toLocaleString()}
                            </span>
                          </div>
                          <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded">
                            {reply.status}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{reply.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-6 space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Update Status</p>
                  <div className="flex items-center gap-3">
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="flex-1 px-3 py-2 bg-background border border-border rounded-xl text-sm outline-none focus:border-teal-500"
                    >
                      {STATUS_OPTIONS.filter((s) => s.value).map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleUpdateStatus}
                      disabled={savingStatus || newStatus === selected.status}
                      className="px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition flex items-center gap-2"
                    >
                      {savingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      Save
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Admin Notes</p>
                  <div className="flex flex-col sm:flex-row items-start gap-3">
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                      className="w-full sm:flex-1 px-3 py-2 bg-background border border-border rounded-xl text-sm outline-none focus:border-teal-500 resize-y min-h-[60px]"
                      placeholder="Internal notes about this message..."
                    />
                    <button
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                      className="w-full sm:w-auto px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shrink-0"
                    >
                      {savingNotes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      Save
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Send Reply</p>
                  <div className="flex flex-col sm:flex-row items-start gap-3">
                    <textarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      rows={3}
                      className="w-full sm:flex-1 px-3 py-2 bg-background border border-border rounded-xl text-sm outline-none focus:border-teal-500 resize-y min-h-[60px]"
                      placeholder="Type your reply..."
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={sendingReply || !replyBody.trim()}
                      className="w-full sm:w-auto px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shrink-0"
                    >
                      {sendingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      Send Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
