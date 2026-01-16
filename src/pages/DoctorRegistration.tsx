import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, Loader2, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { RegistrationProgress } from "@/components/registration/RegistrationProgress";
import { DoctorPersonalStep } from "@/components/doctor/DoctorPersonalStep";
import { DoctorProfessionalStep } from "@/components/doctor/DoctorProfessionalStep";
import { DoctorAccessStep } from "@/components/doctor/DoctorAccessStep";
import {
  fullDoctorSchema,
  FullDoctorRegistration,
  doctorPersonalSchema,
  doctorProfessionalSchema,
  doctorAccessSchema,
} from "@/lib/validations/doctor-registration";

const STEPS = [
  { title: "Personal", description: "Basic info" },
  { title: "Professional", description: "Qualifications" },
  { title: "Access", description: "Permissions" },
];

const stepSchemas = [doctorPersonalSchema, doctorProfessionalSchema, doctorAccessSchema];

export default function DoctorRegistration() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const form = useForm<FullDoctorRegistration>({
    resolver: zodResolver(fullDoctorSchema),
    defaultValues: {
      fullName: "",
      title: "",
      officialEmail: "",
      contactNumber: "",
      languagesSpoken: "",
      medicalCouncilNumber: "",
      qualifications: "",
      additionalQualifications: "",
      specialization: "",
      yearsOfExperience: "",
      areasOfExpertise: "",
      systemRole: "",
      department: "",
      approvalAuthority: "",
      appointmentLetter: false,
      digitalSignatureCert: false,
      agreementAccepted: false,
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
      const fields = Object.keys(currentSchema.shape) as (keyof FullDoctorRegistration)[];
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

  const onSubmit = async (data: FullDoctorRegistration) => {
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("Doctor registration submitted successfully");

    toast({
      title: "Registration Submitted!",
      description: "Your application is under review. You will receive an email once approved.",
    });

    setIsSubmitting(false);
    navigate("/doctor/dashboard");
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <DoctorPersonalStep form={form} />;
      case 1:
        return <DoctorProfessionalStep form={form} />;
      case 2:
        return <DoctorAccessStep form={form} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-secondary text-secondary-foreground py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="text-secondary-foreground hover:bg-secondary-foreground/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Stethoscope className="w-6 h-6" />
                <div>
                  <h1 className="text-xl font-semibold">Medical Staff Registration</h1>
                  <p className="text-sm text-secondary-foreground/80">NIT Warangal Health Portal</p>
                </div>
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
                  <Button type="button" onClick={handleNext} className="gap-2 bg-secondary hover:bg-secondary/90">
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="gap-2 bg-primary hover:bg-primary/90"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Submit for Verification
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Need help? Contact Administration at{" "}
          <a href="mailto:healthcentre@nitw.ac.in" className="text-primary hover:underline">
            healthcentre@nitw.ac.in
          </a>
        </p>
      </main>
    </div>
  );
}
