
-- Allow pharmacy and lab_officer to view prescriptions
CREATE POLICY "Pharmacy can view prescriptions" ON public.prescriptions
  FOR SELECT USING (has_role(auth.uid(), 'pharmacy'));

CREATE POLICY "Lab officers can view prescriptions" ON public.prescriptions
  FOR SELECT USING (has_role(auth.uid(), 'lab_officer'));

-- Allow pharmacy and lab_officer to view prescription items
CREATE POLICY "Pharmacy can view prescription items" ON public.prescription_items
  FOR SELECT USING (has_role(auth.uid(), 'pharmacy'));

CREATE POLICY "Lab officers can view prescription items" ON public.prescription_items
  FOR SELECT USING (has_role(auth.uid(), 'lab_officer'));

-- Allow pharmacy, lab_officer, and medical_staff to view students
CREATE POLICY "Staff can view students" ON public.students
  FOR SELECT USING (
    has_role(auth.uid(), 'pharmacy') OR 
    has_role(auth.uid(), 'lab_officer') OR 
    has_role(auth.uid(), 'medical_staff')
  );

-- Allow medical_staff to view medical leave requests  
CREATE POLICY "Medical staff can view leave requests" ON public.medical_leave_requests
  FOR SELECT USING (has_role(auth.uid(), 'medical_staff'));
