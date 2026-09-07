import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

const SKILL_NOTES = {
  RELIEF: "Shallow and high relief work on panels, doors, and furniture.",
  CHIP: "Geometric facets cut with a stab knife — compact, rhythmic, and precise.",
  WHITTLE: "Pocket-knife forms from a single block, often carved in the hand.",
  CARICATURE: "Exaggerated figures with humor, gesture, and character.",
  WILDLIFE: "Birds, fish, and mammals finished with fine texture and paint.",
  FIGURE: "Human and folk figures, from stylized saints to portrait busts.",
  SPOON: "Functional treen: spoons, scoops, and eating ware.",
  BOWL: "Turned or hewn vessels, from dough bowls to ceremonial cups.",
  LETTER: "Incised and raised lettering for signs, memorials, and books.",
  CHAINSAW: "Large outdoor sculpture roughed with a saw, then refined by hand.",
  INTARSIA: "Shaped wood segments fitted into pictorial surfaces.",
  PYROGRAPHY: "Burned line and shade used with or without carved relief.",
  ARCHITECT: "Capitals, moldings, and architectural ornament.",
  STYLIZED: "Abstracted natural forms with strong silhouette.",
  DECORATIVE: "Ornamental motifs for frames, boxes, and domestic objects.",
};

export default function HomePage() {
  const { member } = useAuth();
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    api.craftSkills().then((data) => setSkills(data.craft_skills));
  }, []);

  return (
    <main className="page">
      <section className="hero">
        <p className="kicker">Member home</p>
        <h1>Crafts and skills of the club</h1>
        <p>
          Welcome, {member.member_first_name}. Your registered craft is{" "}
          <strong>{member.craft_skill_desc}</strong>. Membership tier: {member.member_tier_code}.
        </p>
      </section>
      <section className="grid skills-grid">
        {skills.map((skill) => {
          const mine = skill.craft_skill_code === member.craft_skill_code;
          return (
            <article key={skill.craft_skill_code} className={`skill-card ${mine ? "mine" : ""}`}>
              <div>
                <div className="chip">{skill.craft_skill_desc.slice(0, 1)}</div>
                {mine ? <span className="badge">Your skill</span> : null}
                <h3>{skill.craft_skill_desc}</h3>
                <p className="muted">{SKILL_NOTES[skill.craft_skill_code] || skill.craft_skill_code}</p>
              </div>
              <small>{skill.craft_skill_code}</small>
            </article>
          );
        })}
      </section>
    </main>
  );
}
