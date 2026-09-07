import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { iso31661, iso31662 } from "iso-3166";
import { iso6392 } from "iso-639-2";
import { pool, query } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CRAFT_SKILLS = [
  ["RELIEF", "Relief Carving"],
  ["CHIP", "Chip Carving"],
  ["WHITTLE", "Whittling"],
  ["CARICATURE", "Caricature Carving"],
  ["WILDLIFE", "Wildlife Carving"],
  ["FIGURE", "Figure Carving"],
  ["SPOON", "Spoon Carving"],
  ["BOWL", "Bowl Carving"],
  ["LETTER", "Letter Carving"],
  ["CHAINSAW", "Chainsaw Carving"],
  ["INTARSIA", "Intarsia"],
  ["PYROGRAPHY", "Pyrography"],
  ["ARCHITECT", "Architectural Carving"],
  ["STYLIZED", "Stylized Carving"],
  ["DECORATIVE", "Decorative Carving"],
];

async function insertChunks(table, columns, rows, conflictSql) {
  const chunkSize = 400;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const values = [];
    const params = [];
    let n = 1;
    for (const row of chunk) {
      values.push(`(${row.map(() => `$${n++}`).join(",")})`);
      params.push(...row);
    }
    await query(
      `INSERT INTO ${table} (${columns.join(", ")}) VALUES ${values.join(", ")} ${conflictSql}`,
      params
    );
  }
}

export async function applySchema() {
  const sql = await fs.readFile(path.join(__dirname, "schema.sql"), "utf8");
  await pool.query(sql);
  await seedLanguages();
  await pool.query(`
    ALTER TABLE member ADD COLUMN IF NOT EXISTS gender VARCHAR(32);
    ALTER TABLE member ADD COLUMN IF NOT EXISTS preferred_language_code VARCHAR(3);
    CREATE INDEX IF NOT EXISTS idx_member_language ON member (preferred_language_code);
  `);
  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'member' AND column_name = 'preferred_language'
      ) THEN
        UPDATE member m
        SET preferred_language_code = l.language_code
        FROM language l
        WHERE m.preferred_language_code IS NULL
          AND lower(trim(m.preferred_language)) = lower(l.language_desc);
      END IF;
    END $$;
  `);
  await pool.query(`
    UPDATE member SET gender = 'Do Not Wish To Disclose' WHERE gender IS NULL;
    UPDATE member SET preferred_language_code = 'eng' WHERE preferred_language_code IS NULL;
    ALTER TABLE member ALTER COLUMN gender SET NOT NULL;
    ALTER TABLE member ALTER COLUMN preferred_language_code SET NOT NULL;
    ALTER TABLE member DROP COLUMN IF EXISTS preferred_language;
    UPDATE member SET gender = 'Female', preferred_language_code = 'eng' WHERE member_alias IN ('clubadmin', 'chipcarver', 'chainsawmaya');
    UPDATE member SET gender = 'Male', preferred_language_code = 'eng' WHERE member_alias = 'oakcarver';
    UPDATE member SET gender = 'Male', preferred_language_code = 'swe' WHERE member_alias = 'spoonwright';
  `);
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'member_gender_check'
      ) THEN
        ALTER TABLE member ADD CONSTRAINT member_gender_check
          CHECK (gender IN ('Male', 'Female', 'Do Not Wish To Disclose'));
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'member_preferred_language_code_fkey'
      ) THEN
        ALTER TABLE member ADD CONSTRAINT member_preferred_language_code_fkey
          FOREIGN KEY (preferred_language_code) REFERENCES language(language_code);
      END IF;
    END $$;
  `);
}

export async function seedLanguages() {
  const rows = [];
  const seen = new Set();
  for (const lang of iso6392) {
    for (const code of [lang.iso6392B, lang.iso6392T]) {
      if (!code || !/^[a-z]{3}$/i.test(code) || seen.has(code)) continue;
      seen.add(code);
      rows.push([code.toLowerCase(), lang.name]);
    }
  }
  await insertChunks(
    "language",
    ["language_code", "language_desc"],
    rows,
    `ON CONFLICT (language_code) DO UPDATE SET language_desc = EXCLUDED.language_desc`
  );
}

export async function seedIfNeeded() {
  const existing = await query("SELECT COUNT(*)::int AS count FROM country");
  if (existing.rows[0].count > 0) {
    return { seeded: false };
  }
  await seedAll();
  return { seeded: true };
}

export async function seedAll() {
  await query("BEGIN");
  try {
    const countryRows = iso31661.map((country) => [country.alpha2, country.name]);
    await insertChunks(
      "country",
      ["country_code", "country_desc"],
      countryRows,
      `ON CONFLICT (country_code) DO UPDATE SET country_desc = EXCLUDED.country_desc`
    );

    const countrySet = new Set(iso31661.map((country) => country.alpha2));
    const stateRows = iso31662
      .filter((subdivision) => countrySet.has(subdivision.code.slice(0, 2)))
      .map((subdivision) => [
        subdivision.code,
        subdivision.name,
        subdivision.code.slice(0, 2),
      ]);
    await insertChunks(
      "state_province",
      ["state_province_code", "state_province_desc", "country_code"],
      stateRows,
      `ON CONFLICT (state_province_code) DO UPDATE SET
         state_province_desc = EXCLUDED.state_province_desc,
         country_code = EXCLUDED.country_code`
    );

    await seedLanguages();

    const discounts = [
      ["Standard profile — no automatic discount"],
      ["Workshop profile — 10% member pricing on club tools and blanks"],
      ["Lifetime profile — 25% member pricing and complimentary annual symposium"],
    ];
    const discountIds = [];
    for (const [desc] of discounts) {
      const inserted = await query(
        `INSERT INTO member_discount_profile (member_discount_desc)
         VALUES ($1) RETURNING member_discount_id`,
        [desc]
      );
      discountIds.push(inserted.rows[0].member_discount_id);
    }

    const tiers = [
      ["Basic", "Club newsletter, gallery access, and local chapter events.", discountIds[0]],
      ["Advanced", "Workshop privileges, juried exhibition entry, and tool discounts.", discountIds[1]],
      ["Lifetime", "Permanent membership with full benefits and symposium admission.", discountIds[2]],
    ];
    for (const [code, desc, discountId] of tiers) {
      await query(
        `INSERT INTO membership_tier (member_tier_code, member_tier_desc, member_discount_profile_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (member_tier_code) DO UPDATE SET
           member_tier_desc = EXCLUDED.member_tier_desc,
           member_discount_profile_id = EXCLUDED.member_discount_profile_id`,
        [code, desc, discountId]
      );
    }

    for (const [code, desc] of CRAFT_SKILLS) {
      await query(
        `INSERT INTO craft_skill (craft_skill_code, craft_skill_desc)
         VALUES ($1, $2)
         ON CONFLICT (craft_skill_code) DO UPDATE SET craft_skill_desc = EXCLUDED.craft_skill_desc`,
        [code, desc]
      );
    }

    const adminHash = await bcrypt.hash("CarvingAdmin1!", 12);
    const memberHash = await bcrypt.hash("CarvingMember1!", 12);

    await query(
      `INSERT INTO member (
         member_alias, member_first_name, member_middle_name, member_last_name,
         gender, preferred_language_code, email_address, telephone_number_1, telephone_number_1_type,
         telephone_number_2, telephone_number_2_type, address_line_1, address_line_2,
         city, zip_code, state_province_code, country_code, craft_skill_code,
         member_tier_code, active_ind, password_hash, role
       ) VALUES
       ($1,'Helena','M.','Voss','Female','eng','admin@iwc.club','+1-206-555-0148','Mobile','+1-206-555-0190','Landline',
        '18 Cedar Ridge Lane',NULL,'Seattle','98101','US-WA','US','RELIEF','Lifetime','Y',$2,'ADMIN'),
       ($3,'Jonah',NULL,'Keller','Male','eng','member@iwc.club','+1-503-555-0172','Mobile',NULL,NULL,
        '42 Maple Court','Apt 4','Portland','97201','US-OR','US','WILDLIFE','Advanced','Y',$4,'MEMBER'),
       ('chipcarver','Amina','R.','Okoye','Female','eng','amina.okoye@iwc.club','+44-20-7946-0958','Landline',NULL,NULL,
        '7 Carvers Walk',NULL,'London','SW1A 1AA','GB-LND','GB','CHIP','Basic','Y',$4,'MEMBER'),
       ('spoonwright','Lars',NULL,'Lindqvist','Male','swe','lars.lindqvist@iwc.club','+46-8-555-0199','Mobile',NULL,NULL,
        '12 Bjorkgatan',NULL,'Stockholm','111 20','SE-AB','SE','SPOON','Advanced','N',$4,'MEMBER'),
       ('chainsawmaya','Maya',NULL,'Chen','Female','eng','maya.chen@iwc.club','+1-604-555-0133','Mobile',NULL,NULL,
        '90 Granville Street',NULL,'Vancouver','V6C 1T2','CA-BC','CA','CHAINSAW','Lifetime','S',$4,'MEMBER')
       ON CONFLICT (email_address) DO NOTHING`,
      ["clubadmin", adminHash, "oakcarver", memberHash]
    );

    await query("COMMIT");
    console.log("Database seeded with ISO 3166 reference data and sample members.");
  } catch (err) {
    await query("ROLLBACK");
    throw err;
  }
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  applySchema()
    .then(seedAll)
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
