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

INSERT INTO
  miners (
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
    ?
  );

INSERT INTO
  sensors (
    id,
    access_pointsid,
    active,
    modified_by
  )
VALUES
  (?, ?, ?, ?);

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