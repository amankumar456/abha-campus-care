import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Check, Loader2, GraduationCap, User, Phone, Mail, Building2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { RegistrationProgress } from "@/components/registration/RegistrationProgress";

const DEPARTMENTS = [
  "Biotechnology",
  "BSc-BEd",
  "Chemical Engineering",
  "Chemistry",
  "Civil Engineering",
  "Computer Science and Engineering",
  "Electrical Engineering",
  "Electronics and Communication Engineering",
  "Mathematics",
  "Mechanical Engineering",
  "Metallurgical and Materials Engineering",
  "Physics",
  "School of Management",
] as const;

const DESIGNATIONS = [
  "Professor",
  "Associate Professor",
  "Assistant Professor",
  "Lecturer",
] as const;

// Step 1: Personal Info
const personalInfoSchema = z.object({
  fullName: z.string().min(3, "Name must be at least 3 characters"),
  designation: z.string().min(1, "Please select a designation"),
  officialEmail: z.string().email("Invalid email").regex(/@nitw\.ac\.in$/i, "Must be an official NITW email"),
  contactNumber: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  department: z.string().min(1, "Please select a department"),
});

// Step 2: Agreement
const agreementSchema = z.object({
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms",
  }),
  agreeToMentorResponsibilities: z.boolean().refine((val) => val === true, {
    message: "You must acknowledge mentor responsibilities",
  }),
});

const fullMentorSchema = personalInfoSchema.merge(agreementSchema);
type FullMentorRegistration = z.infer<typeof fullMentorSchema>;

const STEPS = [
  { title: "Personal", description: "Basic info" },
  { title: "Agreement", description: "Terms" },
];

const stepSchemas = [personalInfoSchema, agreementSchema];

export default function MentorRegistration() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const form = useForm<FullMentorRegistration>({
    resolver: zodResolver(fullMentorSchema),
    defaultValues: {
      fullName: "",
      designation: "",
      officialEmail: "",
      contactNumber: "",
      department: "",
      agreeToTerms: false,
      agreeToMentorResponsibilities: false,
    },
    mode: "onChange",
  });

  const { register, setValue, watch, formState: { errors } } = form;

  const validateCurrentStep = async () => {
    const currentSchema = stepSchemas[currentStep];
    const values = form.getValues();

    try {
      await currentSchema.parseAsync(values);
      return true;
    } catch {
      const fields = Object.keys(currentSchema.shape) as (keyof FullMentorRegistration)[];
      fields.forEach((field) => form.trigger(field));
      return false;
    }
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const onSubmit = async (data: FullMentorRegistration) => {
    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in first to complete registration.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        navigate("/auth");
        return;
      }

      // Check if mentor profile already exists
      const { data: existingMentor } = await supabase
        .from('mentors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const mentorData = {
        name: data.fullName,
        email: data.officialEmail,
        phone: data.contactNumber,
        department: data.department,
        updated_at: new Date().toISOString(),
      };

      if (existingMentor) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('mentors')
          .update(mentorData)
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } else {
        // Insert new profile
        const { error: insertError } = await supabase
          .from('mentors')
          .insert({
            ...mentorData,
            user_id: user.id,
          });

        if (insertError) throw insertError;

        // Add mentor role if not exists
        try {
          await supabase.from('user_roles').insert({
            user_id: user.id,
            role: 'mentor'
          });
        } catch {
          // Role may already exist, ignore
        }
      }

      toast({
        title: "Registration Successful!",
        description: "Your mentor profile has been saved.",
      });

      navigate("/mentor/home");
    } catch (error: any) {
      console.error("Mentor registration error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Personal Information</h2>
                <p className="text-sm text-muted-foreground">Your basic identification details</p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    placeholder="Prof. / Dr. Full Name"
                    className={`pl-10 ${errors.fullName ? "border-destructive" : ""}`}
                    {...register("fullName")}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Designation *</Label>
                <Select
                  value={watch("designation")}
                  onValueChange={(value) => setValue("designation", value, { shouldValidate: true })}
                >
                  <SelectTrigger className={`mt-1 ${errors.designation ? "border-destructive" : ""}`}>
                    <SelectValue placeholder="Select designation" />
                  </SelectTrigger>
                  <SelectContent>
                    {DESIGNATIONS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.designation && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.designation.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Department *</Label>
                <Select
                  value={watch("department")}
                  onValueChange={(value) => setValue("department", value, { shouldValidate: true })}
                >
                  <SelectTrigger className={`mt-1 ${errors.department ? "border-destructive" : ""}`}>
                    <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.department && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.department.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="officialEmail">Official Email *</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="officialEmail"
                    type="email"
                    placeholder="mentor@nitw.ac.in"
                    className={`pl-10 ${errors.officialEmail ? "border-destructive" : ""}`}
                    {...register("officialEmail")}
                  />
                </div>
                {errors.officialEmail && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.officialEmail.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="contactNumber">Contact Number *</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="contactNumber"
                    type="tel"
                    placeholder="10-digit mobile number"
                    className={`pl-10 ${errors.contactNumber ? "border-destructive" : ""}`}
                    {...register("contactNumber")}
                  />
                </div>
                {errors.contactNumber && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.contactNumber.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Mentor Agreement</h2>
                <p className="text-sm text-muted-foreground">Please review and accept the terms</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-muted/50 rounded-lg border">
                <h3 className="font-semibold mb-2">Mentor Responsibilities</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Monitor the health and wellbeing of assigned mentees</li>
                  <li>• Receive notifications about mentee health visits</li>
                  <li>• Provide guidance and support during medical emergencies</li>
                  <li>• Maintain confidentiality of student health information</li>
                  <li>• Coordinate with Health Centre staff when needed</li>
                </ul>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="agreeToMentorResponsibilities"
                    checked={watch("agreeToMentorResponsibilities")}
                    onCheckedChange={(checked) =>
                      setValue("agreeToMentorResponsibilities", checked === true, { shouldValidate: true })
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="agreeToMentorResponsibilities"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I acknowledge and accept the mentor responsibilities *
                    </label>
                    {errors.agreeToMentorResponsibilities && (
                      <p className="text-sm text-destructive">{errors.agreeToMentorResponsibilities.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="agreeToTerms"
                    checked={watch("agreeToTerms")}
                    onCheckedChange={(checked) =>
                      setValue("agreeToTerms", checked === true, { shouldValidate: true })
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="agreeToTerms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I agree to the terms and conditions of the NIT Warangal Health Portal *
                    </label>
                    {errors.agreeToTerms && (
                      <p className="text-sm text-destructive">{errors.agreeToTerms.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 sm:p-8">
            {/* Progress Indicator */}
            <RegistrationProgress currentStep={currentStep} steps={STEPS} />

            {/* Form Content */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8">
              {renderStep()}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>

                {currentStep < STEPS.length - 1 ? (
                  <Button type="button" onClick={handleNext} className="gap-2">
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="gap-2 bg-secondary hover:bg-secondary/90"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Complete Registration
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Need help? Contact the Health Centre at{" "}
          <a href="mailto:healthcentre@nitw.ac.in" className="text-primary hover:underline">
            healthcentre@nitw.ac.in
          </a>
        </p>
      </main>
    </div>
  );
}
