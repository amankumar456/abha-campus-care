import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { RegistrationProgress } from "@/components/registration/RegistrationProgress";
import { PersonalInfoStep } from "@/components/registration/PersonalInfoStep";
import { AcademicInfoStep } from "@/components/registration/AcademicInfoStep";
import { MedicalInfoStep } from "@/components/registration/MedicalInfoStep";
import { DeclarationsStep } from "@/components/registration/DeclarationsStep";
import {
  fullRegistrationSchema,
  FullRegistration,
  personalInfoSchema,
  academicInfoSchema,
  medicalInfoSchema,
  declarationsSchema,
} from "@/lib/validations/student-registration";

const STEPS = [
  { title: "Personal", description: "Basic info" },
  { title: "Academic", description: "Study details" },
  { title: "Medical", description: "Health info" },
  { title: "Declarations", description: "Consent" },
];

const stepSchemas = [personalInfoSchema, academicInfoSchema, medicalInfoSchema, declarationsSchema];

export default function StudentRegistration() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const form = useForm<FullRegistration>({
    resolver: zodResolver(fullRegistrationSchema),
    defaultValues: {
      fullName: "",
      rollNumber: "",
      officialEmail: "",
      personalContact: "",
      emergencyContact: "",
      emergencyRelationship: "",
      fatherName: "",
      fatherContact: "",
      motherName: "",
      motherContact: "",
      mentorName: "",
      mentorContact: "",
      mentorEmail: "",
      department: "",
      yearOfStudy: "",
      currentSemester: "",
      programme: "",
      bloodGroup: "",
      hasPreviousHealthIssues: undefined,
      previousHealthDetails: "",
      currentMedications: "",
      knownAllergies: "",
      covidVaccinationStatus: "",
      hasDisability: undefined,
      disabilityDetails: "",
      accuracyConfirmation: false,
      codeOfConduct: false,
      photoVideoConsent: false,
      medicalAuthorization: false,
    },
    mode: "onChange",
  });

  const validateCurrentStep = async () => {
    const currentSchema = stepSchemas[currentStep];
    const values = form.getValues();
    
    try {
      await currentSchema.parseAsync(values);
      return true;
    } catch {
      // Trigger validation to show errors
      const fields = Object.keys(currentSchema.shape) as (keyof FullRegistration)[];
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

  const onSubmit = async (data: FullRegistration) => {
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

      // Check if student profile already exists
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let studentId: string;

      if (existingStudent) {
        studentId = existingStudent.id;
        // Update existing profile
        const { error: updateError } = await supabase
          .from('students')
          .update({
            full_name: data.fullName,
            roll_number: data.rollNumber,
            email: data.officialEmail,
            phone: data.personalContact,
            program: data.programme,
            branch: data.department,
            batch: data.yearOfStudy,
            year_of_study: data.yearOfStudy,
            mentor_name: data.mentorName,
            mentor_contact: data.mentorContact,
            mentor_email: data.mentorEmail,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } else {
        // Insert new profile
        const { data: newStudent, error: insertError } = await supabase
          .from('students')
          .insert({
            user_id: user.id,
            full_name: data.fullName,
            roll_number: data.rollNumber,
            email: data.officialEmail,
            phone: data.personalContact,
            program: data.programme,
            branch: data.department,
            batch: data.yearOfStudy,
            year_of_study: data.yearOfStudy,
            mentor_name: data.mentorName,
            mentor_contact: data.mentorContact,
            mentor_email: data.mentorEmail,
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        studentId = newStudent.id;

        // Add student role if not exists
        try {
          await supabase.from('user_roles').insert({
            user_id: user.id,
            role: 'student'
          });
        } catch {
          // Role may already exist, ignore
        }
      }

      // Now save medical info to student_profiles
      const medicalData = {
        student_id: studentId,
        blood_group: data.bloodGroup || null,
        has_previous_health_issues: data.hasPreviousHealthIssues === "yes",
        previous_health_details: data.previousHealthDetails || null,
        current_medications: data.currentMedications || null,
        known_allergies: data.knownAllergies || null,
        covid_vaccination_status: data.covidVaccinationStatus || null,
        has_disability: data.hasDisability === "yes",
        disability_details: data.disabilityDetails || null,
        emergency_contact: data.emergencyContact || null,
        emergency_relationship: data.emergencyRelationship || null,
        father_name: data.fatherName || null,
        father_contact: data.fatherContact || null,
        mother_name: data.motherName || null,
        mother_contact: data.motherContact || null,
        accuracy_confirmation: data.accuracyConfirmation || false,
        code_of_conduct: data.codeOfConduct || false,
        photo_video_consent: data.photoVideoConsent || false,
        medical_authorization: data.medicalAuthorization || false,
        updated_at: new Date().toISOString(),
      };

      // Check if student_profile exists
      const { data: existingProfile } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('student_id', studentId)
        .maybeSingle();

      if (existingProfile) {
        const { error: profileUpdateError } = await supabase
          .from('student_profiles')
          .update(medicalData)
          .eq('student_id', studentId);
        
        if (profileUpdateError) throw profileUpdateError;
      } else {
        const { error: profileInsertError } = await supabase
          .from('student_profiles')
          .insert(medicalData);
        
        if (profileInsertError) throw profileInsertError;
      }
      
      toast({
        title: "Registration Successful!",
        description: "Your health portal profile has been saved.",
      });
      
      navigate("/health-dashboard");
    } catch (error: any) {
      console.error("Registration error:", error);
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
        return <PersonalInfoStep form={form} />;
      case 1:
        return <AcademicInfoStep form={form} />;
      case 2:
        return <MedicalInfoStep form={form} />;
      case 3:
        return <DeclarationsStep form={form} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Student Registration</h1>
                <p className="text-sm text-primary-foreground/80">NIT Warangal Health Portal</p>
              </div>
            </div>
          </div>
        </div>
      </header>

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

        {/* Help Text */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Need help? Contact the Health Centre at{" "}
          <a href="tel:+918702462087" className="text-primary hover:underline">
            +91 870 246 2087
          </a>
        </p>
      </main>
    </div>
  );
}
