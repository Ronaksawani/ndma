import React from "react";
import { useNavigate } from "react-router-dom";
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

export default function Sidebar({ role }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const partnerLinks = [
    { icon: "📊", label: "Dashboard", href: "/partner/dashboard" },
    { icon: "➕", label: "Add Training", href: "/partner/add-training" },
    { icon: "📋", label: "My Trainings", href: "/partner/my-trainings" },
    { icon: "👤", label: "Profile", href: "/partner/profile" },
  ];

  const adminLinks = [
    { icon: "📊", label: "Dashboard", href: "/admin/dashboard" },
    { icon: "📋", label: "All Trainings", href: "/admin/trainings" },
    { icon: "🤝", label: "Partners", href: "/admin/partners" },
    { icon: "📈", label: "Reports", href: "/admin/reports" },
    { icon: "⚙️", label: "Settings", href: "/admin/settings" },
  ];

  const links = role === "admin" ? adminLinks : partnerLinks;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src="/ndma-logo.png" alt="Logo" />
        <div className="sidebar-title">
          {role === "admin" ? "NDMA Admin" : "Partner Portal"}
        </div>
      </div>
      <ul className="sidebar-menu">
        {links.map((link, idx) => (
          <li key={idx}>
            <a href={link.href}>
              <span className="sidebar-icon">
                {IconMap[link.icon] || link.icon}
              </span>
              <span>{link.label}</span>
            </a>
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
            onClick={handleLogout}
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
