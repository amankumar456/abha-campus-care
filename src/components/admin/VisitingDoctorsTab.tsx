import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Loader2, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

interface VisitingDoctor {
  id: string;
  name: string;
  specialization: string;
  visit_day: string;
  visit_time_start: string;
  visit_time_end: string;
  is_monthly: boolean;
  month_week: number | null;
}

interface VisitingDoctorsTabProps {
  doctors: VisitingDoctor[];
  onRefresh: () => void;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const WEEKS_OF_MONTH = [
  { value: '1', label: '1st week' },
  { value: '2', label: '2nd week' },
  { value: '3', label: '3rd week' },
  { value: '4', label: '4th week' },
];

const VisitingDoctorsTab = ({ doctors, onRefresh }: VisitingDoctorsTabProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<VisitingDoctor | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    visit_day: '',
    visit_time_start: '',
    visit_time_end: '',
    is_monthly: false,
    month_week: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      specialization: '',
      visit_day: '',
      visit_time_start: '',
      visit_time_end: '',
      is_monthly: false,
      month_week: ''
    });
    setEditingDoctor(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (doctor: VisitingDoctor) => {
    setEditingDoctor(doctor);
    setFormData({
      name: doctor.name,
      specialization: doctor.specialization,
      visit_day: doctor.visit_day,
      visit_time_start: doctor.visit_time_start,
      visit_time_end: doctor.visit_time_end,
      is_monthly: doctor.is_monthly,
      month_week: doctor.month_week?.toString() || ''
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.specialization || !formData.visit_day || 
        !formData.visit_time_start || !formData.visit_time_end) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        name: formData.name,
        specialization: formData.specialization,
        visit_day: formData.visit_day,
        visit_time_start: formData.visit_time_start,
        visit_time_end: formData.visit_time_end,
        is_monthly: formData.is_monthly,
        month_week: formData.is_monthly && formData.month_week ? parseInt(formData.month_week) : null
      };

      if (editingDoctor) {
        const { error } = await supabase
          .from('visiting_doctors')
          .update(data)
          .eq('id', editingDoctor.id);
        if (error) throw error;
        toast.success('Visiting doctor updated successfully');
      } else {
        const { error } = await supabase
          .from('visiting_doctors')
          .insert(data);
        if (error) throw error;
        toast.success('Visiting doctor added successfully');
      }

      setDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Error saving visiting doctor:', error);
      toast.error('Failed to save visiting doctor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('visiting_doctors')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Visiting doctor deleted successfully');
      setDeleteConfirmId(null);
      onRefresh();
    } catch (error) {
      console.error('Error deleting visiting doctor:', error);
      toast.error('Failed to delete visiting doctor');
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Visiting Doctors
              </CardTitle>
              <CardDescription>Manage specialist doctors who visit periodically</CardDescription>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Visiting Doctor
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Visit Day</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No visiting doctors found
                  </TableCell>
                </TableRow>
              ) : (
                doctors.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell className="font-medium">{doctor.name}</TableCell>
                    <TableCell>{doctor.specialization}</TableCell>
                    <TableCell>{doctor.visit_day}</TableCell>
                    <TableCell>
                      {formatTime(doctor.visit_time_start)} - {formatTime(doctor.visit_time_end)}
                    </TableCell>
                    <TableCell>
                      {doctor.is_monthly 
                        ? `Monthly (${WEEKS_OF_MONTH.find(w => w.value === doctor.month_week?.toString())?.label || ''})`
                        : 'Weekly'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(doctor)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteConfirmId(doctor.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDoctor ? 'Edit Visiting Doctor' : 'Add Visiting Doctor'}
            </DialogTitle>
            <DialogDescription>
              {editingDoctor ? 'Update the visiting doctor details' : 'Add a new visiting doctor to the system'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Dr. Jane Doe"
              />
            </div>

            <div className="space-y-2">
              <Label>Specialization *</Label>
              <Input
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                placeholder="e.g., Dermatologist, Psychiatrist"
              />
            </div>

            <div className="space-y-2">
              <Label>Visit Day *</Label>
              <Select 
                value={formData.visit_day} 
                onValueChange={(value) => setFormData({ ...formData, visit_day: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day} value={day}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time *</Label>
                <Input
                  type="time"
                  value={formData.visit_time_start}
                  onChange={(e) => setFormData({ ...formData, visit_time_start: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time *</Label>
                <Input
                  type="time"
                  value={formData.visit_time_end}
                  onChange={(e) => setFormData({ ...formData, visit_time_end: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Monthly Visit (instead of weekly)</Label>
              <Switch
                checked={formData.is_monthly}
                onCheckedChange={(checked) => setFormData({ ...formData, is_monthly: checked, month_week: '' })}
              />
            </div>

            {formData.is_monthly && (
              <div className="space-y-2">
                <Label>Week of Month</Label>
                <Select 
                  value={formData.month_week} 
                  onValueChange={(value) => setFormData({ ...formData, month_week: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select week" />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKS_OF_MONTH.map((week) => (
                      <SelectItem key={week.value} value={week.value}>{week.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                editingDoctor ? 'Update' : 'Add'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this visiting doctor? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VisitingDoctorsTab;
