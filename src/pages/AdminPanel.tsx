import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Shield, UserPlus, Trash2, Loader2, Users, Search, Stethoscope, UserCheck, GraduationCap, Link2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import MedicalOfficersTab from '@/components/admin/MedicalOfficersTab';
import VisitingDoctorsTab from '@/components/admin/VisitingDoctorsTab';
import MentorsTab from '@/components/admin/MentorsTab';
import StudentMentorAssignment from '@/components/admin/StudentMentorAssignment';
import SecurityDashboard from '@/components/admin/SecurityDashboard';

interface UserWithRoles {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  roles: string[];
  linked_doctor: { id: string; name: string } | null;
  linked_mentor: { id: string; name: string } | null;
}

interface Doctor {
  id: string;
  name: string;
  user_id: string | null;
}

interface Mentor {
  id: string;
  name: string;
  department: string;
  email: string | null;
  phone: string | null;
  user_id: string | null;
}

interface MentorForLinking {
  id: string;
  name: string;
  user_id: string | null;
}

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

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-500',
  doctor: 'bg-blue-500',
  mentor: 'bg-green-500',
  student: 'bg-purple-500'
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user, loading: roleLoading } = useUserRole();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [mentorsForLinking, setMentorsForLinking] = useState<MentorForLinking[]>([]);
  const [medicalOfficers, setMedicalOfficers] = useState<MedicalOfficer[]>([]);
  const [visitingDoctors, setVisitingDoctors] = useState<VisitingDoctor[]>([]);
  const [allMentors, setAllMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  
  // Dialog states
  const [addRoleDialogOpen, setAddRoleDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedMentorId, setSelectedMentorId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!roleLoading && !user) {
      navigate('/auth');
    }
  }, [user, roleLoading, navigate]);

  useEffect(() => {
    if (user) {
      checkAdminAndFetchData();
    }
  }, [user]);

  const checkAdminAndFetchData = async () => {
    try {
      // Check if user is admin
      const { data: adminCheck } = await supabase.rpc('has_role', {
        _user_id: user!.id,
        _role: 'admin'
      });

      if (!adminCheck) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);
      await fetchData();
    } catch (error) {
      console.error('Error checking admin status:', error);
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      // Fetch users via edge function
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('list-users', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (response.error) throw response.error;
      setUsers(response.data.users || []);

      // Fetch unlinked doctors for role linking
      const { data: doctorsData } = await supabase
        .from('medical_officers')
        .select('id, name, user_id');
      setDoctors(doctorsData || []);

      // Fetch mentors for linking
      const { data: mentorsData } = await supabase
        .from('mentors')
        .select('id, name, user_id');
      setMentorsForLinking(mentorsData || []);

      // Fetch all medical officers for management
      const { data: medicalOfficersData } = await supabase
        .from('medical_officers')
        .select('*')
        .order('name');
      setMedicalOfficers(medicalOfficersData || []);

      // Fetch all visiting doctors for management
      const { data: visitingDoctorsData } = await supabase
        .from('visiting_doctors')
        .select('*')
        .order('name');
      setVisitingDoctors(visitingDoctorsData || []);

      // Fetch all mentors for management
      const { data: allMentorsData } = await supabase
        .from('mentors')
        .select('*')
        .order('name');
      setAllMentors(allMentorsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async () => {
    if (!selectedUserId || !selectedRole) return;

    setSubmitting(true);
    try {
      // Add role to user_roles table
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUserId,
          role: selectedRole as any
        });

      if (roleError) {
        if (roleError.code === '23505') {
          toast.error('User already has this role');
        } else {
          throw roleError;
        }
        return;
      }

      // Link doctor/mentor profile if selected
      if (selectedRole === 'doctor' && selectedDoctorId) {
        await supabase
          .from('medical_officers')
          .update({ user_id: selectedUserId })
          .eq('id', selectedDoctorId);
      } else if (selectedRole === 'mentor' && selectedMentorId) {
        await supabase
          .from('mentors')
          .update({ user_id: selectedUserId })
          .eq('id', selectedMentorId);
      }

      toast.success('Role added successfully');
      setAddRoleDialogOpen(false);
      setSelectedUserId(null);
      setSelectedRole('');
      setSelectedDoctorId('');
      setSelectedMentorId('');
      await fetchData();
    } catch (error) {
      console.error('Error adding role:', error);
      toast.error('Failed to add role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role as any);

      if (error) throw error;

      // Unlink doctor/mentor profile
      if (role === 'doctor') {
        await supabase
          .from('medical_officers')
          .update({ user_id: null })
          .eq('user_id', userId);
      } else if (role === 'mentor') {
        await supabase
          .from('mentors')
          .update({ user_id: null })
          .eq('user_id', userId);
      }

      toast.success('Role removed successfully');
      await fetchData();
    } catch (error) {
      console.error('Error removing role:', error);
      toast.error('Failed to remove role');
    }
  };

  const openAddRoleDialog = (userId: string) => {
    setSelectedUserId(userId);
    setSelectedRole('');
    setSelectedDoctorId('');
    setSelectedMentorId('');
    setAddRoleDialogOpen(true);
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unlinkedDoctors = doctors.filter(d => !d.user_id);
  const unlinkedMentors = mentorsForLinking.filter(m => !m.user_id);

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-destructive" />
              Admin Access Required
            </CardTitle>
            <CardDescription>
              You don't have administrator privileges to access this panel.
              Please contact an existing administrator to get access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Shield className="h-8 w-8 text-primary" />
                Admin Panel
              </h1>
              <p className="text-muted-foreground">Manage users, doctors, and system settings</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.filter(u => u.roles.includes('admin')).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Doctor Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.filter(u => u.roles.includes('doctor')).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Medical Officers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{medicalOfficers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Visiting Doctors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visitingDoctors.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Mentors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allMentors.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users & Roles
            </TabsTrigger>
            <TabsTrigger value="student-mentor" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Student-Mentor
            </TabsTrigger>
            <TabsTrigger value="medical-officers" className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Medical Officers
            </TabsTrigger>
            <TabsTrigger value="visiting-doctors" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Visiting Doctors
            </TabsTrigger>
            <TabsTrigger value="mentors" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Mentors
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Security Dashboard Tab */}
          <TabsContent value="security">
            <SecurityDashboard />
          </TabsContent>

          {/* Student-Mentor Assignment Tab */}
          <TabsContent value="student-mentor">
            <StudentMentorAssignment />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>View and manage user roles</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Linked Profile</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Sign In</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.roles.length === 0 ? (
                          <span className="text-muted-foreground text-sm">No roles</span>
                        ) : (
                          u.roles.map((role) => (
                            <Badge
                              key={role}
                              className={`${ROLE_COLORS[role]} text-white cursor-pointer hover:opacity-80`}
                              onClick={() => handleRemoveRole(u.id, role)}
                              title="Click to remove"
                            >
                              {role}
                              <Trash2 className="h-3 w-3 ml-1" />
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {u.linked_doctor && (
                        <span className="text-sm">Dr. {u.linked_doctor.name}</span>
                      )}
                      {u.linked_mentor && (
                        <span className="text-sm">{u.linked_mentor.name}</span>
                      )}
                      {!u.linked_doctor && !u.linked_mentor && (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(u.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {u.last_sign_in_at 
                        ? format(new Date(u.last_sign_in_at), 'MMM d, yyyy')
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAddRoleDialog(u.id)}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Add Role
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

            {/* Add Role Dialog */}
            <Dialog open={addRoleDialogOpen} onOpenChange={setAddRoleDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Role to User</DialogTitle>
                  <DialogDescription>
                    Assign a role and optionally link a profile
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="doctor">Doctor</SelectItem>
                        <SelectItem value="mentor">Mentor</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedRole === 'doctor' && unlinkedDoctors.length > 0 && (
                    <div className="space-y-2">
                      <Label>Link Doctor Profile (Optional)</Label>
                      <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a doctor profile" />
                        </SelectTrigger>
                        <SelectContent>
                          {unlinkedDoctors.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedRole === 'mentor' && unlinkedMentors.length > 0 && (
                    <div className="space-y-2">
                      <Label>Link Mentor Profile (Optional)</Label>
                      <Select value={selectedMentorId} onValueChange={setSelectedMentorId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a mentor profile" />
                        </SelectTrigger>
                        <SelectContent>
                          {unlinkedMentors.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddRoleDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddRole} disabled={!selectedRole || submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Role'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="medical-officers">
            <MedicalOfficersTab officers={medicalOfficers} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="visiting-doctors">
            <VisitingDoctorsTab doctors={visitingDoctors} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="mentors">
            <MentorsTab mentors={allMentors} onRefresh={fetchData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
