import { UseFormReturn } from "react-hook-form";
import { Stethoscope, AlertCircle, Award } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FullDoctorRegistration,
  QUALIFICATIONS,
  SPECIALIZATIONS,
  EXPERIENCE_RANGES,
} from "@/lib/validations/doctor-registration";

interface DoctorProfessionalStepProps {
  form: UseFormReturn<FullDoctorRegistration>;
}

export function DoctorProfessionalStep({ form }: DoctorProfessionalStepProps) {
  const { register, setValue, watch, formState: { errors } } = form;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
          <Stethoscope className="w-6 h-6 text-secondary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Professional Details</h2>
          <p className="text-sm text-muted-foreground">Your medical qualifications and experience</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="medicalCouncilNumber">Medical Council Registration Number *</Label>
          <div className="relative">
            <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="medicalCouncilNumber"
              placeholder="e.g., MCI/AP/12345"
              className={`pl-10 ${errors.medicalCouncilNumber ? "border-destructive" : ""}`}
              {...register("medicalCouncilNumber")}
            />
          </div>
          {errors.medicalCouncilNumber && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.medicalCouncilNumber.message}
            </p>
          )}
        </div>

        <div>
          <Label>Primary Qualification *</Label>
          <Select
            value={watch("qualifications")}
            onValueChange={(value) => setValue("qualifications", value, { shouldValidate: true })}
          >
            <SelectTrigger className={errors.qualifications ? "border-destructive" : ""}>
              <SelectValue placeholder="Select qualification" />
            </SelectTrigger>
            <SelectContent>
              {QUALIFICATIONS.map((qual) => (
                <SelectItem key={qual} value={qual}>
                  {qual}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.qualifications && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.qualifications.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="additionalQualifications">Additional Qualifications</Label>
          <Input
            id="additionalQualifications"
            placeholder="e.g., FRCS, Fellowship"
            {...register("additionalQualifications")}
          />
        </div>

        <div>
          <Label>Specialization *</Label>
          <Select
            value={watch("specialization")}
            onValueChange={(value) => setValue("specialization", value, { shouldValidate: true })}
          >
            <SelectTrigger className={errors.specialization ? "border-destructive" : ""}>
              <SelectValue placeholder="Select specialization" />
            </SelectTrigger>
            <SelectContent>
              {SPECIALIZATIONS.map((spec) => (
                <SelectItem key={spec} value={spec}>
                  {spec}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.specialization && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.specialization.message}
            </p>
          )}
        </div>

        <div>
          <Label>Years of Experience *</Label>
          <Select
            value={watch("yearsOfExperience")}
            onValueChange={(value) => setValue("yearsOfExperience", value, { shouldValidate: true })}
          >
            <SelectTrigger className={errors.yearsOfExperience ? "border-destructive" : ""}>
              <SelectValue placeholder="Select experience" />
            </SelectTrigger>
            <SelectContent>
              {EXPERIENCE_RANGES.map((exp) => (
                <SelectItem key={exp} value={exp}>
                  {exp}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.yearsOfExperience && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.yearsOfExperience.message}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="areasOfExpertise">Areas of Expertise *</Label>
          <Textarea
            id="areasOfExpertise"
            placeholder="Describe your key areas of expertise and sub-specialties..."
            {...register("areasOfExpertise")}
            className={errors.areasOfExpertise ? "border-destructive" : ""}
          />
          {errors.areasOfExpertise && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.areasOfExpertise.message}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-accent/50 rounded-lg border border-accent">
        <p className="text-sm text-accent-foreground">
          <strong>Verification Notice:</strong> Your Medical Council Registration Number and 
          qualifications will be verified against official records before your account is activated.
        </p>
      </div>
    </div>
  );
}
