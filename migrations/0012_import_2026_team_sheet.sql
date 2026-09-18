PRAGMA foreign_keys = ON;

-- 2026 team sheet: import the unambiguous project URLs and selected topics.
UPDATE student_projects SET live_url = 'https://crimson-fog-ed21.2673436169.workers.dev/', updated_at = CURRENT_TIMESTAMP WHERE year = 2026 AND id = 'project-2026-a1';
UPDATE student_projects SET live_url = 'https://a2.3561417383.workers.dev/', updated_at = CURRENT_TIMESTAMP WHERE year = 2026 AND id = 'project-2026-a2';
UPDATE student_projects SET live_url = 'https://guileless-creponne-651016.netlify.app/', updated_at = CURRENT_TIMESTAMP WHERE year = 2026 AND id = 'project-2026-a3';
UPDATE student_projects SET live_url = 'https://caascd-curation.github.io/A4-Desktop/', updated_at = CURRENT_TIMESTAMP WHERE year = 2026 AND id = 'project-2026-a4';
UPDATE student_projects SET live_url = 'https://gotothewharf.pages.dev/', updated_at = CURRENT_TIMESTAMP WHERE year = 2026 AND id = 'project-2026-a5';
UPDATE student_projects SET live_url = 'https://caascd-curation.github.io/A6-Cinema-Card/', updated_at = CURRENT_TIMESTAMP WHERE year = 2026 AND id = 'project-2026-a6';
UPDATE student_projects SET live_url = 'https://sage-zuccutto-c85e53.netlify.app/', updated_at = CURRENT_TIMESTAMP WHERE year = 2026 AND id = 'project-2026-a7';
UPDATE student_projects SET live_url = 'https://tunnel-archive-2026.rosy-bead-2625.chatgpt.site/', updated_at = CURRENT_TIMESTAMP WHERE year = 2026 AND id = 'project-2026-a8';
UPDATE student_projects SET live_url = 'https://caascd-curation.github.io/B1-factory/', updated_at = CURRENT_TIMESTAMP WHERE year = 2026 AND id = 'project-2026-b1';
UPDATE student_projects SET live_url = 'https://yellow-pages-archive.pages.dev/', updated_at = CURRENT_TIMESTAMP WHERE year = 2026 AND id = 'project-2026-b2';
UPDATE student_projects SET live_url = 'https://b3-darkroom.pages.dev/', updated_at = CURRENT_TIMESTAMP WHERE year = 2026 AND id = 'project-2026-b3';
UPDATE student_projects SET live_url = 'https://b4-living-room.2736024602.workers.dev/', updated_at = CURRENT_TIMESTAMP WHERE year = 2026 AND id = 'project-2026-b4';
UPDATE student_projects SET live_url = 'https://tgtz706.github.io/111/', updated_at = CURRENT_TIMESTAMP WHERE year = 2026 AND id = 'project-2026-b5';
UPDATE student_projects SET live_url = 'https://sunfield.3187253462.workers.dev/', updated_at = CURRENT_TIMESTAMP WHERE year = 2026 AND id = 'project-2026-b6';
UPDATE student_projects SET live_url = 'https://caascd-curation.github.io/B7-MONITOR-CARD/', updated_at = CURRENT_TIMESTAMP WHERE year = 2026 AND id = 'project-2026-b7';
UPDATE student_projects SET live_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE year = 2026 AND id = 'project-2026-b8';

DELETE FROM topic_assignments WHERE group_id IN (
  'group-a1', 'group-a2', 'group-a3', 'group-a4',
  'group-a5', 'group-a6', 'group-a7', 'group-a8',
  'group-b1', 'group-b2', 'group-b3', 'group-b4',
  'group-b5', 'group-b6', 'group-b7', 'group-b8'
);

INSERT INTO topic_assignments (group_id, topic_id)
SELECT 'group-a1', id FROM topics WHERE normalized_label = '阳台';
INSERT INTO topic_assignments (group_id, topic_id)
SELECT 'group-a2', id FROM topics WHERE normalized_label = '谷仓';
INSERT INTO topic_assignments (group_id, topic_id)
SELECT 'group-a3', id FROM topics WHERE normalized_label = '蓄水池';
INSERT INTO topic_assignments (group_id, topic_id)
SELECT 'group-a4', id FROM topics WHERE normalized_label = '桌面';
INSERT INTO topic_assignments (group_id, topic_id)
SELECT 'group-a5', id FROM topics WHERE normalized_label = '码头';
INSERT INTO topic_assignments (group_id, topic_id)
SELECT 'group-a6', id FROM topics WHERE normalized_label = '影院';
INSERT INTO topic_assignments (group_id, topic_id)
SELECT 'group-a7', id FROM topics WHERE normalized_label = '楼梯间';
INSERT INTO topic_assignments (group_id, topic_id)
SELECT 'group-a8', id FROM topics WHERE normalized_label = '隧道';
INSERT INTO topic_assignments (group_id, topic_id)
SELECT 'group-b1', id FROM topics WHERE normalized_label = '工厂';
INSERT INTO topic_assignments (group_id, topic_id)
SELECT 'group-b2', id FROM topics WHERE normalized_label = '黄页';
INSERT INTO topic_assignments (group_id, topic_id)
SELECT 'group-b3', id FROM topics WHERE normalized_label = '暗房';
INSERT INTO topic_assignments (group_id, topic_id)
SELECT 'group-b4', id FROM topics WHERE normalized_label = '客厅';
INSERT INTO topic_assignments (group_id, topic_id)
SELECT 'group-b5', id FROM topics WHERE normalized_label = '橱窗';
INSERT INTO topic_assignments (group_id, topic_id)
SELECT 'group-b6', id FROM topics WHERE normalized_label = '晒场';
INSERT INTO topic_assignments (group_id, topic_id)
SELECT 'group-b7', id FROM topics WHERE normalized_label = '监控室';
INSERT INTO topic_assignments (group_id, topic_id)
SELECT 'group-b8', id FROM topics WHERE normalized_label = '田';
