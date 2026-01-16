import { UseFormReturn } from "react-hook-form";
import { FileCheck, AlertCircle, Shield } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FullRegistration } from "@/lib/validations/student-registration";

interface DeclarationsStepProps {
  form: UseFormReturn<FullRegistration>;
}

export function DeclarationsStep({ form }: DeclarationsStepProps) {
  const { setValue, watch, formState: { errors } } = form;

  const declarations = [
    {
      id: "accuracyConfirmation",
      label: "Information Accuracy Confirmation",
      description:
        "I hereby declare that all the information provided above is true, complete, and correct to the best of my knowledge and belief. I understand that providing false information may result in disciplinary action.",
      required: true,
    },
    {
      id: "codeOfConduct",
      label: "Code of Conduct Agreement",
      description:
        "I agree to abide by the NIT Warangal Health Centre's code of conduct and policies. I understand that violation of these rules may result in termination of health services.",
      required: true,
    },
    {
      id: "photoVideoConsent",
      label: "Photo/Video Release Consent",
      description:
        "I consent to the use of my photograph for the health portal ID card and related documentation purposes. (Optional)",
      required: false,
    },
    {
      id: "medicalAuthorization",
      label: "Emergency Medical Treatment Authorization",
      description:
        "In case of a medical emergency where I am unable to provide consent, I authorize the NIT Warangal Health Centre to provide necessary medical treatment and contact my emergency contact person.",
      required: true,
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileCheck className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Declarations & Consent</h2>
          <p className="text-sm text-muted-foreground">Review and accept the required agreements</p>
        </div>
      </div>

      <div className="space-y-6">
        {declarations.map((declaration) => {
          const fieldName = declaration.id as keyof FullRegistration;
          const isChecked = watch(fieldName) as boolean;
          const error = errors[fieldName];

          return (
            <div
              key={declaration.id}
              className={`p-4 rounded-lg border transition-colors ${
                isChecked ? "border-primary/30 bg-primary/5" : "border-border bg-card"
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  id={declaration.id}
                  checked={isChecked}
                  onCheckedChange={(checked) =>
                    setValue(fieldName, checked as boolean, { shouldValidate: true })
                  }
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <Label
                    htmlFor={declaration.id}
                    className="text-base font-medium cursor-pointer flex items-center gap-2"
                  >
                    {declaration.label}
                    {declaration.required && (
                      <span className="text-destructive">*</span>
                    )}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {declaration.description}
                  </p>
                  {error && (
                    <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {error.message as string}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-5 bg-accent/50 rounded-lg border border-accent">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-secondary mt-0.5" />
          <div>
            <h4 className="font-semibold text-foreground">Your Data is Protected</h4>
            <p className="text-sm text-muted-foreground mt-1">
              By registering, your data will be protected under NIT Warangal's data protection 
              policy and India's Digital Health Data Guidelines. Your medical information will 
              only be accessible through our secure, multi-person approval system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
