// components/ProtectedRoute.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const resetTimeout = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        localStorage.removeItem("token");
        router.push("/login");
      }, 3600000); // 1 heure
    };

    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        // Vérification du token côté client
        try {
          const decoded = JSON.parse(atob(token.split(".")[1]));
          const exp = decoded.exp * 1000;
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

        // Vérification du token côté serveur
        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        // Initialisation du timer d'inactivité
        window.addEventListener("mousemove", resetTimeout);
        window.addEventListener("keydown", resetTimeout);
        resetTimeout();
      } catch (error) {
        console.error("Erreur lors de la vérification de l'authentification:", error);
        localStorage.removeItem("token");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("mousemove", resetTimeout);
      window.removeEventListener("keydown", resetTimeout);
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}
