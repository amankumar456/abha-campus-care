import { UseFormReturn } from "react-hook-form";
import { User, Phone, Mail, AlertCircle, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FullRegistration } from "@/lib/validations/student-registration";
import { Separator } from "@/components/ui/separator";

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

      {/* Basic Details */}
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
          <Label htmlFor="aadharNumber">Aadhaar Card Number *</Label>
          <Input
            id="aadharNumber"
            placeholder="12-digit Aadhaar number"
            maxLength={12}
            {...register("aadharNumber")}
            className={errors.aadharNumber ? "border-destructive" : ""}
          />
          {errors.aadharNumber && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.aadharNumber.message}
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

      {/* Parent Details Section */}
      <Separator className="my-6" />
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-secondary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Parent/Guardian Details</h3>
          <p className="text-sm text-muted-foreground">Contact information for parents or guardians</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="fatherName">Father's Name *</Label>
          <Input
            id="fatherName"
            placeholder="Father's full name"
            {...register("fatherName")}
            className={errors.fatherName ? "border-destructive" : ""}
          />
          {errors.fatherName && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.fatherName.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="fatherContact">Father's Contact Number *</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="fatherContact"
              type="tel"
              placeholder="10-digit mobile number"
              className={`pl-10 ${errors.fatherContact ? "border-destructive" : ""}`}
              {...register("fatherContact")}
            />
          </div>
          {errors.fatherContact && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.fatherContact.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="motherName">Mother's Name *</Label>
          <Input
            id="motherName"
            placeholder="Mother's full name"
            {...register("motherName")}
            className={errors.motherName ? "border-destructive" : ""}
          />
          {errors.motherName && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.motherName.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="motherContact">Mother's Contact Number *</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="motherContact"
              type="tel"
              placeholder="10-digit mobile number"
              className={`pl-10 ${errors.motherContact ? "border-destructive" : ""}`}
              {...register("motherContact")}
            />
          </div>
          {errors.motherContact && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.motherContact.message}
            </p>
          )}
        </div>
      </div>

      {/* Mentor Details Section */}
      <Separator className="my-6" />
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
          <Users className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Faculty Mentor Details</h3>
          <p className="text-sm text-muted-foreground">Your assigned faculty mentor/advisor information</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="mentorName">Mentor's Name *</Label>
          <Input
            id="mentorName"
            placeholder="Prof. / Dr. Full Name"
            {...register("mentorName")}
            className={errors.mentorName ? "border-destructive" : ""}
          />
          {errors.mentorName && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.mentorName.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="mentorContact">Mentor's Contact Number *</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="mentorContact"
              type="tel"
              placeholder="10-digit mobile number"
              className={`pl-10 ${errors.mentorContact ? "border-destructive" : ""}`}
              {...register("mentorContact")}
            />
          </div>
          {errors.mentorContact && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.mentorContact.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="mentorEmail">Mentor's Email *</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="mentorEmail"
              type="email"
              placeholder="mentor@nitw.ac.in"
              className={`pl-10 ${errors.mentorEmail ? "border-destructive" : ""}`}
              {...register("mentorEmail")}
            />
          </div>
          {errors.mentorEmail && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.mentorEmail.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}