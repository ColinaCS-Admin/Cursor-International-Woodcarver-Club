import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Router } from "express";
import { query } from "../db.js";
import { signToken, requireAuth } from "../middleware/auth.js";
import { ACTIVE_LABELS, mapMember, validateMemberPayload } from "../memberFields.js";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function findByLogin(identifier) {
  const result = await query(
    `SELECT * FROM member
     WHERE lower(email_address) = lower($1)
        OR lower(member_alias) = lower($1)
     LIMIT 1`,
    [identifier.trim()]
  );
  return result.rows[0] || null;
}

router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body || {};
    if (!identifier || !password) {
      return res.status(400).json({ error: "Email/alias and password are required." });
    }

    const member = await findByLogin(identifier);
    if (!member) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const ok = await bcrypt.compare(password, member.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    if (member.active_ind !== "Y") {
      const status = ACTIVE_LABELS[member.active_ind] || "Inactive";
      return res.status(403).json({
        error: `This membership is ${status.toLowerCase()} and cannot sign in.`,
      });
    }

    const token = signToken(member);
    res.json({
      token,
      member: await hydrateMember(member.member_id),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to sign in." });
  }
});

router.post("/register", async (req, res) => {
  try {
    const payload = req.body || {};
    const errors = await validateMemberPayload(payload, { requirePassword: true });
    if (errors.length) {
      return res.status(400).json({ error: errors[0], errors });
    }

    const aliasExists = await query(
      "SELECT 1 FROM member WHERE lower(member_alias) = lower($1)",
      [payload.member_alias]
    );
    const emailExists = await query(
      "SELECT 1 FROM member WHERE lower(email_address) = lower($1)",
      [payload.email_address]
    );
    if (aliasExists.rows.length) {
      return res.status(409).json({ error: "That member alias is already taken." });
    }
    if (emailExists.rows.length) {
      return res.status(409).json({ error: "That email address is already registered." });
    }

    const password_hash = await bcrypt.hash(payload.password, 12);
    const inserted = await query(
      `INSERT INTO member (
         member_alias, member_first_name, member_middle_name, member_last_name,
         gender, preferred_language_code, email_address, telephone_number_1, telephone_number_1_type,
         telephone_number_2, telephone_number_2_type, address_line_1, address_line_2,
         city, zip_code, state_province_code, country_code, craft_skill_code,
         member_tier_code, active_ind, password_hash, role
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'Y',$19,'MEMBER'
       ) RETURNING member_id`,
      [
        payload.member_alias.trim(),
        payload.member_first_name.trim(),
        emptyToNull(payload.member_middle_name),
        payload.member_last_name.trim(),
        payload.gender,
        String(payload.preferred_language_code).trim().toLowerCase(),
        payload.email_address.trim(),
        payload.telephone_number_1.trim(),
        payload.telephone_number_1_type,
        emptyToNull(payload.telephone_number_2),
        payload.telephone_number_2 ? payload.telephone_number_2_type : null,
        payload.address_line_1.trim(),
        emptyToNull(payload.address_line_2),
        emptyToNull(payload.city),
        emptyToNull(payload.zip_code),
        emptyToNull(payload.state_province_code),
        payload.country_code,
        payload.craft_skill_code,
        payload.member_tier_code,
        password_hash,
      ]
    );

    const member = await hydrateMember(inserted.rows[0].member_id);
    const token = signToken(member);
    res.status(201).json({ token, member });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to complete registration." });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { identifier } = req.body || {};
    if (!identifier) {
      return res.status(400).json({ error: "Email or member alias is required." });
    }

    const member = await findByLogin(identifier);
    const generic = {
      message:
        "If an account matches that email or alias, password reset instructions have been issued.",
    };

    if (!member) {
      return res.json(generic);
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashed = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await query(
      `UPDATE member
       SET password_reset_token = $1, password_reset_expires = $2
       WHERE member_id = $3`,
      [hashed, expires, member.member_id]
    );

    const resetUrl = `${process.env.APP_BASE_URL || "http://localhost:5173"}/reset-password?token=${rawToken}`;

    if (process.env.NODE_ENV !== "production") {
      return res.json({
        ...generic,
        resetUrl,
        demoNote: "Development mode: use this link to reset the password.",
      });
    }

    console.log(`Password reset for ${member.email_address}: ${resetUrl}`);
    res.json(generic);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to process the request." });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) {
      return res.status(400).json({ error: "Reset token and new password are required." });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const result = await query(
      `SELECT member_id FROM member
       WHERE password_reset_token = $1
         AND password_reset_expires > NOW()`,
      [hashed]
    );

    if (!result.rows.length) {
      return res.status(400).json({ error: "This reset link is invalid or has expired." });
    }

    const password_hash = await bcrypt.hash(password, 12);
    await query(
      `UPDATE member
       SET password_hash = $1,
           password_reset_token = NULL,
           password_reset_expires = NULL
       WHERE member_id = $2`,
      [password_hash, result.rows[0].member_id]
    );

    res.json({ message: "Password updated. You can now sign in." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to reset password." });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const member = await hydrateMember(req.member.member_id);
    res.json({ member });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to load the current member." });
  }
});

export async function hydrateMember(memberId) {
  const result = await query(
    `SELECT
        m.member_id, m.member_alias, m.member_first_name, m.member_middle_name,
        m.member_last_name, m.gender, m.preferred_language_code, m.email_address,
        m.telephone_number_1, m.telephone_number_1_type,
        m.telephone_number_2, m.telephone_number_2_type, m.address_line_1, m.address_line_2,
        m.city, m.zip_code, m.state_province_code, m.country_code, m.craft_skill_code,
        m.member_tier_code, m.active_ind, m.role,
        cs.craft_skill_desc, mt.member_tier_desc,
        c.country_desc, sp.state_province_desc, lang.language_desc AS preferred_language_desc
     FROM member m
     JOIN craft_skill cs ON cs.craft_skill_code = m.craft_skill_code
     JOIN membership_tier mt ON mt.member_tier_code = m.member_tier_code
     JOIN country c ON c.country_code = m.country_code
     JOIN language lang ON lang.language_code = m.preferred_language_code
     LEFT JOIN state_province sp ON sp.state_province_code = m.state_province_code
     WHERE m.member_id = $1`,
    [memberId]
  );
  return result.rows[0] ? mapMember(result.rows[0]) : null;
}

function emptyToNull(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed;
}

export default router;
export { EMAIL_RE };
