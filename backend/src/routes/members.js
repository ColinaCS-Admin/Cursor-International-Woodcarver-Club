import { Router } from "express";
import { query } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { ACTIVE_VALUES, mapMember } from "../memberFields.js";
import { hydrateMember } from "./auth.js";

const router = Router();

const MEMBER_SELECT = `
  SELECT
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
`;

router.get("/me", requireAuth, async (req, res) => {
  try {
    const member = await hydrateMember(req.member.member_id);
    res.json({ member });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to load member account." });
  }
});

router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await query(`${MEMBER_SELECT} ORDER BY m.member_last_name, m.member_first_name`);
    res.json({ members: result.rows.map(mapMember) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to load the member listing." });
  }
});

router.patch("/:id/status", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { active_ind } = req.body || {};

    if (!ACTIVE_VALUES.includes(active_ind)) {
      return res.status(400).json({
        error: "Active status must be Y (Active), N (Inactive), or S (Suspended).",
      });
    }

    if (Number(id) === Number(req.member.member_id) && active_ind !== "Y") {
      return res.status(400).json({ error: "You cannot deactivate your own administrator account." });
    }

    const updated = await query(
      `UPDATE member SET active_ind = $1 WHERE member_id = $2 RETURNING member_id`,
      [active_ind, id]
    );

    if (!updated.rows.length) {
      return res.status(404).json({ error: "Member not found." });
    }

    const member = await hydrateMember(id);
    res.json({ member });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to update member status." });
  }
});

export default router;
