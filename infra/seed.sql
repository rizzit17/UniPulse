-- UniPulse Seed Data
-- 4 departments, 12 categories, 8 technicians, and 20 sample requests

-- 1. Base Users (BCrypt hash for 'password123': $2a$12$Z0w6n... or standard BCrypt hash)
INSERT INTO users (id, email, password_hash, full_name, role, campus_id, is_active, created_at, updated_at)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'admin@unipulse.edu', '$2a$12$1uTqS4hWcKxY3H6iV6h10.bA5wYV4bJ/8q1wz8cO8D1X1u8h7K6O2', 'System Administrator', 'ADMIN', 'CAMPUS-CENTRAL', true, NOW(), NOW()),
  ('a0000000-0000-0000-0000-000000000002', 'faculty.wright@unipulse.edu', '$2a$12$1uTqS4hWcKxY3H6iV6h10.bA5wYV4bJ/8q1wz8cO8D1X1u8h7K6O2', 'Prof. Arthur Wright', 'FACULTY', 'CAMPUS-CENTRAL', true, NOW(), NOW()),
  ('a0000000-0000-0000-0000-000000000003', 'student.alex@unipulse.edu', '$2a$12$1uTqS4hWcKxY3H6iV6h10.bA5wYV4bJ/8q1wz8cO8D1X1u8h7K6O2', 'Alex Rivera', 'STUDENT', 'CAMPUS-CENTRAL', true, NOW(), NOW()),
  ('a0000000-0000-0000-0000-000000000004', 'student.jordan@unipulse.edu', '$2a$12$1uTqS4hWcKxY3H6iV6h10.bA5wYV4bJ/8q1wz8cO8D1X1u8h7K6O2', 'Jordan Lee', 'STUDENT', 'CAMPUS-CENTRAL', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- 2. Departments
INSERT INTO departments (id, name, code, description, is_active, created_at, updated_at)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'Facilities & Maintenance', 'FACILITIES', 'Campus buildings, electrical, HVAC, and civil works', true, NOW(), NOW()),
  ('d0000000-0000-0000-0000-000000000002', 'IT & Network Infrastructure', 'IT', 'Campus Wi-Fi, computer labs, AV, and networking', true, NOW(), NOW()),
  ('d0000000-0000-0000-0000-000000000003', 'Residential & Housing', 'HOUSING', 'Dormitories, residential furniture, pest control, and keys', true, NOW(), NOW()),
  ('d0000000-0000-0000-0000-000000000004', 'Campus Safety & Security', 'SECURITY', 'Access turnstiles, CCTV surveillance, and fire safety systems', true, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- 3. Categories
INSERT INTO categories (id, name, department_id, default_priority, default_sla_hours, is_active, created_at, updated_at)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'HVAC & Climate Control', 'd0000000-0000-0000-0000-000000000001', 'P2', 24, true, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000002', 'Plumbing & Water Supply', 'd0000000-0000-0000-0000-000000000001', 'P1', 12, true, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000003', 'Electrical Infrastructure', 'd0000000-0000-0000-0000-000000000001', 'P1', 6, true, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000004', 'Campus Wi-Fi & LAN', 'd0000000-0000-0000-0000-000000000002', 'P2', 8, true, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000005', 'Smart Classroom AV & Projectors', 'd0000000-0000-0000-0000-000000000002', 'P2', 12, true, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000006', 'Computer Labs & Workstations', 'd0000000-0000-0000-0000-000000000002', 'P3', 24, true, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000007', 'Furniture & Carpentry', 'd0000000-0000-0000-0000-000000000003', 'P3', 48, true, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000008', 'Pest Control & Sanitation', 'd0000000-0000-0000-0000-000000000003', 'P3', 36, true, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000009', 'Door Locks & Key Services', 'd0000000-0000-0000-0000-000000000003', 'P2', 12, true, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000010', 'Access Turnstiles & Readers', 'd0000000-0000-0000-0000-000000000004', 'P1', 4, true, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000011', 'CCTV Surveillance', 'd0000000-0000-0000-0000-000000000004', 'P2', 12, true, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000012', 'Fire Alarms & Safety Equipment', 'd0000000-0000-0000-0000-000000000004', 'P1', 2, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. Technicians (Users + Profiles)
INSERT INTO users (id, email, password_hash, full_name, role, campus_id, is_active, created_at, updated_at)
VALUES
  ('t0000000-0000-0000-0000-000000000001', 'tech.marcus@unipulse.edu', '$2a$12$1uTqS4hWcKxY3H6iV6h10.bA5wYV4bJ/8q1wz8cO8D1X1u8h7K6O2', 'Marcus Vance', 'TECHNICIAN', 'CAMPUS-CENTRAL', true, NOW(), NOW()),
  ('t0000000-0000-0000-0000-000000000002', 'tech.elena@unipulse.edu', '$2a$12$1uTqS4hWcKxY3H6iV6h10.bA5wYV4bJ/8q1wz8cO8D1X1u8h7K6O2', 'Elena Rostova', 'TECHNICIAN', 'CAMPUS-CENTRAL', true, NOW(), NOW()),
  ('t0000000-0000-0000-0000-000000000003', 'tech.raj@unipulse.edu', '$2a$12$1uTqS4hWcKxY3H6iV6h10.bA5wYV4bJ/8q1wz8cO8D1X1u8h7K6O2', 'Raj Patel', 'TECHNICIAN', 'CAMPUS-CENTRAL', true, NOW(), NOW()),
  ('t0000000-0000-0000-0000-000000000004', 'tech.sarah@unipulse.edu', '$2a$12$1uTqS4hWcKxY3H6iV6h10.bA5wYV4bJ/8q1wz8cO8D1X1u8h7K6O2', 'Sarah Jenkins', 'TECHNICIAN', 'CAMPUS-CENTRAL', true, NOW(), NOW()),
  ('t0000000-0000-0000-0000-000000000005', 'tech.david@unipulse.edu', '$2a$12$1uTqS4hWcKxY3H6iV6h10.bA5wYV4bJ/8q1wz8cO8D1X1u8h7K6O2', 'David Kim', 'TECHNICIAN', 'CAMPUS-CENTRAL', true, NOW(), NOW()),
  ('t0000000-0000-0000-0000-000000000006', 'tech.priya@unipulse.edu', '$2a$12$1uTqS4hWcKxY3H6iV6h10.bA5wYV4bJ/8q1wz8cO8D1X1u8h7K6O2', 'Priya Sharma', 'TECHNICIAN', 'CAMPUS-CENTRAL', true, NOW(), NOW()),
  ('t0000000-0000-0000-0000-000000000007', 'tech.alex@unipulse.edu', '$2a$12$1uTqS4hWcKxY3H6iV6h10.bA5wYV4bJ/8q1wz8cO8D1X1u8h7K6O2', 'Alex Mercer', 'TECHNICIAN', 'CAMPUS-CENTRAL', true, NOW(), NOW()),
  ('t0000000-0000-0000-0000-000000000008', 'tech.fatima@unipulse.edu', '$2a$12$1uTqS4hWcKxY3H6iV6h10.bA5wYV4bJ/8q1wz8cO8D1X1u8h7K6O2', 'Fatima Al-Hassan', 'TECHNICIAN', 'CAMPUS-CENTRAL', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO technician_profiles (user_id, department_id, skills, shift, max_workload, current_workload, is_active, created_at, updated_at)
VALUES
  ('t0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', '["HVAC", "Electrical"]'::jsonb, 'MORNING', 6, 2, true, NOW(), NOW()),
  ('t0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', '["Plumbing", "Sanitation"]'::jsonb, 'EVENING', 5, 1, true, NOW(), NOW()),
  ('t0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', '["Networking", "Wi-Fi", "Switches"]'::jsonb, 'MORNING', 8, 3, true, NOW(), NOW()),
  ('t0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', '["AV Systems", "Hardware", "Projectors"]'::jsonb, 'EVENING', 5, 1, true, NOW(), NOW()),
  ('t0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000003', '["Carpentry", "Furniture", "Locks"]'::jsonb, 'MORNING', 6, 1, true, NOW(), NOW()),
  ('t0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000003', '["Pest Control", "Sanitation"]'::jsonb, 'NIGHT', 4, 1, true, NOW(), NOW()),
  ('t0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000004', '["Access Control", "Turnstiles"]'::jsonb, 'MORNING', 5, 2, true, NOW(), NOW()),
  ('t0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000004', '["Fire Safety", "CCTV", "Emergency"]'::jsonb, 'NIGHT', 6, 1, true, NOW(), NOW())
ON CONFLICT (user_id) DO NOTHING;
