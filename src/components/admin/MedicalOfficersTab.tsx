import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Loader2, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';

interface MedicalOfficer {
  id: string;
  name: string;
  designation: string;
  qualification: string;
  email: string | null;
  phone_office: string | null;
  phone_mobile: string[] | null;
  is_senior: boolean;
  user_id: string | null;
}

interface MedicalOfficersTabProps {
  officers: MedicalOfficer[];
  onRefresh: () => void;
}

const MedicalOfficersTab = ({ officers, onRefresh }: MedicalOfficersTabProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState<MedicalOfficer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    qualification: '',
    email: '',
    phone_office: '',
    phone_mobile: '',
    is_senior: false
  });

  const resetForm = () => {
    setFormData({
      name: '',
      designation: '',
      qualification: '',
      email: '',
      phone_office: '',
      phone_mobile: '',
      is_senior: false
    });
    setEditingOfficer(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (officer: MedicalOfficer) => {
    setEditingOfficer(officer);
    setFormData({
      name: officer.name,
      designation: officer.designation,
      qualification: officer.qualification,
      email: officer.email || '',
      phone_office: officer.phone_office || '',
      phone_mobile: officer.phone_mobile?.join(', ') || '',
      is_senior: officer.is_senior
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.designation || !formData.qualification) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const phoneArray = formData.phone_mobile
        ? formData.phone_mobile.split(',').map(p => p.trim()).filter(Boolean)
        : null;

      const data = {
        name: formData.name,
        designation: formData.designation,
        qualification: formData.qualification,
        email: formData.email || null,
        phone_office: formData.phone_office || null,
        phone_mobile: phoneArray,
        is_senior: formData.is_senior
      };

      if (editingOfficer) {
        const { error } = await supabase
          .from('medical_officers')
          .update(data)
          .eq('id', editingOfficer.id);
        if (error) throw error;
        toast.success('Medical officer updated successfully');
      } else {
        const { error } = await supabase
          .from('medical_officers')
          .insert(data);
        if (error) throw error;
        toast.success('Medical officer added successfully');
      }

      setDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Error saving medical officer:', error);
      toast.error('Failed to save medical officer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('medical_officers')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Medical officer deleted successfully');
      setDeleteConfirmId(null);
      onRefresh();
    } catch (error) {
      console.error('Error deleting medical officer:', error);
      toast.error('Failed to delete medical officer');
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Medical Officers
              </CardTitle>
              <CardDescription>Manage permanent medical staff</CardDescription>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Medical Officer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Qualification</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Senior</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {officers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No medical officers found
                  </TableCell>
                </TableRow>
              ) : (
                officers.map((officer) => (
                  <TableRow key={officer.id}>
                    <TableCell className="font-medium">{officer.name}</TableCell>
                    <TableCell>{officer.designation}</TableCell>
                    <TableCell>{officer.qualification}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {officer.email && <div>{officer.email}</div>}
                        {officer.phone_office && <div>{officer.phone_office}</div>}
                      </div>
                    </TableCell>
                    <TableCell>{officer.is_senior ? 'Yes' : 'No'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(officer)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteConfirmId(officer.id)}
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
              {editingOfficer ? 'Edit Medical Officer' : 'Add Medical Officer'}
            </DialogTitle>
            <DialogDescription>
              {editingOfficer ? 'Update the medical officer details' : 'Add a new medical officer to the system'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Dr. John Smith"
              />
            </div>

            <div className="space-y-2">
              <Label>Designation *</Label>
              <Input
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="Medical Officer"
              />
            </div>

            <div className="space-y-2">
              <Label>Qualification *</Label>
              <Input
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                placeholder="MBBS, MD"
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="doctor@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Office Phone</Label>
              <Input
                value={formData.phone_office}
                onChange={(e) => setFormData({ ...formData, phone_office: e.target.value })}
                placeholder="+91 123 456 7890"
              />
            </div>

            <div className="space-y-2">
              <Label>Mobile Phone(s)</Label>
              <Input
                value={formData.phone_mobile}
                onChange={(e) => setFormData({ ...formData, phone_mobile: e.target.value })}
                placeholder="Enter multiple numbers separated by commas"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Senior Medical Officer</Label>
              <Switch
                checked={formData.is_senior}
                onCheckedChange={(checked) => setFormData({ ...formData, is_senior: checked })}
              />
            </div>
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
                editingOfficer ? 'Update' : 'Add'
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
              Are you sure you want to delete this medical officer? This action cannot be undone.
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

export default MedicalOfficersTab;
