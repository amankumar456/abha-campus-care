import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { z } from "zod";
import { 
  Siren, 
  Phone, 
  MapPin, 
  User, 
  Clock, 
  Building2, 
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Ambulance,
  ShieldAlert,
  HeartPulse,
  Stethoscope,
  Send
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface Student {
  id: string;
  full_name: string;
  roll_number: string;
  program: string;
  branch: string | null;
  email?: string | null;
}

interface AmbulanceDispatchFormProps {
  student: Student;
  priorityLevel: "standard" | "urgent" | "emergency";
  onDispatchComplete?: () => void;
}

const AMBULANCE_TYPES = {
  bls: {
    name: "Basic Life Support (BLS)",
    icon: Ambulance,
    available: 3,
    eta: "10-15 minutes",
    capabilities: ["Stretcher", "First aid kit", "Oxygen supply", "Basic monitoring"],
    color: "bg-primary/10 text-primary border-primary/20"
  },
  als: {
    name: "Advanced Life Support (ALS)",
    icon: HeartPulse,
    available: 2,
    eta: "15-20 minutes",
    capabilities: ["ECG monitor", "Defibrillator", "IV medications", "Paramedic on board"],
    color: "bg-warning/10 text-warning-foreground border-warning/20"
  },
  critical_care: {
    name: "Critical Care Unit (CCU)",
    icon: ShieldAlert,
    available: 1,
    eta: "25-30 minutes",
    capabilities: ["Ventilator", "ICU equipment", "Critical care team", "Advanced monitoring"],
    color: "bg-destructive/10 text-destructive border-destructive/20"
  }
};

const DESTINATION_HOSPITALS = [
  { value: "city_general", name: "City General Hospital", distance: "5 km", specialty: "General Emergencies" },
  { value: "trauma_center", name: "Trauma Center", distance: "8 km", specialty: "Trauma/Accidents" },
  { value: "cardiac_hospital", name: "Cardiac Hospital", distance: "7 km", specialty: "Cardiac Issues" },
  { value: "neuro_institute", name: "Neuro Institute", distance: "10 km", specialty: "Neurological" },
  { value: "rohini_hospital", name: "Rohini Super Specialty", distance: "8 km", specialty: "Multi-Specialty" },
  { value: "samraksha_hospital", name: "Samraksha Hospital", distance: "10 km", specialty: "Multi-Specialty" },
];

const PICKUP_LOCATIONS = [
  "Health Centre - NIT Warangal",
  "Main Gate - NIT Warangal",
  "Boys Hostel - Block A",
  "Boys Hostel - Block B",
  "Girls Hostel - Block A",
  "Girls Hostel - Block B",
  "Academic Block - Main Building",
  "Library Complex",
  "Sports Ground",
  "Other (specify)"
];

const ambulanceFormSchema = z.object({
  ambulanceType: z.enum(["bls", "als", "critical_care"]),
  destinationHospital: z.string().min(1, "Please select a hospital"),
  pickupLocation: z.string().min(1, "Please select pickup location"),
  customPickupLocation: z.string().optional(),
  emergencyContactName: z.string().min(2, "Emergency contact name required"),
  emergencyContactPhone: z.string().regex(/^[0-9]{10}$/, "Valid 10-digit phone required"),
  accompanyingPerson: z.string().min(2, "Accompanying person name required"),
  accompanyingPersonType: z.enum(["warden", "friend", "security", "parent", "none"]),
  paramedicInstructions: z.string().optional(),
  notifyCollegeSecurity: z.boolean().default(true),
  alertHospitalEmergency: z.boolean().default(true),
});

type AmbulanceFormData = z.infer<typeof ambulanceFormSchema>;

export default function AmbulanceDispatchForm({ 
  student, 
  priorityLevel, 
  onDispatchComplete 
}: AmbulanceDispatchFormProps) {
  const { doctorId } = useUserRole();
  const queryClient = useQueryClient();
  const [isDispatching, setIsDispatching] = useState(false);

  const form = useForm<AmbulanceFormData>({
    resolver: zodResolver(ambulanceFormSchema),
    defaultValues: {
      ambulanceType: priorityLevel === "emergency" ? "als" : "bls",
      destinationHospital: "",
      pickupLocation: "Health Centre - NIT Warangal",
      emergencyContactName: "",
      emergencyContactPhone: "",
      accompanyingPerson: "",
      accompanyingPersonType: "security",
      paramedicInstructions: "",
      notifyCollegeSecurity: true,
      alertHospitalEmergency: true,
    },
  });

  const selectedAmbulanceType = form.watch("ambulanceType");
  const selectedPickupLocation = form.watch("pickupLocation");
  const ambulanceConfig = AMBULANCE_TYPES[selectedAmbulanceType];

  const dispatchMutation = useMutation({
    mutationFn: async (data: AmbulanceFormData) => {
      if (!doctorId) throw new Error("Doctor ID not found");
      
      const pickupLoc = data.pickupLocation === "Other (specify)" 
        ? data.customPickupLocation 
        : data.pickupLocation;

      const { error } = await supabase.from("ambulance_requests").insert({
        student_id: student.id,
        requesting_doctor_id: doctorId,
        priority_level: priorityLevel,
        ambulance_type: data.ambulanceType,
        destination_hospital: data.destinationHospital,
        pickup_location: pickupLoc || "NIT Warangal Campus",
        emergency_contact_name: data.emergencyContactName,
        emergency_contact_phone: data.emergencyContactPhone,
        accompanying_person: data.accompanyingPerson,
        accompanying_person_type: data.accompanyingPersonType,
        paramedic_instructions: data.paramedicInstructions || null,
        status: "dispatched",
        dispatched_at: new Date().toISOString(),
        estimated_arrival_minutes: parseInt(ambulanceConfig.eta.split("-")[0]) || 15,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("🚑 Ambulance Dispatched!", {
        description: `${ambulanceConfig.name} is on the way. ETA: ${ambulanceConfig.eta}`,
      });
      queryClient.invalidateQueries({ queryKey: ["ambulance-requests"] });
      onDispatchComplete?.();
    },
    onError: (error) => {
      console.error("Dispatch error:", error);
      toast.error("Failed to dispatch ambulance", {
        description: "Please try again or contact emergency services directly.",
      });
    },
  });

  const onSubmit = (data: AmbulanceFormData) => {
    setIsDispatching(true);
    dispatchMutation.mutate(data, {
      onSettled: () => setIsDispatching(false)
    });
  };

  return (
    <Card className="border-2 border-destructive/30 bg-gradient-to-br from-destructive/5 to-transparent">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-destructive/10 animate-pulse">
            <Siren className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-lg text-destructive">Emergency Ambulance Dispatch</CardTitle>
            <CardDescription>
              Request ambulance for {student.full_name} ({student.roll_number})
            </CardDescription>
          </div>
          <Badge variant="destructive" className="ml-auto">
            {priorityLevel.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Ambulance Type Selection */}
            <FormField
              control={form.control}
              name="ambulanceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold flex items-center gap-2">
                    <Ambulance className="h-4 w-4" />
                    Ambulance Type
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="grid gap-3"
                    >
                      {(Object.entries(AMBULANCE_TYPES) as [keyof typeof AMBULANCE_TYPES, typeof AMBULANCE_TYPES.bls][]).map(([key, config]) => {
                        const Icon = config.icon;
                        return (
                          <div key={key} className="relative">
                            <RadioGroupItem value={key} id={`ambulance-${key}`} className="peer sr-only" />
                            <Label
                              htmlFor={`ambulance-${key}`}
                              className={cn(
                                "flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                                "hover:bg-muted/50 peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-offset-2",
                                field.value === key && "ring-2 ring-offset-2",
                                config.color
                              )}
                            >
                              <Icon className="h-6 w-6 shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{config.name}</span>
                                  <div className="flex items-center gap-2 text-xs">
                                    <Badge variant="outline" className="gap-1">
                                      <CheckCircle2 className="h-3 w-3 text-primary" />
                                      {config.available} Available
                                    </Badge>
                                    <Badge variant="secondary" className="gap-1">
                                      <Clock className="h-3 w-3" />
                                      {config.eta}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {config.capabilities.map((cap, idx) => (
                                    <span key={idx} className="text-xs bg-background/50 px-2 py-0.5 rounded">
                                      {cap}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </Label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Destination Hospital */}
            <FormField
              control={form.control}
              name="destinationHospital"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Destination Hospital
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select hospital based on condition..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DESTINATION_HOSPITALS.map((hospital) => (
                        <SelectItem key={hospital.value} value={hospital.value}>
                          <div className="flex flex-col">
                            <span>{hospital.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {hospital.distance} • {hospital.specialty}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Pickup Location */}
            <FormField
              control={form.control}
              name="pickupLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Pickup Location
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pickup location..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PICKUP_LOCATIONS.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedPickupLocation === "Other (specify)" && (
              <FormField
                control={form.control}
                name="customPickupLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Specify pickup location..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Emergency Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="emergencyContactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Emergency Contact Name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Parent/Guardian name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emergencyContactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Emergency Contact Phone
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="10-digit mobile number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Accompanying Person */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="accompanyingPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accompanying Person</FormLabel>
                    <FormControl>
                      <Input placeholder="Name of person accompanying" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accompanyingPersonType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accompanist Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="security">College Security</SelectItem>
                        <SelectItem value="warden">Hostel Warden</SelectItem>
                        <SelectItem value="friend">Friend/Classmate</SelectItem>
                        <SelectItem value="parent">Parent/Guardian</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Paramedic Instructions */}
            <FormField
              control={form.control}
              name="paramedicInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Paramedic Instructions (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Special instructions for paramedics..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Auto-notifications */}
            <div className="space-y-3 p-4 rounded-lg bg-muted/50">
              <Label className="text-sm font-medium">Automatic Notifications</Label>
              <div className="flex flex-col gap-3">
                <FormField
                  control={form.control}
                  name="notifyCollegeSecurity"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal cursor-pointer">
                        Notify College Security Control Room
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="alertHospitalEmergency"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal cursor-pointer">
                        Alert Hospital Emergency Department
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Emergency Warning */}
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Emergency Protocol</AlertTitle>
              <AlertDescription>
                Dispatching ambulance will immediately notify security and hospital. 
                This action is logged for audit purposes.
              </AlertDescription>
            </Alert>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={isDispatching}
            >
              {isDispatching ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Dispatching Ambulance...
                </>
              ) : (
                <>
                  <Siren className="h-5 w-5 mr-2" />
                  REQUEST AMBULANCE IMMEDIATELY
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
