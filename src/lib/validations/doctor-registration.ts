import { z } from "zod";

export const doctorPersonalSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters"),
  title: z.string().min(1, "Please select a title"),
  officialEmail: z
    .string()
    .trim()
    .email("Invalid email address"),
  contactNumber: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  languagesSpoken: z
    .string()
    .trim()
    .min(2, "Please enter at least one language"),
});

export const doctorProfessionalSchema = z.object({
  medicalCouncilNumber: z
    .string()
    .trim()
    .min(5, "Medical Council Registration Number is required")
    .max(30, "Invalid registration number"),
  qualifications: z.string().min(1, "Please select primary qualification"),
  additionalQualifications: z.string().optional(),
  specialization: z.string().min(1, "Please select specialization"),
  yearsOfExperience: z.string().min(1, "Please select years of experience"),
  areasOfExpertise: z
    .string()
    .trim()
    .min(2, "Please enter at least one area of expertise"),
});

export const doctorAccessSchema = z.object({
  systemRole: z.string().min(1, "Please select your role"),
  department: z.string().min(1, "Please select department"),
  approvalAuthority: z.string().min(1, "Please select approval authority level"),
  appointmentLetter: z.boolean().refine((val) => val === true, {
    message: "Please confirm you have your appointment letter",
  }),
  digitalSignatureCert: z.boolean().refine((val) => val === true, {
    message: "Please confirm you have a digital signature certificate",
  }),
  agreementAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

export const fullDoctorSchema = doctorPersonalSchema
  .merge(doctorProfessionalSchema)
  .merge(doctorAccessSchema);

export type DoctorPersonal = z.infer<typeof doctorPersonalSchema>;
export type DoctorProfessional = z.infer<typeof doctorProfessionalSchema>;
export type DoctorAccess = z.infer<typeof doctorAccessSchema>;
export type FullDoctorRegistration = z.infer<typeof fullDoctorSchema>;

// Constants
export const TITLES = ["Dr.", "Prof.", "Asst. Prof.", "Assoc. Prof."] as const;

export const QUALIFICATIONS = [
  "MBBS",
  "MD",
  "MS",
  "DNB",
  "DM",
  "MCh",
  "MBBS + MD",
  "MBBS + MS",
] as const;

export const SPECIALIZATIONS = [
  "General Medicine",
  "General Surgery",
  "Orthopaedics",
  "Dermatology",
  "Ophthalmology",
  "ENT",
  "Psychiatry",
  "Gynaecology",
  "Paediatrics",
  "Cardiology",
  "Neurology",
  "Pulmonology",
  "Gastroenterology",
  "Dental",
  "Physiotherapy",
] as const;

export const EXPERIENCE_RANGES = [
  "Less than 1 year",
  "1-3 years",
  "3-5 years",
  "5-10 years",
  "10-15 years",
  "15-20 years",
  "20+ years",
] as const;

export const SYSTEM_ROLES = [
  "Consultant Physician",
  "Visiting Specialist",
  "Resident Medical Officer",
  "Medical Superintendent",
  "Nursing Staff",
  "Pharmacist",
  "Lab Technician",
] as const;

export const DEPARTMENTS = [
  "General OPD",
  "Emergency",
  "Pharmacy",
  "Laboratory",
  "Radiology",
  "Physiotherapy",
  "Mental Health",
  "Administration",
] as const;

export const APPROVAL_LEVELS = [
  "Level 1 - Basic Access (View assigned patients)",
  "Level 2 - Standard Access (View & edit patient records)",
  "Level 3 - Supervisor Access (Approve Level 1 requests)",
  "Level 4 - HOD Access (Approve Level 2 requests)",
  "Level 5 - Admin Access (Full approval authority)",
] as const;
