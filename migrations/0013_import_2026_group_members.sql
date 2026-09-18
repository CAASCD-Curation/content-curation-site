PRAGMA foreign_keys = ON;

-- Match the 2026 team sheet to the student accounts already present in D1.
-- The roster was matched by display name; B7's sheet nickname 叶柠溯(溯溯溯) maps to 叶柠溯.
DELETE FROM group_members
WHERE group_id IN (
  'group-a1', 'group-a2', 'group-a3', 'group-a4',
  'group-a5', 'group-a6', 'group-a7', 'group-a8',
  'group-b1', 'group-b2', 'group-b3', 'group-b4',
  'group-b5', 'group-b6', 'group-b7', 'group-b8'
)
OR user_id IN (
  SELECT id FROM users WHERE username IN (
    '3221305402', '3241305005', '3241305472',
    '3241305555', '3241305318', '3241305228',
    '3241305013', '3241305131', '3241305052',
    '3241305152', '3241305207', '3241305193',
    '3241305490', '3241305332', '3241305085',
    '3241305528', '3241305356', '3241305116',
    '3241305164', '3241305284', '3241305081',
    '3241305367', '3231305300', '3241305260',
    '3241305064', '3241305441', '3241305154',
    '3241305214', '3241305479', '3241305533',
    '3241305156', '3241305310', '3241305176',
    '3241305466', '3241305400', '3241305560',
    '3241305383', '3241305072', '3241305339',
    '3241305521', '3241305147', '3241305146',
    '3241305564', '3241305315', '3241305117',
    '3241305122', '3241305477', '3241305036'
  )
);

INSERT INTO group_members (group_id, user_id)
SELECT 'group-a1', id FROM users WHERE username IN ('3221305402', '3241305005', '3241305472') AND role = 'student';
INSERT INTO group_members (group_id, user_id)
SELECT 'group-a2', id FROM users WHERE username IN ('3241305555', '3241305318', '3241305228') AND role = 'student';
INSERT INTO group_members (group_id, user_id)
SELECT 'group-a3', id FROM users WHERE username IN ('3241305013', '3241305131', '3241305052') AND role = 'student';
INSERT INTO group_members (group_id, user_id)
SELECT 'group-a4', id FROM users WHERE username IN ('3241305152', '3241305207', '3241305193') AND role = 'student';
INSERT INTO group_members (group_id, user_id)
SELECT 'group-a5', id FROM users WHERE username IN ('3241305490', '3241305332', '3241305085') AND role = 'student';
INSERT INTO group_members (group_id, user_id)
SELECT 'group-a6', id FROM users WHERE username IN ('3241305528', '3241305356', '3241305116') AND role = 'student';
INSERT INTO group_members (group_id, user_id)
SELECT 'group-a7', id FROM users WHERE username IN ('3241305164', '3241305284', '3241305081') AND role = 'student';
INSERT INTO group_members (group_id, user_id)
SELECT 'group-a8', id FROM users WHERE username IN ('3241305367', '3231305300', '3241305260') AND role = 'student';
INSERT INTO group_members (group_id, user_id)
SELECT 'group-b1', id FROM users WHERE username IN ('3241305064', '3241305441', '3241305154') AND role = 'student';
INSERT INTO group_members (group_id, user_id)
SELECT 'group-b2', id FROM users WHERE username IN ('3241305214', '3241305479', '3241305533') AND role = 'student';
INSERT INTO group_members (group_id, user_id)
SELECT 'group-b3', id FROM users WHERE username IN ('3241305156', '3241305310', '3241305176') AND role = 'student';
INSERT INTO group_members (group_id, user_id)
SELECT 'group-b4', id FROM users WHERE username IN ('3241305466', '3241305400', '3241305560') AND role = 'student';
INSERT INTO group_members (group_id, user_id)
SELECT 'group-b5', id FROM users WHERE username IN ('3241305383', '3241305072', '3241305339') AND role = 'student';
INSERT INTO group_members (group_id, user_id)
SELECT 'group-b6', id FROM users WHERE username IN ('3241305521', '3241305147', '3241305146') AND role = 'student';
INSERT INTO group_members (group_id, user_id)
SELECT 'group-b7', id FROM users WHERE username IN ('3241305117', '3241305564', '3241305315') AND role = 'student';
INSERT INTO group_members (group_id, user_id)
SELECT 'group-b8', id FROM users WHERE username IN ('3241305122', '3241305477', '3241305036') AND role = 'student';
