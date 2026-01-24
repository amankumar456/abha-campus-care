import { useState } from "react";
import { 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  Siren, 
  Clock, 
  Stethoscope,
  Activity,
  ThermometerSun,
  HeartPulse,
  Brain,
  Bone,
  Eye,
  Wind
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Student {
  id: string;
  full_name: string;
  roll_number: string;
  program: string;
  branch: string | null;
  email?: string | null;
}

interface PriorityAssessmentProps {
  student: Student;
  onAssessmentComplete: (assessment: PriorityAssessmentData) => void;
}

export interface PriorityAssessmentData {
  priorityLevel: "standard" | "urgent" | "emergency";
  symptoms: string[];
  clinicalNotes: string;
  ambulanceRequired: boolean;
  ambulanceTypeRecommended?: "bls" | "als" | "critical_care";
}

const SYMPTOM_CATEGORIES = {
  standard: {
    label: "Standard Care Symptoms",
    icon: ThermometerSun,
    symptoms: [
      "Mild fever (< 101°F)",
      "Common cold/cough",
      "Mild headache",
      "Minor cuts/bruises",
      "Mild stomach upset",
      "Allergies (non-severe)",
      "Minor skin rash",
      "Muscle strain"
    ]
  },
  urgent: {
    label: "Urgent Care Symptoms",
    icon: Activity,
    symptoms: [
      "High fever (> 102°F)",
      "Persistent vomiting",
      "Moderate to severe pain",
      "Dizziness/lightheadedness",
      "Dehydration signs",
      "Sprain/mild injury",
      "Anxiety/panic attack",
      "Migraine"
    ]
  },
  emergency: {
    label: "Emergency Symptoms",
    icon: Siren,
    symptoms: [
      "Severe chest pain",
      "Difficulty breathing",
      "Loss of consciousness",
      "Severe bleeding",
      "Suspected fracture",
      "Seizures",
      "Severe allergic reaction",
      "Stroke symptoms (FAST)"
    ]
  }
};

const PRIORITY_CONFIGS = {
  standard: {
    level: 1,
    label: "Level 1: Standard Care",
    color: "border-primary bg-primary/5",
    badgeColor: "bg-primary/10 text-primary border-primary/20",
    icon: CheckCircle2,
    iconColor: "text-primary",
    description: "Routine consultation - No immediate danger",
    waitTime: "15-30 minutes",
    ambulance: "Not required",
    response: "Routine consultation"
  },
  urgent: {
    level: 2,
    label: "Level 2: Urgent Care",
    color: "border-warning bg-warning/5",
    badgeColor: "bg-warning/10 text-warning-foreground border-warning/20",
    icon: AlertCircle,
    iconColor: "text-warning",
    description: "Priority attention needed - Monitor closely",
    waitTime: "0-10 minutes",
    ambulance: "On standby",
    response: "Priority consultation"
  },
  emergency: {
    level: 3,
    label: "Level 3: Emergency",
    color: "border-destructive bg-destructive/5",
    badgeColor: "bg-destructive/10 text-destructive border-destructive/20",
    icon: Siren,
    iconColor: "text-destructive",
    description: "IMMEDIATE attention required - Life-threatening",
    waitTime: "No wait - Direct treatment",
    ambulance: "REQUIRED immediately",
    response: "Immediate attention"
  }
};

const AMBULANCE_MATRIX = [
  { condition: "Fractures/Dislocations", required: true, type: "bls" as const },
  { condition: "Chest Pain/Breathing Issues", required: true, type: "als" as const },
  { condition: "Severe Bleeding", required: true, type: "als" as const },
  { condition: "Loss of Consciousness", required: true, type: "als" as const },
  { condition: "High Fever with Dehydration", required: false, type: "bls" as const },
  { condition: "Psychological Emergency", required: false, type: "bls" as const },
];

export default function PriorityAssessment({ student, onAssessmentComplete }: PriorityAssessmentProps) {
  const [priorityLevel, setPriorityLevel] = useState<"standard" | "urgent" | "emergency" | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [ambulanceRequired, setAmbulanceRequired] = useState(false);
  const [ambulanceType, setAmbulanceType] = useState<"bls" | "als" | "critical_care">("bls");

  const handlePriorityChange = (value: "standard" | "urgent" | "emergency") => {
    setPriorityLevel(value);
    // Auto-set ambulance requirement for emergencies
    if (value === "emergency") {
      setAmbulanceRequired(true);
      setAmbulanceType("als");
    } else if (value === "standard") {
      setAmbulanceRequired(false);
    }
    
    // Notify parent of assessment
    onAssessmentComplete({
      priorityLevel: value,
      symptoms: selectedSymptoms,
      clinicalNotes,
      ambulanceRequired: value === "emergency" ? true : ambulanceRequired,
      ambulanceTypeRecommended: value === "emergency" ? "als" : (ambulanceRequired ? ambulanceType : undefined)
    });
  };

  const handleSymptomToggle = (symptom: string) => {
    const updated = selectedSymptoms.includes(symptom)
      ? selectedSymptoms.filter(s => s !== symptom)
      : [...selectedSymptoms, symptom];
    setSelectedSymptoms(updated);
    
    if (priorityLevel) {
      onAssessmentComplete({
        priorityLevel,
        symptoms: updated,
        clinicalNotes,
        ambulanceRequired,
        ambulanceTypeRecommended: ambulanceRequired ? ambulanceType : undefined
      });
    }
  };

  const config = priorityLevel ? PRIORITY_CONFIGS[priorityLevel] : null;

  return (
    <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-destructive/10">
            <Siren className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-lg">Emergency Priority Assessment</CardTitle>
            <CardDescription>
              Assess {student.full_name}'s condition to determine care priority
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Priority Level Selection */}
        <div className="space-y-4">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Select Priority Level
          </Label>
          
          <RadioGroup
            value={priorityLevel || ""}
            onValueChange={(val) => handlePriorityChange(val as "standard" | "urgent" | "emergency")}
            className="grid gap-4"
          >
            {(Object.entries(PRIORITY_CONFIGS) as [keyof typeof PRIORITY_CONFIGS, typeof PRIORITY_CONFIGS.standard][]).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <div key={key} className="relative">
                  <RadioGroupItem value={key} id={`priority-${key}`} className="peer sr-only" />
                  <Label
                    htmlFor={`priority-${key}`}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                      "hover:bg-muted/50 peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-offset-2",
                      config.color,
                      priorityLevel === key && "ring-2 ring-offset-2"
                    )}
                  >
                    <div className={cn("p-2 rounded-lg", config.badgeColor)}>
                      <Icon className={cn("h-6 w-6", config.iconColor)} />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">{config.label}</span>
                        <Badge variant="outline" className={config.badgeColor}>
                          Level {config.level}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{config.description}</p>
                      <div className="flex flex-wrap gap-3 text-xs">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Wait: {config.waitTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Siren className="h-3 w-3" />
                          Ambulance: {config.ambulance}
                        </span>
                      </div>
                    </div>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </div>

        {/* Symptom Selection */}
        {priorityLevel && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Observed Symptoms
            </Label>
            
            <div className="grid gap-4">
              {Object.entries(SYMPTOM_CATEGORIES).map(([key, category]) => {
                const Icon = category.icon;
                const isCurrentPriority = key === priorityLevel;
                return (
                  <div 
                    key={key} 
                    className={cn(
                      "p-4 rounded-lg border",
                      isCurrentPriority ? "bg-muted/50 border-primary/30" : "bg-background"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{category.label}</span>
                      {isCurrentPriority && (
                        <Badge variant="secondary" className="text-xs">Recommended</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {category.symptoms.map((symptom) => (
                        <div key={symptom} className="flex items-center space-x-2">
                          <Checkbox
                            id={symptom}
                            checked={selectedSymptoms.includes(symptom)}
                            onCheckedChange={() => handleSymptomToggle(symptom)}
                          />
                          <label 
                            htmlFor={symptom}
                            className="text-sm cursor-pointer leading-tight"
                          >
                            {symptom}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ambulance Decision Matrix for Emergency */}
        {priorityLevel === "emergency" && (
          <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20 animate-in fade-in slide-in-from-top-2 duration-300">
            <h4 className="font-semibold text-destructive flex items-center gap-2 mb-3">
              <Siren className="h-4 w-4" />
              Ambulance Decision Matrix
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Condition</th>
                    <th className="text-center py-2 px-2">Required</th>
                    <th className="text-center py-2 px-2">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {AMBULANCE_MATRIX.map((item, idx) => (
                    <tr key={idx} className="border-b border-muted">
                      <td className="py-2 px-2">{item.condition}</td>
                      <td className="text-center py-2 px-2">
                        {item.required ? (
                          <Badge variant="destructive" className="text-xs">Yes</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Optional</Badge>
                        )}
                      </td>
                      <td className="text-center py-2 px-2">
                        <Badge variant="outline" className="text-xs uppercase">{item.type}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Clinical Notes */}
        {priorityLevel && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <Label htmlFor="clinical-notes" className="text-sm font-medium">
              Clinical Notes (Optional)
            </Label>
            <Textarea
              id="clinical-notes"
              placeholder="Add any relevant clinical observations..."
              value={clinicalNotes}
              onChange={(e) => {
                setClinicalNotes(e.target.value);
                onAssessmentComplete({
                  priorityLevel,
                  symptoms: selectedSymptoms,
                  clinicalNotes: e.target.value,
                  ambulanceRequired,
                  ambulanceTypeRecommended: ambulanceRequired ? ambulanceType : undefined
                });
              }}
              className="resize-none"
              rows={2}
            />
          </div>
        )}

        {/* Assessment Summary */}
        {priorityLevel && config && (
          <div className={cn(
            "p-4 rounded-xl border-2",
            config.color
          )}>
            <div className="flex items-center gap-3">
              <config.icon className={cn("h-8 w-8", config.iconColor)} />
              <div>
                <p className="font-semibold text-foreground">{config.label}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedSymptoms.length > 0 
                    ? `${selectedSymptoms.length} symptom(s) identified`
                    : "Select symptoms to continue"
                  }
                </p>
              </div>
              {priorityLevel === "emergency" && (
                <Badge variant="destructive" className="ml-auto animate-pulse">
                  <Siren className="h-3 w-3 mr-1" />
                  Ambulance Required
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
