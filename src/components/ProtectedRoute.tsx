// components/ProtectedRoute.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Vérification de l’expiration du token
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      const exp = decoded.exp * 1000; // Convertir en millisecondes
      if (Date.now() >= exp) {
        localStorage.removeItem("token");
        router.push("/login");
      }
    } catch  {
      localStorage.removeItem("token");
      router.push("/login");
    }

    // Gestion de l’inactivité (1h = 3600000ms)
    let timeout: NodeJS.Timeout;
    const resetTimeout = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        localStorage.removeItem("token");
        router.push("/login");
      }, 3600000); // 1 heure
    };

    // Écoute les interactions utilisateur pour réinitialiser le timer
    window.addEventListener("mousemove", resetTimeout);
    window.addEventListener("keydown", resetTimeout);
    resetTimeout(); // Démarre le timer initial

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("mousemove", resetTimeout);
      window.removeEventListener("keydown", resetTimeout);
    };
  }, [router]);

  return <>{children}</>;
}
