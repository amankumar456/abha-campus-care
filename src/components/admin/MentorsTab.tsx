import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Loader2, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

interface Mentor {
  id: string;
  name: string;
  department: string;
  email: string | null;
  phone: string | null;
  user_id: string | null;
}

interface MentorsTabProps {
  mentors: Mentor[];
  onRefresh: () => void;
}

const MentorsTab = ({ mentors, onRefresh }: MentorsTabProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMentor, setEditingMentor] = useState<Mentor | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    email: '',
    phone: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      department: '',
      email: '',
      phone: ''
    });
    setEditingMentor(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (mentor: Mentor) => {
    setEditingMentor(mentor);
    setFormData({
      name: mentor.name,
      department: mentor.department,
      email: mentor.email || '',
      phone: mentor.phone || ''
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.department) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        name: formData.name,
        department: formData.department,
        email: formData.email || null,
        phone: formData.phone || null
      };

      if (editingMentor) {
        const { error } = await supabase
          .from('mentors')
          .update(data)
          .eq('id', editingMentor.id);
        if (error) throw error;
        toast.success('Mentor updated successfully');
      } else {
        const { error } = await supabase
          .from('mentors')
          .insert(data);
        if (error) throw error;
        toast.success('Mentor added successfully');
      }

      setDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Error saving mentor:', error);
      toast.error('Failed to save mentor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('mentors')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Mentor deleted successfully');
      setDeleteConfirmId(null);
      onRefresh();
    } catch (error) {
      console.error('Error deleting mentor:', error);
      toast.error('Failed to delete mentor');
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Mentors
              </CardTitle>
              <CardDescription>Manage student mentors and faculty advisors</CardDescription>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Mentor
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Linked Account</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mentors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No mentors found
                  </TableCell>
                </TableRow>
              ) : (
                mentors.map((mentor) => (
                  <TableRow key={mentor.id}>
                    <TableCell className="font-medium">{mentor.name}</TableCell>
                    <TableCell>{mentor.department}</TableCell>
                    <TableCell>{mentor.email || '-'}</TableCell>
                    <TableCell>{mentor.phone || '-'}</TableCell>
                    <TableCell>
                      {mentor.user_id ? (
                        <span className="text-green-600 text-sm">Linked</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not linked</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(mentor)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteConfirmId(mentor.id)}
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
              {editingMentor ? 'Edit Mentor' : 'Add Mentor'}
            </DialogTitle>
            <DialogDescription>
              {editingMentor ? 'Update the mentor details' : 'Add a new mentor to the system'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Prof. John Smith"
              />
            </div>

            <div className="space-y-2">
              <Label>Department *</Label>
              <Input
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g., Computer Science"
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="mentor@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 123 456 7890"
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
                editingMentor ? 'Update' : 'Add'
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
              Are you sure you want to delete this mentor? This action cannot be undone.
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

export default MentorsTab;
