import { UseFormReturn } from "react-hook-form";
import { Heart, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FullRegistration,
  BLOOD_GROUPS,
  COVID_VACCINATION_STATUS,
} from "@/lib/validations/student-registration";

interface MedicalInfoStepProps {
  form: UseFormReturn<FullRegistration>;
}

export function MedicalInfoStep({ form }: MedicalInfoStepProps) {
  const { register, setValue, watch, formState: { errors } } = form;
  const hasPreviousHealthIssues = watch("hasPreviousHealthIssues");
  const hasDisability = watch("hasDisability");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
          <Heart className="w-6 h-6 text-destructive" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Medical Information</h2>
          <p className="text-sm text-muted-foreground">Health details for emergency care</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label>Blood Group *</Label>
          <Select
            value={watch("bloodGroup")}
            onValueChange={(value) => setValue("bloodGroup", value, { shouldValidate: true })}
          >
            <SelectTrigger className={errors.bloodGroup ? "border-destructive" : ""}>
              <SelectValue placeholder="Select blood group" />
            </SelectTrigger>
            <SelectContent>
              {BLOOD_GROUPS.map((bg) => (
                <SelectItem key={bg} value={bg}>
                  {bg}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.bloodGroup && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.bloodGroup.message}
            </p>
          )}
        </div>

        <div>
          <Label>COVID-19 Vaccination Status *</Label>
          <Select
            value={watch("covidVaccinationStatus")}
            onValueChange={(value) => setValue("covidVaccinationStatus", value, { shouldValidate: true })}
          >
            <SelectTrigger className={errors.covidVaccinationStatus ? "border-destructive" : ""}>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {COVID_VACCINATION_STATUS.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.covidVaccinationStatus && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.covidVaccinationStatus.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-base">Do you have any previous major health issues? *</Label>
          <RadioGroup
            value={hasPreviousHealthIssues}
            onValueChange={(value: "yes" | "no") => setValue("hasPreviousHealthIssues", value, { shouldValidate: true })}
            className="flex gap-6 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="health-yes" />
              <Label htmlFor="health-yes" className="font-normal cursor-pointer">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="health-no" />
              <Label htmlFor="health-no" className="font-normal cursor-pointer">No</Label>
            </div>
          </RadioGroup>
          {errors.hasPreviousHealthIssues && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.hasPreviousHealthIssues.message}
            </p>
          )}
        </div>

        {hasPreviousHealthIssues === "yes" && (
          <div>
            <Label htmlFor="previousHealthDetails">Please describe your health conditions</Label>
            <Textarea
              id="previousHealthDetails"
              placeholder="Describe any surgeries, chronic conditions, or major health events..."
              {...register("previousHealthDetails")}
              className={errors.previousHealthDetails ? "border-destructive" : ""}
            />
            {errors.previousHealthDetails && (
              <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.previousHealthDetails.message}
              </p>
            )}
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="currentMedications">Current Medications (if any)</Label>
        <Textarea
          id="currentMedications"
          placeholder="List any medications you are currently taking..."
          {...register("currentMedications")}
          className={errors.currentMedications ? "border-destructive" : ""}
        />
        {errors.currentMedications && (
          <p className="text-sm text-destructive mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.currentMedications.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="knownAllergies">Known Allergies (if any)</Label>
        <Textarea
          id="knownAllergies"
          placeholder="List any allergies (food, drug, environmental)..."
          {...register("knownAllergies")}
          className={errors.knownAllergies ? "border-destructive" : ""}
        />
        {errors.knownAllergies && (
          <p className="text-sm text-destructive mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.knownAllergies.message}
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-base">Do you have any physical disabilities requiring accommodation? *</Label>
          <RadioGroup
            value={hasDisability}
            onValueChange={(value: "yes" | "no") => setValue("hasDisability", value, { shouldValidate: true })}
            className="flex gap-6 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="disability-yes" />
              <Label htmlFor="disability-yes" className="font-normal cursor-pointer">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="disability-no" />
              <Label htmlFor="disability-no" className="font-normal cursor-pointer">No</Label>
            </div>
          </RadioGroup>
          {errors.hasDisability && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.hasDisability.message}
            </p>
          )}
        </div>

        {hasDisability === "yes" && (
          <div>
            <Label htmlFor="disabilityDetails">Please describe the accommodation needed</Label>
            <Textarea
              id="disabilityDetails"
              placeholder="Describe your needs..."
              {...register("disabilityDetails")}
              className={errors.disabilityDetails ? "border-destructive" : ""}
            />
            {errors.disabilityDetails && (
              <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.disabilityDetails.message}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-accent/50 rounded-lg border border-accent">
        <p className="text-sm text-accent-foreground">
          <strong>Privacy Note:</strong> Your medical information is encrypted and protected under 
          our strict data security policy. Only authorized medical personnel with proper approval 
          can access this information.
        </p>
      </div>
    </div>
  );
}
