UPDATE access SET 
  id_prefix = ?, 
  name = ? 
WHERE
  id = ?;
UPDATE access_points SET 
  id_prefix = ?, 
  area_id = ?, 
  name = ?, 
  lat = ?, 
  longitude = ? 
WHERE
  id = ?;
UPDATE announcements SET 
  id_prefix = ?, 
  usersid = ?, 
  name = ?, 
  message = ?, 
  created_at = ? 
WHERE
  id = ?;
UPDATE areas SET 
  id_prefix = ?, 
  name = ?, 
  lat = ?, 
  longitude = ? 
WHERE
  id = ?;
UPDATE logs SET 
  id_prefix = ?, 
  loger_id = ?, 
  loger_name = ?, 
  created_at = ?, 
  message = ? 
WHERE
  id = ?;
UPDATE measurements SET 
  id_prefix = ?, 
  sensor_id = ?, 
  access_point_id = ?, 
  created_at = ?, 
  location = ?, 
  other_data = ? 
WHERE
  id = ?;
UPDATE miners SET 
  id_prefix = ?, 
  name = ?, 
  email = ?, 
  status = ?, 
  created_at = ?, 
  created_by = ?, 
  updated_at = ?, 
  updated_by = ?, 
  user_id = ?, 
  shift_id = ?, 
  sensor_id = ? 
WHERE
  id = ?;
UPDATE sensor_alerts SET 
  id_prefix = ?, 
  sensor_id = ?, 
  name = ?, 
  status = ?, 
  created_at = ? 
WHERE
  id = ?;
UPDATE sensors SET 
  id_prefix = ?, 
  status = ?, 
  device_id = ?, 
  available = ?, 
  updated_by = ?, 
  updated_at = ?, 
  created_by = ?, 
  created_at = ? 
WHERE
  id = ?;
UPDATE settings SET 
  app_notifications = ?, 
  email_notifications = ?, 
  dark_mode = ? 
WHERE
  user_id = ?;
UPDATE shifts SET 
  id_prefix = ?, 
  name = ? 
WHERE
  id = ?;
UPDATE user_roles SET 
  id_prefix = ?, 
  name = ? 
WHERE
  id = ?;
UPDATE users SET 
  id_prefix = ?, 
  name = ?, 
  email = ?, 
  password = ?, 
  user_role_id = ?, 
  created_by = ?, 
  created_at = ?, 
  updated_by = ?, 
  updated_at = ?, 
  phone = ?, 
  access_id = ?, 
  area_id = ? 
WHERE
  id = ?;

