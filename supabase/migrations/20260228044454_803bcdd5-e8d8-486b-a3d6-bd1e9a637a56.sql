-- Fix existing prescriptions that stored user_id instead of students.id
UPDATE prescriptions p
SET student_id = s.id
FROM students s
WHERE s.user_id = p.student_id
  AND p.student_id != s.id;