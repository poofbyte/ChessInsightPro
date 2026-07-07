import { TableDefinition } from "@core/db-sync";

const contentEntriesTable: TableDefinition = {
  name: "content_entries",
  columns: [
    { name: "id", type: "TEXT PRIMARY KEY" },
    { name: "slug", type: "TEXT UNIQUE NOT NULL" },
    { name: "content_type", type: "TEXT NOT NULL" }, // 'lesson', 'rule', 'term', 'opening', 'page', 'settings'
    { name: "status", type: "TEXT NOT NULL DEFAULT 'published'" }, // 'draft', 'published', 'archived'
    { name: "published_version_id", type: "TEXT" },
    { name: "created_at", type: "TEXT NOT NULL DEFAULT (datetime('now'))" },
    { name: "updated_at", type: "TEXT NOT NULL DEFAULT (datetime('now'))" },
  ],
};

const contentRevisionsTable: TableDefinition = {
  name: "content_revisions",
  columns: [
    { name: "id", type: "TEXT PRIMARY KEY" },
    { name: "entry_id", type: "TEXT NOT NULL" },
    { name: "data", type: "TEXT NOT NULL" }, // JSON
    { name: "change_summary", type: "TEXT" },
    { name: "author_id", type: "TEXT" },
    { name: "created_at", type: "TEXT NOT NULL DEFAULT (datetime('now'))" },
  ],
};

const usersTable: TableDefinition = {
  name: "users",
  columns: [
    { name: "id", type: "TEXT PRIMARY KEY" },
    { name: "email", type: "TEXT UNIQUE NOT NULL" },
    { name: "password_hash", type: "TEXT NOT NULL" },
    { name: "plan", type: "TEXT NOT NULL DEFAULT 'FREE'" },
    { name: "custom_quotas", type: "TEXT" }, // JSON string
    { name: "plan_renews_at", type: "TEXT" },
    { name: "signup_ip", type: "TEXT" },
    { name: "is_banned", type: "INTEGER NOT NULL DEFAULT 0" },
    { name: "ban_reason", type: "TEXT" },
    { name: "role", type: "TEXT NOT NULL DEFAULT 'USER'" },
    { name: "name", type: "TEXT" },
    { name: "phone", type: "TEXT" },
    { name: "chess_com_url", type: "TEXT" },
    { name: "lichess_url", type: "TEXT" },
    { name: "fide_id_url", type: "TEXT" },
    { name: "fide_elo", type: "INTEGER" },
    { name: "bio", type: "TEXT" },
    { name: "created_at", type: "TEXT NOT NULL DEFAULT (datetime('now'))" },
  ],
};

const sessionsTable: TableDefinition = {
  name: "sessions",
  columns: [
    { name: "id", type: "TEXT PRIMARY KEY" },
    { name: "user_id", type: "TEXT NOT NULL" },
    { name: "refresh_token_hash", type: "TEXT NOT NULL" },
    { name: "expires_at", type: "TEXT NOT NULL" },
    { name: "created_at", type: "TEXT NOT NULL DEFAULT (datetime('now'))" },
    { name: "user_agent", type: "TEXT" },
    { name: "ip", type: "TEXT" },
  ],
};

const gamesTable: TableDefinition = {
  name: "games",
  columns: [
    { name: "id", type: "TEXT PRIMARY KEY" },
    { name: "user_id", type: "TEXT NOT NULL" },
    { name: "pgn", type: "TEXT NOT NULL" },
    { name: "headers", type: "TEXT" }, // JSON
    { name: "analysis", type: "TEXT" }, // JSON
    { name: "created_at", type: "TEXT NOT NULL DEFAULT (datetime('now'))" },
  ],
};

const profilesTable: TableDefinition = {
  name: "profiles",
  columns: [
    { name: "user_id", type: "TEXT PRIMARY KEY" },
    { name: "elo", type: "INTEGER NOT NULL DEFAULT 1200" },
    { name: "accuracy_history", type: "TEXT" }, // JSON
    { name: "weaknesses", type: "TEXT" }, // JSON
    { name: "updated_at", type: "TEXT NOT NULL DEFAULT (datetime('now'))" },
  ],
};

const learningCardsTable: TableDefinition = {
  name: "learning_cards",
  columns: [
    { name: "id", type: "TEXT PRIMARY KEY" },
    { name: "user_id", type: "TEXT NOT NULL" },
    { name: "concept_id", type: "TEXT NOT NULL" },
    { name: "box", type: "INTEGER NOT NULL DEFAULT 0" },
    { name: "due_at", type: "TEXT NOT NULL" },
    { name: "last_reviewed_at", type: "TEXT" },
  ],
};

const puzzleAttemptsTable: TableDefinition = {
  name: "puzzle_attempts",
  columns: [
    { name: "id", type: "TEXT PRIMARY KEY" },
    { name: "user_id", type: "TEXT NOT NULL" },
    { name: "puzzle_id", type: "TEXT NOT NULL" },
    { name: "mode", type: "TEXT NOT NULL" },
    { name: "hints_used", type: "INTEGER NOT NULL DEFAULT 0" },
    { name: "mistakes", type: "INTEGER NOT NULL DEFAULT 0" },
    { name: "elo_change", type: "INTEGER NOT NULL DEFAULT 0" },
    { name: "solved_at", type: "TEXT NOT NULL DEFAULT (datetime('now'))" },
  ],
};

const usageEventsTable: TableDefinition = {
  name: "usage_events",
  columns: [
    { name: "id", type: "TEXT PRIMARY KEY" },
    { name: "user_id", type: "TEXT NOT NULL" },
    { name: "ip_address", type: "TEXT" },
    { name: "event_type", type: "TEXT NOT NULL" },
    { name: "created_at", type: "TEXT NOT NULL DEFAULT (datetime('now'))" },
  ],
};

const signupAttemptsTable: TableDefinition = {
  name: "signup_attempts",
  columns: [
    { name: "id", type: "TEXT PRIMARY KEY" },
    { name: "ip", type: "TEXT NOT NULL" },
    { name: "created_at", type: "TEXT NOT NULL DEFAULT (datetime('now'))" },
  ],
};

const loginAttemptsTable: TableDefinition = {
  name: "login_attempts",
  columns: [
    { name: "id", type: "TEXT PRIMARY KEY" },
    { name: "ip", type: "TEXT NOT NULL" },
    { name: "email", type: "TEXT" },
    { name: "success", type: "INTEGER NOT NULL DEFAULT 0" },
    { name: "created_at", type: "TEXT NOT NULL DEFAULT (datetime('now'))" },
  ],
};

const generatedPuzzlesTable: TableDefinition = {
  name: "generated_puzzles",
  columns: [
    { name: "id", type: "TEXT PRIMARY KEY" },
    { name: "fen", type: "TEXT NOT NULL" },
    { name: "solution_uci", type: "TEXT NOT NULL" }, // JSON
    { name: "themes", type: "TEXT NOT NULL" }, // JSON
    { name: "rating", type: "INTEGER NOT NULL" },
    { name: "source_game_url", type: "TEXT" },
    { name: "generated_at", type: "TEXT NOT NULL DEFAULT (datetime('now'))" },
    { name: "times_served", type: "INTEGER NOT NULL DEFAULT 0" },
  ],
};

const pendingUpgradeRequestsTable: TableDefinition = {
  name: "pending_upgrade_requests",
  columns: [
    { name: "id", type: "TEXT PRIMARY KEY" },
    { name: "user_id", type: "TEXT NOT NULL" },
    { name: "requested_plan", type: "TEXT NOT NULL" },
    { name: "requested_quotas", type: "TEXT" }, // JSON
    { name: "requested_price_bdt", type: "INTEGER NOT NULL" },
    { name: "verification_details", type: "TEXT" }, // JSON
    { name: "created_at", type: "TEXT NOT NULL DEFAULT (datetime('now'))" },
    { name: "status", type: "TEXT NOT NULL DEFAULT 'PENDING'" },
  ],
};

const systemConfigTable: TableDefinition = {
  name: "system_config",
  columns: [
    { name: "key", type: "TEXT PRIMARY KEY" },
    { name: "value", type: "TEXT" }, // JSON encoded
    { name: "updated_at", type: "TEXT NOT NULL DEFAULT (datetime('now'))" },
    { name: "updated_by", type: "TEXT" },
  ],
};

const adminAuditLogTable: TableDefinition = {
  name: "admin_audit_log",
  columns: [
    { name: "id", type: "TEXT PRIMARY KEY" },
    { name: "admin_user_id", type: "TEXT NOT NULL" },
    { name: "action", type: "TEXT NOT NULL" },
    { name: "target_type", type: "TEXT" },
    { name: "target_id", type: "TEXT" },
    { name: "details", type: "TEXT" }, // JSON
    { name: "created_at", type: "TEXT NOT NULL DEFAULT (datetime('now'))" },
  ],
};

const activityLogsTable: TableDefinition = {
  name: "activity_logs",
  columns: [
    { name: "id", type: "TEXT PRIMARY KEY" },
    { name: "user_id", type: "TEXT NOT NULL" },
    { name: "activity_type", type: "TEXT NOT NULL" },
    { name: "activity_name", type: "TEXT" },
    { name: "details", type: "TEXT" },
    { name: "ip_address", type: "TEXT" },
    { name: "created_at", type: "TEXT NOT NULL DEFAULT (datetime('now'))" },
  ],
};

const analyticsEventsTable: TableDefinition = {
  name: "analytics_events",
  columns: [
    { name: "event_id", type: "TEXT PRIMARY KEY DEFAULT (hex(randomblob(16)))" },
    { name: "version", type: "INTEGER NOT NULL DEFAULT 1" },
    { name: "category", type: "TEXT NOT NULL DEFAULT 'unknown'" }, 
    { name: "event_type", type: "TEXT NOT NULL DEFAULT 'unknown'" },
    { name: "correlation_id", type: "TEXT" },
    { name: "session_id", type: "TEXT NOT NULL DEFAULT 'unknown'" },
    { name: "user_id", type: "TEXT" },
    { name: "priority", type: "TEXT NOT NULL DEFAULT 'normal'" },
    { name: "timestamp", type: "INTEGER NOT NULL DEFAULT 0" }, 
    { name: "platform", type: "TEXT NOT NULL DEFAULT 'web'" },     
    { name: "app_version", type: "TEXT NOT NULL DEFAULT '1.0.0'" },
    { name: "properties", type: "TEXT" }, // JSON string
    { name: "context", type: "TEXT" },    // JSON string
    { name: "metadata", type: "TEXT" },   // JSON string (remaining metadata)
  ],
};

export const ALL_TABLES: TableDefinition[] = [
  usersTable,
  sessionsTable,
  gamesTable,
  profilesTable,
  learningCardsTable,
  puzzleAttemptsTable,
  usageEventsTable,
  signupAttemptsTable,
  loginAttemptsTable,
  generatedPuzzlesTable,
  pendingUpgradeRequestsTable,
  systemConfigTable,
  adminAuditLogTable,
  activityLogsTable,
  analyticsEventsTable,
  contentEntriesTable,
  contentRevisionsTable,
];
