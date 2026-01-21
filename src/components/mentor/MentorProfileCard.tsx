import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Mail, 
  Phone, 
  Building2,
  Users
} from "lucide-react";

interface MentorProfile {
  name: string;
  email: string | null;
  phone: string | null;
  department: string;
}

interface MentorProfileCardProps {
  profile: MentorProfile;
  menteeCount: number;
}

export default function MentorProfileCard({ profile, menteeCount }: MentorProfileCardProps) {
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="w-5 h-5 text-primary" />
          My Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <User className="w-8 h-8 text-primary" />
          </div>
          
          {/* Info */}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground mb-1">
              {profile.name}
            </h3>
            <Badge variant="secondary" className="mb-3">
              Faculty Mentor
            </Badge>
            
            <div className="space-y-2 mt-3">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{profile.department}</span>
              </div>
              {profile.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a 
                    href={`mailto:${profile.email}`} 
                    className="text-primary hover:underline"
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
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">
                  {menteeCount} mentee{menteeCount !== 1 ? 's' : ''} assigned
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
