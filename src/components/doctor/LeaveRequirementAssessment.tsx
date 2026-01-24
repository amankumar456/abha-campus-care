import { useState } from "react";
import { 
  FileText, 
  Calendar, 
  GraduationCap, 
  Clock, 
  CheckCircle2, 
  XCircle,
  BookOpen,
  Beaker,
  CalendarDays,
  Users,
  Utensils,
  Home,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface LeaveRequirementAssessmentProps {
  studentName: string;
  onAssessmentComplete: (assessment: LeaveAssessmentData) => void;
}

export interface LeaveAssessmentData {
  leaveRequired: boolean;
  leaveDurationCategory?: "short" | "medium" | "extended" | "long_term";
  recommendedDays?: number;
  examsAffected: string[];
  labsAffected: string[];
  specialAccommodations: string[];
  modifiedAcademicPlan?: {
    attendanceModifications: string[];
    inClassAccommodations: string[];
    temporaryRestrictions: string[];
  };
  justification?: string;
  hospitalizationRequired?: boolean;
  caregiverNeeded?: boolean;
  specialEquipment: string[];
}

const LEAVE_DURATION_OPTIONS = {
  short: {
    label: "Short Leave",
    days: "1-3 days",
    description: "Mild illness, minor procedures, recovery from minor injury",
    color: "border-primary bg-primary/5"
  },
  medium: {
    label: "Medium Leave",
    days: "4-7 days",
    description: "Moderate illness, post-operative recovery, infectious diseases",
    color: "border-warning bg-warning/5"
  },
  extended: {
    label: "Extended Leave",
    days: "8-14 days",
    description: "Major illness, surgery recovery, mental health treatment",
    color: "border-secondary bg-secondary/5"
  },
  long_term: {
    label: "Long-term Leave",
    days: "15+ days",
    description: "Serious medical conditions, hospitalization, specialized treatment",
    color: "border-destructive bg-destructive/5"
  }
};

const SPECIAL_ACCOMMODATIONS = [
  { id: "extended_deadlines", label: "Extended deadlines", icon: CalendarDays },
  { id: "alternative_assessment", label: "Alternative assessment", icon: FileText },
  { id: "makeup_classes", label: "Make-up classes", icon: BookOpen },
  { id: "online_access", label: "Online material access", icon: GraduationCap },
  { id: "tutor_assistance", label: "Tutor assistance", icon: Users },
  { id: "hostel_food_modifications", label: "Hostel food modifications", icon: Utensils },
];

const ATTENDANCE_MODIFICATIONS = [
  "Late arrival permitted",
  "Early departure allowed",
  "Skip specific strenuous activities",
  "Flexible attendance tracking"
];

const IN_CLASS_ACCOMMODATIONS = [
  "Extra breaks during class",
  "Permission to stand/stretch",
  "Special seating arrangement",
  "Recording lectures allowed"
];

const TEMPORARY_RESTRICTIONS = [
  "No sports/games",
  "No lab work",
  "Limited library hours",
  "No hostel mess duty",
  "No physical training"
];

const SPECIAL_EQUIPMENT = [
  "Crutches",
  "Walker",
  "Wheelchair",
  "Neck brace",
  "Arm sling",
  "Medical bed rest"
];

export default function LeaveRequirementAssessment({ 
  studentName, 
  onAssessmentComplete 
}: LeaveRequirementAssessmentProps) {
  const [leaveRequired, setLeaveRequired] = useState<boolean | null>(null);
  const [durationCategory, setDurationCategory] = useState<keyof typeof LEAVE_DURATION_OPTIONS | null>(null);
  const [recommendedDays, setRecommendedDays] = useState<number>(0);
  const [examsAffected, setExamsAffected] = useState<string[]>([]);
  const [labsAffected, setLabsAffected] = useState<string[]>([]);
  const [selectedAccommodations, setSelectedAccommodations] = useState<string[]>([]);
  const [attendanceModifications, setAttendanceModifications] = useState<string[]>([]);
  const [inClassAccommodations, setInClassAccommodations] = useState<string[]>([]);
  const [temporaryRestrictions, setTemporaryRestrictions] = useState<string[]>([]);
  const [justification, setJustification] = useState("");
  const [hospitalizationRequired, setHospitalizationRequired] = useState(false);
  const [caregiverNeeded, setCaregiverNeeded] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [examInput, setExamInput] = useState("");
  const [labInput, setLabInput] = useState("");

  const handleLeaveRequiredChange = (required: boolean) => {
    setLeaveRequired(required);
    updateAssessment(required);
  };

  const handleDurationChange = (category: keyof typeof LEAVE_DURATION_OPTIONS) => {
    setDurationCategory(category);
    const daysMap = { short: 2, medium: 5, extended: 10, long_term: 20 };
    setRecommendedDays(daysMap[category]);
    updateAssessment(true, category, daysMap[category]);
  };

  const updateAssessment = (
    required: boolean = leaveRequired || false,
    duration = durationCategory,
    days = recommendedDays
  ) => {
    onAssessmentComplete({
      leaveRequired: required,
      leaveDurationCategory: duration || undefined,
      recommendedDays: days,
      examsAffected,
      labsAffected,
      specialAccommodations: selectedAccommodations,
      modifiedAcademicPlan: !required ? {
        attendanceModifications,
        inClassAccommodations,
        temporaryRestrictions
      } : undefined,
      justification,
      hospitalizationRequired,
      caregiverNeeded,
      specialEquipment: selectedEquipment
    });
  };

  const toggleItem = (item: string, array: string[], setArray: (arr: string[]) => void) => {
    const updated = array.includes(item) 
      ? array.filter(i => i !== item) 
      : [...array, item];
    setArray(updated);
    setTimeout(() => updateAssessment(), 0);
  };

  const addExam = () => {
    if (examInput.trim()) {
      setExamsAffected([...examsAffected, examInput.trim()]);
      setExamInput("");
      setTimeout(() => updateAssessment(), 0);
    }
  };

  const addLab = () => {
    if (labInput.trim()) {
      setLabsAffected([...labsAffected, labInput.trim()]);
      setLabInput("");
      setTimeout(() => updateAssessment(), 0);
    }
  };

  return (
    <Card className="border-2 border-dashed border-secondary/30 bg-gradient-to-br from-secondary/5 to-transparent">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-secondary/10">
            <FileText className="h-6 w-6 text-secondary" />
          </div>
          <div>
            <CardTitle className="text-lg">Medical Leave Requirement Assessment</CardTitle>
            <CardDescription>
              Determine if {studentName} requires medical leave from academic activities
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Leave Required Question */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">
            Does this condition require medical leave from academic activities?
          </Label>
          
          <RadioGroup
            value={leaveRequired === null ? "" : leaveRequired ? "yes" : "no"}
            onValueChange={(val) => handleLeaveRequiredChange(val === "yes")}
            className="grid grid-cols-2 gap-4"
          >
            <div className="relative">
              <RadioGroupItem value="yes" id="leave-yes" className="peer sr-only" />
              <Label
                htmlFor="leave-yes"
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                  "hover:bg-muted/50 peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-primary peer-data-[state=checked]:ring-offset-2",
                  leaveRequired === true && "ring-2 ring-primary ring-offset-2 bg-primary/5 border-primary"
                )}
              >
                <CheckCircle2 className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-semibold">YES</p>
                  <p className="text-sm text-muted-foreground">Student requires medical leave</p>
                </div>
              </Label>
            </div>

            <div className="relative">
              <RadioGroupItem value="no" id="leave-no" className="peer sr-only" />
              <Label
                htmlFor="leave-no"
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                  "hover:bg-muted/50 peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-secondary peer-data-[state=checked]:ring-offset-2",
                  leaveRequired === false && "ring-2 ring-secondary ring-offset-2 bg-secondary/5 border-secondary"
                )}
              >
                <XCircle className="h-6 w-6 text-secondary" />
                <div>
                  <p className="font-semibold">NO</p>
                  <p className="text-sm text-muted-foreground">Modified schedule only</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* If YES - Leave Duration Assessment */}
        {leaveRequired === true && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Leave Duration Selection */}
            <div className="space-y-4">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Leave Duration Assessment
              </Label>
              
              <RadioGroup
                value={durationCategory || ""}
                onValueChange={(val) => handleDurationChange(val as keyof typeof LEAVE_DURATION_OPTIONS)}
                className="grid gap-3"
              >
                {Object.entries(LEAVE_DURATION_OPTIONS).map(([key, option]) => (
                  <div key={key} className="relative">
                    <RadioGroupItem value={key} id={`duration-${key}`} className="peer sr-only" />
                    <Label
                      htmlFor={`duration-${key}`}
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                        "hover:bg-muted/50 peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-offset-2",
                        option.color,
                        durationCategory === key && "ring-2 ring-offset-2"
                      )}
                    >
                      <Clock className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{option.label}</span>
                          <Badge variant="outline">{option.days}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Exact Days Input */}
            {durationCategory && (
              <div className="space-y-2">
                <Label htmlFor="exactDays">Exact Number of Days</Label>
                <Input
                  id="exactDays"
                  type="number"
                  min={1}
                  max={90}
                  value={recommendedDays}
                  onChange={(e) => {
                    setRecommendedDays(parseInt(e.target.value) || 0);
                    updateAssessment();
                  }}
                  className="w-32"
                />
              </div>
            )}

            {/* Academic Impact Assessment */}
            <div className="space-y-4 p-4 rounded-lg bg-muted/50">
              <Label className="text-base font-semibold flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Academic Impact Assessment
              </Label>

              {/* Exams Affected */}
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Exams/Tests Affected
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Mid-term Mathematics"
                    value={examInput}
                    onChange={(e) => setExamInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addExam())}
                  />
                  <button
                    type="button"
                    onClick={addExam}
                    className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm"
                  >
                    Add
                  </button>
                </div>
                {examsAffected.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {examsAffected.map((exam, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-1">
                        {exam}
                        <button
                          type="button"
                          onClick={() => setExamsAffected(examsAffected.filter((_, i) => i !== idx))}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Labs Affected */}
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2">
                  <Beaker className="h-4 w-4" />
                  Practical/Lab Sessions Affected
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Physics Lab Session 5"
                    value={labInput}
                    onChange={(e) => setLabInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLab())}
                  />
                  <button
                    type="button"
                    onClick={addLab}
                    className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm"
                  >
                    Add
                  </button>
                </div>
                {labsAffected.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {labsAffected.map((lab, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-1">
                        {lab}
                        <button
                          type="button"
                          onClick={() => setLabsAffected(labsAffected.filter((_, i) => i !== idx))}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Special Accommodations */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Special Accommodations Needed</Label>
              <div className="grid grid-cols-2 gap-3">
                {SPECIAL_ACCOMMODATIONS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                        selectedAccommodations.includes(item.id) 
                          ? "bg-primary/5 border-primary" 
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => toggleItem(item.id, selectedAccommodations, setSelectedAccommodations)}
                    >
                      <Checkbox checked={selectedAccommodations.includes(item.id)} />
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Treatment Requirements */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
              <div
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                  hospitalizationRequired ? "bg-warning/10 border-warning" : "hover:bg-muted/50"
                )}
                onClick={() => {
                  setHospitalizationRequired(!hospitalizationRequired);
                  setTimeout(() => updateAssessment(), 0);
                }}
              >
                <Checkbox checked={hospitalizationRequired} />
                <Home className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Hospitalization Required</span>
              </div>

              <div
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                  caregiverNeeded ? "bg-warning/10 border-warning" : "hover:bg-muted/50"
                )}
                onClick={() => {
                  setCaregiverNeeded(!caregiverNeeded);
                  setTimeout(() => updateAssessment(), 0);
                }}
              >
                <Checkbox checked={caregiverNeeded} />
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Caregiver Needed</span>
              </div>
            </div>

            {/* Special Equipment */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Special Equipment Required</Label>
              <div className="flex flex-wrap gap-2">
                {SPECIAL_EQUIPMENT.map((equipment) => (
                  <Badge
                    key={equipment}
                    variant={selectedEquipment.includes(equipment) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleItem(equipment, selectedEquipment, setSelectedEquipment)}
                  >
                    {equipment}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Clinical Justification */}
            <div className="space-y-2">
              <Label htmlFor="justification">Clinical Justification</Label>
              <Textarea
                id="justification"
                placeholder="Provide clinical justification for the recommended leave duration..."
                value={justification}
                onChange={(e) => {
                  setJustification(e.target.value);
                  updateAssessment();
                }}
                className="resize-none"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* If NO - Modified Academic Plan */}
        {leaveRequired === false && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-5 w-5 text-secondary" />
                <h4 className="font-semibold">Modified Academic Plan</h4>
              </div>

              {/* Attendance Modifications */}
              <div className="space-y-3 mb-4">
                <Label className="text-sm font-medium">Attendance Modifications</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ATTENDANCE_MODIFICATIONS.map((mod) => (
                    <div
                      key={mod}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded border cursor-pointer text-sm",
                        attendanceModifications.includes(mod) 
                          ? "bg-primary/5 border-primary" 
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => toggleItem(mod, attendanceModifications, setAttendanceModifications)}
                    >
                      <Checkbox checked={attendanceModifications.includes(mod)} />
                      <span>{mod}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* In-class Accommodations */}
              <div className="space-y-3 mb-4">
                <Label className="text-sm font-medium">In-class Accommodations</Label>
                <div className="grid grid-cols-2 gap-2">
                  {IN_CLASS_ACCOMMODATIONS.map((acc) => (
                    <div
                      key={acc}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded border cursor-pointer text-sm",
                        inClassAccommodations.includes(acc) 
                          ? "bg-primary/5 border-primary" 
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => toggleItem(acc, inClassAccommodations, setInClassAccommodations)}
                    >
                      <Checkbox checked={inClassAccommodations.includes(acc)} />
                      <span>{acc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Temporary Restrictions */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Temporary Restrictions</Label>
                <div className="flex flex-wrap gap-2">
                  {TEMPORARY_RESTRICTIONS.map((restriction) => (
                    <Badge
                      key={restriction}
                      variant={temporaryRestrictions.includes(restriction) ? "destructive" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleItem(restriction, temporaryRestrictions, setTemporaryRestrictions)}
                    >
                      {restriction}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assessment Summary */}
        {leaveRequired !== null && (
          <div className={cn(
            "p-4 rounded-xl border-2",
            leaveRequired 
              ? durationCategory ? LEAVE_DURATION_OPTIONS[durationCategory].color : "border-primary bg-primary/5"
              : "border-secondary bg-secondary/5"
          )}>
            <div className="flex items-center gap-3">
              {leaveRequired ? (
                <FileText className="h-8 w-8 text-primary" />
              ) : (
                <GraduationCap className="h-8 w-8 text-secondary" />
              )}
              <div>
                <p className="font-semibold text-foreground">
                  {leaveRequired 
                    ? `Medical Leave Required: ${recommendedDays} days`
                    : "Modified Academic Plan Active"
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  {leaveRequired
                    ? `${examsAffected.length} exam(s), ${labsAffected.length} lab(s) affected`
                    : `${attendanceModifications.length + inClassAccommodations.length} modifications, ${temporaryRestrictions.length} restrictions`
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
