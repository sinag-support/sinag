"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useRole() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setRole(null);
          setLoading(false);
          return;
        }

        const response = await fetch("/api/auth/role");
        if (response.ok) {
          const data = await response.json();
          setRole(data.role);
        } else {
          setRole(null);
        }
      } catch (error) {
        console.error("Error fetching role:", error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setRole(null);
        setLoading(false);
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        fetchRole();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { role, loading };
}
