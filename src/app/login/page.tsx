"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { loginSchema } from "@/lib/validation";
import Image from "next/image";
import { EnvelopeIcon, LockClosedIcon, ClockIcon, ChartBarIcon } from "@heroicons/react/24/outline";

type FormData = z.infer<typeof loginSchema>;
type Errors = Partial<Record<keyof FormData, string>>;

export default function LoginPage() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<string>("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = loginSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors(
        Object.fromEntries(
          Object.entries(fieldErrors).map(([key, value]) => [key, value?.[0]])
        )
      );
      return;
    }

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await res.json();

    if (res.ok && data.success) {
      localStorage.setItem("token", data.data.token);
      router.push("/");
    } else {
      setMessage(data.message || "Une erreur est survenue lors de la connexion");
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Colonne gauche */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/80 to-indigo-600/80 backdrop-blur-md">
          <div className="absolute inset-0 bg-grid-white/[0.2] bg-[size:16px_16px]" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="max-w-xl">
            <h1 className="text-5xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
              Time Tracking App
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed">
              Gérez efficacement votre temps et vos projets en toute simplicité.
            </p>
          </div>

          <div className="space-y-8">
            {[
              {
                title: "Suivi du temps simplifié",
                desc: "Gérez vos heures efficacement",
                icon: <ClockIcon className="w-6 h-6 text-white" />
              },
              {
                title: "Gestion de projets",
                desc: "Suivez vos projets en temps réel",
                icon: <ChartBarIcon className="w-6 h-6 text-white" />
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="flex items-center space-x-4 backdrop-blur-md bg-white/10 p-4 rounded-2xl
                            hover:bg-white/20 transition-all duration-300"
              >
                <div className="flex-shrink-0">
                  <div
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/20 to-white/5 
                                flex items-center justify-center backdrop-blur-sm"
                  >
                    {feature.icon}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-white">{feature.title}</h3>
                  <p className="text-sm text-blue-100">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-white/60">
            © 2025 PNUD NIGER. Tous droits réservés.
          </p>
        </div>
      </div>

      {/* Colonne droite */}
      <div className="flex-1 flex flex-col min-h-screen">
        <div className="self-end p-8">
          <Image
            src="/logoundp.png"
            alt="Logo"
            width={120}
            height={120}
            className="w-auto h-auto filter drop-shadow-md"
          />
        </div>

        <div className="flex-1 flex items-center justify-center px-4 pb-20">
          <div className="w-full max-w-[440px]">
            <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-gray-100/50">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Bienvenue
                </h2>
                <p className="text-gray-600">
                  Connectez-vous à votre espace de travail
                </p>
              </div>

              {message && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Adresse email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="pl-10 w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      placeholder="vous@exemple.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LockClosedIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="pl-10 w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.password}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl
                         hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5 transition-all duration-200
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg"
                >
                  Se connecter
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
