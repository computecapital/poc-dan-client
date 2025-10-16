"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { setAccessToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const resp = await api.post("/login", { email, password });
      const token: string | undefined = resp.data?.accessToken;
      if (!token) throw new Error("Resposta de login sem accessToken");
      setAccessToken(token);

      router.replace("/");
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || "Falha no login"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh w-full flex items-center justify-center p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 bg-card border border-border rounded-xl p-6 shadow-sm"
      >
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Entrar</h1>
          <p className="text-sm text-muted-foreground">
            Acesse com seu e-mail e senha.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm" htmlFor="password">
            Senha
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {error && <div className="text-sm text-destructive">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
