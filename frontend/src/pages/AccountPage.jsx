import { useAuth } from "../AuthContext.jsx";

const FIELDS = [
  ["member_id", "Member ID"],
  ["member_alias", "Member alias"],
  ["member_first_name", "First name"],
  ["member_middle_name", "Middle name"],
  ["member_last_name", "Last name"],
  ["email_address", "Email address"],
  ["telephone_number_1", "Telephone number 1"],
  ["telephone_number_2", "Telephone number 2"],
  ["address_line_1", "Address line 1"],
  ["address_line_2", "Address line 2"],
  ["city", "City"],
  ["zip_code", "Zip code"],
  ["state_province_code", "State / province code"],
  ["country_code", "Country code"],
  ["craft_skill_desc", "Craft skill"],
  ["member_tier_desc", "Membership tier"],
  ["active_ind", "Active indicator"],
];

function display(member, key) {
  if (key === "telephone_number_1") {
    return `${member.telephone_number_1} (${member.telephone_number_1_type})`;
  }
  if (key === "telephone_number_2") {
    if (!member.telephone_number_2) return "—";
    return `${member.telephone_number_2} (${member.telephone_number_2_type || "—"})`;
  }
  if (key === "state_province_code" && member.state_province_desc) {
    return `${member.state_province_code} · ${member.state_province_desc}`;
  }
  if (key === "country_code" && member.country_desc) {
    return `${member.country_code} · ${member.country_desc}`;
  }
  if (key === "active_ind") {
    return `${member.active_ind} · ${member.active_label}`;
  }
  return member[key] || "—";
}

export default function AccountPage() {
  const { member } = useAuth();

  return (
    <main className="page">
      <section className="hero">
        <p className="kicker">Member account</p>
        <h1>
          {member.member_first_name} {member.member_last_name}
        </h1>
        <p>Membership record for alias {member.member_alias}.</p>
      </section>
      <section className="card" style={{ padding: 24, marginTop: 20 }}>
        <dl className="account-grid">
          {FIELDS.map(([key, label]) => (
            <div className="account-item" key={key}>
              <dt>{label}</dt>
              <dd>{display(member, key)}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
