-- V2 Migration: Add gender column to doctors table
ALTER TABLE doctors ADD COLUMN gender VARCHAR(10) NULL DEFAULT 'MALE';
