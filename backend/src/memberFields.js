import { query } from "./db.js";

export const PHONE_TYPES = ["Mobile", "Landline"];
export const ACTIVE_VALUES = ["Y", "N", "S"];
export const ACTIVE_LABELS = { Y: "Active", N: "Inactive", S: "Suspended" };
export const TIER_CODES = ["Basic", "Advanced", "Lifetime"];

export function mapMember(row) {
  return {
    member_id: Number(row.member_id),
    member_alias: row.member_alias,
    member_first_name: row.member_first_name,
    member_middle_name: row.member_middle_name,
    member_last_name: row.member_last_name,
    email_address: row.email_address,
    telephone_number_1: row.telephone_number_1,
    telephone_number_1_type: row.telephone_number_1_type,
    telephone_number_2: row.telephone_number_2,
    telephone_number_2_type: row.telephone_number_2_type,
    address_line_1: row.address_line_1,
    address_line_2: row.address_line_2,
    city: row.city,
    zip_code: row.zip_code,
    state_province_code: row.state_province_code,
    country_code: row.country_code,
    country_desc: row.country_desc,
    state_province_desc: row.state_province_desc,
    craft_skill_code: row.craft_skill_code,
    craft_skill_desc: row.craft_skill_desc,
    member_tier_code: row.member_tier_code,
    member_tier_desc: row.member_tier_desc,
    active_ind: row.active_ind,
    active_label: ACTIVE_LABELS[row.active_ind] || row.active_ind,
    role: row.role,
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function validateMemberPayload(payload, { requirePassword = false } = {}) {
  const errors = [];
  const required = [
    ["member_alias", "Member alias"],
    ["member_first_name", "First name"],
    ["member_last_name", "Last name"],
    ["email_address", "Email address"],
    ["telephone_number_1", "Telephone number 1"],
    ["telephone_number_1_type", "Telephone number 1 type"],
    ["address_line_1", "Address line 1"],
    ["country_code", "Country"],
    ["craft_skill_code", "Craft skill"],
    ["member_tier_code", "Membership tier"],
  ];

  for (const [key, label] of required) {
    if (!String(payload[key] || "").trim()) {
      errors.push(`${label} is required.`);
    }
  }

  if (payload.email_address && !EMAIL_RE.test(String(payload.email_address).trim())) {
    errors.push("Email address is not valid.");
  }

  if (payload.telephone_number_1_type && !PHONE_TYPES.includes(payload.telephone_number_1_type)) {
    errors.push("Telephone number 1 type must be Mobile or Landline.");
  }

  if (payload.telephone_number_2 && !payload.telephone_number_2_type) {
    errors.push("Telephone number 2 type is required when a second number is provided.");
  }

  if (payload.telephone_number_2_type && !PHONE_TYPES.includes(payload.telephone_number_2_type)) {
    errors.push("Telephone number 2 type must be Mobile or Landline.");
  }

  if (requirePassword) {
    if (!payload.password) {
      errors.push("Password is required.");
    } else if (String(payload.password).length < 8) {
      errors.push("Password must be at least 8 characters.");
    }
  }

  if (payload.country_code) {
    const country = await query("SELECT 1 FROM country WHERE country_code = $1", [
      payload.country_code,
    ]);
    if (!country.rows.length) {
      errors.push("Country code must be a valid ISO 3166-1 value.");
    } else {
      const states = await query(
        "SELECT state_province_code FROM state_province WHERE country_code = $1",
        [payload.country_code]
      );
      if (states.rows.length) {
        if (!payload.state_province_code) {
          errors.push("State / province is required for the selected country.");
        } else if (
          !states.rows.some((row) => row.state_province_code === payload.state_province_code)
        ) {
          errors.push("State / province must be a valid ISO 3166-2 value for the selected country.");
        }
      }
    }
  }

  if (payload.craft_skill_code) {
    const skill = await query("SELECT 1 FROM craft_skill WHERE craft_skill_code = $1", [
      payload.craft_skill_code,
    ]);
    if (!skill.rows.length) errors.push("Craft skill is not valid.");
  }

  if (payload.member_tier_code && !TIER_CODES.includes(payload.member_tier_code)) {
    errors.push('Membership tier must be "Basic", "Advanced", or "Lifetime".');
  }

  return errors;
}
