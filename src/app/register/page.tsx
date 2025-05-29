// app/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { registerSchema } from "@/lib/validation";

type FormData = z.infer<typeof registerSchema>;
type Errors = Partial<Record<keyof FormData, string>>;

export default function RegisterPage() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    name: "",
    indice: "",
    grade: "",
    proformaCosts: [{ year: new Date().getFullYear(), cost: 0 }],
    type: "OPERATION",
    role: "STAFF",
    isActive: true,
    signature: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<string>("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = registerSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors(
        Object.fromEntries(
          Object.entries(fieldErrors).map(([key, value]) => [key, value?.[0]])
        ) as Errors
      );
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage(
          "Inscription réussie ! Vous allez être redirigé vers la page de connexion."
        );
        setErrors({});
        setTimeout(() => router.push("/login"), 2000); // Redirection après 2 secondes
      } else {
        setMessage(data.message || "Erreur lors de l’inscription");
      }
    } catch (error) {
      setMessage("Erreur serveur : " + (error as Error).message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Inscription</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>
        <div>
          <input
            type="password"
            placeholder="Mot de passe"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
          )}
        </div>
        <div>
          <input
            type="text"
            placeholder="Nom"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>
        <div>
          <input
            type="text"
            placeholder="Indice"
            value={formData.indice}
            onChange={(e) =>
              setFormData({ ...formData, indice: e.target.value })
            }
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.indice && (
            <p className="text-red-500 text-sm mt-1">{errors.indice}</p>
          )}
        </div>
        <div>
          <input
            type="text"
            placeholder="Grade"
            value={formData.grade}
            onChange={(e) =>
              setFormData({ ...formData, grade: e.target.value })
            }
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.grade && (
            <p className="text-red-500 text-sm mt-1">{errors.grade}</p>
          )}
        </div>
        <div>
          <input
            type="number"
            step="0.01"
            placeholder="Coût proforma"
            value={formData.proformaCosts[0]?.cost || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                proformaCosts: [{
                  year: formData.proformaCosts[0]?.year || new Date().getFullYear(),
                  cost: parseFloat(e.target.value) || 0
                }],
              })
            }
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.proformaCosts && (
            <p className="text-red-500 text-sm mt-1">{errors.proformaCosts}</p>
          )}
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition"
        >
          S’inscrire
        </button>
      </form>
      {message && (
        <p
          className={`mt-4 text-center ${
            message.includes("réussie") ? "text-green-500" : "text-red-500"
          }`}
        >
          {message}
        </p>
      )}
      <p className="mt-4 text-center">
        Déjà un compte ?{" "}
        <a href="/login" className="text-blue-500 hover:underline">
          Connectez-vous
        </a>
      </p>
    </div>
  );
}
