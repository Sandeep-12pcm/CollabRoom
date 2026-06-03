import express from "express";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

// GET /api/tournament/registrations — fetches all registrations (service role bypasses RLS)
router.get("/registrations", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("tournament_registrations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json({ data });
  } catch (error: any) {
    console.error("Failed to fetch registrations:", error);
    return res.status(500).json({ error: error.message });
  }
});

router.post("/approve", async (req, res) => {

  const { registrationId, userEmail, status, reason } = req.body;

  if (!registrationId || !status) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // 1. Update the registration in Supabase
    // Try both table names just in case
    let { error: updateError } = await supabaseAdmin
      .from("tournament_registrations")
      .update({ status })
      .eq("id", registrationId);

    if (updateError) {
      const { error: fallbackError } = await supabaseAdmin
        .from("tournament-registrations")
        .update({ status })
        .eq("id", registrationId);
      if (fallbackError) throw fallbackError;
    }

    // 2. If approved or rejected and we have an email, send the confirmation email
    if ((status === "approved" || status === "rejected") && userEmail) {
      let mailOptions;

      if (status === "approved") {
        mailOptions = {
          from: `"Tournament Admin" <${process.env.SMTP_EMAIL}>`,
          to: userEmail,
          subject: "🎉 Tournament Slot Confirmed — CollabRoom",
          html: `
            <div style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">

              <!-- Header / Branding -->
              <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);padding:32px 40px;text-align:center;">
                <h1 style="margin:0;font-size:28px;font-weight:800;letter-spacing:2px;color:#ffffff;">
                  &#9654;&nbsp;CollabRoom
                </h1>
                <p style="margin:6px 0 0;font-size:13px;color:#a0aec0;letter-spacing:1px;text-transform:uppercase;">Tournament Management</p>
              </div>

              <!-- Body -->
              <div style="max-width:600px;margin:0 auto;background:#ffffff;padding:36px 40px;">

                <h2 style="margin-top:0;font-size:22px;color:#0f3460;">&#x2705; Your Slot is Confirmed!</h2>

                <p style="color:#374151;line-height:1.7;">Hello,</p>
                <p style="color:#374151;line-height:1.7;">
                  Great news! Your team's registration for the upcoming tournament has been reviewed and
                  <strong style="color:#16a34a;">approved</strong>. Your slot is now officially confirmed.
                </p>

                <!-- Registration ID Badge -->
                <div style="background:#f0fdf4;border-left:4px solid #22c55e;border-radius:4px;padding:14px 18px;margin:20px 0;">
                  <p style="margin:0;font-size:13px;color:#6b7280;">Registration ID</p>
                  <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#15803d;font-family:monospace;">${registrationId}</p>
                </div>

                <p style="color:#374151;line-height:1.7;">
                  Please make sure all players are ready before the scheduled match time.
                  Join our WhatsApp group for live updates and further instructions:
                </p>

                <div style="text-align:center;margin:24px 0;">
                  <a href="https://chat.whatsapp.com/GkM5x3CeEyH4aQHWJrwmxH"
                     style="display:inline-block;background:#25d366;color:#ffffff;font-weight:700;font-size:15px;padding:12px 28px;border-radius:8px;text-decoration:none;">
                    &#128172; Join WhatsApp Group
                  </a>
                </div>

                <p style="color:#374151;line-height:1.7;">Best of luck,<br/><strong>The CollabRoom Admin Team</strong></p>
              </div>

              <!-- Why did you receive this -->
              <div style="max-width:600px;margin:0 auto;background:#f9fafb;padding:18px 40px;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                  You received this email because <strong>${userEmail}</strong> was used to register for a CollabRoom tournament.
                  If this wasn't you, please contact our support team immediately.
                </p>
              </div>

              <!-- Footer -->
              <div style="max-width:600px;margin:0 auto;background:#1a1a2e;padding:24px 40px;text-align:center;border-radius:0 0 8px 8px;">
                <p style="margin:0 0 8px;font-size:13px;color:#a0aec0;">
                  Need help? &nbsp;
                  <a href="mailto:${process.env.SMTP_EMAIL}" style="color:#60a5fa;text-decoration:none;">Contact Support</a>
                  &nbsp;&#183;&nbsp;
                  <a href="https://collabroom.online" style="color:#60a5fa;text-decoration:none;">Visit Website</a>
                </p>
                <p style="margin:0;font-size:11px;color:#4b5563;">
                  &copy; ${new Date().getFullYear()} CollabRoom. All rights reserved.
                </p>
              </div>

            </div>
          `,
        };
      } else if (status === "rejected") {
        mailOptions = {
          from: `"Tournament Admin" <${process.env.SMTP_EMAIL}>`,
          to: userEmail,
          subject: "Tournament Registration Update — CollabRoom",
          html: `
            <div style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">

              <!-- Header / Branding -->
              <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);padding:32px 40px;text-align:center;">
                <h1 style="margin:0;font-size:28px;font-weight:800;letter-spacing:2px;color:#ffffff;">
                  &#9654;&nbsp;CollabRoom
                </h1>
                <p style="margin:6px 0 0;font-size:13px;color:#a0aec0;letter-spacing:1px;text-transform:uppercase;">Tournament Management</p>
              </div>

              <!-- Body -->
              <div style="max-width:600px;margin:0 auto;background:#ffffff;padding:36px 40px;">

                <h2 style="margin-top:0;font-size:22px;color:#b91c1c;">Registration Not Approved</h2>

                <p style="color:#374151;line-height:1.7;">Hello,</p>
                <p style="color:#374151;line-height:1.7;">
                  Thank you for registering. Unfortunately, your team's registration for the upcoming tournament has been
                  reviewed and <strong style="color:#dc2626;">not approved</strong> at this time.
                </p>

                <!-- Reason Badge -->
                <div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:4px;padding:14px 18px;margin:20px 0;">
                  <p style="margin:0;font-size:13px;color:#6b7280;">Reason for Rejection</p>
                  <p style="margin:4px 0 0;font-size:15px;color:#991b1b;">${reason || "Not specified"}</p>
                </div>

                <p style="color:#374151;line-height:1.7;">
                  If a payment was made, it will be refunded within <strong>2–3 business days</strong>.
                  To expedite your refund, please reply to this email with your payment details
                  (UPI ID / QR Code / Bank details).
                </p>

                <p style="color:#374151;line-height:1.7;">
                  If you have any questions or believe this was an error, please reach out to us — we're happy to help.
                </p>

                <p style="color:#374151;line-height:1.7;">Regards,<br/><strong>Team CollabRoom</strong></p>
              </div>

              <!-- Why did you receive this -->
              <div style="max-width:600px;margin:0 auto;background:#f9fafb;padding:18px 40px;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                  You received this email because <strong>${userEmail}</strong> was used to register for a CollabRoom tournament.
                  If this wasn't you, please contact our support team immediately.
                </p>
              </div>

              <!-- Footer -->
              <div style="max-width:600px;margin:0 auto;background:#1a1a2e;padding:24px 40px;text-align:center;border-radius:0 0 8px 8px;">
                <p style="margin:0 0 8px;font-size:13px;color:#a0aec0;">
                  Need help? &nbsp;
                  <a href="mailto:${process.env.SMTP_EMAIL}" style="color:#60a5fa;text-decoration:none;">Contact Support</a>
                  &nbsp;&#183;&nbsp;
                  <a href="https://collabroom.vercel.app" style="color:#60a5fa;text-decoration:none;">Visit Website</a>
                </p>
                <p style="margin:0;font-size:11px;color:#4b5563;">
                  &copy; ${new Date().getFullYear()} CollabRoom. All rights reserved.
                </p>
              </div>

            </div>
          `,
        };
      }

      if (mailOptions) {
        try {
          await transporter.sendMail(mailOptions);
          console.log(`Email sent successfully to ${userEmail} for status ${status}`);
        } catch (emailErr) {
          console.error("Failed to send email:", emailErr);
          // We still return success since DB was updated, but log the email error
          return res.status(200).json({
            message: "Status updated, but email failed to send (check SMTP config).",
            emailError: true
          });
        }
      }
    }

    return res.status(200).json({ message: "Success" });
  } catch (error: any) {
    console.error("Approval route error:", error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
