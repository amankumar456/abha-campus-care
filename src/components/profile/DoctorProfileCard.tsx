import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Phone, 
  Stethoscope,
  Award,
  Building2,
  Calendar,
  FileCheck,
  Edit
} from "lucide-react";
import ProfileCompletionIndicator from "./ProfileCompletionIndicator";

interface DoctorProfileCardProps {
  profile: {
    name: string;
    designation: string;
    qualification: string;
    email: string | null;
    phoneOffice: string | null;
    phoneMobile: string[] | null;
    isSenior: boolean;
  };
  stats?: {
    todayAppointments: number;
    pendingApprovals: number;
    totalPatients: number;
  };
}

export default function DoctorProfileCard({ profile, stats }: DoctorProfileCardProps) {
  // Define profile fields for completion tracking
  const profileFields = [
    { name: "name", label: "Full Name", filled: !!profile.name, required: true },
    { name: "designation", label: "Designation", filled: !!profile.designation, required: true },
    { name: "qualification", label: "Qualification", filled: !!profile.qualification, required: true },
    { name: "email", label: "Email", filled: !!profile.email, required: true },
    { name: "phoneOffice", label: "Office Phone", filled: !!profile.phoneOffice, required: false },
    { name: "phoneMobile", label: "Mobile Phone", filled: !!(profile.phoneMobile && profile.phoneMobile.length > 0), required: true },
  ];

  return (
    <Card className="bg-gradient-to-br from-blue-500/5 to-blue-600/10 border-blue-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5 text-blue-600" />
            My Profile
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-blue-600 hover:text-blue-700"
          >
            <Link to="/doctor/register">
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Completion Indicator */}
        <ProfileCompletionIndicator fields={profileFields} />
        
        <Separator />

        {/* Doctor Info */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Stethoscope className="w-8 h-8 text-blue-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground mb-1">
              {profile.name}
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100">
                {profile.designation}
              </Badge>
              {profile.isSenior && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100">
                  <Award className="w-3 h-3 mr-1" />
                  Senior
                </Badge>
              )}
            </div>
            
            <div className="space-y-2 mt-3">
              <div className="flex items-center gap-2 text-sm">
                <Award className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{profile.qualification}</span>
              </div>
              {profile.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a 
                    href={`mailto:${profile.email}`} 
                    className="text-blue-600 hover:underline truncate max-w-[200px]"
                  >
                    {profile.email}
                  </a>
                </div>
              )}
              {profile.phoneOffice && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <a 
                    href={`tel:${profile.phoneOffice}`} 
                    className="text-blue-600 hover:underline"
                  >
                    {profile.phoneOffice} (Office)
                  </a>
                </div>
              )}
              {profile.phoneMobile && profile.phoneMobile.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {profile.phoneMobile.join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Doctor Stats */}
        {stats && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Today's Overview
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-lg bg-background/50 border text-center">
                <p className="text-xl font-bold text-foreground">{stats.todayAppointments}</p>
                <p className="text-xs text-muted-foreground">Appointments</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50 border text-center">
                <p className="text-xl font-bold text-amber-600">{stats.pendingApprovals}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50 border text-center">
                <p className="text-xl font-bold text-foreground">{stats.totalPatients}</p>
                <p className="text-xs text-muted-foreground">Patients</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Info */}
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <FileCheck className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm text-foreground">Health Centre</p>
              <p className="text-xs text-muted-foreground mt-1">
                NIT Warangal Health Centre • General OPD
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
