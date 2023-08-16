CREATE TABLE access (
  id        int(11) NOT NULL AUTO_INCREMENT, 
  id_prefix char(5) DEFAULT 'acc-' NOT NULL, 
  name      char(10) NOT NULL, 
  PRIMARY KEY (id));
CREATE TABLE access_points (
  id         int(11) NOT NULL AUTO_INCREMENT, 
  id_prefix  char(5) DEFAULT 'acc-' NOT NULL, 
  area_id    int(11) NOT NULL, 
  name       char(30) NOT NULL, 
  lat        decimal(9, 6) NOT NULL, 
  longitude  decimal(9, 6) NOT NULL, 
  status     tinyint(3) DEFAULT 1 NOT NULL, 
  device_id  char(50) UNIQUE, 
  created_at datetime DEFAULT CURRENT_TIMESTAMP  NOT NULL, 
  PRIMARY KEY (id));
CREATE TABLE announcements (
  id         int(11) NOT NULL AUTO_INCREMENT, 
  id_prefix  char(5) DEFAULT 'ann-' NOT NULL, 
  usersid    int(11) NOT NULL, 
  name       char(255) NOT NULL, 
  message    varchar(255) DEFAULT 'No Message', 
  created_at datetime DEFAULT CURRENT_TIMESTAMP  NOT NULL, 
  PRIMARY KEY (id));
CREATE TABLE areas (
  id         int(11) NOT NULL AUTO_INCREMENT, 
  id_prefix  char(5) DEFAULT 'are-' NOT NULL, 
  name       char(30) NOT NULL, 
  lat        decimal(9, 6) NOT NULL, 
  longitude  decimal(9, 6) NOT NULL, 
  created_at datetime DEFAULT CURRENT_TIMESTAMP  NOT NULL, 
  PRIMARY KEY (id));
CREATE TABLE logs (
  id         int(11) NOT NULL AUTO_INCREMENT, 
  id_prefix  char(5) DEFAULT 'log-' NOT NULL, 
  loger_id   char(15) NOT NULL, 
  loger_name char(30) DEFAULT 'System' NOT NULL, 
  created_at datetime DEFAULT CURRENT_TIMESTAMP  NOT NULL, 
  message    varchar(255) DEFAULT 'No Message' NOT NULL, 
  PRIMARY KEY (id));
CREATE TABLE measurements (
  id              int(11) NOT NULL AUTO_INCREMENT, 
  id_prefix       char(5) DEFAULT 'mea-' NOT NULL, 
  sensor_id       int(11) NOT NULL, 
  access_point_id int(11) NOT NULL, 
  created_at      datetime DEFAULT CURRENT_TIMESTAMP  NOT NULL, 
  location        char(255) NOT NULL, 
  other_data      varchar(255) NOT NULL, 
  PRIMARY KEY (id), 
  INDEX (sensor_id), 
  INDEX (access_point_id));
CREATE TABLE miners (
  id         int(11) NOT NULL AUTO_INCREMENT, 
  id_prefix  char(5) DEFAULT 'min-' NOT NULL, 
  name       char(20) DEFAULT 'No Name' NOT NULL, 
  email      char(100) DEFAULT 'system@email.com' NOT NULL, 
  status     tinyint(1) DEFAULT 1 NOT NULL, 
  created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL, 
  created_by char(20) DEFAULT 'System' NOT NULL, 
  updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL, 
  updated_by char(20) DEFAULT 'System' NOT NULL, 
  user_id    int(11) NOT NULL, 
  shift_id   int(11) NOT NULL, 
  sensor_id  int(11), 
  PRIMARY KEY (id), 
  INDEX (status), 
  INDEX (user_id), 
  INDEX (shift_id));
CREATE TABLE sensor_alerts (
  id         int(11) NOT NULL AUTO_INCREMENT, 
  id_prefix  char(5) DEFAULT 'ale-' NOT NULL, 
  sensor_id  int(11) NOT NULL, 
  name       char(50) NOT NULL, 
  status     tinyint(3) DEFAULT 1 NOT NULL, 
  created_at datetime DEFAULT CURRENT_TIMESTAMP  NOT NULL, 
  PRIMARY KEY (id), 
  INDEX (sensor_id), 
  INDEX (status));
CREATE TABLE sensors (
  id         int(11) NOT NULL AUTO_INCREMENT, 
  id_prefix  char(5) DEFAULT 'sen-' NOT NULL, 
  status     tinyint(1) DEFAULT 0 NOT NULL, 
  device_id  char(50) UNIQUE, 
  available  tinyint(1) DEFAULT 1 NOT NULL, 
  updated_by char(20) DEFAULT 'System' NOT NULL, 
  updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL, 
  created_by char(20) NOT NULL, 
  created_at datetime DEFAULT CURRENT_TIMESTAMP  NOT NULL, 
  PRIMARY KEY (id), 
  INDEX (status), 
  INDEX (available));
CREATE TABLE settings (
  user_id             int(11) NOT NULL, 
  app_notifications   tinyint(1) DEFAULT 1 NOT NULL, 
  email_notifications tinyint(1) DEFAULT 1 NOT NULL, 
  dark_mode           tinyint(1) DEFAULT 0 NOT NULL, 
  PRIMARY KEY (user_id));
CREATE TABLE shifts (
  id        int(11) NOT NULL AUTO_INCREMENT, 
  id_prefix char(5) DEFAULT 'shi-' NOT NULL, 
  name      char(10) NOT NULL, 
  PRIMARY KEY (id));
CREATE TABLE user_roles (
  id        int(11) NOT NULL AUTO_INCREMENT, 
  id_prefix char(5) DEFAULT 'rol-' NOT NULL, 
  name      char(10) DEFAULT 'Day' NOT NULL, 
  PRIMARY KEY (id));
CREATE TABLE users (
  id           int(11) NOT NULL AUTO_INCREMENT, 
  id_prefix    char(5) DEFAULT 'user-' NOT NULL, 
  name         char(20) DEFAULT 'No Name' NOT NULL, 
  email        char(100) DEFAULT 'system@email.com' NOT NULL UNIQUE, 
  password     varchar(255) NOT NULL, 
  user_role_id int(11) NOT NULL, 
  created_by   char(20) DEFAULT 'System' NOT NULL, 
  created_at   datetime DEFAULT CURRENT_TIMESTAMP  NOT NULL, 
  updated_by   char(20) DEFAULT 'System' NOT NULL, 
  updated_at   datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL, 
  phone        char(11) NOT NULL, 
  access_id    int(11) NOT NULL, 
  area_id      int(11) NOT NULL, 
  PRIMARY KEY (id));
ALTER TABLE users ADD CONSTRAINT FKusers813607 FOREIGN KEY (area_id) REFERENCES areas (id);
ALTER TABLE announcements ADD CONSTRAINT FKannounceme740387 FOREIGN KEY (usersid) REFERENCES users (id);
ALTER TABLE sensor_alerts ADD CONSTRAINT FKsensor_ale45012 FOREIGN KEY (sensor_id) REFERENCES sensors (id);
ALTER TABLE measurements ADD CONSTRAINT FKmeasuremen498651 FOREIGN KEY (access_point_id) REFERENCES access_points (id);
ALTER TABLE access_points ADD CONSTRAINT FKaccess_poi369117 FOREIGN KEY (area_id) REFERENCES areas (id);
ALTER TABLE measurements ADD CONSTRAINT FKmeasuremen1268 FOREIGN KEY (sensor_id) REFERENCES sensors (id);
ALTER TABLE miners ADD CONSTRAINT FKminers201161 FOREIGN KEY (sensor_id) REFERENCES sensors (id);
ALTER TABLE miners ADD CONSTRAINT FKminers229400 FOREIGN KEY (shift_id) REFERENCES shifts (id);
ALTER TABLE users ADD CONSTRAINT FKusers50369 FOREIGN KEY (access_id) REFERENCES access (id);
ALTER TABLE miners ADD CONSTRAINT FKminers594447 FOREIGN KEY (user_id) REFERENCES users (id);
ALTER TABLE settings ADD CONSTRAINT FKsettings81676 FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE Cascade ON DELETE Cascade;
ALTER TABLE users ADD CONSTRAINT FKusers895240 FOREIGN KEY (user_role_id) REFERENCES user_roles (id);

