ALTER TABLE rooms ADD COLUMN model_layer_ids_json TEXT NOT NULL DEFAULT '[]';

INSERT OR IGNORE INTO rooms (id, number, name, sort_order, model_layer_ids_json)
VALUES (
  'room13',
  '13',
  '楼梯间',
  13,
  '["stair-inside","stair-midside","stair-outside"]'
);

UPDATE topics
SET room_id = 'room13'
WHERE normalized_label = '楼梯间';
