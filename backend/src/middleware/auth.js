import jwt from "jsonwebtoken";
import { query } from "../db.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret-change-in-production";

export function signToken(member) {
  return jwt.sign(
    {
      member_id: member.member_id,
      member_alias: member.member_alias,
      role: member.role,
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const payload = jwt.verify(token, JWT_SECRET);
    const result = await query(
      `SELECT member_id, member_alias, email_address, role, active_ind
       FROM member WHERE member_id = $1`,
      [payload.member_id]
    );

    if (!result.rows.length) {
      return res.status(401).json({ error: "Account not found." });
    }

    const member = result.rows[0];
    if (member.active_ind !== "Y") {
      const status = member.active_ind === "S" ? "suspended" : "inactive";
      return res.status(403).json({ error: `This membership is ${status}.` });
    }

    req.member = member;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session." });
  }
}

export function requireAdmin(req, res, next) {
  if (req.member?.role !== "ADMIN") {
    return res.status(403).json({ error: "Administrator access required." });
  }
  next();
}
