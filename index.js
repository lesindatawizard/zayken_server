import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ----------------------------------------
// MULTER — File Uploads (multiple files)
// ----------------------------------------
const upload = multer({ dest: "uploads/" });

// ----------------------------------------
// SMTP — GoDaddy Professional Email
// ----------------------------------------
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_SERVER,  // smtp-relay.brevo.com
  port: Number(process.env.SMTP_PORT), // 587
  secure: false, // must be FALSE for port 587 (STARTTLS)
  auth: {
    user: process.env.SMTP_LOGIN,     // your Brevo login email
    pass: process.env.SMTP_PASSWORD,  // your Brevo SMTP key (password)
  },
  tls: {
    rejectUnauthorized: false
  }
}); 

// Verify SMTP connection
transporter.verify((err) => {
  if (err) console.log("❌ SMTP Error:", err);
  else console.log("✅ SMTP Server Ready to send emails.");
});

// ----------------------------------------
// TEST ROUTE
// ----------------------------------------
app.get("/", (req, res) => {
  res.send("Zayken Projects Backend Running...");
});

// ----------------------------------------
// QUOTE FORM — MULTIPLE ATTACHMENTS
// ----------------------------------------
app.post("/submit-quote", upload.array("attachments"), async (req, res) => {
  try {
    const form = req.body;
    const files = req.files || [];

    console.log("📩 Form:", form);
    console.log("📎 Files:", files);

    // Build email attachments
    const emailAttachments = files.map((f) => ({
      filename: f.originalname,
      path: f.path,
    }));

    // ----------------------------------------
    // BUILD EMAIL HTML TEMPLATE
    // ----------------------------------------
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
  
      <h2 style="color:#004aad; margin-bottom:10px;">
        📩 New Quote Request – ${form.name}
      </h2>
  
      <!-- ======================= CLIENT INFO ======================= -->
      <h3 style="margin: 20px 0 10px;">Client Information</h3>
  
      <table style="border-collapse: collapse; width: 100%;">
        <tr>
          <td style="padding:8px; width:180px; font-weight:bold;">Name</td>
          <td style="padding:8px;">${form.name}</td>
        </tr>
        <tr>
          <td style="padding:8px; font-weight:bold;">Email</td>
          <td style="padding:8px;">${form.email}</td>
        </tr>
        <tr>
          <td style="padding:8px; font-weight:bold;">Phone</td>
          <td style="padding:8px;">${form.phone}</td>
        </tr>
        <tr>
          <td style="padding:8px; font-weight:bold;">Client Type</td>
          <td style="padding:8px;">${form.type.toUpperCase()}</td>
        </tr>
        <tr>
          <td style="padding:8px; font-weight:bold;">Project Location</td>
          <td style="padding:8px;">${form.projectLocation}</td>
        </tr>
      </table>
  
      <!-- ======================= COMMERCIAL ======================= -->
      ${
        form.type === "commercial"
          ? `
        <h3 style="margin: 25px 0 10px;">Commercial Project Details</h3>
        <table style="border-collapse: collapse; width: 100%;">
          <tr>
            <td style="padding:8px; width:180px; font-weight:bold;">Commercial Space Type</td>
            <td style="padding:8px;">
              ${form.commercialSpaceType === "Other" ? form.commercialSpaceTypeOther : form.commercialSpaceType}
            </td>
          </tr>
  
          <tr>
            <td style="padding:8px; font-weight:bold;">Scope</td>
            <td style="padding:8px;">
              ${form.commercialScope.join(", ")}
              ${
                form.commercialScope.includes("Other")
                  ? `<br><strong>Other:</strong> ${form.commercialScopeOther}`
                  : ""
              }
            </td>
          </tr>
  
          <tr>
            <td style="padding:8px; font-weight:bold;">Approx Area</td>
            <td style="padding:8px;">${form.approxArea || "-"}</td>
          </tr>
  
          <tr>
            <td style="padding:8px; font-weight:bold;">Timeline</td>
            <td style="padding:8px;">${form.timeline || "-"}</td>
          </tr>
  
          <tr>
            <td style="padding:8px; font-weight:bold;">Site Ready?</td>
            <td style="padding:8px;">${form.siteReady || "-"}</td>
          </tr>
        </table>
      `
          : ""
      }
  
      <!-- ======================= RESIDENTIAL ======================= -->
      ${
        form.type === "residential"
          ? `
        <h3 style="margin: 25px 0 10px;">Residential Project Details</h3>
  
        <table style="border-collapse: collapse; width: 100%;">
          <tr>
            <td style="padding:8px; width:180px; font-weight:bold;">Property Type</td>
            <td style="padding:8px;">
              ${form.propertyType === "Others" ? form.propertyTypeOther : form.propertyType}
            </td>
          </tr>
  
          <tr>
            <td style="padding:8px; font-weight:bold;">Scope</td>
            <td style="padding:8px;">
              ${form.residentialScope.join(", ")}
              ${
                form.residentialScope.includes("Other")
                  ? `<br><strong>Other:</strong> ${form.residentialScopeOther}`
                  : ""
              }
            </td>
          </tr>
  
          <tr>
            <td style="padding:8px; font-weight:bold;">Approx Area</td>
            <td style="padding:8px;">${form.approxAreaResidential || "-"}</td>
          </tr>
  
          <tr>
            <td style="padding:8px; font-weight:bold;">Timeline</td>
            <td style="padding:8px;">${form.timelineResidential || "-"}</td>
          </tr>
  
          <tr>
            <td style="padding:8px; font-weight:bold;">Site Ready?</td>
            <td style="padding:8px;">${form.siteReadyResidential || "-"}</td>
          </tr>
        </table>
      `
          : ""
      }
  
      <!-- ======================= F&B ======================= -->
      ${
        form.type === "fnb"
          ? `
        <h3 style="margin: 25px 0 10px;">F&B Project Details</h3>
  
        <table style="border-collapse: collapse; width: 100%;">
          <tr>
            <td style="padding:8px; width:180px; font-weight:bold;">F&B Type</td>
            <td style="padding:8px;">
              ${form.fnbType === "Others" ? form.fnbTypeOther : form.fnbType}
            </td>
          </tr>
  
          <tr>
            <td style="padding:8px; font-weight:bold;">Scope</td>
            <td style="padding:8px;">
              ${form.fnbScope.join(", ")}
              ${
                form.fnbScope.includes("Other")
                  ? `<br><strong>Other:</strong> ${form.fnbScopeOther}`
                  : ""
              }
            </td>
          </tr>
  
          <tr>
            <td style="padding:8px; font-weight:bold;">Approx Area</td>
            <td style="padding:8px;">${form.approxAreaFnb || "-"}</td>
          </tr>
  
          <tr>
            <td style="padding:8px; font-weight:bold;">Timeline</td>
            <td style="padding:8px;">${form.timelineFnb || "-"}</td>
          </tr>
  
          <tr>
            <td style="padding:8px; font-weight:bold;">Site Ready?</td>
            <td style="padding:8px;">${form.siteReadyFnb || "-"}</td>
          </tr>
        </table>
      `
          : ""
      }
  
      <!-- ======================= MESSAGE ======================= -->
      <h3 style="margin: 25px 0 10px;">Message / Requirements</h3>
      <div style="background:#f5f5f5; padding:12px; border-radius:5px;">
        ${form.message}
      </div>
  
    </div>
  `;
    // ----------------------------------------
    // SEND EMAIL
    // ----------------------------------------
    await transporter.sendMail({
      from: `"Zayken Projects" <info@zaykenprojects.com>`,
      to: "info@zaykenprojects.com",
      subject: `📩 New Quote Request – ${form.name}`,
      html: htmlContent,
      attachments: emailAttachments,
    });

    res.json({ success: true, message: "Email sent successfully!" });

  } catch (err) {
    console.error("❌ Email Failed:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Backend running at http://localhost:${PORT}`)
);