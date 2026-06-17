import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  component: IndexRedirect,
});

function IndexRedirect() {
  const [dest, setDest] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setDest(data.user ? "/home" : "/auth");
    });
  }, []);
  if (!dest) {
    return (
      <div className="flex min-h-screen items-center justify-center nuppy-bg">
        <div className="font-display text-2xl text-brand animate-pulse">Nuppy</div>
      </div>
    );
  }
  return <Navigate to={dest} replace />;
}
