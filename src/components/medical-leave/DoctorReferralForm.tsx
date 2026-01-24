import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Building2, Calendar, CheckCircle2, ExternalLink, Loader2, Mail, MapPin, Navigation, Phone, Search, Send, Stethoscope, User } from "lucide-react";
import { z } from "zod";

// Hospital contact information type
interface HospitalInfo {
  name: string;
  location: string;
  entitlement?: string;
  phone?: string;
  emergency?: string;
  address?: string;
  directions?: string;
  mapUrl?: string;
  specialties?: string[];
}

// Empanelled hospitals list with contact details
const EMPANELLED_HOSPITALS: Record<string, HospitalInfo[]> = {
  superSpecialityWarangal: [
    { 
      name: "Rohini Super Specialty Hospital", 
      location: "Hanamkonda",
      phone: "0870-2461111",
      emergency: "0870-2461122",
      address: "6-3-249, Rohini Circle, Hanamkonda, Warangal - 506001",
      directions: "Near Hanamkonda Bus Stand, opposite Rohini Circle. 8 km from NIT Warangal main gate.",
      mapUrl: "https://maps.google.com/?q=Rohini+Super+Specialty+Hospital+Hanamkonda",
      specialties: ["Cardiology", "Neurology", "Nephrology", "Oncology"]
    },
    { 
      name: "Samraksha Super Specialty Hospital", 
      location: "Warangal",
      phone: "0870-2577777",
      emergency: "0870-2577700",
      address: "Warangal Main Road, Near MGM Hospital, Warangal - 506002",
      directions: "On Warangal Main Road, near MGM Government Hospital. 10 km from NIT Warangal.",
      mapUrl: "https://maps.google.com/?q=Samraksha+Super+Specialty+Hospital+Warangal",
      specialties: ["Cardiac Surgery", "Orthopedics", "Gastroenterology", "Urology"]
    },
  ],
  generalWarangal: [
    { 
      name: "Jaya Hospital", 
      location: "Hanamkonda",
      phone: "0870-2542899",
      emergency: "0870-2542800",
      address: "JPN Road, Hanamkonda, Warangal - 506001",
      directions: "On JPN Road, near Thousand Pillar Temple. 7 km from NIT Warangal.",
      mapUrl: "https://maps.google.com/?q=Jaya+Hospital+Hanamkonda",
      specialties: ["General Medicine", "Surgery", "Pediatrics", "Gynecology"]
    },
    { 
      name: "Guardian Multi-Speciality Hospital", 
      location: "Warangal",
      phone: "0870-2576666",
      emergency: "0870-2576600",
      address: "SVN Road, Warangal Fort, Warangal - 506002",
      directions: "Near Warangal Fort, on SVN Road. 9 km from NIT Warangal.",
      mapUrl: "https://maps.google.com/?q=Guardian+Multi+Speciality+Hospital+Warangal",
      specialties: ["Multi-Specialty", "Critical Care", "Dialysis"]
    },
    { 
      name: "Max Care Hospitals", 
      location: "Warangal",
      phone: "0870-2555555",
      address: "Nakkalagutta, Hanamkonda, Warangal - 506001",
      directions: "At Nakkalagutta Junction, Hanamkonda. 6 km from NIT Warangal.",
      mapUrl: "https://maps.google.com/?q=Max+Care+Hospitals+Warangal"
    },
    { 
      name: "Pramoda Hospital", 
      location: "Hanamkonda",
      phone: "0870-2500222",
      address: "Kothawada Road, Hanamkonda, Warangal - 506001",
      directions: "On Kothawada Road, near RTC Bus Stand. 8 km from NIT Warangal.",
      mapUrl: "https://maps.google.com/?q=Pramoda+Hospital+Hanamkonda"
    },
    { 
      name: "Sharat Laser Eye Hospital", 
      location: "Hanamkonda",
      phone: "0870-2574433",
      address: "Subedari, Hanamkonda, Warangal - 506001",
      directions: "At Subedari, near Subedari Circle. 7 km from NIT Warangal.",
      mapUrl: "https://maps.google.com/?q=Sharat+Eye+Hospital+Hanamkonda",
      specialties: ["Ophthalmology", "LASIK", "Cataract Surgery"]
    },
    { 
      name: "Sri Laxmi Narasimha Hospital", 
      location: "Hanamkonda",
      phone: "0870-2543322",
      address: "Mulugu Road, Hanamkonda, Warangal - 506001",
      directions: "On Mulugu Road, near Balasamudram. 6 km from NIT Warangal.",
      mapUrl: "https://maps.google.com/?q=Sri+Laxmi+Narasimha+Hospital+Hanamkonda"
    },
  ],
  superSpecialityHyderabad: [
    { 
      name: "Basavatarakam Indo American Cancer Hospital", 
      location: "Hyderabad",
      phone: "040-23551235",
      emergency: "040-23551236",
      address: "Road No. 10, Banjara Hills, Hyderabad - 500034",
      directions: "In Banjara Hills, Road No. 10. Approx. 150 km from NIT Warangal (2.5 hrs by road).",
      mapUrl: "https://maps.google.com/?q=Basavatarakam+Indo+American+Cancer+Hospital+Hyderabad",
      specialties: ["Oncology", "Cancer Treatment", "Radiation Therapy", "Chemotherapy"]
    },
    { 
      name: "Krishna Institute of Medical Sciences Ltd. (KIMS)", 
      location: "Hyderabad",
      phone: "040-44885000",
      emergency: "040-44885100",
      address: "1-8-31/1, Minister Road, Secunderabad - 500003",
      directions: "At Minister Road, Secunderabad. 145 km from NIT Warangal.",
      mapUrl: "https://maps.google.com/?q=KIMS+Hospitals+Secunderabad",
      specialties: ["Cardiac Sciences", "Neuro Sciences", "Liver Transplant", "Orthopedics"]
    },
    { 
      name: "Sunshine Hospitals", 
      location: "Hyderabad",
      phone: "040-44556677",
      emergency: "040-44556600",
      address: "PG Road, Secunderabad - 500003",
      directions: "On PG Road, Secunderabad. 145 km from NIT Warangal.",
      mapUrl: "https://maps.google.com/?q=Sunshine+Hospitals+Hyderabad",
      specialties: ["Orthopedics", "Joint Replacement", "Spine Surgery", "Sports Medicine"]
    },
    { 
      name: "CARE Super Speciality Hospitals", 
      location: "Hyderabad",
      phone: "040-30418888",
      emergency: "040-30418800",
      address: "Road No. 1, Banjara Hills, Hyderabad - 500034",
      directions: "In Banjara Hills, Road No. 1. Approx. 150 km from NIT Warangal.",
      mapUrl: "https://maps.google.com/?q=CARE+Hospitals+Banjara+Hills",
      specialties: ["Cardiac Sciences", "Neuro Sciences", "Oncology", "Gastroenterology"]
    },
  ],
  empanelledStudents: [
    { 
      name: "M/s. Medicover Hospitals", 
      location: "Hyderabad & Warangal", 
      entitlement: "Employees & Students",
      phone: "0870-6662288",
      emergency: "1800-599-1818",
      address: "Nakkalagutta, Hanamkonda, Warangal & Hi-Tech City, Hyderabad",
      directions: "Warangal branch at Nakkalagutta. 6 km from NIT Warangal.",
      mapUrl: "https://maps.google.com/?q=Medicover+Hospitals+Warangal",
      specialties: ["Multi-Specialty", "Emergency Care", "Diagnostics"]
    },
    { 
      name: "M/s. Vijaya Diagnostic Centre Ltd.", 
      location: "Hyderabad & Warangal", 
      entitlement: "Employees & Students",
      phone: "0870-2440000",
      address: "Hanamkonda, Warangal & Multiple locations in Hyderabad",
      directions: "Multiple centers in Warangal city. Nearest at Hanamkonda center.",
      mapUrl: "https://maps.google.com/?q=Vijaya+Diagnostic+Centre+Warangal",
      specialties: ["Diagnostics", "Lab Tests", "Radiology", "Health Checkups"]
    },
    { 
      name: "M/s. Rohini Medicare Pvt. Ltd.", 
      location: "Hanamkonda", 
      entitlement: "Employees & Students",
      phone: "0870-2461111",
      emergency: "0870-2461100",
      address: "Rohini Circle, Hanamkonda, Warangal - 506001",
      directions: "At Rohini Circle, Hanamkonda. 8 km from NIT Warangal main gate.",
      mapUrl: "https://maps.google.com/?q=Rohini+Medicare+Hanamkonda"
    },
    { 
      name: "M/s. Ajara Hospitals", 
      location: "Warangal", 
      entitlement: "Employees & Students",
      phone: "0870-2500123",
      address: "Main Road, Warangal - 506002",
      directions: "On Warangal Main Road. 10 km from NIT Warangal.",
      mapUrl: "https://maps.google.com/?q=Ajara+Hospitals+Warangal"
    },
    { 
      name: "M/s. Laxmi Narasimha Hospital", 
      location: "Hanamkonda", 
      entitlement: "Employees & Students",
      phone: "0870-2543322",
      address: "Mulugu Road, Hanamkonda, Warangal - 506001",
      directions: "On Mulugu Road, near Balasamudram. 6 km from NIT Warangal.",
      mapUrl: "https://maps.google.com/?q=Laxmi+Narasimha+Hospital+Hanamkonda"
    },
    { 
      name: "M/s. Samraksha Super Specialty Hospital", 
      location: "Warangal", 
      entitlement: "Employees & Students",
      phone: "0870-2577777",
      emergency: "0870-2577700",
      address: "Warangal Main Road, Near MGM Hospital, Warangal - 506002",
      directions: "On Warangal Main Road. 10 km from NIT Warangal.",
      mapUrl: "https://maps.google.com/?q=Samraksha+Hospital+Warangal"
    },
    { 
      name: "M/s. Dr. Sharat Maxivision Eye Hospitals", 
      location: "Hanamkonda", 
      entitlement: "Employees & Students",
      phone: "0870-2574433",
      address: "Subedari, Hanamkonda, Warangal - 506001",
      directions: "At Subedari Circle. 7 km from NIT Warangal.",
      mapUrl: "https://maps.google.com/?q=Sharat+Maxivision+Hanamkonda",
      specialties: ["Ophthalmology", "LASIK", "Retina Care"]
    },
    { 
      name: "M/s. Ekashilaa Hospitals", 
      location: "Hanamkonda", 
      entitlement: "Employees & Students",
      phone: "0870-2571234",
      address: "JPN Road, Hanamkonda, Warangal - 506001",
      directions: "On JPN Road, Hanamkonda. 7 km from NIT Warangal.",
      mapUrl: "https://maps.google.com/?q=Ekashilaa+Hospitals+Hanamkonda"
    },
    { 
      name: "M/s. Jaya Hospitals", 
      location: "Hanamkonda", 
      entitlement: "Employees & Students",
      phone: "0870-2542899",
      emergency: "0870-2542800",
      address: "JPN Road, Hanamkonda, Warangal - 506001",
      directions: "On JPN Road, near Thousand Pillar Temple. 7 km from NIT Warangal.",
      mapUrl: "https://maps.google.com/?q=Jaya+Hospitals+Hanamkonda"
    },
    { 
      name: "M/s. S Vision Hospital", 
      location: "Hanamkonda", 
      entitlement: "Employees & Students",
      phone: "0870-2575000",
      address: "Hanamkonda, Warangal - 506001",
      directions: "In Hanamkonda city. 7 km from NIT Warangal.",
      mapUrl: "https://maps.google.com/?q=S+Vision+Hospital+Hanamkonda",
      specialties: ["Ophthalmology", "Eye Care"]
    },
    { 
      name: "M/s. Dr. Vasavi's Hospital", 
      location: "Naimnagar, Hanamkonda", 
      entitlement: "Employees & Students",
      phone: "0870-2546789",
      address: "Naimnagar, Hanamkonda, Warangal - 506001",
      directions: "At Naimnagar, Hanamkonda. 8 km from NIT Warangal.",
      mapUrl: "https://maps.google.com/?q=Dr+Vasavis+Hospital+Hanamkonda"
    },
    { 
      name: "M/s. Pebbles Kids Hospital", 
      location: "Main Road, Balasamudram, Hanamkonda", 
      entitlement: "Employees & Students",
      phone: "0870-2549876",
      address: "Main Road, Balasamudram, Hanamkonda - 506001",
      directions: "At Balasamudram, Main Road. 5 km from NIT Warangal.",
      mapUrl: "https://maps.google.com/?q=Pebbles+Kids+Hospital+Hanamkonda",
      specialties: ["Pediatrics", "Neonatal Care", "Child Healthcare"]
    },
    { 
      name: "M/s. Sri Chakra Super Speciality Hospital", 
      location: "Balasamudram, Hanamkonda", 
      entitlement: "Employees & Students",
      phone: "0870-2548765",
      address: "Opp. Hayagreevachary Ground, Balasamudram, Hanamkonda - 506001",
      directions: "Opposite Hayagreevachary Ground, Balasamudram. 5 km from NIT Warangal.",
      mapUrl: "https://maps.google.com/?q=Sri+Chakra+Hospital+Hanamkonda"
    },
    { 
      name: "M/s. Sri Valli Good Life Hospital", 
      location: "Balasamudram, Hanamkonda", 
      entitlement: "Employees & Students",
      phone: "0870-2547654",
      address: "Beside New Bus Stand Road, Balasamudram, Hanamkonda - 506001",
      directions: "Near New Bus Stand, Balasamudram. 5 km from NIT Warangal.",
      mapUrl: "https://maps.google.com/?q=Sri+Valli+Hospital+Hanamkonda"
    },
    { 
      name: "M/s. K&H Dental Hospitals", 
      location: "Hanamkonda & Warangal", 
      entitlement: "Employees & Students",
      phone: "0870-2574321",
      address: "Near Hanuman Temple Road, Hanamkonda & JPN Road, Warangal",
      directions: "Two branches: Hanamkonda (7 km) and Warangal (10 km) from NIT.",
      mapUrl: "https://maps.google.com/?q=KH+Dental+Hospitals+Hanamkonda",
      specialties: ["Dental Care", "Orthodontics", "Oral Surgery"]
    },
  ],
};

// Get hospital details by name
const getHospitalByName = (name: string): HospitalInfo | null => {
  for (const category of Object.values(EMPANELLED_HOSPITALS)) {
    const found = category.find(h => h.name === name);
    if (found) return found;
  }
  return null;
};

// Hospital Details Card Component
const HospitalDetailsCard = ({ hospital }: { hospital: HospitalInfo }) => (
  <div className="mt-4 p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 animate-in fade-in slide-in-from-top-2 duration-300">
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <h4 className="font-semibold text-foreground">{hospital.name}</h4>
        </div>
        
        {hospital.address && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <span className="text-muted-foreground">{hospital.address}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {hospital.phone && (
            <a 
              href={`tel:${hospital.phone}`} 
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Phone className="h-3.5 w-3.5" />
              {hospital.phone}
            </a>
          )}
          {hospital.emergency && (
            <a 
              href={`tel:${hospital.emergency}`} 
              className="inline-flex items-center gap-1.5 text-sm text-destructive font-medium hover:underline"
            >
              <Phone className="h-3.5 w-3.5" />
              Emergency: {hospital.emergency}
            </a>
          )}
        </div>

        {hospital.directions && (
          <div className="flex items-start gap-2 text-sm bg-white/60 rounded-md p-2">
            <Navigation className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span className="text-muted-foreground">{hospital.directions}</span>
          </div>
        )}

        {hospital.specialties && hospital.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {hospital.specialties.map((specialty, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {specialty}
              </Badge>
            ))}
          </div>
        )}

        {hospital.mapUrl && (
          <a
            href={hospital.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open in Google Maps
          </a>
        )}
      </div>
    </div>
  </div>
);

interface Student {
  id: string;
  full_name: string;
  roll_number: string;
  program: string;
  branch: string | null;
  email?: string | null;
}

// Custom schema for this form
const referralFormSchema = z.object({
  rollNumber: z.string().min(2, "Roll number is required"),
  email: z.string().email("Valid email required").regex(
    /@(nitw\.ac\.in|student\.nitw\.ac\.in|student\.nit\.ac\.in)$/,
    "Must be a valid NIT Warangal email"
  ),
  referralHospital: z.string().min(2, "Hospital name is required"),
  expectedDuration: z.string().min(1, "Expected duration is required"),
  doctorNotes: z.string().optional(),
});

type ReferralFormData = z.infer<typeof referralFormSchema>;

const DoctorReferralForm = () => {
  const { doctorId, isDoctor } = useUserRole();
  const queryClient = useQueryClient();
  const [foundStudent, setFoundStudent] = useState<Student | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const form = useForm<ReferralFormData>({
    resolver: zodResolver(referralFormSchema),
    defaultValues: {
      rollNumber: "",
      email: "",
      referralHospital: "",
      expectedDuration: "",
      doctorNotes: "",
    },
  });

  // Get selected hospital details
  const selectedHospitalName = form.watch("referralHospital");
  const selectedHospital = selectedHospitalName && selectedHospitalName !== "other" 
    ? getHospitalByName(selectedHospitalName) 
    : null;

  // Search for student by roll number and email
  const searchStudent = async () => {
    const rollNumber = form.getValues("rollNumber").trim();
    const email = form.getValues("email").trim().toLowerCase();

    if (!rollNumber || !email) {
      setSearchError("Please enter both roll number and email");
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setFoundStudent(null);

    try {
      const { data, error } = await supabase
        .from("students_doctor_view")
        .select("id, full_name, roll_number, program, branch")
        .ilike("roll_number", rollNumber)
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setSearchError("No student found with this roll number");
        return;
      }

      // Verify email matches (check students table for email)
      const { data: studentWithEmail } = await supabase
        .from("students")
        .select("email")
        .eq("id", data.id)
        .maybeSingle();

      if (studentWithEmail?.email && studentWithEmail.email.toLowerCase() !== email) {
        setSearchError("Email does not match the student's registered email");
        return;
      }

      setFoundStudent({ ...data, email });
      toast.success("Student found", {
        description: `${data.full_name} - ${data.roll_number}`,
      });
    } catch (error) {
      console.error("Search error:", error);
      setSearchError("Failed to search for student. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const referralMutation = useMutation({
    mutationFn: async (data: ReferralFormData) => {
      if (!doctorId) throw new Error("Doctor ID not found");
      if (!foundStudent) throw new Error("Please verify student first");

      const { error } = await supabase.from("medical_leave_requests").insert({
        student_id: foundStudent.id,
        referring_doctor_id: doctorId,
        referral_hospital: data.referralHospital,
        expected_duration: data.expectedDuration,
        doctor_notes: data.doctorNotes || null,
        status: "student_form_pending",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Referral submitted successfully", {
        description: "The student has been notified to complete the leave form.",
      });
      form.reset();
      setFoundStudent(null);
      queryClient.invalidateQueries({ queryKey: ["medical-leave-requests"] });
    },
    onError: (error) => {
      console.error("Referral error:", error);
      toast.error("Failed to submit referral", {
        description: "Please try again or contact support.",
      });
    },
  });

  const onSubmit = (data: ReferralFormData) => {
    if (!foundStudent) {
      toast.error("Please verify student first");
      return;
    }
    referralMutation.mutate(data);
  };

  if (!isDoctor) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>Only doctors can access this form.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Stethoscope className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Off-Campus Treatment Referral</CardTitle>
            <CardDescription>
              Refer a student for external hospital treatment
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Student Verification */}
            <div className="space-y-4">
              <Label className="text-base font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Student Verification
              </Label>
              <p className="text-sm text-muted-foreground">
                Enter the student's roll number and college email to verify their identity
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rollNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Roll Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., 21CS1045" 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setFoundStudent(null);
                            setSearchError(null);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        College Email
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="student@student.nitw.ac.in" 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setFoundStudent(null);
                            setSearchError(null);
                          }}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Must be @nitw.ac.in or @student.nitw.ac.in
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="button"
                variant="secondary"
                onClick={searchStudent}
                disabled={isSearching}
                className="w-full md:w-auto"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Verify Student
                  </>
                )}
              </Button>

              {searchError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{searchError}</AlertDescription>
                </Alert>
              )}

              {foundStudent && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span className="font-medium text-primary">Student Verified</span>
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{foundStudent.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {foundStudent.roll_number} • {foundStudent.program}
                      {foundStudent.branch && ` • ${foundStudent.branch}`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Referral Details - Only show after student verification */}
            {foundStudent && (
              <>
                <div className="space-y-4 pt-4 border-t">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Referral Details
                  </Label>

                  <FormField
                    control={form.control}
                    name="referralHospital"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referral Hospital</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select empanelled hospital..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[300px]">
                            <SelectItem value="other">
                              <span className="text-muted-foreground">Other Hospital (specify below)</span>
                            </SelectItem>
                            
                            {/* Group: Empanelled for Students */}
                            <div className="px-2 py-1.5 text-xs font-semibold text-primary bg-primary/5">
                              Empanelled for Students (2023-2024)
                            </div>
                            {EMPANELLED_HOSPITALS.empanelledStudents.map((h, idx) => (
                              <SelectItem key={`emp-${idx}`} value={h.name}>
                                <div className="flex flex-col">
                                  <span>{h.name}</span>
                                  <span className="text-xs text-muted-foreground">{h.location}</span>
                                </div>
                              </SelectItem>
                            ))}

                            {/* Group: Super Speciality Warangal */}
                            <div className="px-2 py-1.5 text-xs font-semibold text-primary bg-primary/5 mt-2">
                              Super Speciality - Warangal
                            </div>
                            {EMPANELLED_HOSPITALS.superSpecialityWarangal.map((h, idx) => (
                              <SelectItem key={`ssw-${idx}`} value={h.name}>
                                <div className="flex flex-col">
                                  <span>{h.name}</span>
                                  <span className="text-xs text-muted-foreground">{h.location}</span>
                                </div>
                              </SelectItem>
                            ))}

                            {/* Group: General Warangal */}
                            <div className="px-2 py-1.5 text-xs font-semibold text-primary bg-primary/5 mt-2">
                              General Hospitals - Warangal
                            </div>
                            {EMPANELLED_HOSPITALS.generalWarangal.map((h, idx) => (
                              <SelectItem key={`gw-${idx}`} value={h.name}>
                                <div className="flex flex-col">
                                  <span>{h.name}</span>
                                  <span className="text-xs text-muted-foreground">{h.location}</span>
                                </div>
                              </SelectItem>
                            ))}

                            {/* Group: Super Speciality Hyderabad */}
                            <div className="px-2 py-1.5 text-xs font-semibold text-primary bg-primary/5 mt-2">
                              Super Speciality - Hyderabad
                            </div>
                            {EMPANELLED_HOSPITALS.superSpecialityHyderabad.map((h, idx) => (
                              <SelectItem key={`ssh-${idx}`} value={h.name}>
                                <div className="flex flex-col">
                                  <span>{h.name}</span>
                                  <span className="text-xs text-muted-foreground">{h.location}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select from empanelled hospitals (01.07.2023 - 30.06.2024)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Show hospital details when selected */}
                  {selectedHospital && (
                    <HospitalDetailsCard hospital={selectedHospital} />
                  )}

                  {selectedHospitalName === "other" && (
                    <FormItem>
                      <FormLabel>Other Hospital Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter hospital name..."
                          onChange={(e) => form.setValue("referralHospital", e.target.value)}
                        />
                      </FormControl>
                    </FormItem>
                  )}

                  <FormField
                    control={form.control}
                    name="expectedDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Expected Treatment Duration
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 3-5 days, 1 week..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="doctorNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medical Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add any relevant medical notes..."
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          These notes will be visible to authorized personnel only
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Declaration */}
                <div className="p-4 rounded-lg bg-accent/30 border border-accent">
                  <p className="text-sm font-medium text-accent-foreground">
                    Medical Declaration
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    By submitting this referral, I confirm that the student is medically unfit 
                    to remain on campus and requires off-campus treatment at the specified hospital.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={referralMutation.isPending}
                >
                  {referralMutation.isPending ? (
                    "Submitting Referral..."
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Referral & Notify Student
                    </>
                  )}
                </Button>
              </>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default DoctorReferralForm;
