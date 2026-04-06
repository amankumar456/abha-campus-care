import { useEffect, useState } from 'react';
import { useStudentAutoFill, getAutoFillValues } from '@/hooks/useStudentAutoFill';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * EXAMPLE: How to use useStudentAutoFill hook in your profile form
 * 
 * This shows how to auto-fill form fields from:
 * ✅ students table (name, email, roll_number, program, branch)
 * ✅ student_profiles table (blood_group, allergies, medications)
 * ✅ auth.users metadata
 */

export default function ProfileFormAutoFillExample() {
  const { studentData, loading, error } = useStudentAutoFill();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    roll_number: '',
    program: '',
    branch: '',
    phone: '',
    blood_group: '',
    known_allergies: '',
    current_medications: '',
    covid_vaccination_status: '',
  });

  // Auto-fill form when student data is loaded
  useEffect(() => {
    if (studentData) {
      const values = getAutoFillValues(studentData);
      setForm(prev => ({
        ...prev,
        ...values,
      }));
    }
  }, [studentData]);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Profile Completion (Auto-fill)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-800">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Profile Completion</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          ✅ Form fields auto-filled from signup data
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Student Basic Info - Auto-filled from students table */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">Basic Information (Auto-filled)</h3>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Full Name</label>
              <Input
                value={form.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                placeholder="Your full name"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="Your email"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Roll Number</label>
                <Input
                  value={form.roll_number}
                  onChange={(e) => handleChange('roll_number', e.target.value)}
                  placeholder="Roll number"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Program</label>
                <Input
                  value={form.program}
                  onChange={(e) => handleChange('program', e.target.value)}
                  placeholder="B.Tech, M.Tech, etc."
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Branch</label>
                <Input
                  value={form.branch}
                  onChange={(e) => handleChange('branch', e.target.value)}
                  placeholder="CSE, ECE, etc."
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Phone</label>
              <Input
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="Your phone number"
              />
            </div>
          </div>
        </div>

        {/* Health Profile - Auto-filled from student_profiles table */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="font-semibold text-green-900 mb-3">Health Information (Auto-filled)</h3>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Blood Group</label>
              <Input
                value={form.blood_group}
                onChange={(e) => handleChange('blood_group', e.target.value)}
                placeholder="A+, B-, O+, etc."
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Known Allergies</label>
              <Textarea
                value={form.known_allergies}
                onChange={(e) => handleChange('known_allergies', e.target.value)}
                placeholder="List any allergies"
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Current Medications</label>
              <Textarea
                value={form.current_medications}
                onChange={(e) => handleChange('current_medications', e.target.value)}
                placeholder="List any current medications"
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">COVID Vaccination Status</label>
              <Input
                value={form.covid_vaccination_status}
                onChange={(e) => handleChange('covid_vaccination_status', e.target.value)}
                placeholder="Fully Vaccinated / Partially Vaccinated / Not Vaccinated"
              />
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-900">
            ℹ️ <strong>Auto-fill Status:</strong> All fields are pre-filled with your signup data from Supabase. You can edit any field as needed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
