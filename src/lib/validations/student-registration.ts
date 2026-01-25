import { z } from "zod";

export const personalInfoSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters"),
  rollNumber: z
    .string()
    .trim()
    .min(5, "Roll number must be at least 5 characters")
    .max(20, "Roll number must be less than 20 characters")
    .regex(/^[A-Za-z0-9]+$/, "Roll number must contain only letters and numbers"),
  officialEmail: z
    .string()
    .trim()
    .email("Invalid email address")
    .regex(/@(nitw\.ac\.in|student\.nitw\.ac\.in|student\.nit\.ac\.in)$/i, "Must be an official NIT email (e.g., ak25edi0022@student.nit.ac.in)"),
  personalContact: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  emergencyContact: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  emergencyRelationship: z
    .string()
    .trim()
    .min(2, "Relationship must be at least 2 characters")
    .max(50, "Relationship must be less than 50 characters"),
  // Parent Details
  fatherName: z
    .string()
    .trim()
    .min(2, "Father's name must be at least 2 characters")
    .max(100, "Father's name must be less than 100 characters"),
  fatherContact: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  motherName: z
    .string()
    .trim()
    .min(2, "Mother's name must be at least 2 characters")
    .max(100, "Mother's name must be less than 100 characters"),
  motherContact: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  // Mentor Details
  mentorName: z
    .string()
    .trim()
    .min(2, "Mentor name must be at least 2 characters")
    .max(100, "Mentor name must be less than 100 characters"),
  mentorContact: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  mentorEmail: z
    .string()
    .trim()
    .email("Invalid email address"),
});

export const academicInfoSchema = z.object({
  department: z.string().min(1, "Please select a department"),
  yearOfStudy: z.string().min(1, "Please select year of study"),
  currentSemester: z.string().min(1, "Please select current semester"),
  programme: z.string().min(1, "Please select programme"),
});

export const medicalInfoSchema = z.object({
  bloodGroup: z.string().min(1, "Please select blood group"),
  hasPreviousHealthIssues: z.enum(["yes", "no"], {
    required_error: "Please select an option",
  }),
  previousHealthDetails: z.string().max(500, "Details must be less than 500 characters").optional(),
  currentMedications: z.string().max(500, "Medications list must be less than 500 characters").optional(),
  knownAllergies: z.string().max(500, "Allergies list must be less than 500 characters").optional(),
  covidVaccinationStatus: z.string().min(1, "Please select vaccination status"),
  hasDisability: z.enum(["yes", "no"], {
    required_error: "Please select an option",
  }),
  disabilityDetails: z.string().max(500, "Details must be less than 500 characters").optional(),
});

export const declarationsSchema = z.object({
  accuracyConfirmation: z.boolean().refine((val) => val === true, {
    message: "You must confirm the accuracy of information",
  }),
  codeOfConduct: z.boolean().refine((val) => val === true, {
    message: "You must agree to the Code of Conduct",
  }),
  photoVideoConsent: z.boolean(),
  medicalAuthorization: z.boolean().refine((val) => val === true, {
    message: "Medical treatment authorization is required",
  }),
});

export const fullRegistrationSchema = personalInfoSchema
  .merge(academicInfoSchema)
  .merge(medicalInfoSchema)
  .merge(declarationsSchema);

export type PersonalInfo = z.infer<typeof personalInfoSchema>;
export type AcademicInfo = z.infer<typeof academicInfoSchema>;
export type MedicalInfo = z.infer<typeof medicalInfoSchema>;
export type Declarations = z.infer<typeof declarationsSchema>;
export type FullRegistration = z.infer<typeof fullRegistrationSchema>;

// Constants for form options
export const DEPARTMENTS = [
  "Biotechnology",
  "Chemical Engineering",
  "Chemistry",
  "Civil Engineering",
  "Computer Science and Engineering",
  "Department of Education",
  "Electrical Engineering",
  "Electronics and Communication Engineering",
  "Mathematics",
  "Mechanical Engineering",
  "Metallurgical and Materials Engineering",
  "Physics",
] as const;

export const PROGRAMMES = [
  "B.Tech",
  "BSc-BEd",
  "M.Tech",
  "M.Sc",
  "MBA",
  "MCA",
  "Ph.D",
] as const;

export const YEARS_OF_STUDY = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"] as const;

export const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] as const;

export const BLOOD_GROUPS = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
] as const;

export const COVID_VACCINATION_STATUS = [
  "Fully Vaccinated (2 doses)",
  "Partially Vaccinated (1 dose)",
  "Booster Dose Received",
  "Not Vaccinated",
] as const;
