PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS student_projects (
  id TEXT PRIMARY KEY,
  year INTEGER NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  group_id TEXT NOT NULL REFERENCES course_groups(id) ON DELETE RESTRICT,
  repository_name TEXT NOT NULL,
  repository_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  live_url TEXT,
  cover_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  snapshot_members_json TEXT,
  snapshot_topic_label TEXT,
  first_published_at TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (year, group_id),
  UNIQUE (year, repository_name)
);

CREATE INDEX IF NOT EXISTS idx_student_projects_year_status
  ON student_projects(year, status);

INSERT OR IGNORE INTO student_projects
  (id, year, group_id, repository_name, repository_url, live_url, status)
VALUES
  ('project-2026-a1', 2026, 'group-a1', 'A1-balcony', 'https://github.com/CAASCD-Curation/A1-balcony', 'https://caascd-curation.github.io/A1-balcony/', 'draft'),
  ('project-2026-a2', 2026, 'group-a2', 'A2-', 'https://github.com/CAASCD-Curation/A2-', 'https://a2.3561417383.workers.dev/barn/', 'draft'),
  ('project-2026-a3', 2026, 'group-a3', 'A3-Reservoir', 'https://github.com/CAASCD-Curation/A3-Reservoir', NULL, 'draft'),
  ('project-2026-a4', 2026, 'group-a4', 'A4-Desktop', 'https://github.com/CAASCD-Curation/A4-Desktop', 'https://caascd-curation.github.io/A4-Desktop/', 'draft'),
  ('project-2026-a5', 2026, 'group-a5', 'A5-Wharf', 'https://github.com/CAASCD-Curation/A5-Wharf', 'https://aboutwharf.pages.dev/', 'draft'),
  ('project-2026-a6', 2026, 'group-a6', 'A6-Cinema-Card', 'https://github.com/CAASCD-Curation/A6-Cinema-Card', 'https://caascd-curation.github.io/A6-Cinema-Card/', 'draft'),
  ('project-2026-a7', 2026, 'group-a7', 'A7-Stairwell', 'https://github.com/CAASCD-Curation/A7-Stairwell', NULL, 'draft'),
  ('project-2026-a8', 2026, 'group-a8', 'A8-Tunnel', 'https://github.com/CAASCD-Curation/A8-Tunnel', NULL, 'draft'),
  ('project-2026-b1', 2026, 'group-b1', 'B1-factory', 'https://github.com/CAASCD-Curation/B1-factory', 'https://caascd-curation.github.io/B1-factory/', 'draft'),
  ('project-2026-b2', 2026, 'group-b2', 'B2-yellowpage-card', 'https://github.com/CAASCD-Curation/B2-yellowpage-card', NULL, 'draft'),
  ('project-2026-b3', 2026, 'group-b3', 'B3-Darkroom', 'https://github.com/CAASCD-Curation/B3-Darkroom', 'https://b3-darkroom.pages.dev/', 'draft'),
  ('project-2026-b4', 2026, 'group-b4', 'B4-Living-Room', 'https://github.com/CAASCD-Curation/B4-Living-Room', 'https://b4-living-room.2736024602.workers.dev', 'draft'),
  ('project-2026-b5', 2026, 'group-b5', 'B5-SHOPWINDOW', 'https://github.com/CAASCD-Curation/B5-SHOPWINDOW', 'https://windowshop05.pages.dev/', 'draft'),
  ('project-2026-b6', 2026, 'group-b6', 'B6-Sunfield', 'https://github.com/CAASCD-Curation/B6-Sunfield', 'https://sunfield.3187253462.workers.dev/', 'draft'),
  ('project-2026-b7', 2026, 'group-b7', 'B7-MONITOR-CARD', 'https://github.com/CAASCD-Curation/B7-MONITOR-CARD', 'https://caascd-curation.github.io/B7-MONITOR-CARD/', 'draft'),
  ('project-2026-b8', 2026, 'group-b8', 'B8-FIRLD', 'https://github.com/CAASCD-Curation/B8-FIRLD', NULL, 'draft');
