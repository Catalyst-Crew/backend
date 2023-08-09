    SELECT
        JSON_ARRAYAGG(
            JSON_OBJECT(
                'measurement_id', m.id,
                'id_prefix_measurement', m.id_prefix,
                'sensor_id', m.sensor_id,
                'access_point_id', m.access_point_id,
                'measurement_created_at', m.created_at,
                'location', m.location,
                'other_data', m.other_data,
                'access_point', JSON_OBJECT(
                    'access_point_id', ap.id,
                    'id_prefix_access_point', ap.id_prefix,
                    'area_id', ap.area_id,
                    'access_point_name', ap.name,
                    'access_point_lat', ap.lat,
                    'access_point_longitude', ap.longitude,
                    'access_point_status', ap.status,
                    'device_id', ap.device_id,
                    'access_point_created_at', ap.created_at
                ),
                'area', JSON_OBJECT(
                    'area_id', ar.id,
                    'id_prefix_area', ar.id_prefix,
                    'area_name', ar.name,
                    'area_lat', ar.lat,
                    'area_longitude', ar.longitude,
                    'area_created_at', ar.created_at
                )
            )
        ) AS combined_data
    FROM measurements m
    JOIN access_points ap ON m.access_point_id = ap.id
    JOIN areas ar ON ap.area_id = ar.id;




SELECT
    s.id AS sensor_id,
    s.id_prefix AS sensor_id_prefix,
    s.status AS sensor_status,
    s.device_id AS sensor_device_id,
    s.available AS sensor_available,
    s.updated_by AS sensor_updated_by,
    s.updated_at AS sensor_updated_at,
    s.created_by AS sensor_created_by,
    s.created_at AS sensor_created_at,
    JSON_ARRAYAGG(
        JSON_OBJECT(
            'measurement_id', m.id,
            'measurement_id_prefix', m.id_prefix,
            'access_point_id', m.access_point_id,
            'access_point_id_prefix', ap.id_prefix,
            'area_id', ap.area_id,
            'area_id_prefix', ar.id_prefix,
            'measurement_created_at', m.created_at,
            'location', m.location,
            'other_data', m.other_data,
            'access_point_name', ap.name,
            'access_point_lat', ap.lat,
            'access_point_longitude', ap.longitude,
            'access_point_status', ap.status,
            'access_point_device_id', ap.device_id,
            'access_point_created_at', ap.created_at,
            'area_name', ar.name,
            'area_lat', ar.lat,
            'area_longitude', ar.longitude,
            'area_created_at', ar.created_at,
            'miner_id', mn.id,
            'miner_id_prefix', mn.id_prefix,
            'miner_name', mn.name,
            'miner_email', mn.email,
            'miner_status', mn.status,
            'miner_created_at', mn.created_at,
            'miner_created_by', mn.created_by,
            'miner_updated_at', mn.updated_at,
            'miner_updated_by', mn.updated_by,
            'miner_user_id', mn.user_id,
            'miner_shift_id', mn.shift_id
        )
    ) AS combined_data
FROM sensors s
LEFT JOIN measurements m ON s.id = m.sensor_id
LEFT JOIN access_points ap ON m.access_point_id = ap.id
LEFT JOIN areas ar ON ap.area_id = ar.id
LEFT JOIN miners mn ON mn.sensor_id = s.id
GROUP BY s.id;


SELECT
    s.id AS sensor_id,
    s.id_prefix AS sensor_id_prefix,
    s.status AS sensor_status,
    s.device_id AS sensor_device_id,
    s.available AS sensor_available,
    s.updated_by AS sensor_updated_by,
    s.updated_at AS sensor_updated_at,
    s.created_by AS sensor_created_by,
    s.created_at AS sensor_created_at,
    JSON_OBJECT(
        'miner_id', mn.id,
        'miner_id_prefix', mn.id_prefix,
        'miner_name', mn.name,
        'miner_email', mn.email,
        'miner_status', mn.status,
        'miner_created_at', mn.created_at,
        'miner_created_by', mn.created_by,
        'miner_updated_at', mn.updated_at,
        'miner_updated_by', mn.updated_by,
        'miner_user_id', mn.user_id,
        'miner_shift_id', mn.shift_id
    ) AS miner_info,
    JSON_OBJECT(
        'area_id', ar.id,
        'area_id_prefix', ar.id_prefix,
        'area_name', ar.name,
        'area_lat', ar.lat,
        'area_longitude', ar.longitude,
        'area_created_at', ar.created_at
    ) AS area_info,
    JSON_OBJECT(
        'access_point_id', ap.id,
        'access_point_id_prefix', ap.id_prefix,
        'access_point_name', ap.name,
        'access_point_lat', ap.lat,
        'access_point_longitude', ap.longitude,
        'access_point_status', ap.status,
        'access_point_device_id', ap.device_id,
        'access_point_created_at', ap.created_at
    ) AS access_point_info,
    JSON_ARRAYAGG(
        JSON_OBJECT(
            'measurement_id', m.id,
            'measurement_id_prefix', m.id_prefix,
            'measurement_access_point_id', m.access_point_id,
            'measurement_created_at', m.created_at,
            'measurement_location', m.location,
            'measurement_other_data', m.other_data
        )
    ) AS measurements
FROM sensors s
LEFT JOIN miners mn ON mn.sensor_id = s.id
LEFT JOIN measurements m ON s.id = m.sensor_id
LEFT JOIN access_points ap ON m.access_point_id = ap.id
LEFT JOIN areas ar ON ap.area_id = ar.id
WHERE s.available = 0
GROUP BY s.id;



SELECT
    s.id AS sensor_id,
    s.id_prefix AS sensor_id_prefix,
    s.status AS sensor_status,
    s.device_id AS sensor_device_id,
    s.available AS sensor_available,
    s.updated_by AS sensor_updated_by,
    s.updated_at AS sensor_updated_at,
    s.created_by AS sensor_created_by,
    s.created_at AS sensor_created_at,
    (SELECT JSON_OBJECT(
        'miner_id', mn.id,
        'miner_id_prefix', mn.id_prefix,
        'miner_name', mn.name,
        'miner_email', mn.email,
        'miner_status', mn.status,
        'miner_created_at', mn.created_at,
        'miner_created_by', mn.created_by,
        'miner_updated_at', mn.updated_at,
        'miner_updated_by', mn.updated_by,
        'miner_user_id', mn.user_id,
        'miner_shift_id', mn.shift_id
    ) FROM miners mn WHERE mn.sensor_id = s.id) AS miner_info,
    (SELECT JSON_OBJECT(
        'area_id', ar.id,
        'area_id_prefix', ar.id_prefix,
        'area_name', ar.name,
        'area_lat', ar.lat,
        'area_longitude', ar.longitude,
        'area_created_at', ar.created_at
    ) FROM areas ar JOIN access_points ap ON ap.area_id = ar.id WHERE ap.id = m.access_point_id) AS area_info,
    (SELECT JSON_OBJECT(
        'access_point_id', ap.id,
        'access_point_id_prefix', ap.id_prefix,
        'access_point_name', ap.name,
        'access_point_lat', ap.lat,
        'access_point_longitude', ap.longitude,
        'access_point_status', ap.status,
        'access_point_device_id', ap.device_id,
        'access_point_created_at', ap.created_at
    ) FROM access_points ap WHERE ap.id = m.access_point_id) AS access_point_info,
    JSON_ARRAYAGG(
        JSON_OBJECT(
            'measurement_id', m.id,
            'measurement_id_prefix', m.id_prefix,
            'measurement_created_at', m.created_at,
            'measurement_location', m.location,
            'measurement_other_data', m.other_data
        )
    ) AS measurements
FROM sensors s
LEFT JOIN measurements m ON s.id = m.sensor_id
WHERE s.available = 0
GROUP BY s.id;
