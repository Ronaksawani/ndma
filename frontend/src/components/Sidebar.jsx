import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiBarChart2,
  FiPlus,
  FiList,
  FiUser,
  FiSettings,
  FiUsers,
  FiTrendingUp,
  FiLogOut,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

const IconMap = {
  "📊": <FiBarChart2 />,
  "➕": <FiPlus />,
  "📋": <FiList />,
  "👤": <FiUser />,
  "⚙️": <FiSettings />,
  "🤝": <FiUsers />,
  "📈": <FiTrendingUp />,
  "🚪": <FiLogOut />,
};

export default function Sidebar({ role, isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const partnerLinks = [
    { icon: "📊", label: "Dashboard", href: "/partner/dashboard" },
    { icon: "➕", label: "Add Training", href: "/partner/add-training" },
    { icon: "📋", label: "My Trainings", href: "/partner/my-trainings" },
    { icon: "📈", label: "Reports", href: "/partner/reports" },
    { icon: "👤", label: "Profile", href: "/partner/profile" },
  ];

  const adminLinks = [
    {
      icon: "📊",
      label: "Dashboard",
      href: "/admin/dashboard",
      match: ["/admin/dashboard"],
    },
    {
      icon: "📋",
      label: "Training Events",
      href: "/admin/training-events",
      match: ["/admin/training-events", "/admin/training/"],
    },
    {
      icon: "🤝",
      label: "Partners",
      href: "/admin/partners",
      match: ["/admin/partners", "/admin/partner/", "/admin/add-partner"],
    },
    {
      icon: "📈",
      label: "Reports",
      href: "/admin/reports",
      match: ["/admin/reports"],
    },
  ];

  const participantLinks = [
    {
      icon: "📊",
      label: "Dashboard",
      href: "/participant/dashboard",
      match: ["/participant/dashboard"],
    },
    {
      icon: "📅",
      label: "Training Details",
      href: "/participant/upcoming-trainings",
      match: ["/participant/upcoming-trainings"],
    },
    {
      icon: "🤝",
      label: "My Participations",
      href: "/participant/my-participations",
      match: ["/participant/my-participations"],
    },
    {
      icon: "🎓",
      label: (user?.certificatesCount || 0) > 1 ? "Certificates" : "Certificate",
      href: "/participant/certificates",
      match: ["/participant/certificates"],
    },
    {
      icon: "👤",
      label: "My Profile",
      href: "/participant/profile",
      match: ["/participant/profile"],
    },
  ];

  const partnerLinksWithMatch = partnerLinks.map((link) => ({
    ...link,
    match:
      link.href === "/partner/my-trainings"
        ? [
            "/partner/my-trainings",
            "/partner/edit-training/",
            "/partner/view-training/",
          ]
        : [link.href],
  }));

  const links =
    role === "admin"
      ? adminLinks
      : role === "participant"
        ? participantLinks
        : partnerLinksWithMatch;

  const isActiveLink = (link) => {
    return link.match.some(
      (path) =>
        location.pathname === path || location.pathname.startsWith(path),
    );
  };

  return (
    <aside className={`sidebar ${isOpen ? "active" : ""}`}>
      <div className="sidebar-logo">
        <img src="/ndma-logo.png" alt="Logo" />
        <div className="sidebar-title">
          {role === "admin"
            ? "NDMA Admin"
            : role === "participant"
              ? "Participant Portal"
              : "Partner Portal"}
        </div>
      </div>
      <ul className="sidebar-menu">
        {links.map((link, idx) => (
          <li key={idx}>
            <Link
              to={link.href}
              className={isActiveLink(link) ? "active" : ""}
              aria-current={isActiveLink(link) ? "page" : undefined}
              onClick={() => onClose && onClose()}
            >
              <span className="sidebar-icon">
                {IconMap[link.icon] || link.icon}
              </span>
              <span>{link.label}</span>
            </Link>
          </li>
        ))}
        <li
          style={{
            marginTop: "40px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: "20px",
          }}
        >
          <button
            onClick={() => {
              handleLogout();
              if (onClose) onClose();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
              padding: "12px 20px",
              color: "#fca5a5",
              background: "none",
              border: "none",
              cursor: "pointer",
              width: "100%",
              fontSize: "14px",
              fontWeight: "inherit",
              fontFamily: "inherit",
              transition: "background-color 0.3s",
            }}
            onMouseEnter={(e) =>
              (e.target.style.backgroundColor = "rgba(255,255,255,0.1)")
            }
            onMouseLeave={(e) =>
              (e.target.style.backgroundColor = "transparent")
            }
          >
            <span className="sidebar-icon">
              <FiLogOut size={20} />
            </span>
            <span>Logout</span>
          </button>
        </li>
      </ul>
    </aside>
  );
}
