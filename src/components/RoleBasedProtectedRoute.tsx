'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type RoleBasedProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles: string[];
};

export default function RoleBasedProtectedRoute({
  children,
  allowedRoles,
}: RoleBasedProtectedRouteProps) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("Token non trouvé, redirection vers /login");
          router.push("/login");
          return;
        }

        // Vérification de l'expiration du token
        try {
          const decoded = JSON.parse(atob(token.split(".")[1]));
          const exp = decoded.exp * 1000; // Convertir en millisecondes
          if (Date.now() >= exp) {
            console.log("Token expiré, redirection vers /login");
            localStorage.removeItem("token");
            router.push("/login");
            return;
          }
        } catch (error) {
          console.error("Erreur de décodage du token:", error);
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          console.log("Réponse non valide de /api/auth/me:", data.message);
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        const userRole = data.data.role;
        if (!allowedRoles.includes(userRole)) {
          console.log("Rôle non autorisé, redirection vers /unauthorized");
          router.push("/unauthorized");
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error("Erreur lors de la vérification de l'authentification:", error);
        localStorage.removeItem("token");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Mettre en place un intervalle pour vérifier périodiquement l'authentification
    const interval = setInterval(checkAuth, 5 * 60 * 1000); // Vérifier toutes les 5 minutes

    return () => clearInterval(interval);
  }, [router, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
