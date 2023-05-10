DELETE FROM
  access_points
WHERE
  id = ?;

DELETE FROM
  alerts
WHERE
  id = ?;

DELETE FROM
  areas
WHERE
  id = ?;

DELETE FROM
  measurements
WHERE
  id = ?;

DELETE FROM
  miners
WHERE
  id = ?;

DELETE FROM
  sensors
WHERE
  id = ?;

DELETE FROM
  users
WHERE
  id = ?;