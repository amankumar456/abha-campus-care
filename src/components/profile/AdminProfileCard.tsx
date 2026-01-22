import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Mail, 
  Shield,
  Users,
  Stethoscope,
  GraduationCap,
  Activity,
  ShieldCheck
} from "lucide-react";

interface AdminProfileCardProps {
  profile: {
    email: string;
    name?: string;
    lastSignIn?: string;
  };
  stats?: {
    totalUsers: number;
    totalDoctors: number;
    totalMentors: number;
    totalStudents: number;
  };
}

export default function AdminProfileCard({ profile, stats }: AdminProfileCardProps) {
  return (
    <Card className="bg-gradient-to-br from-red-500/5 to-red-600/10 border-red-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="w-5 h-5 text-red-600" />
          Admin Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Admin Info */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground mb-1">
              {profile.name || 'Administrator'}
            </h3>
            <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100 mb-3">
              <ShieldCheck className="w-3 h-3 mr-1" />
              System Administrator
            </Badge>
            
            <div className="space-y-2 mt-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground truncate max-w-[200px]">{profile.email}</span>
              </div>
              {profile.lastSignIn && (
                <div className="flex items-center gap-2 text-sm">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Last login: {profile.lastSignIn}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Stats */}
        {stats && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              System Overview
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg bg-background/50 border text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-xl font-bold text-foreground">{stats.totalUsers}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50 border text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Stethoscope className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-xl font-bold text-foreground">{stats.totalDoctors}</p>
                <p className="text-xs text-muted-foreground">Doctors</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50 border text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <GraduationCap className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-xl font-bold text-foreground">{stats.totalMentors}</p>
                <p className="text-xs text-muted-foreground">Mentors</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50 border text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <User className="w-4 h-4 text-purple-500" />
                </div>
                <p className="text-xl font-bold text-foreground">{stats.totalStudents}</p>
                <p className="text-xs text-muted-foreground">Students</p>
              </div>
            </div>
          </div>
        )}

        {/* Admin Notice */}
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm text-foreground">Full Access</p>
              <p className="text-xs text-muted-foreground mt-1">
                You have complete administrative control over the health portal system.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
