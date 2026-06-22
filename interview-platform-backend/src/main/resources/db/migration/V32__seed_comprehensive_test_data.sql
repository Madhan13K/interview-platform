-- V32: Comprehensive test data for all modules
-- Run only in dev/staging environments (NOT production)
-- This seeds realistic data for every feature to enable full platform testing

-- ─────────────────────────────────────────────────────────────
-- Additional Test Users (password for all: Test@123)
-- ─────────────────────────────────────────────────────────────
INSERT INTO users (id, first_name, last_name, email, password, phone_number, status, auth_provider, created_at)
SELECT gen_random_uuid(), 'Alice', 'Johnson', 'alice.johnson@test.com',
       crypt('Test@123', gen_salt('bf')), '+1-555-0101', 'ACTIVE', 'LOCAL', NOW() - INTERVAL '30 days'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'alice.johnson@test.com');

INSERT INTO users (id, first_name, last_name, email, password, phone_number, status, auth_provider, created_at)
SELECT gen_random_uuid(), 'Bob', 'Smith', 'bob.smith@test.com',
       crypt('Test@123', gen_salt('bf')), '+1-555-0102', 'ACTIVE', 'LOCAL', NOW() - INTERVAL '25 days'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'bob.smith@test.com');

INSERT INTO users (id, first_name, last_name, email, password, phone_number, status, auth_provider, created_at)
SELECT gen_random_uuid(), 'Charlie', 'Brown', 'charlie.brown@test.com',
       crypt('Test@123', gen_salt('bf')), '+1-555-0103', 'ACTIVE', 'LOCAL', NOW() - INTERVAL '20 days'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'charlie.brown@test.com');

INSERT INTO users (id, first_name, last_name, email, password, phone_number, status, auth_provider, created_at)
SELECT gen_random_uuid(), 'Diana', 'Lee', 'diana.lee@test.com',
       crypt('Test@123', gen_salt('bf')), '+1-555-0104', 'ACTIVE', 'LOCAL', NOW() - INTERVAL '15 days'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'diana.lee@test.com');

INSERT INTO users (id, first_name, last_name, email, password, phone_number, status, auth_provider, created_at)
SELECT gen_random_uuid(), 'Eve', 'Davis', 'eve.davis@test.com',
       crypt('Test@123', gen_salt('bf')), '+1-555-0105', 'ACTIVE', 'LOCAL', NOW() - INTERVAL '10 days'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'eve.davis@test.com');

INSERT INTO users (id, first_name, last_name, email, password, phone_number, status, auth_provider, created_at)
SELECT gen_random_uuid(), 'Frank', 'Wilson', 'frank.wilson@test.com',
       crypt('Test@123', gen_salt('bf')), '+1-555-0106', 'ACTIVE', 'LOCAL', NOW() - INTERVAL '5 days'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'frank.wilson@test.com');

-- Assign roles to test users
INSERT INTO user_roles (id, user_id, role_id, assigned_at)
SELECT gen_random_uuid(), u.id, r.id, NOW()
FROM users u JOIN roles r ON r.name = 'INTERVIEWER' WHERE u.email = 'alice.johnson@test.com'
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id);

INSERT INTO user_roles (id, user_id, role_id, assigned_at)
SELECT gen_random_uuid(), u.id, r.id, NOW()
FROM users u JOIN roles r ON r.name = 'INTERVIEWER' WHERE u.email = 'bob.smith@test.com'
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id);

INSERT INTO user_roles (id, user_id, role_id, assigned_at)
SELECT gen_random_uuid(), u.id, r.id, NOW()
FROM users u JOIN roles r ON r.name = 'CANDIDATE' WHERE u.email = 'charlie.brown@test.com'
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id);

INSERT INTO user_roles (id, user_id, role_id, assigned_at)
SELECT gen_random_uuid(), u.id, r.id, NOW()
FROM users u JOIN roles r ON r.name = 'CANDIDATE' WHERE u.email = 'diana.lee@test.com'
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id);

INSERT INTO user_roles (id, user_id, role_id, assigned_at)
SELECT gen_random_uuid(), u.id, r.id, NOW()
FROM users u JOIN roles r ON r.name = 'CANDIDATE' WHERE u.email = 'eve.davis@test.com'
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id);

INSERT INTO user_roles (id, user_id, role_id, assigned_at)
SELECT gen_random_uuid(), u.id, r.id, NOW()
FROM users u JOIN roles r ON r.name = 'RECRUITER' WHERE u.email = 'frank.wilson@test.com'
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id);

-- ─────────────────────────────────────────────────────────────
-- Question Categories & Questions
-- ─────────────────────────────────────────────────────────────
INSERT INTO question_categories (id, name, description, created_at)
SELECT gen_random_uuid(), 'Data Structures', 'Questions about arrays, trees, graphs, hash maps', NOW()
WHERE NOT EXISTS (SELECT 1 FROM question_categories WHERE name = 'Data Structures');

INSERT INTO question_categories (id, name, description, created_at)
SELECT gen_random_uuid(), 'System Design', 'Large-scale system architecture questions', NOW()
WHERE NOT EXISTS (SELECT 1 FROM question_categories WHERE name = 'System Design');

INSERT INTO question_categories (id, name, description, created_at)
SELECT gen_random_uuid(), 'Behavioral', 'STAR method behavioral interview questions', NOW()
WHERE NOT EXISTS (SELECT 1 FROM question_categories WHERE name = 'Behavioral');

INSERT INTO question_categories (id, name, description, created_at)
SELECT gen_random_uuid(), 'Frontend', 'React, CSS, JavaScript, accessibility questions', NOW()
WHERE NOT EXISTS (SELECT 1 FROM question_categories WHERE name = 'Frontend');

-- Sample questions
INSERT INTO questions (id, title, description, category_id, difficulty, type, expected_duration_minutes, tags, is_active, created_at)
SELECT gen_random_uuid(), 'Implement LRU Cache', 'Design and implement a Least Recently Used cache with O(1) get and put operations.',
       c.id, 'HARD', 'CODING', 45, 'cache,hashmap,linked-list', true, NOW()
FROM question_categories c WHERE c.name = 'Data Structures'
AND NOT EXISTS (SELECT 1 FROM questions WHERE title = 'Implement LRU Cache');

INSERT INTO questions (id, title, description, category_id, difficulty, type, expected_duration_minutes, tags, is_active, created_at)
SELECT gen_random_uuid(), 'Design URL Shortener', 'Design a URL shortening service like bit.ly that handles billions of URLs.',
       c.id, 'HARD', 'SYSTEM_DESIGN', 60, 'scale,hashing,distributed', true, NOW()
FROM question_categories c WHERE c.name = 'System Design'
AND NOT EXISTS (SELECT 1 FROM questions WHERE title = 'Design URL Shortener');

INSERT INTO questions (id, title, description, category_id, difficulty, type, expected_duration_minutes, tags, is_active, created_at)
SELECT gen_random_uuid(), 'Tell me about a challenging project', 'Describe a technically challenging project and how you overcame obstacles.',
       c.id, 'MEDIUM', 'BEHAVIORAL', 15, 'leadership,problem-solving', true, NOW()
FROM question_categories c WHERE c.name = 'Behavioral'
AND NOT EXISTS (SELECT 1 FROM questions WHERE title = 'Tell me about a challenging project');

INSERT INTO questions (id, title, description, category_id, difficulty, type, expected_duration_minutes, tags, is_active, created_at)
SELECT gen_random_uuid(), 'React Virtual DOM', 'Explain how React Virtual DOM works and why it improves performance.',
       c.id, 'MEDIUM', 'THEORETICAL', 10, 'react,performance,dom', true, NOW()
FROM question_categories c WHERE c.name = 'Frontend'
AND NOT EXISTS (SELECT 1 FROM questions WHERE title = 'React Virtual DOM');

INSERT INTO questions (id, title, description, category_id, difficulty, type, expected_duration_minutes, tags, is_active, created_at)
SELECT gen_random_uuid(), 'Binary Tree Level Order Traversal', 'Implement level-order (BFS) traversal of a binary tree.',
       c.id, 'MEDIUM', 'CODING', 30, 'tree,bfs,queue', true, NOW()
FROM question_categories c WHERE c.name = 'Data Structures'
AND NOT EXISTS (SELECT 1 FROM questions WHERE title = 'Binary Tree Level Order Traversal');

-- ─────────────────────────────────────────────────────────────
-- Job Positions
-- ─────────────────────────────────────────────────────────────
INSERT INTO job_positions (id, title, department, description, requirements, location, status, employment_type, experience_level, salary_range, created_by, created_at)
SELECT gen_random_uuid(), 'Senior Backend Engineer', 'Engineering', 
       'Build scalable microservices with Java/Spring Boot', 'Java, Spring Boot, PostgreSQL, Kafka, 5+ years',
       'Remote', 'OPEN', 'FULL_TIME', 'SENIOR', '$150,000 - $200,000',
       (SELECT id FROM users WHERE email = 'frank.wilson@test.com' LIMIT 1), NOW()
WHERE NOT EXISTS (SELECT 1 FROM job_positions WHERE title = 'Senior Backend Engineer');

INSERT INTO job_positions (id, title, department, description, requirements, location, status, employment_type, experience_level, salary_range, created_by, created_at)
SELECT gen_random_uuid(), 'Frontend Developer', 'Engineering',
       'Build beautiful UIs with React and TypeScript', 'React, TypeScript, CSS, 3+ years',
       'San Francisco, CA', 'OPEN', 'FULL_TIME', 'MID', '$120,000 - $160,000',
       (SELECT id FROM users WHERE email = 'frank.wilson@test.com' LIMIT 1), NOW()
WHERE NOT EXISTS (SELECT 1 FROM job_positions WHERE title = 'Frontend Developer');

INSERT INTO job_positions (id, title, department, description, requirements, location, status, employment_type, experience_level, salary_range, created_by, created_at)
SELECT gen_random_uuid(), 'DevOps Engineer', 'Infrastructure',
       'Manage Kubernetes clusters and CI/CD pipelines', 'Kubernetes, AWS, Terraform, Docker, 4+ years',
       'Remote', 'OPEN', 'FULL_TIME', 'SENIOR', '$140,000 - $180,000',
       (SELECT id FROM users WHERE email = 'frank.wilson@test.com' LIMIT 1), NOW()
WHERE NOT EXISTS (SELECT 1 FROM job_positions WHERE title = 'DevOps Engineer');

-- ─────────────────────────────────────────────────────────────
-- Interviews (past and upcoming)
-- ─────────────────────────────────────────────────────────────
INSERT INTO interviews (id, title, description, status, type, mode, candidate_id, scheduled_by_id, start_time, end_time, time_zone, created_at)
SELECT gen_random_uuid(), 'Technical Screen - Charlie', 'First round technical interview',
       'COMPLETED', 'TECHNICAL', 'VIDEO',
       (SELECT id FROM users WHERE email = 'charlie.brown@test.com' LIMIT 1),
       (SELECT id FROM users WHERE email = 'frank.wilson@test.com' LIMIT 1),
       NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '60 minutes', 'America/New_York', NOW() - INTERVAL '10 days'
WHERE NOT EXISTS (SELECT 1 FROM interviews WHERE title = 'Technical Screen - Charlie');

INSERT INTO interviews (id, title, description, status, type, mode, candidate_id, scheduled_by_id, start_time, end_time, time_zone, created_at)
SELECT gen_random_uuid(), 'System Design - Diana', 'System design round',
       'SCHEDULED', 'SYSTEM_DESIGN', 'VIDEO',
       (SELECT id FROM users WHERE email = 'diana.lee@test.com' LIMIT 1),
       (SELECT id FROM users WHERE email = 'frank.wilson@test.com' LIMIT 1),
       NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '90 minutes', 'America/Los_Angeles', NOW()
WHERE NOT EXISTS (SELECT 1 FROM interviews WHERE title = 'System Design - Diana');

INSERT INTO interviews (id, title, description, status, type, mode, candidate_id, scheduled_by_id, start_time, end_time, time_zone, created_at)
SELECT gen_random_uuid(), 'Behavioral - Eve', 'Final behavioral round',
       'SCHEDULED', 'BEHAVIORAL', 'VIDEO',
       (SELECT id FROM users WHERE email = 'eve.davis@test.com' LIMIT 1),
       (SELECT id FROM users WHERE email = 'frank.wilson@test.com' LIMIT 1),
       NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days' + INTERVAL '45 minutes', 'America/Chicago', NOW()
WHERE NOT EXISTS (SELECT 1 FROM interviews WHERE title = 'Behavioral - Eve');

INSERT INTO interviews (id, title, description, status, type, mode, candidate_id, scheduled_by_id, start_time, end_time, time_zone, created_at)
SELECT gen_random_uuid(), 'Coding Challenge - Charlie', 'Live coding assessment',
       'COMPLETED', 'CODING', 'VIDEO',
       (SELECT id FROM users WHERE email = 'charlie.brown@test.com' LIMIT 1),
       (SELECT id FROM users WHERE email = 'frank.wilson@test.com' LIMIT 1),
       NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '60 minutes', 'America/New_York', NOW() - INTERVAL '5 days'
WHERE NOT EXISTS (SELECT 1 FROM interviews WHERE title = 'Coding Challenge - Charlie');

-- ─────────────────────────────────────────────────────────────
-- Interview Feedback (for completed interviews)
-- ─────────────────────────────────────────────────────────────
INSERT INTO interview_feedback (id, interview_id, interviewer_id, rating, recommendation, strengths, weaknesses, comments, submitted_at)
SELECT gen_random_uuid(),
       (SELECT id FROM interviews WHERE title = 'Technical Screen - Charlie' LIMIT 1),
       (SELECT id FROM users WHERE email = 'alice.johnson@test.com' LIMIT 1),
       4, 'HIRE', 'Strong algorithmic thinking, clean code', 'Could improve system design knowledge', 'Good candidate for mid-level position', NOW() - INTERVAL '6 days'
WHERE NOT EXISTS (SELECT 1 FROM interview_feedback WHERE comments = 'Good candidate for mid-level position');

INSERT INTO interview_feedback (id, interview_id, interviewer_id, rating, recommendation, strengths, weaknesses, comments, submitted_at)
SELECT gen_random_uuid(),
       (SELECT id FROM interviews WHERE title = 'Coding Challenge - Charlie' LIMIT 1),
       (SELECT id FROM users WHERE email = 'bob.smith@test.com' LIMIT 1),
       5, 'STRONG_HIRE', 'Excellent problem solving, optimized solution', 'None noted', 'Outstanding performance on coding challenge', NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM interview_feedback WHERE comments = 'Outstanding performance on coding challenge');

-- ─────────────────────────────────────────────────────────────
-- Notifications
-- ─────────────────────────────────────────────────────────────
INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
SELECT gen_random_uuid(),
       (SELECT id FROM users WHERE email = 'frank.wilson@test.com' LIMIT 1),
       'New Interview Scheduled', 'System Design interview with Diana Lee scheduled for next week.', 'INTERVIEW_SCHEDULED', false, NOW()
WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE title = 'New Interview Scheduled' AND message LIKE '%Diana Lee%');

INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
SELECT gen_random_uuid(),
       (SELECT id FROM users WHERE email = 'frank.wilson@test.com' LIMIT 1),
       'Feedback Submitted', 'Bob Smith submitted feedback for Coding Challenge - Charlie.', 'FEEDBACK_SUBMITTED', false, NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE title = 'Feedback Submitted' AND message LIKE '%Bob Smith%');

INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
SELECT gen_random_uuid(),
       (SELECT id FROM users WHERE email = 'charlie.brown@test.com' LIMIT 1),
       'Interview Completed', 'Your Technical Screen has been completed. Feedback pending.', 'INTERVIEW_COMPLETED', true, NOW() - INTERVAL '7 days'
WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE title = 'Interview Completed' AND message LIKE '%Technical Screen%');

-- ─────────────────────────────────────────────────────────────
-- Tags
-- ─────────────────────────────────────────────────────────────
INSERT INTO tags (id, name, category, color, created_at)
SELECT gen_random_uuid(), 'high-priority', 'priority', '#EF4444', NOW()
WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = 'high-priority');

INSERT INTO tags (id, name, category, color, created_at)
SELECT gen_random_uuid(), 'senior-level', 'level', '#8B5CF6', NOW()
WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = 'senior-level');

INSERT INTO tags (id, name, category, color, created_at)
SELECT gen_random_uuid(), 'remote-ok', 'location', '#10B981', NOW()
WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = 'remote-ok');

INSERT INTO tags (id, name, category, color, created_at)
SELECT gen_random_uuid(), 'needs-follow-up', 'status', '#F59E0B', NOW()
WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = 'needs-follow-up');
