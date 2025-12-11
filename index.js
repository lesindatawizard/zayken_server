  import express from "express";
  import cors from "cors";
  import multer from "multer";
  import dotenv from "dotenv";
  import * as Brevo from '@getbrevo/brevo';
  import fs from "fs";

  dotenv.config();

  const app = express();
  app.use(cors());
  app.use(express.json());

  // ----------------------------------------
  // MULTER — File Uploads (multiple files)
  // ----------------------------------------
  const upload = multer({ dest: "uploads/" });

  const brevoClient = new Brevo.TransactionalEmailsApi();
  brevoClient.setApiKey(
    Brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY
  );

  // ----------------------------------------
  // TEST ROUTE
  // ----------------------------------------
  app.get("/", (req, res) => {
    res.send("Zayken Projects Backend Running...");
  });

// ****************************************************************************************
// 🚀 1) QUOTE FORM — WITH ATTACHMENTS
// ****************************************************************************************

  // ----------------------------------------
  // QUOTE FORM — MULTIPLE ATTACHMENTS
  // ----------------------------------------
  app.post("/submit-quote", upload.array("attachments"), async (req, res) => {
    try {
      const form = req.body;
      const files = req.files || [];
      // Prevent undefined fields from crashing email template
  form.type = form.type || "";
  form.name = form.name || "";
  form.email = form.email || "";
  form.phone = form.phone || "";
  form.projectLocation = form.projectLocation || "";
  form.message = form.message || "";

    // ----------------------------------------
      // CRITICAL FIX → Convert checkbox strings → arrays
      // ----------------------------------------
      function ensureArray(field) {
        if (!field) return [];
        return Array.isArray(field) ? field : [field];
      }

      form.commercialScope = ensureArray(form.commercialScope);
      form.residentialScope = ensureArray(form.residentialScope);
      form.fnbScope = ensureArray(form.fnbScope);

      // ----------------------------------------
      // Attachments → Convert to base64
      // ----------------------------------------
      let brevoAttachments = [];

      if (files.length > 0) {
        brevoAttachments = files.map((f) => ({
          name: f.originalname,
          content: fs.readFileSync(f.path).toString("base64"),
          type: f.mimetype   // <-- REQUIRED for Brevo
        }));
      }

      console.log("📩 Form:", form);
      console.log("📎 Files:", files);


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
            <td style="padding:8px; font-weight:bold;">Project Type</td>
            <td style="padding:8px;">${(form.type || "").toUpperCase()}</td>
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

    const emailPayload = {
      sender: { name: "Zayken Projects", email: "info@zaykenprojects.com" },
      to: [{ email: "info@zaykenprojects.com" }],
      subject: `📩 New Quote Request – ${form.name}`,
      htmlContent,
    };
    
    // Only attach if actual files exist
    if (brevoAttachments && brevoAttachments.length > 0) {
      emailPayload.attachment = brevoAttachments;
    } else {
      // IMPORTANT FIX → prevents Brevo 400
      delete emailPayload.attachment;
    }
    
    await brevoClient.sendTransacEmail(emailPayload);

        // Cleanup uploaded temp files
        files.forEach((f) => fs.unlinkSync(f.path));

      res.json({ success: true, message: "Email sent successfully!" });

    } catch (err) {
      console.error("❌ Email Failed:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

// ****************************************************************************************
// 🚀 2) CONTACT US FORM — SIMPLE MESSAGE (NO ATTACHMENTS)
// ****************************************************************************************
app.post("/contact-message", async (req, res) => {
  try {
    const { name, email, phone, projectType, message } = req.body;

    if (!name || !email || !phone || !projectType) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    const htmlContent = `
      <h2 style="color:#004aad;font-family:Arial">📨 New Contact Message</h2>

      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Project Type:</strong> ${projectType}</p>

      <h3 style="margin-top:20px">Message</h3>
      <div style="background:#f5f5f5;padding:12px;border-radius:6px">
        ${message || "(No message provided)"}
      </div>
    `;

    const emailPayload = {
      sender: { name: "Zayken Projects", email: "info@zaykenprojects.com" },
      to: [{ email: "info@zaykenprojects.com" }],
      subject: `📨 Contact Message from ${name}`,
      htmlContent,
    };

    await brevoClient.sendTransacEmail(emailPayload);

    return res.json({ success: true, message: "Message sent successfully!" });

  } catch (err) {
    console.error("❌ CONTACT MESSAGE FAILED:", JSON.stringify(err, null, 2));
    return res.status(500).json({
      success: false,
      error: err.message,
      brevoDetails: err.response?.body || "No Brevo details",
    });
  }
});

  // ----------------------------------------
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () =>
    console.log(`🚀 Backend running at http://localhost:${PORT}`)
  );