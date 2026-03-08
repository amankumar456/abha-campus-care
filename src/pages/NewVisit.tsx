import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, Calendar as CalendarIcon, Search, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Student {
  id: string;
  roll_number: string;
  full_name: string;
  program: string;
}

const REASON_CATEGORIES = [
  { value: 'medical_illness', label: 'Medical Illness' },
  { value: 'injury', label: 'Injury' },
  { value: 'mental_wellness', label: 'Mental Wellness Counselling' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'routine_checkup', label: 'Routine Check-up' },
  { value: 'other', label: 'Other' }
];

const SUBCATEGORIES: Record<string, string[]> = {
  medical_illness: ['Fever/Cold', 'Seasonal Allergies', 'Gastric Issues', 'Headache/Migraine', 'Skin Issues', 'Other'],
  injury: ['Sports Injury', 'Accident', 'Fall', 'Other'],
  mental_wellness: ['Anxiety', 'Depression', 'Stress', 'Sleep Issues', 'Other'],
  vaccination: ['COVID Booster', 'Flu Shot', 'Hepatitis', 'Other'],
  routine_checkup: ['Annual Physical', 'Vision Screening', 'Dental Check', 'Other'],
  other: ['Other']
};

const NewVisit = () => {
  const navigate = useNavigate();
  const { user, isDoctor, loading: roleLoading, doctorId } = useUserRole();
  const [searchRoll, setSearchRoll] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [reasonCategory, setReasonCategory] = useState('');
  const [reasonSubcategory, setReasonSubcategory] = useState('');
  const [reasonNotes, setReasonNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState<Date>();

  useEffect(() => {
    if (!roleLoading && !user) {
      navigate('/auth');
    }
  }, [user, roleLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && !isDoctor) {
      toast.error('Only doctors can log new visits');
      navigate('/health-dashboard');
    }
  }, [roleLoading, isDoctor, navigate]);

  const handleSearchStudent = async () => {
    if (!searchRoll.trim()) return;

    setSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, roll_number, full_name, program')
        .eq('roll_number', searchRoll.trim())
        .single();

      if (error || !data) {
        toast.error('Student not found');
        setSelectedStudent(null);
      } else {
        setSelectedStudent(data);
        toast.success('Student found');
      }
    } catch (error) {
      toast.error('Error searching for student');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudent) {
      toast.error('Please select a student first');
      return;
    }

    if (!reasonCategory) {
      toast.error('Please select a reason for visit');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('health_visits')
        .insert({
          student_id: selectedStudent.id,
          doctor_id: doctorId,
          reason_category: reasonCategory as any,
          reason_subcategory: reasonSubcategory || null,
          reason_notes: reasonNotes || null,
          diagnosis: diagnosis || null,
          prescription: prescription || null,
          follow_up_required: followUpRequired,
          follow_up_date: followUpDate ? format(followUpDate, 'yyyy-MM-dd') : null
        });

      if (error) throw error;

      toast.success('Visit record created successfully');
      navigate(`/student-profile/${selectedStudent.roll_number}`);
    } catch (error) {
      console.error('Error creating visit:', error);
      toast.error('Failed to create visit record');
    } finally {
      setSubmitting(false);
    }
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-3xl mx-auto p-8 space-y-8">

        <Card>
          <CardHeader>
            <CardTitle>Log New Health Visit</CardTitle>
            <CardDescription>Record a new student health centre visit</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Student Search */}
              <div className="space-y-2">
                <Label>Search Student by Roll Number</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., UE20CS001"
                    value={searchRoll}
                    onChange={(e) => setSearchRoll(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchStudent())}
                  />
                  <Button type="button" onClick={handleSearchStudent} disabled={searchLoading}>
                    {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
                {selectedStudent && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-medium">{selectedStudent.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedStudent.roll_number} • {selectedStudent.program}
                    </p>
                  </div>
                )}
              </div>

              {/* Reason Category */}
              <div className="space-y-2">
                <Label>Reason for Visit *</Label>
                <Select value={reasonCategory} onValueChange={(v) => { setReasonCategory(v); setReasonSubcategory(''); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason category" />
                  </SelectTrigger>
                  <SelectContent>
                    {REASON_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subcategory */}
              {reasonCategory && SUBCATEGORIES[reasonCategory] && (
                <div className="space-y-2">
                  <Label>Specific Issue</Label>
                  <Select value={reasonSubcategory} onValueChange={setReasonSubcategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select specific issue" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBCATEGORIES[reasonCategory].map((sub) => (
                        <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes / Chief Complaint</Label>
                <Textarea
                  placeholder="Describe the patient's condition..."
                  value={reasonNotes}
                  onChange={(e) => setReasonNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Diagnosis */}
              <div className="space-y-2">
                <Label>Diagnosis</Label>
                <Textarea
                  placeholder="Enter diagnosis..."
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Prescription */}
              <div className="space-y-2">
                <Label>Prescription / Advice</Label>
                <Textarea
                  placeholder="Enter prescription or medical advice..."
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Follow-up */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Follow-up Required?</Label>
                  <p className="text-sm text-muted-foreground">Schedule a follow-up visit</p>
                </div>
                <Switch checked={followUpRequired} onCheckedChange={setFollowUpRequired} />
              </div>

              {followUpRequired && (
                <div className="space-y-2">
                  <Label>Follow-up Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left", !followUpDate && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {followUpDate ? format(followUpDate, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={followUpDate}
                        onSelect={setFollowUpDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* Submit */}
              <Button type="submit" className="w-full" disabled={submitting || !selectedStudent}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Visit Record'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewVisit;
