INSERT INTO
  access_points (id, areasid)
VALUES
  (?, ?);

INSERT INTO
  alerts (
    id,
    name,
    sensorsid,
    active,
    timestamp
  )
VALUES
  (?, ?, ?, ?, ?);

INSERT INTO
  areas (id, name)
VALUES
  (?, ?);

INSERT INTO
  measurements (
    id,
    sensorsid,
    access_pointsid,
    timestamp,
    location
  )
VALUES
  (?, ?, ?, ?, ?);

INSERT INTO miners
  (id, 
  name, 
  sensorsid, 
  shift, 
  created_by, 
  updated_by, 
  last_updated, 
  created, 
  usersid, 
  email) 
VALUES 
  (?, 
  ?, 
  ?, 
  ?, 
  ?, 
  ?, 
  ?, 
  ?, 
  ?, 
  ?);


INSERT INTO sensors
  (id, 
  access_pointsid, 
  active, 
  modified_by, 
  available, 
  deviceId) 
VALUES 
  (?, 
  ?, 
  ?, 
  ?, 
  ?, 
  ?);



INSERT INTO
  users (
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
  )
VALUES
  (
    ?,
    ?,
    ?,
    ?,
    ?,
    ?,
    ?,
    ?,
    ?,
    ?,
    ?
  );