import { Router } from "express";
import { query } from "../db.js";

const router = Router();

router.get("/countries", async (_req, res) => {
  try {
    const result = await query(
      "SELECT country_code, country_desc FROM country ORDER BY country_desc"
    );
    res.json({ countries: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to load countries." });
  }
});

router.get("/states", async (req, res) => {
  try {
    const countryCode = String(req.query.country_code || "").trim().toUpperCase();
    if (!countryCode) {
      return res.status(400).json({ error: "country_code query parameter is required." });
    }
    const result = await query(
      `SELECT state_province_code, state_province_desc, country_code
       FROM state_province
       WHERE country_code = $1
       ORDER BY state_province_desc`,
      [countryCode]
    );
    res.json({ states: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to load states and provinces." });
  }
});

router.get("/craft-skills", async (_req, res) => {
  try {
    const result = await query(
      "SELECT craft_skill_code, craft_skill_desc FROM craft_skill ORDER BY craft_skill_desc"
    );
    res.json({ craft_skills: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to load craft skills." });
  }
});

router.get("/tiers", async (_req, res) => {
  try {
    const result = await query(
      `SELECT mt.member_tier_code, mt.member_tier_desc,
              mt.member_discount_profile_id, dp.member_discount_desc
       FROM membership_tier mt
       LEFT JOIN member_discount_profile dp
         ON dp.member_discount_id = mt.member_discount_profile_id
       ORDER BY array_position(ARRAY['Basic','Advanced','Lifetime'], mt.member_tier_code)`
    );
    res.json({ tiers: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to load membership tiers." });
  }
});

export default router;
