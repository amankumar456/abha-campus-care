import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Mail, 
  Phone, 
  GraduationCap,
  Building2,
  Calendar,
  Users,
  Activity,
  Clock,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";

interface StudentProfileCardProps {
  profile: {
    fullName: string;
    rollNumber: string;
    email: string | null;
    phone: string | null;
    program: string;
    branch: string | null;
    batch: string;
    yearOfStudy: string | null;
    mentorName: string | null;
    mentorEmail: string | null;
    mentorPhone: string | null;
  };
  healthStats?: {
    totalVisits: number;
    thisMonthVisits: number;
    pendingFollowups: number;
    lastVisitDate: string | null;
  };
}

export default function StudentProfileCard({ profile, healthStats }: StudentProfileCardProps) {
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="w-5 h-5 text-primary" />
          My Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Personal Info */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground mb-1">
              {profile.fullName}
            </h3>
            <Badge variant="secondary" className="mb-3">
              {profile.program} - {profile.batch}
            </Badge>
            
            <div className="space-y-2 mt-3">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">Roll No: {profile.rollNumber}</span>
              </div>
              {profile.branch && (
                <div className="flex items-center gap-2 text-sm">
                  <GraduationCap className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{profile.branch}</span>
                </div>
              )}
              {profile.yearOfStudy && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">Year {profile.yearOfStudy}</span>
                </div>
              )}
              {profile.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a 
                    href={`mailto:${profile.email}`} 
                    className="text-primary hover:underline truncate max-w-[200px]"
                  >
                    {profile.email}
                  </a>
                </div>
              )}
              {profile.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a 
                    href={`tel:${profile.phone}`} 
                    className="text-primary hover:underline"
                  >
                    {profile.phone}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mentor Info */}
        {profile.mentorName && (
          <div className="p-4 rounded-lg bg-background/50 border">
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Faculty Mentor
            </h4>
            <p className="font-medium text-foreground">{profile.mentorName}</p>
            {profile.mentorEmail && (
              <p className="text-sm text-muted-foreground">{profile.mentorEmail}</p>
            )}
            {profile.mentorPhone && (
              <p className="text-sm text-muted-foreground">{profile.mentorPhone}</p>
            )}
          </div>
        )}

        {/* Health Stats */}
        {healthStats && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Health Summary
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-background/50 border text-center">
                <p className="text-2xl font-bold text-foreground">{healthStats.totalVisits}</p>
                <p className="text-xs text-muted-foreground">Total Visits</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50 border text-center">
                <p className="text-2xl font-bold text-foreground">{healthStats.thisMonthVisits}</p>
                <p className="text-xs text-muted-foreground">This Month</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {healthStats.pendingFollowups > 0 && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {healthStats.pendingFollowups} Pending Follow-up
                </Badge>
              )}
              {healthStats.lastVisitDate && (
                <Badge variant="outline" className="text-muted-foreground">
                  <Clock className="w-3 h-3 mr-1" />
                  Last: {healthStats.lastVisitDate}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Update Profile Button */}
        <Button variant="outline" className="w-full" asChild>
          <Link to="/student/register">
            <User className="w-4 h-4 mr-2" />
            Update Profile
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
