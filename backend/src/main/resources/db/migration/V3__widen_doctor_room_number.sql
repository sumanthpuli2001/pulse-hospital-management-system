-- =============================================================================
-- Migration: V3__widen_doctor_room_number.sql
-- Description: Expand room_number length to 255 characters for doctors
-- =============================================================================

ALTER TABLE doctors MODIFY room_number VARCHAR(255);
