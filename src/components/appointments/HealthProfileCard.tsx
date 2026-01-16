import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Phone, Activity, Calendar, AlertTriangle } from "lucide-react";

interface HealthProfileCardProps {
  userName?: string;
  rollNumber?: string;
  mentorName?: string;
  totalVisits?: number;
  thisMonthVisits?: number;
  pendingFollowups?: number;
  lastVisitDate?: string;
  commonIssue?: string;
}

const HealthProfileCard = ({
  userName = "Student",
  rollNumber = "N/A",
  mentorName = "Not Assigned",
  totalVisits = 0,
  thisMonthVisits = 0,
  pendingFollowups = 0,
  lastVisitDate = "No visits yet",
  commonIssue = "N/A"
}: HealthProfileCardProps) => {
  return (
    <Card className="h-full bg-white/95 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          My Health Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Profile Info */}
        <div className="space-y-2">
          <p className="font-semibold text-foreground">{userName}</p>
          <p className="text-sm text-muted-foreground">Roll No: {rollNumber}</p>
          <p className="text-sm text-muted-foreground">Mentor: {mentorName}</p>
        </div>

        {/* Health Summary */}
        <div className="pt-3 border-t space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Health Summary</p>
          <div className="space-y-1 text-sm">
            <p className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Total visits:</span>
              <span className="font-medium">{totalVisits}</span>
            </p>
            <p className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Last visit:</span>
              <span className="font-medium">{lastVisitDate}</span>
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
            {totalVisits} Total Visits
          </Badge>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
            {thisMonthVisits} This Month
          </Badge>
          {pendingFollowups > 0 && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-200">
              {pendingFollowups} Pending Follow-up
            </Badge>
          )}
        </div>

        {/* Emergency Contact */}
        <Button variant="destructive" className="w-full mt-4" size="sm">
          <Phone className="w-4 h-4 mr-2" />
          Emergency Contact
        </Button>
      </CardContent>
    </Card>
  );
};

export default HealthProfileCard;
