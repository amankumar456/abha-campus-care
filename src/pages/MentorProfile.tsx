import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2, User, Phone, Mail, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";

const DEPARTMENTS = [
  "Biotechnology",
  "Chemical Engineering",
  "Chemistry",
  "Civil Engineering",
  "Computer Science & Engineering",
  "Electrical Engineering",
  "Electronics & Communication Engineering",
  "Mathematics",
  "Mechanical Engineering",
  "Metallurgical & Materials Engineering",
  "Physics",
  "School of Management",
];

const mentorProfileSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  phone: z.string().regex(/^\d{10}$/, "Enter a valid 10-digit phone number").optional().or(z.literal("")),
  department: z.string().min(1, "Please select a department"),
});

type MentorProfileForm = z.infer<typeof mentorProfileSchema>;

export default function MentorProfile() {
  const navigate = useNavigate();
  const { isMentor, loading: roleLoading, mentorId } = useUserRole();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const form = useForm<MentorProfileForm>({
    resolver: zodResolver(mentorProfileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      department: "",
    },
    mode: "onChange",
  });

  const { register, setValue, watch, formState: { errors } } = form;

  useEffect(() => {
    if (!roleLoading && !isMentor) {
      toast({
        title: "Access Denied",
        description: "You don't have mentor access.",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [roleLoading, isMentor, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!mentorId) return;
      
      try {
        const { data, error } = await supabase
          .from('mentors')
          .select('name, email, phone, department')
          .eq('id', mentorId)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          setValue("name", data.name || "");
          setValue("email", data.email || "");
          setValue("phone", data.phone || "");
          setValue("department", data.department || "");
        }
      } catch (error) {
        console.error('Error fetching mentor profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (mentorId) {
      fetchProfile();
    } else if (!roleLoading) {
      setLoading(false);
    }
  }, [mentorId, roleLoading, setValue]);

  const onSubmit = async (data: MentorProfileForm) => {
    if (!mentorId) {
      toast({
        title: "Error",
        description: "Mentor profile not found.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('mentors')
        .update({
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          department: data.department,
          updated_at: new Date().toISOString(),
        })
        .eq('id', mentorId);

      if (error) throw error;

      toast({
        title: "Profile Updated!",
        description: "Your mentor profile has been saved successfully.",
      });

      navigate("/mentor/dashboard");
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast({
        title: "Update Failed",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <Skeleton className="h-12 w-48 mb-6" />
          <Skeleton className="h-96 w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/mentor/dashboard")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">My Profile</h1>
            <p className="text-muted-foreground">Update your mentor profile information</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Mentor Information
            </CardTitle>
            <CardDescription>
              This information will be visible to students assigned to you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Name */}
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Prof. / Dr. Full Name"
                    className={`pl-10 ${errors.name ? "border-destructive" : ""}`}
                    {...register("name")}
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* Department */}
              <div>
                <Label>Department *</Label>
                <Select
                  value={watch("department")}
                  onValueChange={(value) => setValue("department", value, { shouldValidate: true })}
                >
                  <SelectTrigger className={`mt-1 ${errors.department ? "border-destructive" : ""}`}>
                    <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
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
                  <p className="text-sm text-destructive mt-1">{errors.department.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="mentor@nitw.ac.in"
                    className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone">Contact Number</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="10-digit mobile number"
                    className={`pl-10 ${errors.phone ? "border-destructive" : ""}`}
                    {...register("phone")}
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Profile
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}