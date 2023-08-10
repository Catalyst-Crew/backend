 SELECT
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'area_id', ar.id,
                    'area_name', ar.name,
                    'area_latitude', ar.lat,
                    'area_longitude', ar.longitude,
                    'id_prefix_area', ar.id_prefix,
                    'area_created_at', ar.created_at,
                    'access_points', ap_json.access_points
                )
            ) AS areas
        FROM
            areas ar
        INNER JOIN (
            SELECT
                area_id,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'area_id', ap.area_id,
                        'access_point_id', ap.id,
                        'device_id', ap.device_id,
                        'access_point_name', ap.name,
                        'access_point_latitude', ap.lat,
                        'access_point_status', ap.status,
                        'measurements', mea_json.measurements,
                        'id_prefix_access_point', ap.id_prefix,
                        'access_point_longitude', ap.longitude,
                        'access_point_created_at', ap.created_at
                    )
                ) AS access_points
            FROM
                access_points ap
            LEFT JOIN (
                SELECT
                    access_point_id,
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', mea.id,
                            'miner_id', min.id,
                            'miner_name', min.name,
                            'location', mea.location,
                            'miner_shift', min.shift,
                            'sensor_id', mea.sensor_id,
                            'other_data', mea.other_data,
                            'created_at', mea.created_at,
                            'miner_supervisor', min.user_id,
                            'access_point_id', mea.access_point_id,
                            'measurement_id_prefix', mea.id_prefix,
                            'sensor_id_prefix', sen_json.id_prefix,
                            'sensor_device_id', sen_json.device_id
                        )
                    ) AS measurements
                FROM (
                    SELECT
                        m1.*
                    FROM
                        measurements m1
                    INNER JOIN (
                        SELECT
                            sensor_id,
                            MAX(created_at) AS latest_created_at
                        FROM
                            measurements
                        GROUP BY
                            sensor_id
                    ) m2 ON m1.sensor_id = m2.sensor_id AND m1.created_at = m2.latest_created_at
                ) mea
                INNER JOIN sensors sen_json ON mea.sensor_id = sen_json.id
                INNER JOIN miners min ON sen_json.id = min.sensor_id
                GROUP BY
                    access_point_id
            ) mea_json ON ap.id = mea_json.access_point_id
            GROUP BY
                area_id
        ) ap_json ON ar.id = ap_json.area_id;