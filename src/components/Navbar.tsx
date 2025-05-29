"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BellIcon, UserCircleIcon, KeyIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import ChangePasswordModal from "./ChangePasswordModal";

export default function Navbar() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string>("");
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchUserRole = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        // Vérifier la structure de la réponse
        if (data.success && data.data?.role) {
          setUserRole(data.data.role);
        } else {
          console.error("Erreur de réponse:", data);
          router.push("/login");
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du rôle:", error);
        router.push("/login");
      }
    };

    fetchUserRole();
  }, [router]);

  const navigationLinks = [
    { href: "/", label: "Dashboard", roles: ["ADMIN", "STAFF", "USER"] },
    { href: "/time-entries", label: "Entrées de Temps", roles: ["ADMIN","PMSU"] },
    { href: "/users/assignments", label: "Assignations", roles: ["ADMIN","PMSU"] },
    { href: "/projects", label: "Projets", roles: ["ADMIN", "PMSU"] },
    { href: "/activities", label: "Activités", roles: ["ADMIN", "PMSU"] },
    { href: "/users", label: "Utilisateurs", roles: ["ADMIN", "PMSU"] },
  ];


  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo et Navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <div className="flex-shrink-0">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-2 mr-2">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  TimeTrack
                </span>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              {navigationLinks
                .filter((link) => {
                  const hasAccess = link.roles.includes(userRole);
                  return hasAccess;
                })
                .map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group relative px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    {link.label}
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                  </Link>
                ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-blue-600 transition-colors">
              <BellIcon className="h-6 w-6" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>

            {/* Profile */}
            <div className="relative group">
              <button className="flex items-center space-x-3 p-2 rounded-full hover:bg-gray-50 transition-colors">
                <div className="relative h-8 w-8 rounded-full overflow-hidden ring-2 ring-white">
                  <Image
                    src="/avatar.svg"
                    alt="Profile"
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                  />
                </div>
                <UserCircleIcon className="h-5 w-5 text-gray-400" />
              </button>

              {/* Dropdown Menu */}
              <div
                className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible
                            group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right"
              >
                <button
                  onClick={() => setIsChangePasswordModalOpen(true)}
                  className="w-full px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors
                           flex items-center space-x-2"
                >
                  <KeyIcon className="h-4 w-4" />
                  <span>Changer mot de passe</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors
                           flex items-center space-x-2"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de changement de mot de passe rendu via portail */}
      {isMounted && typeof window !== 'undefined' && createPortal(
        <ChangePasswordModal
          isOpen={isChangePasswordModalOpen}
          onClose={() => setIsChangePasswordModalOpen(false)}
        />,
        document.body
      )}
    </nav>
  );
}
