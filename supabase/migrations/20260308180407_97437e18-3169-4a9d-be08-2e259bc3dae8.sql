-- Reassign all data from fake doctors to Dr. Anchoori Karthik (083a157b-9e8d-493d-8074-a65eede29221)
-- Fake doctors to remove:
-- 985a837b = Dr. Priya Sharma
-- 4470e2dc = Dr. anikant singh
-- 1384646e = Dr. Anil Reddy
-- a87d0f91 = Dr. Kavitha Rao

-- Reassign appointments
UPDATE appointments SET medical_officer_id = '083a157b-9e8d-493d-8074-a65eede29221' 
WHERE medical_officer_id IN ('985a837b-37fa-4d17-be5e-b7692aab43f4','4470e2dc-0b30-40d9-b2d8-f7b8d68b1385','1384646e-f721-4536-a8f8-46882e281617','a87d0f91-344d-4e83-8f6a-0ac1500d4435');

-- Reassign prescriptions
UPDATE prescriptions SET doctor_id = '083a157b-9e8d-493d-8074-a65eede29221' 
WHERE doctor_id IN ('985a837b-37fa-4d17-be5e-b7692aab43f4','4470e2dc-0b30-40d9-b2d8-f7b8d68b1385','1384646e-f721-4536-a8f8-46882e281617','a87d0f91-344d-4e83-8f6a-0ac1500d4435');

-- Reassign medical leave requests (referring_doctor_id)
UPDATE medical_leave_requests SET referring_doctor_id = '083a157b-9e8d-493d-8074-a65eede29221' 
WHERE referring_doctor_id IN ('985a837b-37fa-4d17-be5e-b7692aab43f4','4470e2dc-0b30-40d9-b2d8-f7b8d68b1385','1384646e-f721-4536-a8f8-46882e281617','a87d0f91-344d-4e83-8f6a-0ac1500d4435');

-- Reassign medical leave requests (approved_by_doctor_id)
UPDATE medical_leave_requests SET approved_by_doctor_id = '083a157b-9e8d-493d-8074-a65eede29221' 
WHERE approved_by_doctor_id IN ('985a837b-37fa-4d17-be5e-b7692aab43f4','4470e2dc-0b30-40d9-b2d8-f7b8d68b1385','1384646e-f721-4536-a8f8-46882e281617','a87d0f91-344d-4e83-8f6a-0ac1500d4435');

-- Reassign medical leave requests (cleared_by_doctor_id)
UPDATE medical_leave_requests SET cleared_by_doctor_id = '083a157b-9e8d-493d-8074-a65eede29221' 
WHERE cleared_by_doctor_id IN ('985a837b-37fa-4d17-be5e-b7692aab43f4','4470e2dc-0b30-40d9-b2d8-f7b8d68b1385','1384646e-f721-4536-a8f8-46882e281617','a87d0f91-344d-4e83-8f6a-0ac1500d4435');

-- Reassign lab reports
UPDATE lab_reports SET doctor_id = '083a157b-9e8d-493d-8074-a65eede29221' 
WHERE doctor_id IN ('985a837b-37fa-4d17-be5e-b7692aab43f4','4470e2dc-0b30-40d9-b2d8-f7b8d68b1385','1384646e-f721-4536-a8f8-46882e281617','a87d0f91-344d-4e83-8f6a-0ac1500d4435');

-- Reassign health visits
UPDATE health_visits SET doctor_id = '083a157b-9e8d-493d-8074-a65eede29221' 
WHERE doctor_id IN ('985a837b-37fa-4d17-be5e-b7692aab43f4','4470e2dc-0b30-40d9-b2d8-f7b8d68b1385','1384646e-f721-4536-a8f8-46882e281617','a87d0f91-344d-4e83-8f6a-0ac1500d4435');

-- Reassign ambulance requests
UPDATE ambulance_requests SET requesting_doctor_id = '083a157b-9e8d-493d-8074-a65eede29221' 
WHERE requesting_doctor_id IN ('985a837b-37fa-4d17-be5e-b7692aab43f4','4470e2dc-0b30-40d9-b2d8-f7b8d68b1385','1384646e-f721-4536-a8f8-46882e281617','a87d0f91-344d-4e83-8f6a-0ac1500d4435');

-- Reassign emergency treatments
UPDATE emergency_treatments SET doctor_id = '083a157b-9e8d-493d-8074-a65eede29221' 
WHERE doctor_id IN ('985a837b-37fa-4d17-be5e-b7692aab43f4','4470e2dc-0b30-40d9-b2d8-f7b8d68b1385','1384646e-f721-4536-a8f8-46882e281617','a87d0f91-344d-4e83-8f6a-0ac1500d4435');

-- Reassign emergency handovers
UPDATE emergency_handovers SET handover_from_doctor_id = '083a157b-9e8d-493d-8074-a65eede29221' 
WHERE handover_from_doctor_id IN ('985a837b-37fa-4d17-be5e-b7692aab43f4','4470e2dc-0b30-40d9-b2d8-f7b8d68b1385','1384646e-f721-4536-a8f8-46882e281617','a87d0f91-344d-4e83-8f6a-0ac1500d4435');

UPDATE emergency_handovers SET handover_to_doctor_id = '083a157b-9e8d-493d-8074-a65eede29221' 
WHERE handover_to_doctor_id IN ('985a837b-37fa-4d17-be5e-b7692aab43f4','4470e2dc-0b30-40d9-b2d8-f7b8d68b1385','1384646e-f721-4536-a8f8-46882e281617','a87d0f91-344d-4e83-8f6a-0ac1500d4435');

-- Reassign priority assessments
UPDATE priority_assessments SET assessing_doctor_id = '083a157b-9e8d-493d-8074-a65eede29221' 
WHERE assessing_doctor_id IN ('985a837b-37fa-4d17-be5e-b7692aab43f4','4470e2dc-0b30-40d9-b2d8-f7b8d68b1385','1384646e-f721-4536-a8f8-46882e281617','a87d0f91-344d-4e83-8f6a-0ac1500d4435');

-- Reassign leave approval workflow
UPDATE leave_approval_workflow SET level1_approved_by = '083a157b-9e8d-493d-8074-a65eede29221' 
WHERE level1_approved_by IN ('985a837b-37fa-4d17-be5e-b7692aab43f4','4470e2dc-0b30-40d9-b2d8-f7b8d68b1385','1384646e-f721-4536-a8f8-46882e281617','a87d0f91-344d-4e83-8f6a-0ac1500d4435');

-- Now delete the fake doctors
DELETE FROM medical_officers WHERE id IN (
  '985a837b-37fa-4d17-be5e-b7692aab43f4',
  '4470e2dc-0b30-40d9-b2d8-f7b8d68b1385',
  '1384646e-f721-4536-a8f8-46882e281617',
  'a87d0f91-344d-4e83-8f6a-0ac1500d4435'
);