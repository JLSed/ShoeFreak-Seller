import { MdSpaceDashboard, MdAccountCircle } from "react-icons/md";
import logo from "../assets/react.svg"; // Keep as fallback
import { GiRunningShoe } from "react-icons/gi";
import { IoIosLogOut, IoMdPerson } from "react-icons/io";
import { FaStore, FaUsers } from "react-icons/fa";
import { RiNotification4Fill } from "react-icons/ri";
import { useState, useRef, useEffect } from "react";
import { signOut, getCurrentUser, fetchUserProfile } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

const navItems = [
  { label: "Dashboard", icon: <MdSpaceDashboard />, link: "/home" },
  { label: "Shoe List", icon: <GiRunningShoe />, link: "/shoe-list" },
  { label: "Customers", icon: <IoMdPerson />, link: "/messages" },
  { label: "Marketplace", icon: <FaStore />, link: "/marketplace" },
  { label: "Social", icon: <FaUsers />, link: "/socialmedia" },
];

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  // Fetch user profile picture
  useEffect(() => {
    const fetchProfilePicture = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          const profile = await fetchUserProfile(user.id);
          if (profile && profile.photo_url) {
            setProfilePicture(profile.photo_url);
          }
        }
      } catch (error) {
        console.error("Error fetching profile picture:", error);
      }
    };

    fetchProfilePicture();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="px-2 flex justify-between items-center absolute py-2 bg-gray-100 border border-gray-600 left-0 right-0 top-0 z-50">
      <div>
        <p className="font-rock_salt text-green-900">Shoe F.R.R.K</p>
      </div>
      <div className="font-gochi_hand text-xl text-green-900 flex gap-4">
        {navItems.map((item) => (
          <button
            onClick={() => navigate(item.link)}
            className="flex items-center gap-1"
            key={item.label}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-4" ref={menuRef}>
        <RiNotification4Fill className="text-2xl text-green-900" />
        <div className="relative">
          <div
            className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center cursor-pointer"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            {profilePicture ? (
              <img
                src={profilePicture}
                alt="profile picture"
                className="object-cover w-full h-full"
              />
            ) : (
              <img
                src={logo}
                alt="default profile"
                className="object-cover w-8 h-8"
              />
            )}
          </div>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <button
                className="flex items-center justify-between w-full text-left px-4 py-2 font-poppins text-green-700 hover:bg-gray-100"
                onClick={() => navigate("/profile")}
              >
                View Profile
                <MdAccountCircle className="text-xl " />
              </button>
              <button
                className="flex items-center justify-between w-full text-left px-4 py-2 font-poppins text-red-700 hover:bg-gray-100"
                onClick={handleLogout}
              >
                Log Out
                <IoIosLogOut className="text-xl " />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Header;
