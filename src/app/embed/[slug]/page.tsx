import { db } from "@/db";
import { widgets, testimonials } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import WidgetDisplayClient from "./WidgetDisplayClient";
import { getCachedWidgetPayload, setCachedWidgetPayload } from "@/lib/cache/redis";

export const dynamic = "force-dynamic";

export default async function EmbedWidgetPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { theme?: string };
}) {
  const initialTheme = searchParams?.theme;

  // Check Upstash Redis cache first
  const cachedPayload = await getCachedWidgetPayload(params.slug);
  if (cachedPayload && cachedPayload.widget) {
    return (
      <WidgetDisplayClient
        widget={cachedPayload.widget}
        testimonials={cachedPayload.testimonials}
        initialTheme={initialTheme}
      />
    );
  }

  const [widget] = await db
    .select()
    .from(widgets)
    .where(and(eq(widgets.slug, params.slug), eq(widgets.isActive, true)));

  if (!widget) {
    notFound();
  }

  // Fetch approved testimonials for active widget
  const approvedTestimonials = await db
    .select()
    .from(testimonials)
    .where(and(eq(testimonials.widgetId, widget.id), eq(testimonials.status, "approved")));

  const payload = { widget, testimonials: approvedTestimonials };

  // Asynchronously populate Redis cache
  await setCachedWidgetPayload(params.slug, payload);

  return (
    <WidgetDisplayClient
      widget={widget}
      testimonials={approvedTestimonials}
      initialTheme={initialTheme}
    />
  );
}


