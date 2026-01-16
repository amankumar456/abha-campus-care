import { UseFormReturn } from "react-hook-form";
import { GraduationCap, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FullRegistration,
  DEPARTMENTS,
  PROGRAMMES,
  YEARS_OF_STUDY,
  SEMESTERS,
} from "@/lib/validations/student-registration";

interface AcademicInfoStepProps {
  form: UseFormReturn<FullRegistration>;
}

export function AcademicInfoStep({ form }: AcademicInfoStepProps) {
  const { setValue, watch, formState: { errors } } = form;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
          <GraduationCap className="w-6 h-6 text-secondary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Academic Details</h2>
          <p className="text-sm text-muted-foreground">Your current academic information</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label>Programme *</Label>
          <Select
            value={watch("programme")}
            onValueChange={(value) => setValue("programme", value, { shouldValidate: true })}
          >
            <SelectTrigger className={errors.programme ? "border-destructive" : ""}>
              <SelectValue placeholder="Select programme" />
            </SelectTrigger>
            <SelectContent>
              {PROGRAMMES.map((prog) => (
                <SelectItem key={prog} value={prog}>
                  {prog}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.programme && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.programme.message}
            </p>
          )}
        </div>

        <div>
          <Label>Department / Branch *</Label>
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

        <div>
          <Label>Year of Study *</Label>
          <Select
            value={watch("yearOfStudy")}
            onValueChange={(value) => setValue("yearOfStudy", value, { shouldValidate: true })}
          >
            <SelectTrigger className={errors.yearOfStudy ? "border-destructive" : ""}>
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {YEARS_OF_STUDY.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.yearOfStudy && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.yearOfStudy.message}
            </p>
          )}
        </div>

        <div>
          <Label>Current Semester *</Label>
          <Select
            value={watch("currentSemester")}
            onValueChange={(value) => setValue("currentSemester", value, { shouldValidate: true })}
          >
            <SelectTrigger className={errors.currentSemester ? "border-destructive" : ""}>
              <SelectValue placeholder="Select semester" />
            </SelectTrigger>
            <SelectContent>
              {SEMESTERS.map((sem) => (
                <SelectItem key={sem} value={sem}>
                  Semester {sem}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.currentSemester && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.currentSemester.message}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-accent/50 rounded-lg border border-accent">
        <p className="text-sm text-accent-foreground">
          <strong>Note:</strong> Your academic details will be verified against the university records. 
          Please ensure the information matches your official enrollment data.
        </p>
      </div>
    </div>
  );
}
