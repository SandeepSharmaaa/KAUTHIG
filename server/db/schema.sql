-- ============================================================
-- KAUTHIG — Event Registration System
-- schema.sql — Core DDL
-- Target: MySQL 8.x
-- ============================================================

CREATE DATABASE IF NOT EXISTS KAUTHIG
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE KAUTHIG;

-- ------------------------------------------------------------
-- users
-- ------------------------------------------------------------
CREATE TABLE users (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    role            ENUM('organizer', 'check_in_staff', 'guest') NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_email UNIQUE (email)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- events
-- ------------------------------------------------------------
CREATE TABLE events (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    venue           VARCHAR(255) NOT NULL,
    is_archived     BOOLEAN NOT NULL DEFAULT FALSE,
    created_by      INT UNSIGNED,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_events_created_by FOREIGN KEY (created_by)
        REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_events_dates CHECK (end_date >= start_date),
    INDEX idx_events_is_archived (is_archived)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- sessions
-- ------------------------------------------------------------
CREATE TABLE sessions (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    event_id            INT UNSIGNED NOT NULL,
    title               VARCHAR(255) NOT NULL,
    start_time          DATETIME NOT NULL,
    duration_minutes    INT UNSIGNED NOT NULL,
    location            VARCHAR(255) NOT NULL,
    capacity            INT UNSIGNED NOT NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_sessions_event_id FOREIGN KEY (event_id)
        REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT chk_sessions_capacity CHECK (capacity > 0),
    INDEX idx_sessions_event_id (event_id),
    INDEX idx_sessions_start_time (start_time)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- registrations
-- ------------------------------------------------------------
CREATE TABLE registrations (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id          INT UNSIGNED NOT NULL,
    attendee_name        VARCHAR(255) NOT NULL,
    attendee_email       VARCHAR(255) NOT NULL,
    status               ENUM('reserved', 'confirmed', 'checked_in', 'cancelled', 'expired')
                             NOT NULL DEFAULT 'reserved',
    reserved_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmed_at         TIMESTAMP NULL,
    checked_in_at        TIMESTAMP NULL,
    cancelled_at         TIMESTAMP NULL,
    expired_at           TIMESTAMP NULL,
    created_by           INT UNSIGNED,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                             ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_registrations_session_id FOREIGN KEY (session_id)
        REFERENCES sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_registrations_created_by FOREIGN KEY (created_by)
        REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uq_registrations_session_email UNIQUE (session_id, attendee_email),
    INDEX idx_registrations_session_status (session_id, status),
    INDEX idx_registrations_attendee_email (attendee_email),
    INDEX idx_registrations_attendee_name (attendee_name),
    INDEX idx_registrations_status_reserved_at (status, reserved_at)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- registration_timeline (append-only audit log)
-- ------------------------------------------------------------
CREATE TABLE registration_timeline (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    registration_id     INT UNSIGNED NOT NULL,
    action               VARCHAR(50) NOT NULL,
    old_status           VARCHAR(20) NULL,
    new_status           VARCHAR(20) NULL,
    note                 TEXT NULL,
    performed_by         INT UNSIGNED NULL,
    performed_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_timeline_registration_id FOREIGN KEY (registration_id)
        REFERENCES registrations(id) ON DELETE CASCADE,
    CONSTRAINT fk_timeline_performed_by FOREIGN KEY (performed_by)
        REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_timeline_registration_id (registration_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- staff_assignments
-- ------------------------------------------------------------
CREATE TABLE staff_assignments (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED NOT NULL,
    session_id      INT UNSIGNED NOT NULL,
    assigned_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_staff_assignments_user_id FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_staff_assignments_session_id FOREIGN KEY (session_id)
        REFERENCES sessions(id) ON DELETE CASCADE,
    CONSTRAINT uq_staff_assignments_user_session UNIQUE (user_id, session_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- capacity_alerts
-- ------------------------------------------------------------
CREATE TABLE capacity_alerts (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id      INT UNSIGNED NOT NULL,
    is_dismissed    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_capacity_alerts_session_id FOREIGN KEY (session_id)
        REFERENCES sessions(id) ON DELETE CASCADE,
    CONSTRAINT uq_capacity_alerts_session_id UNIQUE (session_id)
) ENGINE=InnoDB;

-- ============================================================
-- End of schema.sql
-- ============================================================

show tables;