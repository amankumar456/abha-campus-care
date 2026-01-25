import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Phone, Activity, Calendar, AlertTriangle, X, UserCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

interface EmergencyContacts {
  emergencyContact?: string;
  emergencyRelationship?: string;
  fatherName?: string;
  fatherContact?: string;
  motherName?: string;
  motherContact?: string;
}

interface HealthProfileCardProps {
  userName?: string;
  rollNumber?: string;
  mentorName?: string;
  mentorContact?: string;
  totalVisits?: number;
  thisMonthVisits?: number;
  pendingFollowups?: number;
  lastVisitDate?: string;
  commonIssue?: string;
  isProfileComplete?: boolean;
  emergencyContacts?: EmergencyContacts;
}

const HealthProfileCard = ({
  userName = "Student",
  rollNumber = "N/A",
  mentorName = "Not Assigned",
  mentorContact,
  totalVisits = 0,
  thisMonthVisits = 0,
  pendingFollowups = 0,
  lastVisitDate = "No visits yet",
  commonIssue = "N/A",
  isProfileComplete = false,
  emergencyContacts
}: HealthProfileCardProps) => {
  const [showContactsDialog, setShowContactsDialog] = useState(false);
  const [showIncompleteDialog, setShowIncompleteDialog] = useState(false);
  const navigate = useNavigate();

  const handleEmergencyClick = () => {
    if (isProfileComplete && emergencyContacts?.emergencyContact) {
      setShowContactsDialog(true);
    } else {
      setShowIncompleteDialog(true);
    }
  };

  const hasAnyContact = emergencyContacts?.emergencyContact || 
                        emergencyContacts?.fatherContact || 
                        emergencyContacts?.motherContact ||
                        mentorContact;

  return (
    <>
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

          {/* Emergency Contact Button */}
          <Button 
            variant="destructive" 
            className="w-full mt-4" 
            size="sm"
            onClick={handleEmergencyClick}
          >
            <Phone className="w-4 h-4 mr-2" />
            Emergency Contact
          </Button>
        </CardContent>
      </Card>

      {/* Emergency Contacts Dialog */}
      <Dialog open={showContactsDialog} onOpenChange={setShowContactsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-destructive" />
              Emergency Contacts
            </DialogTitle>
            <DialogDescription>
              Contact these people in case of emergency
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Primary Emergency Contact */}
            {emergencyContacts?.emergencyContact && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-destructive uppercase tracking-wide mb-1">
                      Primary Emergency Contact
                    </p>
                    <p className="font-semibold text-foreground">
                      {emergencyContacts.emergencyRelationship || "Emergency Contact"}
                    </p>
                    <p className="text-lg font-bold text-destructive">
                      {emergencyContacts.emergencyContact}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => window.location.href = `tel:${emergencyContacts.emergencyContact}`}
                  >
                    <Phone className="w-4 h-4 mr-1" /> Call
                  </Button>
                </div>
              </div>
            )}

            {/* Father Contact */}
            {emergencyContacts?.fatherContact && (
              <div className="p-4 rounded-lg bg-muted border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Father
                    </p>
                    <p className="font-semibold text-foreground">
                      {emergencyContacts.fatherName || "Father"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {emergencyContacts.fatherContact}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `tel:${emergencyContacts.fatherContact}`}
                  >
                    <Phone className="w-4 h-4 mr-1" /> Call
                  </Button>
                </div>
              </div>
            )}

            {/* Mother Contact */}
            {emergencyContacts?.motherContact && (
              <div className="p-4 rounded-lg bg-muted border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Mother
                    </p>
                    <p className="font-semibold text-foreground">
                      {emergencyContacts.motherName || "Mother"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {emergencyContacts.motherContact}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `tel:${emergencyContacts.motherContact}`}
                  >
                    <Phone className="w-4 h-4 mr-1" /> Call
                  </Button>
                </div>
              </div>
            )}

            {/* Mentor Contact */}
            {mentorContact && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">
                      Faculty Mentor
                    </p>
                    <p className="font-semibold text-foreground">
                      {mentorName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {mentorContact}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `tel:${mentorContact}`}
                  >
                    <Phone className="w-4 h-4 mr-1" /> Call
                  </Button>
                </div>
              </div>
            )}

            {!hasAnyContact && (
              <div className="text-center py-4 text-muted-foreground">
                <Phone className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No emergency contacts available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Incomplete Profile Dialog */}
      <Dialog open={showIncompleteDialog} onOpenChange={setShowIncompleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              Complete Your Profile First
            </DialogTitle>
            <DialogDescription>
              Emergency contact information is required for your safety
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex gap-3">
                <UserCheck className="w-10 h-10 text-amber-600 shrink-0" />
                <div>
                  <p className="font-medium text-amber-800">Profile Incomplete</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Please complete your student registration to add emergency contact details. 
                    This information is crucial for your safety and enables quick contact with 
                    your family or guardians in case of a medical emergency.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowIncompleteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => navigate('/student-registration')}
              >
                Complete Profile
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HealthProfileCard;
