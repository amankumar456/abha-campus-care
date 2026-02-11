import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Pill,
  Plus,
  Trash2,
  Clock,
  CalendarDays,
  Utensils,
  Stethoscope,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MedicineItem {
  id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  meal_timing: string;
}

interface PrescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  studentName: string;
  onCompleted: () => void;
}

const FREQUENCY_OPTIONS = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Four times daily",
  "Every 4 hours",
  "Every 6 hours",
  "Every 8 hours",
  "As needed (SOS)",
  "Once a week",
];

const DURATION_OPTIONS = [
  "1 day",
  "2 days",
  "3 days",
  "5 days",
  "7 days",
  "10 days",
  "14 days",
  "21 days",
  "30 days",
  "Until follow-up",
];

const MEAL_TIMING_OPTIONS = [
  { value: "before_meal", label: "Before Meal" },
  { value: "after_meal", label: "After Meal" },
  { value: "with_meal", label: "With Meal" },
  { value: "empty_stomach", label: "Empty Stomach" },
  { value: "any_time", label: "Any Time" },
  { value: "bedtime", label: "At Bedtime" },
];

const createEmptyMedicine = (): MedicineItem => ({
  id: crypto.randomUUID(),
  medicine_name: "",
  dosage: "",
  frequency: "Twice daily",
  duration: "5 days",
  instructions: "",
  meal_timing: "after_meal",
});

export default function PrescriptionDialog({
  open,
  onOpenChange,
  appointmentId,
  patientId,
  doctorId,
  studentName,
  onCompleted,
}: PrescriptionDialogProps) {
  const queryClient = useQueryClient();
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [medicines, setMedicines] = useState<MedicineItem[]>([createEmptyMedicine()]);

  const addMedicine = () => {
    setMedicines((prev) => [...prev, createEmptyMedicine()]);
  };

  const removeMedicine = (id: string) => {
    if (medicines.length <= 1) return;
    setMedicines((prev) => prev.filter((m) => m.id !== id));
  };

  const updateMedicine = (id: string, field: keyof MedicineItem, value: string) => {
    setMedicines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const completeMutation = useMutation({
    mutationFn: async () => {
      // Validate at least one medicine has name and dosage
      const validMedicines = medicines.filter(
        (m) => m.medicine_name.trim() && m.dosage.trim()
      );

      // Create prescription record
      const { data: prescription, error: prescError } = await supabase
        .from("prescriptions")
        .insert({
          appointment_id: appointmentId,
          doctor_id: doctorId,
          student_id: patientId,
          diagnosis: diagnosis.trim() || null,
          notes: notes.trim() || null,
        })
        .select("id")
        .single();

      if (prescError) throw prescError;

      // Insert medicine items if any
      if (validMedicines.length > 0) {
        const items = validMedicines.map((m) => ({
          prescription_id: prescription.id,
          medicine_name: m.medicine_name.trim(),
          dosage: m.dosage.trim(),
          frequency: m.frequency,
          duration: m.duration,
          instructions: m.instructions.trim() || null,
          meal_timing: m.meal_timing,
        }));

        const { error: itemsError } = await supabase
          .from("prescription_items")
          .insert(items);

        if (itemsError) throw itemsError;
      }

      // Mark appointment as completed
      const { error: aptError } = await supabase
        .from("appointments")
        .update({ status: "completed" })
        .eq("id", appointmentId);

      if (aptError) throw aptError;
    },
    onSuccess: () => {
      toast.success("Prescription saved & appointment completed!");
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-appointment-stats"] });
      onCompleted();
      resetForm();
      onOpenChange(false);
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to save prescription");
    },
  });

  const resetForm = () => {
    setDiagnosis("");
    setNotes("");
    setMedicines([createEmptyMedicine()]);
  };

  const handleSubmit = () => {
    const hasAnyMedicine = medicines.some((m) => m.medicine_name.trim());
    if (!hasAnyMedicine && !diagnosis.trim()) {
      toast.error("Please add at least a diagnosis or one medicine");
      return;
    }
    completeMutation.mutate();
  };

  const handleSkipPrescription = async () => {
    // Complete without prescription
    const { error } = await supabase
      .from("appointments")
      .update({ status: "completed" })
      .eq("id", appointmentId);

    if (error) {
      toast.error("Failed to complete appointment");
      return;
    }

    toast.success("Appointment marked as completed");
    queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
    queryClient.invalidateQueries({ queryKey: ["doctor-appointment-stats"] });
    onCompleted();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Stethoscope className="h-5 w-5 text-primary" />
            Prescribe Medicine — {studentName}
          </DialogTitle>
          <DialogDescription>
            Add diagnosis and prescribed medicines before completing this appointment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Diagnosis */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <FileText className="h-4 w-4 text-primary" />
              Diagnosis
            </Label>
            <Textarea
              placeholder="E.g., Viral fever with throat infection..."
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              rows={2}
            />
          </div>

          <Separator />

          {/* Medicines */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <Pill className="h-4 w-4 text-primary" />
                Prescribed Medicines
              </Label>
              <Badge variant="secondary" className="text-xs">
                {medicines.length} medicine{medicines.length !== 1 ? "s" : ""}
              </Badge>
            </div>

            {medicines.map((med, index) => (
              <div
                key={med.id}
                className="rounded-lg border bg-muted/30 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Medicine #{index + 1}
                  </span>
                  {medicines.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => removeMedicine(med.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Medicine Name *</Label>
                    <Input
                      placeholder="e.g., Paracetamol 500mg"
                      value={med.medicine_name}
                      onChange={(e) =>
                        updateMedicine(med.id, "medicine_name", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Dosage *</Label>
                    <Input
                      placeholder="e.g., 1 tablet"
                      value={med.dosage}
                      onChange={(e) =>
                        updateMedicine(med.id, "dosage", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Frequency
                    </Label>
                    <Select
                      value={med.frequency}
                      onValueChange={(val) =>
                        updateMedicine(med.id, "frequency", val)
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCY_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" /> Duration
                    </Label>
                    <Select
                      value={med.duration}
                      onValueChange={(val) =>
                        updateMedicine(med.id, "duration", val)
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Utensils className="h-3 w-3" /> Meal Timing
                    </Label>
                    <Select
                      value={med.meal_timing}
                      onValueChange={(val) =>
                        updateMedicine(med.id, "meal_timing", val)
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MEAL_TIMING_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Special Instructions
                  </Label>
                  <Input
                    placeholder="e.g., Take with warm water, avoid dairy..."
                    value={med.instructions}
                    onChange={(e) =>
                      updateMedicine(med.id, "instructions", e.target.value)
                    }
                  />
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={addMedicine}
              className="w-full gap-1.5 border-dashed"
            >
              <Plus className="h-4 w-4" />
              Add Another Medicine
            </Button>
          </div>

          <Separator />

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Additional Doctor Notes (optional)
            </Label>
            <Textarea
              placeholder="Any additional advice or follow-up instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={handleSkipPrescription}
            className="text-muted-foreground"
          >
            Skip & Complete
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={completeMutation.isPending}
            className="gap-1.5"
          >
            <CheckCircle2 className="h-4 w-4" />
            {completeMutation.isPending
              ? "Saving..."
              : "Save Prescription & Complete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
