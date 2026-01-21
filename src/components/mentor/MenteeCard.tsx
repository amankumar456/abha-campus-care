import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Mail, 
  Phone, 
  BookOpen, 
  GraduationCap,
  Calendar,
  Eye
} from "lucide-react";

interface Student {
  id: string;
  full_name: string;
  roll_number: string;
  email: string | null;
  phone: string | null;
  program: string;
  batch: string;
  branch: string | null;
  year_of_study: string | null;
}

interface MenteeCardProps {
  student: Student;
  onViewProfile?: (studentId: string) => void;
  visitCount?: number;
}

export default function MenteeCard({ student, onViewProfile, visitCount = 0 }: MenteeCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow border-l-4 border-l-primary/50">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="w-7 h-7 text-primary" />
          </div>
          
          {/* Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg text-foreground truncate">
                {student.full_name}
              </h3>
              <Badge variant="outline" className="ml-2">
                {student.batch}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground font-medium mb-3">
              {student.roll_number}
            </p>
            
            {/* Academic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <GraduationCap className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{student.program}</span>
              </div>
              {student.branch && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{student.branch}</span>
                </div>
              )}
              {student.year_of_study && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>{student.year_of_study}</span>
                </div>
              )}
            </div>
            
            {/* Contact Info */}
            <div className="space-y-1.5 mb-3">
              {student.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <a 
                    href={`mailto:${student.email}`} 
                    className="text-primary hover:underline truncate"
                  >
                    {student.email}
                  </a>
                </div>
              )}
              {student.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <a 
                    href={`tel:${student.phone}`} 
                    className="text-primary hover:underline"
                  >
                    {student.phone}
                  </a>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-xs text-muted-foreground">
                {visitCount} health visit{visitCount !== 1 ? 's' : ''} recorded
              </span>
              {onViewProfile && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onViewProfile(student.id)}
                  className="text-primary"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View Details
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
