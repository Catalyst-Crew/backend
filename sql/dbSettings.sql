/ / Make auto increment start at 1 million for all tables
ALTER TABLE
    `access` AUTO_INCREMENT = 1000000;

ALTER TABLE
    access_points AUTO_INCREMENT = 1000000;

ALTER TABLE
    `announcements` AUTO_INCREMENT = 1000000;

ALTER TABLE
    `areas` AUTO_INCREMENT = 1000000;

ALTER TABLE
    `logs` AUTO_INCREMENT = 1;

ALTER TABLE
    `measurements` AUTO_INCREMENT = 1000000;

ALTER TABLE
    `miners` AUTO_INCREMENT = 1000000;

ALTER TABLE
    `sensor_alerts` AUTO_INCREMENT = 1000000;

ALTER TABLE
    `sensors` AUTO_INCREMENT = 1000000;

ALTER TABLE
    `settings` AUTO_INCREMENT = 1000000;

ALTER TABLE
    `shifts` AUTO_INCREMENT = 1000000;

ALTER TABLE
    `user_roles` AUTO_INCREMENT = 1000000;

ALTER TABLE
    `users` AUTO_INCREMENT = 1000000;

ALTER TABLE
    `areas`
MODIFY
    column `draw_coords` JSON;

SET
    time_zone = '+02:00';

INSERT INTO
    access (`name`)
VALUES
    ('GRANTED'),
    ('BLOCKED'),
    ('DELETED'),
    ('VIEWER');

INSERT INTO
    areas (name, lat, longitude, draw_coords)
VALUES
    (
        'Shaft-A1',
        -26.260693,
        29.121075,
        '[[1,2],[3,4]]'
    ),
    (
        'Shaft-A2',
        -26.261930,
        29.121000,
        '[[1,2],[3,4]]'
    );

INSERT INTO
    access_points (area_id, name, lat, longitude, status)
VALUES
    (1000000, 'A1-1', -26.260693, 29.121075, 1,),
    (1000001, 'A1-2', -26.261693, 29.120075, 0,),
    (1000000, 'A1-3', -26.260693, 29.122075, 1,);

INSERT INTO
    shifts (name)
VALUES
    ('DAY'),
    ('NIGHT');

INSERT INTO
    user_roles (name)
VALUES
    ('Admin'),
    ('Moderator'),
    ('User');