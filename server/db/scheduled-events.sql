DELIMITER $$
CREATE EVENT IF NOT EXISTS expire_stale_reservations
ON SCHEDULE EVERY 1 MINUTE
DO
BEGIN
    -- Insert timeline entries for expiring registrations
    INSERT INTO registration_timeline (registration_id, action, old_status, new_status, performed_by, performed_at)
    SELECT id, 'status_change', 'reserved', 'expired', NULL, NOW()
    FROM registrations
    WHERE status = 'reserved'
    AND reserved_at < NOW() - INTERVAL 30 MINUTE;
    
    -- Update the registrations
    UPDATE registrations
    SET status = 'expired', expired_at = NOW()
    WHERE status = 'reserved'
    AND reserved_at < NOW() - INTERVAL 30 MINUTE;
END$$
DELIMITER ;

SET GLOBAL event_scheduler = ON;
