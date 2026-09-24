const nodemailer = require("nodemailer");

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const AUTO_EMPLOYEE_TEMP_PASSWORD =
  process.env.AUTO_EMPLOYEE_TEMP_PASSWORD || "123456";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error("❌ SMTP Error:", error);
  } else {
    console.log("✅ SMTP Ready");
  }
});

function normalize(value = "") {
  return String(value || "").trim();
}

async function sendActivityEmail({
  to,
  employeeName,
  hrName,
  activityTitle,
  activityType,
  activityDescription,
  message,
  loginEmail,
  temporaryPassword,
}) {
  const target = normalize(to);
  if (!target) {
    throw new Error("L'adresse email destinataire est obligatoire");
  }

  const finalLoginEmail = normalize(loginEmail || to);
  const finalPassword = normalize(temporaryPassword || AUTO_EMPLOYEE_TEMP_PASSWORD);

  const mailOptions = {
    from: `"SkillRanker" <${EMAIL_USER}>`,
    to: target,
    subject: `📢 Nouvelle activité : ${activityTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: auto; padding: 20px; border:1px solid #eee; border-radius:10px">
        <h2 style="color:#1d4ed8;">Bonjour ${employeeName || "Employé"}, 👋</h2>

        <p>
          Une nouvelle activité vous a été assignée par
          <strong>${hrName || "RH"}</strong>.
        </p>

        <div style="background:#f8f9fa; padding:15px; border-radius:8px; margin:20px 0">
          <p><strong>📌 Titre :</strong> ${activityTitle || ""}</p>
          <p><strong>📂 Type :</strong> ${activityType || "Formation"}</p>
          <p><strong>📝 Description :</strong> ${activityDescription || "Aucune description"}</p>
        </div>

        ${
          message
            ? `
          <div style="margin:15px 0">
            <p><strong>💬 Message RH :</strong></p>
            <p style="background:#fff3cd; padding:10px; border-radius:6px">${message}</p>
          </div>
        `
            : ""
        }

        <div style="background:#eef6ff; padding:15px; border-radius:8px; margin:20px 0">
          <p><strong>🔐 Informations de connexion :</strong></p>
          <p><strong>Email :</strong> ${finalLoginEmail}</p>
          <p><strong>Mot de passe temporaire :</strong> ${finalPassword}</p>
        </div>

        <p style="color:#666;">
          Merci de consulter votre tableau de bord pour accepter ou refuser cette activité.
        </p>

        <hr style="margin:20px 0">

        <p style="font-size:12px;color:#999;">
          © ${new Date().getFullYear()} SkillRanker - Tous droits réservés
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email envoyé avec succès");
    console.log("📨 ID:", info.messageId);
    console.log("📩 Destinataire:", target);

    return info;
  } catch (error) {
    console.error("❌ Erreur Nodemailer :", error.message);
    throw new Error("Échec envoi email: " + error.message);
  }
}

async function sendResponseEmail({
  to,
  hrName,
  employeeName,
  activityTitle,
  accepted,
  justification,
}) {
  const target = normalize(to);
  if (!target) {
    throw new Error("L'adresse email destinataire est obligatoire");
  }

  const statusLabel = accepted ? "ACCEPTÉE" : "REFUSÉE";
  const statusColor = accepted ? "#1D9E75" : "#dc3545";

  const mailOptions = {
    from: `"SkillRanker" <${EMAIL_USER}>`,
    to: target,
    subject: `Réponse activité : ${activityTitle} — ${accepted ? "Acceptée" : "Refusée"}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border:1px solid #eee; border-radius:10px">
        <h2 style="color:#333;">Bonjour ${hrName || "RH"},</h2>

        <p>
          <strong>${employeeName || "Un employé"}</strong> a répondu à l'activité :
        </p>

        <div style="background:#f8f9fa; padding:15px; border-radius:8px; margin:20px 0">
          <p><strong>Activité :</strong> ${activityTitle}</p>
          <p><strong>Statut :</strong> <span style="color:${statusColor}; font-weight:bold;">${statusLabel}</span></p>
        </div>

        ${
          !accepted && justification
            ? `
          <div style="margin:15px 0">
            <p><strong>Justification du refus :</strong></p>
            <p style="background:#fff3cd; padding:10px; border-radius:6px; color:#856404;">${justification}</p>
          </div>
        `
            : ""
        }

        <p style="color:#666;">Consultez votre tableau de bord pour plus de détails.</p>

        <hr style="margin:20px 0">

        <p style="font-size:12px;color:#999;">
          © ${new Date().getFullYear()} SkillRanker - Tous droits réservés
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email réponse envoyé → ID:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Erreur envoi email réponse:", error.message);
    throw new Error("Échec envoi email réponse: " + error.message);
  }
}

module.exports = {
  sendActivityEmail,
  sendResponseEmail,
};