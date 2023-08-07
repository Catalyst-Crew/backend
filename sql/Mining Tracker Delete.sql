DELETE FROM access 
  WHERE id = ?;
DELETE FROM access_points 
  WHERE id = ?;
DELETE FROM announcements 
  WHERE id = ?;
DELETE FROM areas 
  WHERE id = ?;
DELETE FROM logs 
  WHERE id = ?;
DELETE FROM measurements 
  WHERE id = ?;
DELETE FROM miners 
  WHERE id = ?;
DELETE FROM sensor_alerts 
  WHERE id = ?;
DELETE FROM sensors 
  WHERE id = ?;
DELETE FROM settings 
  WHERE user_id = ?;
DELETE FROM shifts 
  WHERE id = ?;
DELETE FROM user_roles 
  WHERE id = ?;
DELETE FROM users 
  WHERE id = ?;

