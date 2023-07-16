UPDATE
  access_points
SET
  areasid = ?
WHERE
  id = ?;

UPDATE
  alerts
SET
  name = ?,
  sensorsid = ?,
  active = ?,
  timestamp = ?
WHERE
  id = ?;

UPDATE
  areas
SET
  name = ?
WHERE
  id = ?;

UPDATE
  measurements
SET
  sensorsid = ?,
  access_pointsid = ?,
  timestamp = ?,
  location = ?
WHERE
  id = ?;

UPDATE
  miners
SET
  name = ?,
  usersid = ?,
  sensorsid = ?,
  shift = ?,
  created_by = ?,
  updated_by = ?,
  last_updated = ?,
  created = ?,
  usersid2 = ?
WHERE
  id = ?;

UPDATE sensors SET 
  access_pointsid = ?, 
  active = ?, 
  modified_by = ?, 
  available = ?, 
  deviceId = ? 
WHERE
  id = ?;



UPDATE
  users
SET
  name = ?,
  role = ?,
  email = ?,
  password = ?,
  created_by = ?,
  updated_by = ?,
  last_updated = ?,
  created = ?,
  access = ?,
  areasid = ?
WHERE
  id = ?;