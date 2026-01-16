import { UseFormReturn } from "react-hook-form";
import { User, Phone, Mail, AlertCircle, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FullDoctorRegistration, TITLES } from "@/lib/validations/doctor-registration";

interface DoctorPersonalStepProps {
  form: UseFormReturn<FullDoctorRegistration>;
}

export function DoctorPersonalStep({ form }: DoctorPersonalStepProps) {
  const { register, setValue, watch, formState: { errors } } = form;

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
        <div>
          <Label>Title *</Label>
          <Select
            value={watch("title")}
            onValueChange={(value) => setValue("title", value, { shouldValidate: true })}
          >
            <SelectTrigger className={errors.title ? "border-destructive" : ""}>
              <SelectValue placeholder="Select title" />
            </SelectTrigger>
            <SelectContent>
              {TITLES.map((title) => (
                <SelectItem key={title} value={title}>
                  {title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.title && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.title.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            placeholder="Enter your full name"
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
          <Label htmlFor="officialEmail">Official Email *</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="officialEmail"
              type="email"
              placeholder="doctor@nitw.ac.in"
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
          <div className="relative">
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

        <div className="sm:col-span-2">
          <Label htmlFor="languagesSpoken">Languages Spoken *</Label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="languagesSpoken"
              placeholder="e.g., English, Hindi, Telugu"
              className={`pl-10 ${errors.languagesSpoken ? "border-destructive" : ""}`}
              {...register("languagesSpoken")}
            />
          </div>
          {errors.languagesSpoken && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.languagesSpoken.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
