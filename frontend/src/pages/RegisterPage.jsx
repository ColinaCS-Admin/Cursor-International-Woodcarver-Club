import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import Logo from "../components/Logo.jsx";
import MemberForm from "../components/MemberForm.jsx";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [lookups, setLookups] = useState({ countries: [], craft_skills: [], tiers: [] });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    member_alias: "",
    member_first_name: "",
    member_middle_name: "",
    member_last_name: "",
    email_address: "",
    password: "",
    telephone_number_1: "",
    telephone_number_1_type: "Mobile",
    telephone_number_2: "",
    telephone_number_2_type: "Mobile",
    address_line_1: "",
    address_line_2: "",
    city: "",
    zip_code: "",
    country_code: "",
    state_province_code: "",
    craft_skill_code: "",
    member_tier_code: "Basic",
  });

  useEffect(() => {
    Promise.all([api.countries(), api.craftSkills(), api.tiers()])
      .then(([countries, skills, tiers]) => {
        setLookups({
          countries: countries.countries,
          craft_skills: skills.craft_skills,
          tiers: tiers.tiers,
        });
      })
      .catch((err) => setError(err.message));
  }, []);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(form);
      navigate("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" style={{ width: "min(760px, 100%)" }} onSubmit={onSubmit}>
        <Logo />
        <p className="kicker">New membership</p>
        <h1>Join the club</h1>
        {error ? <div className="error">{error}</div> : null}
        <MemberForm form={form} setForm={setForm} lookups={lookups} includePassword />
        <button className="btn wide" type="submit" disabled={submitting}>
          {submitting ? "Creating account…" : "Create membership"}
        </button>
        <div className="links">
          <Link to="/login">Already a member? Sign in</Link>
        </div>
      </form>
    </div>
  );
}
