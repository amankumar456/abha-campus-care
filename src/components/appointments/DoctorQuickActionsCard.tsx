import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  FileText, 
  Ambulance, 
  ClipboardList, 
  Users, 
  Stethoscope 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const DOCTOR_ACTIONS = [
  { 
    id: 'appointments', 
    label: 'View Appointments', 
    icon: ClipboardList, 
    color: 'bg-primary/10 text-primary hover:bg-primary/20',
    path: '/doctor/dashboard'
  },
  { 
    id: 'medical-leave', 
    label: 'Medical Leave', 
    icon: FileText, 
    color: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
    path: '/medical-leave'
  },
  { 
    id: 'emergency', 
    label: 'Emergency', 
    icon: Ambulance, 
    color: 'bg-red-100 text-red-600 hover:bg-red-200',
    path: '/emergency'
  },
  { 
    id: 'new-visit', 
    label: 'New Visit', 
    icon: Stethoscope, 
    color: 'bg-green-100 text-green-600 hover:bg-green-200',
    path: '/new-visit'
  },
  { 
    id: 'medical-team', 
    label: 'Medical Team', 
    icon: Users, 
    color: 'bg-purple-100 text-purple-600 hover:bg-purple-200',
    path: '/medical-team'
  },
];

const DoctorQuickActionsCard = () => {
  const navigate = useNavigate();

  return (
    <Card className="h-full bg-white/95 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <Zap className="w-5 h-5 text-amber-600" />
          </div>
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Navigate to key areas
        </p>
        <div className="grid grid-cols-2 gap-3">
          {DOCTOR_ACTIONS.map((action) => (
            <Button
              key={action.id}
              variant="ghost"
              className={`flex flex-col h-auto py-4 px-3 ${action.color}`}
              onClick={() => navigate(action.path)}
            >
              <action.icon className="w-6 h-6 mb-2" />
              <span className="text-xs font-medium text-center leading-tight">
                {action.label}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DoctorQuickActionsCard;
