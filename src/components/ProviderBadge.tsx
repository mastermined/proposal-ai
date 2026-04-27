"use client";

import { useEffect, useState } from "react";
import { Cpu } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface ActiveProvider {
  name: string;
  provider: string;
  model: string;
}

export function ProviderBadge() {
  const [active, setActive] = useState<ActiveProvider | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings/provider")
      .then((r) => r.json())
      .then(({ active }) => setActive(active))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return (
    <Link
      href="/settings"
      className={cn(
        "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors",
        active
          ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
          : "border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100"
      )}
    >
      <Cpu size={11} />
      {active ? (
        <span>
          {active.model.length > 20 ? active.model.slice(0, 20) + "…" : active.model}
        </span>
      ) : (
        <span>No provider — click to configure</span>
      )}
    </Link>
  );
}
