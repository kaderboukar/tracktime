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
          router.push("/login");
          return;
        }

        // Vérification de l'expiration du token
        try {
          const decoded = JSON.parse(atob(token.split(".")[1]));
          const exp = decoded.exp * 1000; // Convertir en millisecondes
          if (Date.now() >= exp) {
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
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        if (!allowedRoles.includes(data.data.role)) {
          router.push("/unauthorized");
          setIsAuthorized(false);
        } else {
          setIsAuthorized(true);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de l'authentification:", error);
        localStorage.removeItem("token");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [allowedRoles, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return isAuthorized ? <>{children}</> : null;
}
