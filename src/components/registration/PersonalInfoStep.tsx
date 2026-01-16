import { UseFormReturn } from "react-hook-form";
import { User, Phone, Mail, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FullRegistration } from "@/lib/validations/student-registration";

interface PersonalInfoStepProps {
  form: UseFormReturn<FullRegistration>;
}

export function PersonalInfoStep({ form }: PersonalInfoStepProps) {
  const { register, formState: { errors } } = form;

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
          <Input
            id="fullName"
            placeholder="Enter your full name as per university records"
            {...register("fullName")}
            className={errors.fullName ? "border-destructive" : ""}
          />
          {errors.fullName && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="rollNumber">University Roll Number *</Label>
          <Input
            id="rollNumber"
            placeholder="e.g., 21CS1234"
            {...register("rollNumber")}
            className={errors.rollNumber ? "border-destructive" : ""}
          />
          {errors.rollNumber && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.rollNumber.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="officialEmail">Official Email ID *</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="officialEmail"
              type="email"
              placeholder="your.email@nitw.ac.in"
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
          <Label htmlFor="personalContact">Personal Contact Number *</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="personalContact"
              type="tel"
              placeholder="10-digit mobile number"
              className={`pl-10 ${errors.personalContact ? "border-destructive" : ""}`}
              {...register("personalContact")}
            />
          </div>
          {errors.personalContact && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.personalContact.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="emergencyContact">Emergency Contact Number *</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="emergencyContact"
              type="tel"
              placeholder="10-digit mobile number"
              className={`pl-10 ${errors.emergencyContact ? "border-destructive" : ""}`}
              {...register("emergencyContact")}
            />
          </div>
          {errors.emergencyContact && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.emergencyContact.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="emergencyRelationship">Emergency Contact Relationship *</Label>
          <Input
            id="emergencyRelationship"
            placeholder="e.g., Father, Mother, Guardian"
            {...register("emergencyRelationship")}
            className={errors.emergencyRelationship ? "border-destructive" : ""}
          />
          {errors.emergencyRelationship && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.emergencyRelationship.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
