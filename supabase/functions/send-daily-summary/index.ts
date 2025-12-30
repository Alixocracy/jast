import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Task {
  id: string;
  text: string;
  completed: boolean;
  color: string;
}

interface Thought {
  id: string;
  text: string;
  timestamp: string;
}

interface DailySummaryRequest {
  email: string;
  userName: string;
  tasks: Task[];
  thoughts: Thought[];
  points: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userName, tasks, thoughts, points }: DailySummaryRequest = await req.json();
    
    console.log(`Sending daily summary to ${email} for user ${userName}`);

    const completedTasks = tasks.filter(t => t.completed);
    const pendingTasks = tasks.filter(t => !t.completed);
    const dateStr = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Daily Summary</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f7f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f7f4;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #a8c5a8 0%, #c5d5c5 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #2d3a2d; font-size: 28px; font-weight: 600;">
                🌙 Daily Summary
              </h1>
              <p style="margin: 10px 0 0; color: #4a5a4a; font-size: 16px;">
                ${dateStr}
              </p>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 30px 20px;">
              <p style="margin: 0; color: #333; font-size: 18px;">
                Hey ${userName || 'there'}! 👋
              </p>
              <p style="margin: 10px 0 0; color: #666; font-size: 15px; line-height: 1.5;">
                Here's a recap of your day with JAST. You're doing amazing!
              </p>
            </td>
          </tr>
          
          <!-- Points Badge -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 20px; text-align: center;">
                    <span style="font-size: 32px;">⭐</span>
                    <p style="margin: 10px 0 0; color: #92400e; font-size: 24px; font-weight: 700;">
                      ${points} Points Earned
                    </p>
                    <p style="margin: 5px 0 0; color: #b45309; font-size: 14px;">
                      Great progress today!
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Completed Tasks -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <h2 style="margin: 0 0 15px; color: #333; font-size: 18px; font-weight: 600;">
                ✅ Completed Tasks (${completedTasks.length})
              </h2>
              ${completedTasks.length > 0 ? `
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  ${completedTasks.map(task => `
                    <tr>
                      <td style="padding: 8px 12px; background-color: #f0fdf4; border-radius: 8px; margin-bottom: 8px;">
                        <span style="color: #166534; font-size: 14px;">✓ ${task.text}</span>
                      </td>
                    </tr>
                    <tr><td style="height: 8px;"></td></tr>
                  `).join('')}
                </table>
              ` : `
                <p style="margin: 0; color: #888; font-size: 14px; font-style: italic;">
                  No tasks completed today - that's okay, tomorrow is a new day!
                </p>
              `}
            </td>
          </tr>
          
          <!-- Pending Tasks -->
          ${pendingTasks.length > 0 ? `
          <tr>
            <td style="padding: 0 30px 20px;">
              <h2 style="margin: 0 0 15px; color: #333; font-size: 18px; font-weight: 600;">
                📋 Pending for Tomorrow (${pendingTasks.length})
              </h2>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                ${pendingTasks.map(task => `
                  <tr>
                    <td style="padding: 8px 12px; background-color: #fefce8; border-radius: 8px;">
                      <span style="color: #854d0e; font-size: 14px;">○ ${task.text}</span>
                    </td>
                  </tr>
                  <tr><td style="height: 8px;"></td></tr>
                `).join('')}
              </table>
            </td>
          </tr>
          ` : ''}
          
          <!-- Brain Dump -->
          ${thoughts.length > 0 ? `
          <tr>
            <td style="padding: 0 30px 20px;">
              <h2 style="margin: 0 0 15px; color: #333; font-size: 18px; font-weight: 600;">
                💭 Brain Dump Notes (${thoughts.length})
              </h2>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                ${thoughts.map(thought => `
                  <tr>
                    <td style="padding: 10px 12px; background-color: #f5f3ff; border-radius: 8px; border-left: 3px solid #8b5cf6;">
                      <span style="color: #5b21b6; font-size: 14px;">${thought.text}</span>
                    </td>
                  </tr>
                  <tr><td style="height: 8px;"></td></tr>
                `).join('')}
              </table>
            </td>
          </tr>
          ` : ''}
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f8f7f4; text-align: center;">
              <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.5;">
                Remember: your brain is unique, not broken. 💚
              </p>
              <p style="margin: 15px 0 0; color: #888; font-size: 12px;">
                Sent with love from JAST, your personal wellbeing assistant
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "JAST <onboarding@resend.dev>",
        to: [email],
        subject: `🌙 Your Daily Summary - ${dateStr}`,
        html: emailHtml,
      }),
    });

    const emailResponse = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", emailResponse);
      throw new Error(emailResponse.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-daily-summary function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
