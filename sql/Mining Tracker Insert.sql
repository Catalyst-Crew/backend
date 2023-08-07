INSERT INTO
  access (id, id_prefix, name)
VALUES
  (?, ?, ?);

INSERT INTO
  access_points (
    id,
    id_prefix,
    area_id,
    name,
    lat,
    longitude
  )
VALUES
  (?, ?, ?, ?, ?, ?);

INSERT INTO
  announcements (
    id,
    id_prefix,
    usersid,
    name,
    message,
    created_at
  )
VALUES
  (?, ?, ?, ?, ?, ?);

INSERT INTO
  areas (
    id,
    id_prefix,
    name,
    lat,
    longitude
  )
VALUES
  (?, ?, ?, ?, ?);

INSERT INTO
  logs (
    id,
    id_prefix,
    loger_id,
    loger_name,
    created_at,
    message
  )
VALUES
  (?, ?, ?, ?, ?, ?);

INSERT INTO
  measurements (
    id,
    id_prefix,
    sensor_id,
    access_point_id,
    created_at,
    location,
    other_data
  )
VALUES
  (?, ?, ?, ?, ?, ?, ?);

INSERT INTO
  miners (
    id,
    id_prefix,
    name,
    email,
    status,
    created_at,
    created_by,
    updated_at,
    updated_by,
    user_id,
    shift_id,
    sensor_id
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
    ?,
    ?
  );

INSERT INTO
  sensor_alerts (
    id,
    id_prefix,
    sensor_id,
    name,
    status,
    created_at
  )
VALUES
  (?, ?, ?, ?, ?, ?);

INSERT INTO
  sensors (
    id,
    id_prefix,
    status,
    device_id,
    available,
    updated_by,
    updated_at,
    created_by,
    created_at
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
    ?
  );

INSERT INTO
  settings (
    user_id,
    app_notifications,
    email_notifications,
    dark_mode
  )
VALUES
  (?, ?, ?, ?);

INSERT INTO
  shifts (id, id_prefix, name)
VALUES
  (?, ?, ?);

INSERT INTO
  user_roles (id, id_prefix, name)
VALUES
  (?, ?, ?);

INSERT INTO
  users (
    id,
    id_prefix,
    name,
    email,
    password,
    user_role_id,
    created_by,
    created_at,
    updated_by,
    updated_at,
    phone,
    access_id,
    area_id
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
    ?,
    ?,
    ?
  );