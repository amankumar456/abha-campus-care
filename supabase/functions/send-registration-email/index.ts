import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RegistrationEmailRequest {
  email: string;
  name: string;
  userType: "student" | "doctor" | "mentor" | "pharmacy" | "lab_officer" | "medical_staff";
  rollNumber?: string;
}

// Input validation schemas
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email) && email.length <= 255;
};

const validateName = (name: string): boolean => {
  return name.length >= 2 && name.length <= 100 && /^[a-zA-Z\s.'-]+$/.test(name);
};

const validateUserType = (type: string): type is "student" | "doctor" | "mentor" => {
  return ["student", "doctor", "mentor"].includes(type);
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Validate the JWT
    const token = authHeader.replace('Bearer ', '');
    const { data, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !data?.user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body = await req.json();
    const { email, name, userType, rollNumber }: RegistrationEmailRequest = body;

    // Validate inputs
    if (!email || !validateEmail(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!name || !validateName(name)) {
      return new Response(JSON.stringify({ error: 'Invalid name format' }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!userType || !validateUserType(userType)) {
      return new Response(JSON.stringify({ error: 'Invalid user type' }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Sanitize name for HTML
    const sanitizedName = name.replace(/[<>&"']/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#39;'
      };
      return entities[char] || char;
    });

    const userTypeLabels = {
      student: "Student",
      doctor: "Medical Officer",
      mentor: "Faculty Mentor"
    };

    const welcomeMessages = {
      student: `
        <p>You now have access to:</p>
        <ul>
          <li>📅 Book appointments with doctors</li>
          <li>📋 View your health records</li>
          <li>🏥 Access empanelled hospital information</li>
          <li>💊 Track prescriptions and medications</li>
        </ul>
      `,
      doctor: `
        <p>You now have access to:</p>
        <ul>
          <li>👨‍⚕️ View and manage patient records</li>
          <li>📝 Write prescriptions and diagnoses</li>
          <li>📅 Manage appointment schedules</li>
          <li>📊 Access health analytics</li>
        </ul>
      `,
      mentor: `
        <p>You now have access to:</p>
        <ul>
          <li>👥 View your assigned mentees</li>
          <li>📋 Monitor mentee health visits</li>
          <li>🔔 Receive wellness alerts</li>
          <li>📊 Access mentee health reports</li>
        </ul>
      `
    };

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to NIT Warangal Health Portal</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a365d 0%, #2d5a87 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 24px;">🏥 NIT Warangal Health Portal</h1>
            <p style="color: #e2e8f0; margin: 10px 0 0;">Your Digital Health Companion</p>
          </div>
          
          <div style="background: #fff; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
            <h2 style="color: #1a365d; margin-top: 0;">Welcome, ${sanitizedName}! 🎉</h2>
            
            <p>Thank you for registering with the NIT Warangal Health Portal as a <strong>${userTypeLabels[userType]}</strong>.</p>
            
            ${rollNumber ? `<p><strong>Roll Number:</strong> ${rollNumber.replace(/[<>&"']/g, '')}</p>` : ''}
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              ${welcomeMessages[userType]}
            </div>
            
            <div style="background: #eef2ff; padding: 15px; border-radius: 8px; border-left: 4px solid #4f46e5; margin: 20px 0;">
              <p style="margin: 0; color: #3730a3;">
                <strong>🔒 Security Reminder:</strong> Your health data is encrypted and ABDM-compliant. Only authorized personnel with your consent can access your records.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://healthportal.nitw.ac.in" style="background: #1a365d; color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                Access Health Portal
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <p style="color: #64748b; font-size: 14px; margin-bottom: 5px;">
              Need help? Contact the Health Centre:
            </p>
            <p style="color: #1a365d; font-size: 14px; margin: 0;">
              📞 +91 870 246 2087 | ✉️ healthcentre@nitw.ac.in
            </p>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 0 0 12px 12px; text-align: center; border: 1px solid #e2e8f0; border-top: none;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
              This is an automated email from the NIT Warangal Health Portal.<br>
              Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    // Send email via Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "NIT Warangal Health Portal <onboarding@resend.dev>",
        to: [email],
        subject: `Welcome to NIT Warangal Health Portal - Registration Successful! 🏥`,
        html: emailHtml,
      }),
    });

    const emailResponse = await response.json();

    if (!response.ok) {
      throw new Error(emailResponse.message || "Failed to send email");
    }

    console.log("Registration email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-registration-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);