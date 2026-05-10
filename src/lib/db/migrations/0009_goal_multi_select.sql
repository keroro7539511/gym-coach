-- 把現有單一目標字串轉成 JSON 陣列，例如 muscle_gain → ["muscle_gain"]
UPDATE students SET goal = '["' || goal || '"]' WHERE goal NOT LIKE '[%';
