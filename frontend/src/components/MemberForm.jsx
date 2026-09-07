import { useEffect, useState } from "react";
import { api } from "../api.js";

const PHONE_TYPES = ["Mobile", "Landline"];

export default function MemberForm({ form, setForm, lookups, includePassword }) {
  const [states, setStates] = useState([]);

  useEffect(() => {
    if (!form.country_code) {
      setStates([]);
      return;
    }
    api.states(form.country_code).then((data) => setStates(data.states));
  }, [form.country_code]);

  function update(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "country_code" ? { state_province_code: "" } : {}),
    }));
  }

  return (
    <div className="form-grid">
      <label className="field">
        <span className="required">Member alias</span>
        <input value={form.member_alias} onChange={(e) => update("member_alias", e.target.value)} required />
      </label>
      {includePassword ? (
        <label className="field">
          <span className="required">Password</span>
          <input
            type="password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            minLength={8}
            required
          />
        </label>
      ) : (
        <div />
      )}
      <label className="field">
        <span className="required">First name</span>
        <input
          value={form.member_first_name}
          onChange={(e) => update("member_first_name", e.target.value)}
          required
        />
      </label>
      <label className="field">
        <span>
          Middle name <span className="optional">optional</span>
        </span>
        <input
          value={form.member_middle_name}
          onChange={(e) => update("member_middle_name", e.target.value)}
        />
      </label>
      <label className="field">
        <span className="required">Last name</span>
        <input
          value={form.member_last_name}
          onChange={(e) => update("member_last_name", e.target.value)}
          required
        />
      </label>
      <label className="field">
        <span className="required">Gender</span>
        <select value={form.gender} onChange={(e) => update("gender", e.target.value)} required>
          <option value="">Select gender</option>
          {(lookups.genders || []).map((gender) => (
            <option key={gender} value={gender}>
              {gender}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="required">Preferred language</span>
        <select
          value={form.preferred_language_code}
          onChange={(e) => update("preferred_language_code", e.target.value)}
          required
        >
          <option value="">Select language</option>
          {(lookups.languages || []).map((language) => (
            <option key={language.language_code} value={language.language_code}>
              {language.language_desc} ({language.language_code})
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="required">Email address</span>
        <input
          type="email"
          value={form.email_address}
          onChange={(e) => update("email_address", e.target.value)}
          required
        />
      </label>
      <label className="field">
        <span className="required">Telephone number 1</span>
        <input
          value={form.telephone_number_1}
          onChange={(e) => update("telephone_number_1", e.target.value)}
          required
        />
      </label>
      <label className="field">
        <span className="required">Telephone 1 type</span>
        <select
          value={form.telephone_number_1_type}
          onChange={(e) => update("telephone_number_1_type", e.target.value)}
        >
          {PHONE_TYPES.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>
          Telephone number 2 <span className="optional">optional</span>
        </span>
        <input
          value={form.telephone_number_2}
          onChange={(e) => update("telephone_number_2", e.target.value)}
        />
      </label>
      <label className="field">
        <span>Telephone 2 type</span>
        <select
          value={form.telephone_number_2_type}
          onChange={(e) => update("telephone_number_2_type", e.target.value)}
        >
          {PHONE_TYPES.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
      </label>
      <label className="field span-2">
        <span className="required">Address line 1</span>
        <input
          value={form.address_line_1}
          onChange={(e) => update("address_line_1", e.target.value)}
          required
        />
      </label>
      <label className="field span-2">
        <span>
          Address line 2 <span className="optional">optional</span>
        </span>
        <input value={form.address_line_2} onChange={(e) => update("address_line_2", e.target.value)} />
      </label>
      <label className="field">
        <span>City</span>
        <input value={form.city} onChange={(e) => update("city", e.target.value)} />
      </label>
      <label className="field">
        <span>Zip / postal code</span>
        <input value={form.zip_code} onChange={(e) => update("zip_code", e.target.value)} />
      </label>
      <label className="field">
        <span className="required">Country</span>
        <select
          value={form.country_code}
          onChange={(e) => update("country_code", e.target.value)}
          required
        >
          <option value="">Select country</option>
          {lookups.countries.map((country) => (
            <option key={country.country_code} value={country.country_code}>
              {country.country_desc} ({country.country_code})
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className={states.length ? "required" : ""}>State / province</span>
        <select
          value={form.state_province_code}
          onChange={(e) => update("state_province_code", e.target.value)}
          required={states.length > 0}
          disabled={!states.length}
        >
          <option value="">{states.length ? "Select state / province" : "No ISO 3166-2 divisions"}</option>
          {states.map((state) => (
            <option key={state.state_province_code} value={state.state_province_code}>
              {state.state_province_desc} ({state.state_province_code})
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="required">Craft skill</span>
        <select
          value={form.craft_skill_code}
          onChange={(e) => update("craft_skill_code", e.target.value)}
          required
        >
          <option value="">Select a skill</option>
          {lookups.craft_skills.map((skill) => (
            <option key={skill.craft_skill_code} value={skill.craft_skill_code}>
              {skill.craft_skill_desc}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="required">Membership tier</span>
        <select
          value={form.member_tier_code}
          onChange={(e) => update("member_tier_code", e.target.value)}
          required
        >
          {lookups.tiers.map((tier) => (
            <option key={tier.member_tier_code} value={tier.member_tier_code}>
              {tier.member_tier_code} — {tier.member_tier_desc}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
