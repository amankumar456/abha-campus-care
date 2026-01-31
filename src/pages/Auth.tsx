import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, LogIn, UserPlus, Stethoscope, GraduationCap, ArrowLeft, KeyRound, Users, BookOpen, Phone } from "lucide-react";
import { z } from "zod";
import { PasswordStrength } from "@/components/ui/password-strength";
import { 
  emailSchema, 
  passwordSchema as strongPasswordSchema,
  loginPasswordSchema,
  nameSchema 
} from "@/lib/security/validation";
import { DEPARTMENTS, YEARS_OF_STUDY, PROGRAMMES } from "@/lib/validations/student-registration";

type UserType = "student" | "doctor" | "mentor";
type AuthView = "select" | "signin" | "signup" | "forgot";

interface StudentFormData {
  rollNumber: string;
  branch: string;
  yearOfStudy: string;
  programme: string;
  mentorName: string;
  mentorContact: string;
  mentorEmail: string;
  phone: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  fullName?: string;
  rollNumber?: string;
  branch?: string;
  yearOfStudy?: string;
  programme?: string;
  mentorName?: string;
  mentorContact?: string;
  phone?: string;
}

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [userType, setUserType] = useState<UserType | null>(null);
  const [authView, setAuthView] = useState<AuthView>("select");
  
  // Student-specific registration fields
  const [studentData, setStudentData] = useState<StudentFormData>({
    rollNumber: "",
    branch: "",
    yearOfStudy: "",
    programme: "",
    mentorName: "",
    mentorContact: "",
    mentorEmail: "",
    phone: "",
  });

  useEffect(() => {
    const checkSessionAndRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await redirectBasedOnRole(session.user);
      }
    };

    checkSessionAndRedirect();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && event === 'SIGNED_IN') {
        await redirectBasedOnRole(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const redirectBasedOnRole = async (authUser: any) => {
    // Check user type from metadata
    const userType = authUser?.user_metadata?.user_type;
    
    // Check if user has doctor role in database
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authUser.id);
    
    const isDoctor = roles?.some(r => r.role === 'doctor');
    const isMentor = roles?.some(r => r.role === 'mentor');
    const isAdmin = roles?.some(r => r.role === 'admin');

    if (isAdmin) {
      navigate('/admin');
    } else if (isDoctor || userType === 'doctor') {
      navigate('/doctor/dashboard');
    } else if (isMentor || userType === 'mentor') {
      navigate('/mentor/dashboard');
    } else {
      navigate('/health-dashboard');
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setErrors({});
    setStudentData({
      rollNumber: "",
      branch: "",
      yearOfStudy: "",
      programme: "",
      mentorName: "",
      mentorContact: "",
      mentorEmail: "",
      phone: "",
    });
  };

  const handleBack = () => {
    if (authView === "forgot") {
      setAuthView("signin");
    } else {
      setAuthView("select");
      setUserType(null);
    }
    resetForm();
  };

  const validateForm = (isSignUp: boolean) => {
    const newErrors: FormErrors = {};
    
    // Validate email
    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    // Password validation - strict for signup, lenient for signin
    if (authView !== "forgot") {
      try {
        if (isSignUp) {
          strongPasswordSchema.parse(password);
        } else {
          loginPasswordSchema.parse(password);
        }
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.password = e.errors[0].message;
        }
      }
    }

    // Name validation for signup
    if (isSignUp) {
      try {
        nameSchema.parse(fullName);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.fullName = e.errors[0].message;
        }
      }
      
      // Student-specific validation
      if (userType === "student") {
        if (!studentData.rollNumber.trim() || studentData.rollNumber.length < 5) {
          newErrors.rollNumber = "Roll number is required (min 5 characters)";
        }
        if (!studentData.branch) {
          newErrors.branch = "Please select your branch/department";
        }
        if (!studentData.yearOfStudy) {
          newErrors.yearOfStudy = "Please select your year of study";
        }
        if (!studentData.programme) {
          newErrors.programme = "Please select your programme";
        }
        if (!studentData.mentorName.trim()) {
          newErrors.mentorName = "Mentor name is required";
        }
        if (!studentData.mentorContact.trim() || !/^[6-9]\d{9}$/.test(studentData.mentorContact)) {
          newErrors.mentorContact = "Enter valid 10-digit mentor contact";
        }
        if (studentData.phone && !/^[6-9]\d{9}$/.test(studentData.phone)) {
          newErrors.phone = "Enter valid 10-digit phone number";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(false)) return;

    setIsLoading(true);
    
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setIsLoading(false);
      toast({
        title: "Sign In Failed",
        description: error.message === "Invalid login credentials" 
          ? "Invalid email or password. Please try again."
          : error.message,
        variant: "destructive",
      });
      return;
    }

    // Auto-assign role based on selected user type if not already assigned
    if (data.user && userType) {
      const { data: existingRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id);

      const hasRole = existingRoles?.some(r => r.role === userType);
      
      if (!hasRole) {
        // Assign the role based on the selected user type
        try {
          await supabase.from('user_roles').insert({
            user_id: data.user.id,
            role: userType
          });
          console.log(`Auto-assigned ${userType} role`);
        } catch (err) {
          console.log('Role may already exist:', err);
        }
      }

      // Update user metadata with user_type
      await supabase.auth.updateUser({
        data: { user_type: userType }
      });
    }

    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(true)) return;

    setIsLoading(true);
    
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/email-confirmation`,
        data: {
          full_name: fullName,
          user_type: userType,
        }
      }
    });

    if (error) {
      setIsLoading(false);
      if (error.message.includes("already registered")) {
        toast({
          title: "Account Exists",
          description: "This email is already registered. Please sign in instead.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sign Up Failed",
          description: error.message,
          variant: "destructive",
        });
      }
      return;
    }
    
    if (data.user) {
      // Auto-assign role based on user type selection
      const roleToAssign = userType as "student" | "doctor" | "mentor";
      
      try {
        await supabase.from('user_roles').insert({
          user_id: data.user.id,
          role: roleToAssign
        });
        console.log(`Auto-assigned ${roleToAssign} role on signup`);
      } catch (roleError) {
        console.log('Role assignment error (may already exist):', roleError);
      }

      // For students, create the student profile with all details
      if (userType === "student") {
        const { error: studentError } = await supabase
          .from('students')
          .insert({
            user_id: data.user.id,
            full_name: fullName,
            email: email,
            phone: studentData.phone || null,
            roll_number: studentData.rollNumber,
            program: studentData.programme,
            batch: studentData.yearOfStudy,
            branch: studentData.branch,
            year_of_study: studentData.yearOfStudy,
            mentor_name: studentData.mentorName,
            mentor_contact: studentData.mentorContact,
            mentor_email: studentData.mentorEmail || null,
          });

        if (studentError) {
          console.error('Error creating student profile:', studentError);
          // Don't fail registration, but log the error
        }
      }

      // Send registration confirmation email
      try {
        await supabase.functions.invoke('send-registration-email', {
          body: {
            email,
            name: fullName,
            userType: userType,
            rollNumber: userType === "student" ? studentData.rollNumber : undefined,
          }
        });
      } catch (emailError) {
        console.log('Registration email could not be sent:', emailError);
      }

      setIsLoading(false);

      if (!data.session) {
        navigate(`/email-confirmation?email=${encodeURIComponent(email)}`);
      } else {
        toast({
          title: "Account Created!",
          description: "Welcome to the Health Portal. Your profile has been set up.",
        });
        navigate("/health-dashboard");
      }
    } else {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { email?: string } = {};
    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });

    setIsLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Reset Link Sent!",
        description: "Check your email for the password reset link.",
      });
      setAuthView("signin");
    }
  };

  const selectUserType = (type: UserType) => {
    setUserType(type);
    setAuthView("signin");
  };

  // User type selection view
  if (authView === "select") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Welcome to Health Portal</CardTitle>
              <CardDescription>
                Choose your account type to continue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="w-full h-24 flex flex-col items-center justify-center gap-2 border-2 hover:border-primary hover:bg-primary/5 transition-all"
                onClick={() => selectUserType("student")}
              >
                <GraduationCap className="w-8 h-8 text-primary" />
                <div className="text-center">
                  <p className="font-semibold">New User / Student</p>
                  <p className="text-xs text-muted-foreground">Students, Faculty & Staff</p>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="w-full h-24 flex flex-col items-center justify-center gap-2 border-2 hover:border-secondary hover:bg-secondary/5 transition-all"
                onClick={() => selectUserType("doctor")}
              >
                <Stethoscope className="w-8 h-8 text-secondary" />
                <div className="text-center">
                  <p className="font-semibold">Doctor / Medical Staff</p>
                  <p className="text-xs text-muted-foreground">Medical Officers & Visiting Doctors</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full h-24 flex flex-col items-center justify-center gap-2 border-2 hover:border-green-600 hover:bg-green-50 transition-all"
                onClick={() => selectUserType("mentor")}
              >
                <Users className="w-8 h-8 text-green-600" />
                <div className="text-center">
                  <p className="font-semibold">Faculty Mentor</p>
                  <p className="text-xs text-muted-foreground">Faculty Advisors & Student Mentors</p>
                </div>
              </Button>
            </CardContent>
          </Card>
        </main>
        
        <Footer />
      </div>
    );
  }

  // Forgot password view
  if (authView === "forgot") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="absolute left-4 top-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Reset Password</CardTitle>
              <CardDescription>
                Enter your email address and we'll send you a reset link
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="your.email@nitw.ac.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
        
        <Footer />
      </div>
    );
  }

  // Sign in / Sign up view
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="absolute left-4 top-4 z-10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <CardHeader className="text-center pt-12">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              userType === "doctor" ? "bg-secondary/10" : userType === "mentor" ? "bg-green-100" : "bg-primary/10"
            }`}>
              {userType === "doctor" ? (
                <Stethoscope className="w-8 h-8 text-secondary" />
              ) : userType === "mentor" ? (
                <Users className="w-8 h-8 text-green-600" />
              ) : (
                <GraduationCap className="w-8 h-8 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {userType === "doctor" ? "Doctor Portal" : userType === "mentor" ? "Mentor Portal" : "Student Portal"}
            </CardTitle>
            <CardDescription>
              {userType === "doctor" 
                ? "Sign in to access medical dashboard and patient records"
                : userType === "mentor"
                ? "Sign in to view mentee health information and reports"
                : "Sign in to book appointments and access health services"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full" onValueChange={(v) => setAuthView(v as AuthView)}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin" className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder={userType === "doctor" ? "doctor@nitw.ac.in" : userType === "mentor" ? "mentor@nitw.ac.in" : "student@student.nitw.ac.in"}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signin-password">Password</Label>
                      <Button
                        type="button"
                        variant="link"
                        className="px-0 h-auto text-xs text-muted-foreground hover:text-primary"
                        onClick={() => setAuthView("forgot")}
                      >
                        Forgot password?
                      </Button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className={`w-full ${userType === "doctor" ? "bg-secondary hover:bg-secondary/90" : userType === "mentor" ? "bg-green-600 hover:bg-green-700" : ""}`}
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder={userType === "doctor" ? "Dr. Aman Kumar" : userType === "mentor" ? "Prof. Aman Kumar" : "Aman Kumar"}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-sm text-destructive">{errors.fullName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder={userType === "doctor" ? "doctor@nitw.ac.in" : userType === "mentor" ? "mentor@nitw.ac.in" : "student@student.nitw.ac.in"}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Min 8 chars, uppercase, number, symbol"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        autoComplete="new-password"
                      />
                    </div>
                    <PasswordStrength password={password} />
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>

                  {/* Student-specific registration fields */}
                  {userType === "student" && (
                    <>
                      <div className="border-t pt-4 mt-4">
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          Academic Details
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="rollNumber">Roll Number *</Label>
                            <Input
                              id="rollNumber"
                              placeholder="e.g., 21CS1234"
                              value={studentData.rollNumber}
                              onChange={(e) => setStudentData(prev => ({ ...prev, rollNumber: e.target.value }))}
                            />
                            {errors.rollNumber && (
                              <p className="text-xs text-destructive">{errors.rollNumber}</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone (Optional)</Label>
                            <Input
                              id="phone"
                              placeholder="10-digit mobile"
                              value={studentData.phone}
                              onChange={(e) => setStudentData(prev => ({ ...prev, phone: e.target.value }))}
                            />
                            {errors.phone && (
                              <p className="text-xs text-destructive">{errors.phone}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div className="space-y-2">
                            <Label>Programme *</Label>
                            <Select 
                              value={studentData.programme} 
                              onValueChange={(value) => setStudentData(prev => ({ ...prev, programme: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select programme" />
                              </SelectTrigger>
                              <SelectContent>
                                {PROGRAMMES.map((prog) => (
                                  <SelectItem key={prog} value={prog}>{prog}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {errors.programme && (
                              <p className="text-xs text-destructive">{errors.programme}</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Year of Study *</Label>
                            <Select 
                              value={studentData.yearOfStudy} 
                              onValueChange={(value) => setStudentData(prev => ({ ...prev, yearOfStudy: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select year" />
                              </SelectTrigger>
                              <SelectContent>
                                {YEARS_OF_STUDY.map((year) => (
                                  <SelectItem key={year} value={year}>{year}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {errors.yearOfStudy && (
                              <p className="text-xs text-destructive">{errors.yearOfStudy}</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 mt-3">
                          <Label>Branch/Department *</Label>
                          <Select 
                            value={studentData.branch} 
                            onValueChange={(value) => setStudentData(prev => ({ ...prev, branch: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              {DEPARTMENTS.map((dept) => (
                                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.branch && (
                            <p className="text-xs text-destructive">{errors.branch}</p>
                          )}
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Mentor Details
                        </h4>
                        
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="mentorName">Mentor Name *</Label>
                            <Input
                              id="mentorName"
                              placeholder="e.g., Prof. Rajesh Kumar"
                              value={studentData.mentorName}
                              onChange={(e) => setStudentData(prev => ({ ...prev, mentorName: e.target.value }))}
                            />
                            {errors.mentorName && (
                              <p className="text-xs text-destructive">{errors.mentorName}</p>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor="mentorContact">Mentor Contact *</Label>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  id="mentorContact"
                                  placeholder="10-digit mobile"
                                  value={studentData.mentorContact}
                                  onChange={(e) => setStudentData(prev => ({ ...prev, mentorContact: e.target.value }))}
                                  className="pl-10"
                                />
                              </div>
                              {errors.mentorContact && (
                                <p className="text-xs text-destructive">{errors.mentorContact}</p>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="mentorEmail">Mentor Email</Label>
                              <Input
                                id="mentorEmail"
                                type="email"
                                placeholder="mentor@nitw.ac.in"
                                value={studentData.mentorEmail}
                                onChange={(e) => setStudentData(prev => ({ ...prev, mentorEmail: e.target.value }))}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <Button 
                    type="submit" 
                    className={`w-full ${userType === "doctor" ? "bg-secondary hover:bg-secondary/90" : userType === "mentor" ? "bg-green-600 hover:bg-green-700" : ""}`}
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>

                  {/* Link to detailed registration for doctors only */}
                  {userType === "doctor" && (
                    <div className="text-center pt-2">
                      <p className="text-sm text-muted-foreground">
                        Need to complete full registration?{" "}
                        <Link 
                          to="/doctor/register" 
                          className="text-primary hover:underline font-medium"
                        >
                          Doctor Registration
                        </Link>
                      </p>
                    </div>
                  )}
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
}
