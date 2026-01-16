import { UseFormReturn } from "react-hook-form";
import { Shield, AlertCircle, KeyRound } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FullDoctorRegistration,
  SYSTEM_ROLES,
  DEPARTMENTS,
  APPROVAL_LEVELS,
} from "@/lib/validations/doctor-registration";

interface DoctorAccessStepProps {
  form: UseFormReturn<FullDoctorRegistration>;
}

export function DoctorAccessStep({ form }: DoctorAccessStepProps) {
  const { setValue, watch, formState: { errors } } = form;

  const confirmations = [
    {
      id: "appointmentLetter",
      label: "University Appointment Letter",
      description: "I confirm that I have a valid appointment letter from NIT Warangal for my current position.",
    },
    {
      id: "digitalSignatureCert",
      label: "Digital Signature Certificate",
      description: "I have a valid Digital Signature Certificate (DSC) for signing medical documents electronically.",
    },
    {
      id: "agreementAccepted",
      label: "Terms & Data Access Agreement",
      description: "I agree to abide by the data protection policies and understand my responsibilities regarding patient data access and confidentiality.",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <KeyRound className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Access Configuration</h2>
          <p className="text-sm text-muted-foreground">System role and approval authority settings</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label>System Role *</Label>
          <Select
            value={watch("systemRole")}
            onValueChange={(value) => setValue("systemRole", value, { shouldValidate: true })}
          >
            <SelectTrigger className={errors.systemRole ? "border-destructive" : ""}>
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              {SYSTEM_ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.systemRole && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.systemRole.message}
            </p>
          )}
        </div>

        <div>
          <Label>Department *</Label>
          <Select
            value={watch("department")}
            onValueChange={(value) => setValue("department", value, { shouldValidate: true })}
          >
            <SelectTrigger className={errors.department ? "border-destructive" : ""}>
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

        <div className="sm:col-span-2">
          <Label>Approval Authority Level *</Label>
          <Select
            value={watch("approvalAuthority")}
            onValueChange={(value) => setValue("approvalAuthority", value, { shouldValidate: true })}
          >
            <SelectTrigger className={errors.approvalAuthority ? "border-destructive" : ""}>
              <SelectValue placeholder="Select approval level" />
            </SelectTrigger>
            <SelectContent>
              {APPROVAL_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.approvalAuthority && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.approvalAuthority.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Your approval level determines what type of data access requests you can authorize.
          </p>
        </div>
      </div>

      <div className="space-y-4 mt-8">
        <h3 className="font-medium text-foreground flex items-center gap-2">
          <Shield className="w-4 h-4 text-secondary" />
          Required Confirmations
        </h3>
        
        {confirmations.map((item) => {
          const fieldName = item.id as keyof FullDoctorRegistration;
          const isChecked = watch(fieldName) as boolean;
          const error = errors[fieldName];

          return (
            <div
              key={item.id}
              className={`p-4 rounded-lg border transition-colors ${
                isChecked ? "border-primary/30 bg-primary/5" : "border-border bg-card"
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  id={item.id}
                  checked={isChecked}
                  onCheckedChange={(checked) =>
                    setValue(fieldName, checked as boolean, { shouldValidate: true })
                  }
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <Label htmlFor={item.id} className="text-base font-medium cursor-pointer">
                    {item.label} <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
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
            <h4 className="font-semibold text-foreground">Multi-Person Approval System</h4>
            <p className="text-sm text-muted-foreground mt-1">
              All patient data access requests require multi-person authorization. Your access 
              will be logged and audited. Unauthorized access attempts will result in 
              immediate account suspension and disciplinary action.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
