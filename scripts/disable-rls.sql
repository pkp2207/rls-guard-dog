-- Quick fix: Disable RLS temporarily for testing
-- Run this in Supabase SQL Editor to allow immediate access

-- Disable RLS temporarily
ALTER TABLE schools DISABLE ROW LEVEL SECURITY;
ALTER TABLE teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE progress DISABLE ROW LEVEL SECURITY;