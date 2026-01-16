import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Users, UserCheck, Loader2, GraduationCap, Link2, Unlink } from 'lucide-react';
import { toast } from 'sonner';

interface Student {
  id: string;
  full_name: string;
  roll_number: string;
  email: string | null;
  program: string;
  batch: string;
  mentor_id: string | null;
  mentor?: {
    id: string;
    name: string;
    department: string;
  } | null;
}

interface Mentor {
  id: string;
  name: string;
  department: string;
  email: string | null;
}

export default function StudentMentorAssignment() {
  const [students, setStudents] = useState<Student[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMentor, setFilterMentor] = useState<string>('all');
  
  // Assignment dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedMentorId, setSelectedMentorId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch students with their mentors
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          full_name,
          roll_number,
          email,
          program,
          batch,
          mentor_id,
          mentor:mentors(id, name, department)
        `)
        .order('roll_number');

      if (studentsError) throw studentsError;
      
      // Transform the data to handle the mentor relation
      const transformedStudents = (studentsData || []).map(student => ({
        ...student,
        mentor: Array.isArray(student.mentor) ? student.mentor[0] : student.mentor
      }));
      
      setStudents(transformedStudents);

      // Fetch all mentors
      const { data: mentorsData, error: mentorsError } = await supabase
        .from('mentors')
        .select('id, name, department, email')
        .order('name');

      if (mentorsError) throw mentorsError;
      setMentors(mentorsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openAssignDialog = (student: Student) => {
    setSelectedStudent(student);
    setSelectedMentorId(student.mentor_id || '');
    setAssignDialogOpen(true);
  };

  const handleAssignMentor = async () => {
    if (!selectedStudent) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({ mentor_id: selectedMentorId || null })
        .eq('id', selectedStudent.id);

      if (error) throw error;

      toast.success(selectedMentorId ? 'Mentor assigned successfully' : 'Mentor unassigned successfully');
      setAssignDialogOpen(false);
      setSelectedStudent(null);
      setSelectedMentorId('');
      await fetchData();
    } catch (error) {
      console.error('Error assigning mentor:', error);
      toast.error('Failed to assign mentor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnassignMentor = async (studentId: string) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ mentor_id: null })
        .eq('id', studentId);

      if (error) throw error;

      toast.success('Mentor unassigned successfully');
      await fetchData();
    } catch (error) {
      console.error('Error unassigning mentor:', error);
      toast.error('Failed to unassign mentor');
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    const matchesMentor = 
      filterMentor === 'all' ||
      (filterMentor === 'unassigned' && !student.mentor_id) ||
      (filterMentor === 'assigned' && student.mentor_id) ||
      student.mentor_id === filterMentor;

    return matchesSearch && matchesMentor;
  });

  const studentsWithMentor = students.filter(s => s.mentor_id).length;
  const studentsWithoutMentor = students.filter(s => !s.mentor_id).length;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-600" />
              With Mentor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{studentsWithMentor}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-600" />
              Unassigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{studentsWithoutMentor}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Student-Mentor Assignment
              </CardTitle>
              <CardDescription>Assign faculty mentors to students</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, roll number, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterMentor} onValueChange={setFilterMentor}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Filter by mentor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="unassigned">Unassigned Only</SelectItem>
                <SelectItem value="assigned">Assigned Only</SelectItem>
                {mentors.map((mentor) => (
                  <SelectItem key={mentor.id} value={mentor.id}>
                    {mentor.name} ({mentor.department})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Assigned Mentor</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No students found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-mono font-medium">
                        {student.roll_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{student.full_name}</p>
                          {student.email && (
                            <p className="text-xs text-muted-foreground">{student.email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{student.program}</TableCell>
                      <TableCell>{student.batch}</TableCell>
                      <TableCell>
                        {student.mentor ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              {student.mentor.name}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              ({student.mentor.department})
                            </span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">
                            Unassigned
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAssignDialog(student)}
                          >
                            <Link2 className="h-4 w-4 mr-1" />
                            {student.mentor_id ? 'Change' : 'Assign'}
                          </Button>
                          {student.mentor_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleUnassignMentor(student.id)}
                            >
                              <Unlink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Mentor</DialogTitle>
            <DialogDescription>
              {selectedStudent && (
                <>
                  Assign a faculty mentor to <strong>{selectedStudent.full_name}</strong> ({selectedStudent.roll_number})
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="mentor-select">Select Mentor</Label>
            <Select value={selectedMentorId} onValueChange={setSelectedMentorId}>
              <SelectTrigger id="mentor-select" className="mt-2">
                <SelectValue placeholder="Select a mentor..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No Mentor (Unassign)</SelectItem>
                {mentors.map((mentor) => (
                  <SelectItem key={mentor.id} value={mentor.id}>
                    <div className="flex flex-col">
                      <span>{mentor.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {mentor.department} {mentor.email && `• ${mentor.email}`}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignMentor} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedMentorId ? 'Assign Mentor' : 'Remove Mentor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}