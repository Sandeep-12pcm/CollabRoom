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
  service: "gmail",
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
          subject: "Tournament Slot Confirmed!",
          html: `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2 style="color: #2e6c80;">Tournament Slot Confirmed</h2>
              <p>Hello,</p>
              <p>Your team's registration for the upcoming tournament has been reviewed and <strong>approved</strong>!</p>
              <p>Your slot is now confirmed. Please make sure all players are ready before the match time.</p>
              <p>Your Registration ID is: ${registrationId}</p>
              please join our whatsapp group for further updates: <a href="https://chat.whatsapp.com/GkM5x3CeEyH4aQHWJrwmxH" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Join here</a>
              <br/>
              <p>Best of luck,</p>
              <p>The Admin Team</p>
            </div>
          `,
        };
      } else if (status === "rejected") {
        mailOptions = {
          from: `"Tournament Admin" <${process.env.SMTP_EMAIL}>`,
          to: userEmail,
          subject: "Tournament Slot Rejected",
          html: `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2 style="color: #2e6c80;">Tournament Slot Rejected</h2>
              <p>Hello,</p>
              <p>Your team's registration for the upcoming tournament has been reviewed and <strong>rejected</strong>.</p>
              <p>Your slot is now rejected. Your Payment will be refunded in 2-3 business days (if applicable).</p>
              <p><b>Reason for Rejection:</b> ${reason || "Not specified"}</p>
              <br/>
              <p>Please send the correct payment screenshot, with your in-game name on the screenshot, and email it back to us.</p>
              <p>For any payment refund, please reply us your payment details. (UPI ID / QR Code / bank details)</p>
              <p>Regards,</p>
              <p>Team CollabRoom</p>
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
