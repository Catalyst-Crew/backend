SELECT id, id_prefix, name 
  FROM access;
SELECT id, id_prefix, area_id, name, lat, longitude 
  FROM access_points;
SELECT id, id_prefix, usersid, name, message, created_at 
  FROM announcements;
SELECT id, id_prefix, name, lat, longitude 
  FROM areas;
SELECT id, id_prefix, loger_id, loger_name, created_at, message 
  FROM logs;
SELECT id, id_prefix, sensor_id, access_point_id, created_at, location, other_data 
  FROM measurements;
SELECT id, id_prefix, name, email, status, created_at, created_by, updated_at, updated_by, user_id, shift_id, sensor_id 
  FROM miners;
SELECT id, id_prefix, sensor_id, name, status, created_at 
  FROM sensor_alerts;
SELECT id, id_prefix, status, device_id, available, updated_by, updated_at, created_by, created_at 
  FROM sensors;
SELECT user_id, app_notifications, email_notifications, dark_mode 
  FROM settings;
SELECT id, id_prefix, name 
  FROM shifts;
SELECT id, id_prefix, name 
  FROM user_roles;
SELECT id, id_prefix, name, email, password, user_role_id, created_by, created_at, updated_by, updated_at, phone, access_id, area_id 
  FROM users;

