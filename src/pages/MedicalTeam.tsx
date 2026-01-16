import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Phone, 
  Mail, 
  User, 
  Stethoscope, 
  Calendar, 
  Clock, 
  Ambulance,
  Users,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";
import { Link } from "react-router-dom";

interface MedicalOfficer {
  id: string;
  name: string;
  designation: string;
  qualification: string;
  phone_office: string | null;
  phone_mobile: string[] | null;
  email: string | null;
  is_senior: boolean;
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

interface WorkingStaff {
  id: string;
  name: string;
  designation: string;
  phone: string | null;
  email: string | null;
}

interface ManagementTeam {
  id: string;
  name: string;
  position: string;
  display_order: number;
}

interface AmbulanceService {
  id: string;
  phone_landline: string;
  phone_mobile: string;
  description: string | null;
  equipment: string[] | null;
}

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minutes} ${ampm}`;
};

export default function MedicalTeam() {
  const { data: medicalOfficers, isLoading: loadingOfficers } = useQuery({
    queryKey: ['medical-officers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_officers')
        .select('*')
        .order('is_senior', { ascending: false });
      if (error) throw error;
      return data as MedicalOfficer[];
    }
  });

  const { data: visitingDoctors, isLoading: loadingVisiting } = useQuery({
    queryKey: ['visiting-doctors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visiting_doctors')
        .select('*')
        .order('visit_day');
      if (error) throw error;
      return data as VisitingDoctor[];
    }
  });

  const { data: workingStaff, isLoading: loadingStaff } = useQuery({
    queryKey: ['working-staff'],
    queryFn: async () => {
      const { data, error } = await supabase.from('working_staff').select('*');
      if (error) throw error;
      return data as WorkingStaff[];
    }
  });

  const { data: managementTeam, isLoading: loadingManagement } = useQuery({
    queryKey: ['management-team'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('management_team')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data as ManagementTeam[];
    }
  });

  const { data: ambulanceService } = useQuery({
    queryKey: ['ambulance-service'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ambulance_service')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return data as AmbulanceService | null;
    }
  });

  const isLoading = loadingOfficers || loadingVisiting || loadingStaff || loadingManagement;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Medical Team</h1>
            <p className="text-xl text-primary-foreground/80 max-w-2xl">
              Our dedicated team of medical professionals committed to your health and well-being.
            </p>
            <div className="mt-8 flex gap-4 flex-wrap">
              <Button asChild size="lg" variant="secondary">
                <Link to="/appointments">
                  <Calendar className="w-5 h-5 mr-2" />
                  Book Appointment
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Ambulance Service Banner */}
        {ambulanceService && (
          <section className="emergency-bar">
            <div className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Ambulance className="w-6 h-6 animate-pulse" />
                <span className="font-semibold">24/7 Ambulance Service</span>
              </div>
              <div className="flex items-center gap-6">
                <a href={`tel:${ambulanceService.phone_landline}`} className="flex items-center gap-2 hover:underline">
                  <Phone className="w-4 h-4" />
                  {ambulanceService.phone_landline}
                </a>
                <a href={`tel:${ambulanceService.phone_mobile}`} className="flex items-center gap-2 hover:underline">
                  <Phone className="w-4 h-4" />
                  {ambulanceService.phone_mobile}
                </a>
              </div>
            </div>
          </section>
        )}

        {/* OPD Timings */}
        <section className="bg-accent py-6">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center justify-center gap-8 text-center">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-accent-foreground" />
                <div>
                  <p className="font-semibold text-accent-foreground">Working Days</p>
                  <p className="text-sm text-muted-foreground">8:00 AM - 1:00 PM & 3:00 PM - 8:00 PM</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-accent-foreground" />
                <div>
                  <p className="font-semibold text-accent-foreground">Saturday & Sunday</p>
                  <p className="text-sm text-muted-foreground">9:00 AM - 1:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Tabs defaultValue="officers" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8">
                  <TabsTrigger value="officers" className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4" />
                    Medical Officers
                  </TabsTrigger>
                  <TabsTrigger value="visiting" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Visiting Doctors
                  </TabsTrigger>
                  <TabsTrigger value="staff" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Working Staff
                  </TabsTrigger>
                  <TabsTrigger value="management" className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Management
                  </TabsTrigger>
                </TabsList>

                {/* Medical Officers */}
                <TabsContent value="officers">
                  <div className="grid gap-6 md:grid-cols-2">
                    {medicalOfficers?.map((officer) => (
                      <Card key={officer.id} className="card-feature">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-8 h-8 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">{officer.name}</CardTitle>
                                <p className="text-muted-foreground">{officer.designation}</p>
                              </div>
                            </div>
                            {officer.is_senior && (
                              <Badge variant="default">Senior</Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Qualification:</span> {officer.qualification}
                          </p>
                          {officer.phone_office && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <a href={`tel:${officer.phone_office}`} className="hover:text-primary">
                                {officer.phone_office}
                              </a>
                            </div>
                          )}
                          {officer.phone_mobile && officer.phone_mobile.length > 0 && (
                            <div className="flex items-center gap-2 text-sm flex-wrap">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              {officer.phone_mobile.map((phone, idx) => (
                                <a key={idx} href={`tel:${phone}`} className="hover:text-primary">
                                  {phone}{idx < officer.phone_mobile!.length - 1 ? ', ' : ''}
                                </a>
                              ))}
                            </div>
                          )}
                          {officer.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <a href={`mailto:${officer.email}`} className="hover:text-primary">
                                {officer.email}
                              </a>
                            </div>
                          )}
                          <div className="pt-3">
                            <Button asChild size="sm" variant="outline" className="w-full">
                              <Link to={`/appointments?doctor=${officer.id}&type=medical_officer`}>
                                <Calendar className="w-4 h-4 mr-2" />
                                Book Appointment
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Visiting Doctors */}
                <TabsContent value="visiting">
                  <div className="mb-6 p-4 bg-accent rounded-lg flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                    <p className="text-sm text-accent-foreground">
                      Visiting doctors are available on specific days. Book appointments in advance to secure your slot.
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {visitingDoctors?.map((doctor) => (
                      <Card key={doctor.id} className="card-feature">
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                              <Stethoscope className="w-6 h-6 text-secondary" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{doctor.name}</CardTitle>
                              <Badge variant="secondary" className="mt-1">
                                {doctor.specialization}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>
                              {doctor.is_monthly && doctor.month_week === 1 ? '1st ' : ''}
                              {doctor.visit_day}
                              {doctor.is_monthly ? ' of month' : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>
                              {formatTime(doctor.visit_time_start)} - {formatTime(doctor.visit_time_end)}
                            </span>
                          </div>
                          <Button asChild size="sm" variant="outline" className="w-full mt-2">
                            <Link to={`/appointments?doctor=${doctor.id}&type=visiting_doctor`}>
                              <Calendar className="w-4 h-4 mr-2" />
                              Book Slot
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Working Staff */}
                <TabsContent value="staff">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {workingStaff?.map((staff) => (
                      <Card key={staff.id} className="card-feature">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                              <User className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-semibold">{staff.name}</h3>
                            <p className="text-sm text-muted-foreground mb-4">{staff.designation}</p>
                            {staff.phone && (
                              <a href={`tel:${staff.phone}`} className="flex items-center justify-center gap-2 text-sm hover:text-primary">
                                <Phone className="w-4 h-4" />
                                {staff.phone}
                              </a>
                            )}
                            {staff.email && (
                              <a href={`mailto:${staff.email}`} className="flex items-center justify-center gap-2 text-sm hover:text-primary mt-2">
                                <Mail className="w-4 h-4" />
                                {staff.email}
                              </a>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Management Team */}
                <TabsContent value="management">
                  <Card className="card-feature">
                    <CardHeader>
                      <CardTitle>Medical Management Committee</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-4 font-semibold">Name</th>
                              <th className="text-left py-3 px-4 font-semibold">Position</th>
                            </tr>
                          </thead>
                          <tbody>
                            {managementTeam?.map((member) => (
                              <tr key={member.id} className="border-b last:border-0">
                                <td className="py-3 px-4">{member.name}</td>
                                <td className="py-3 px-4">
                                  <Badge variant={member.position === 'Chairperson' ? 'default' : 'outline'}>
                                    {member.position}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </section>

        {/* Ambulance Equipment Section */}
        {ambulanceService && ambulanceService.equipment && (
          <section className="py-12 bg-muted">
            <div className="container mx-auto px-4">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Ambulance Equipment</h2>
                <p className="text-muted-foreground">{ambulanceService.description}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                {ambulanceService.equipment.map((item, idx) => (
                  <Badge key={idx} variant="outline" className="px-4 py-2 text-sm">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
