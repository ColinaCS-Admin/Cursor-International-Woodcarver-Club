import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import Logo from "./Logo.jsx";

function NavItem({ to, children }) {
  return (
    <NavLink to={to} className={({ isActive }) => (isActive ? "active" : "")}>
      {children}
    </NavLink>
  );
}

export default function Layout() {
  const { member, isAdmin, signOut } = useAuth();

  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" to="/home">
          <Logo />
          <div className="brand-mark">
            International Woodcarver Club
            <span>Membership atelier</span>
          </div>
        </Link>
        <nav className="nav">
          <NavItem to="/home">Crafts & skills</NavItem>
          <NavItem to="/account">My account</NavItem>
          {isAdmin ? <NavItem to="/members">Member listing</NavItem> : null}
          <span className="muted">{member.member_alias}</span>
          <button type="button" onClick={signOut}>
            Sign out
          </button>
        </nav>
      </header>
      <Outlet />
      <footer className="footer">International Woodcarver Club · carved across continents</footer>
    </div>
  );
}
