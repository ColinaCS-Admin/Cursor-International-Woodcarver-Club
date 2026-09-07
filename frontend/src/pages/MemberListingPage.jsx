import { useEffect, useState } from "react";
import { api } from "../api.js";

const COLUMNS = [
  ["member_id", "Member ID"],
  ["member_alias", "Alias"],
  ["member_first_name", "First name"],
  ["member_middle_name", "Middle name"],
  ["member_last_name", "Last name"],
  ["email_address", "Email"],
  ["telephone_number_1", "Telephone 1"],
  ["telephone_number_2", "Telephone 2"],
  ["address_line_1", "Address 1"],
  ["address_line_2", "Address 2"],
  ["city", "City"],
  ["zip_code", "Zip"],
  ["state_province_code", "State / province"],
  ["country_code", "Country"],
  ["craft_skill_desc", "Craft skill"],
  ["member_tier_desc", "Tier"],
  ["active_ind", "Active"],
];

export default function MemberListingPage() {
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .members()
      .then((data) => setMembers(data.members))
      .catch((err) => setError(err.message));
  }, []);

  async function changeStatus(memberId, active_ind) {
    setError("");
    try {
      const data = await api.updateStatus(memberId, active_ind);
      setMembers((current) =>
        current.map((member) => (member.member_id === memberId ? data.member : member))
      );
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="page">
      <section className="hero">
        <p className="kicker">Administration</p>
        <h1>Member listing</h1>
        <p>All club profiles. Use the status dropdown to set Active, Inactive, or Suspended.</p>
      </section>
      {error ? (
        <div className="error" style={{ marginTop: 16 }}>
          {error}
        </div>
      ) : null}
      <div className="table-wrap" style={{ marginTop: 20 }}>
        <table>
          <thead>
            <tr>
              {COLUMNS.map(([key, label]) => (
                <th key={key}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.member_id}>
                {COLUMNS.map(([key]) => (
                  <td key={key}>
                    {key === "active_ind" ? (
                      <select
                        className="status-select"
                        value={member.active_ind}
                        onChange={(e) => changeStatus(member.member_id, e.target.value)}
                        aria-label={`Active status for ${member.member_alias}`}
                      >
                        <option value="Y">Y · Active</option>
                        <option value="N">N · Inactive</option>
                        <option value="S">S · Suspended</option>
                      </select>
                    ) : key === "telephone_number_1" ? (
                      `${member.telephone_number_1} (${member.telephone_number_1_type})`
                    ) : key === "telephone_number_2" ? (
                      member.telephone_number_2
                        ? `${member.telephone_number_2} (${member.telephone_number_2_type || "—"})`
                        : "—"
                    ) : (
                      member[key] || "—"
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
