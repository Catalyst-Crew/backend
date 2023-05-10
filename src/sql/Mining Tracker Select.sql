SELECT
  id,
  areasid
FROM
  access_points;

SELECT
  id,
  name,
  sensorsid,
  active,
  timestamp
FROM
  alerts;

SELECT
  id,
  name
FROM
  areas;

SELECT
  id,
  sensorsid,
  access_pointsid,
  timestamp,
  location
FROM
  measurements;

SELECT
  id,
  name,
  usersid,
  sensorsid,
  shift,
  created_by,
  updated_by,
  last_updated,
  created,
  usersid2
FROM
  miners;

SELECT
  id,
  access_pointsid,
  active,
  modified_by
FROM
  sensors;

SELECT
  id,
  name,
  role,
  email,
  password,
  created_by,
  updated_by,
  last_updated,
  created,
  access,
  areasid
FROM
  users;