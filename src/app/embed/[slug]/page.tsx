import { db } from "@/db";
import { widgets, testimonials } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import WidgetDisplayClient from "./WidgetDisplayClient";

export const dynamic = "force-dynamic";

export default async function EmbedWidgetPage({ params }: { params: { slug: string } }) {
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

  return <WidgetDisplayClient widget={widget} testimonials={approvedTestimonials} />;
}
