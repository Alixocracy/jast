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

interface PointsHistoryEntry {
  action: string;
  points: number;
  timestamp: string;
}

interface DailySummaryRequest {
  email: string;
  userName: string;
  tasks: Task[];
  thoughts: Thought[];
  points: number;
  pointsHistory: PointsHistoryEntry[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userName, tasks, thoughts, points, pointsHistory = [] }: DailySummaryRequest = await req.json();
    
    console.log(`Sending daily summary to ${email} for user ${userName}`);

    const completedTasks = tasks.filter(t => t.completed);
    const pendingTasks = tasks.filter(t => !t.completed);
    const dateStr = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Calculate points breakdown like in PointsDisplay
    const LEVELS = [
      { min: 0, name: "Seedling", emoji: "🌱", color: "#34d399" },
      { min: 50, name: "Rising Star", emoji: "⭐", color: "#38bdf8" },
      { min: 100, name: "Achiever", emoji: "⚡", color: "#a78bfa" },
      { min: 200, name: "Champion", emoji: "🔥", color: "#fb923c" },
      { min: 500, name: "Master", emoji: "👑", color: "#fbbf24" },
    ];

    const getLevelInfo = (pts: number) => {
      for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (pts >= LEVELS[i].min) {
          const nextLevel = LEVELS[i + 1];
          const progress = nextLevel 
            ? ((pts - LEVELS[i].min) / (nextLevel.min - LEVELS[i].min)) * 100
            : 100;
          return { 
            ...LEVELS[i], 
            progress: Math.min(progress, 100),
            nextLevel: nextLevel?.name,
            pointsToNext: nextLevel ? nextLevel.min - pts : 0
          };
        }
      }
      return { ...LEVELS[0], progress: 0, nextLevel: LEVELS[1]?.name, pointsToNext: LEVELS[1]?.min || 0, emoji: "🌱", color: "#34d399", name: "Seedling" };
    };

    const levelInfo = getLevelInfo(points);
    
    // Calculate points by category
    const taskPoints = pointsHistory.filter(h => h.action.includes('task')).reduce((sum, h) => sum + h.points, 0);
    const wellnessPoints = pointsHistory.filter(h => ['Drink Water', 'Deep Breath', 'Take a Walk', 'Mindful Break'].includes(h.action)).reduce((sum, h) => sum + h.points, 0);
    const focusPoints = pointsHistory.filter(h => h.action.includes('Focus')).reduce((sum, h) => sum + h.points, 0);
    const otherPoints = pointsHistory.filter(h => !h.action.includes('task') && !['Drink Water', 'Deep Breath', 'Take a Walk', 'Mindful Break'].includes(h.action) && !h.action.includes('Focus')).reduce((sum, h) => sum + h.points, 0);

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
          
          <!-- Points & Level Section -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="background: linear-gradient(135deg, ${levelInfo.color}22 0%, ${levelInfo.color}44 100%); border-radius: 12px; padding: 20px; border: 2px solid ${levelInfo.color};">
                    <!-- Level Header -->
                    <div style="text-align: center; margin-bottom: 15px;">
                      <span style="font-size: 40px;">${levelInfo.emoji}</span>
                      <p style="margin: 8px 0 0; color: ${levelInfo.color}; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                        Current Level
                      </p>
                      <p style="margin: 4px 0 0; color: #333; font-size: 22px; font-weight: 700;">
                        ${levelInfo.name}
                      </p>
                    </div>
                    
                    <!-- Total Points -->
                    <div style="text-align: center; background: ${levelInfo.color}; border-radius: 8px; padding: 12px; margin-bottom: 15px;">
                      <p style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
                        ${points} Points
                      </p>
                      ${levelInfo.nextLevel ? `
                        <p style="margin: 5px 0 0; color: rgba(255,255,255,0.85); font-size: 12px;">
                          ${levelInfo.pointsToNext} more to reach ${levelInfo.nextLevel}
                        </p>
                      ` : `
                        <p style="margin: 5px 0 0; color: rgba(255,255,255,0.85); font-size: 12px;">
                          You've reached the highest level! 🎉
                        </p>
                      `}
                    </div>
                    
                    <!-- Points Breakdown -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 8px; text-align: center; width: 25%;">
                          <div style="background: white; border-radius: 8px; padding: 10px;">
                            <span style="font-size: 18px;">✓</span>
                            <p style="margin: 4px 0 0; font-size: 18px; font-weight: 700; color: #333;">${taskPoints}</p>
                            <p style="margin: 2px 0 0; font-size: 10px; color: #888;">Tasks</p>
                          </div>
                        </td>
                        <td style="padding: 8px; text-align: center; width: 25%;">
                          <div style="background: white; border-radius: 8px; padding: 10px;">
                            <span style="font-size: 18px;">💚</span>
                            <p style="margin: 4px 0 0; font-size: 18px; font-weight: 700; color: #333;">${wellnessPoints}</p>
                            <p style="margin: 2px 0 0; font-size: 10px; color: #888;">Wellness</p>
                          </div>
                        </td>
                        <td style="padding: 8px; text-align: center; width: 25%;">
                          <div style="background: white; border-radius: 8px; padding: 10px;">
                            <span style="font-size: 18px;">⏱</span>
                            <p style="margin: 4px 0 0; font-size: 18px; font-weight: 700; color: #333;">${focusPoints}</p>
                            <p style="margin: 2px 0 0; font-size: 10px; color: #888;">Focus</p>
                          </div>
                        </td>
                        <td style="padding: 8px; text-align: center; width: 25%;">
                          <div style="background: white; border-radius: 8px; padding: 10px;">
                            <span style="font-size: 18px;">✨</span>
                            <p style="margin: 4px 0 0; font-size: 18px; font-weight: 700; color: #333;">${otherPoints}</p>
                            <p style="margin: 2px 0 0; font-size: 10px; color: #888;">Other</p>
                          </div>
                        </td>
                      </tr>
                    </table>
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
        from: "JAST <jast@sarzamin.ca>",
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
