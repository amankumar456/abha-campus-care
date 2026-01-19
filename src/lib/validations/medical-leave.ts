import { z } from "zod";

export const doctorReferralSchema = z.object({
  studentId: z.string().uuid("Please select a valid student"),
  referralHospital: z.string().min(2, "Hospital name is required").max(200, "Hospital name too long"),
  expectedDuration: z.string().min(1, "Expected duration is required").max(50, "Duration description too long"),
  doctorNotes: z.string().max(500, "Notes too long").optional(),
});

export const studentLeaveFormSchema = z.object({
  illnessDescription: z.string().min(5, "Please describe the illness/treatment").max(300, "Description too long"),
  leaveStartDate: z.string().min(1, "Start date is required"),
  expectedReturnDate: z.string().min(1, "Expected return date is required"),
  accompanistType: z.enum(["friend", "parent_guardian", "other"], {
    required_error: "Please select who will accompany you",
  }),
  accompanistName: z.string().min(2, "Accompanist name is required").max(100, "Name too long"),
  accompanistContact: z.string().regex(/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"),
  accompanistRelationship: z.string().min(2, "Relationship is required").max(50, "Relationship description too long"),
  departureConfirmation: z.boolean().refine((val) => val === true, {
    message: "You must confirm your departure",
  }),
  returnAcknowledgement: z.boolean().refine((val) => val === true, {
    message: "You must acknowledge the return requirement",
  }),
});

export const returnNotificationSchema = z.object({
  returnConfirmation: z.boolean().refine((val) => val === true, {
    message: "Please confirm your return",
  }),
  actualReturnDate: z.string().min(1, "Return date/time is required"),
  hospitalDischargeDate: z.string().min(1, "Discharge date is required"),
  followUpNotes: z.string().max(200, "Follow-up notes too long").optional(),
  returnDeclaration: z.boolean().refine((val) => val === true, {
    message: "Please confirm the declaration",
  }),
});

export type DoctorReferralFormData = z.infer<typeof doctorReferralSchema>;
export type StudentLeaveFormData = z.infer<typeof studentLeaveFormSchema>;
export type ReturnNotificationFormData = z.infer<typeof returnNotificationSchema>;

export const ACCOMPANIST_TYPES = [
  { value: "friend", label: "Friend" },
  { value: "parent_guardian", label: "Parent/Guardian" },
  { value: "other", label: "Other" },
] as const;
