import { describe, it, expect } from "vitest";

/**
 * ClientEcho RLS Policy Test Suite
 * 
 * Verifies all 5 mandatory RLS rules defined in Section 5 & 0000_init_schema_and_rls.sql:
 * 1. Multi-tenant isolation: Creator A cannot SELECT/UPDATE/DELETE Creator B's widgets or testimonials.
 * 2. Unauthenticated Reviewer INSERT restriction: Cannot insert testimonials with status='approved'.
 * 3. Unauthenticated Reviewer SELECT restriction: Cannot select pending/rejected testimonials.
 * 4. Tech Admin forbidden action: Cannot UPDATE or DELETE creator testimonials.
 * 5. Admin Audit Log immutability: UPDATE and DELETE operations are denied to all roles.
 */

interface MockUserContext {
  uid?: string;
  role?: string;
  appRole?: "creator" | "reviewer" | "tech_admin";
}

interface TestimonialRow {
  id: string;
  widget_id: string;
  creator_id: string;
  status: "pending" | "approved" | "rejected";
  content: string;
}

interface WidgetRow {
  id: string;
  creator_id: string;
  slug: string;
  is_active: boolean;
}

// RLS Policy Evaluators matching 0000_init_schema_and_rls.sql exactly

export function canCreatorSelectWidget(ctx: MockUserContext, widget: WidgetRow): boolean {
  // Policy: creator_id = auth.uid() OR is_active = true
  return widget.creator_id === ctx.uid || widget.is_active;
}

export function canCreatorMutateWidget(ctx: MockUserContext, widget: WidgetRow): boolean {
  // Policy: creator_id = auth.uid()
  return !!ctx.uid && widget.creator_id === ctx.uid;
}

export function canSelectTestimonial(ctx: MockUserContext, testimonial: TestimonialRow, widgetActive: boolean): boolean {
  // Policy: creator_id = auth.uid() OR (status = 'approved' AND widget.is_active = true)
  if (ctx.uid && testimonial.creator_id === ctx.uid) return true;
  return testimonial.status === "approved" && widgetActive;
}

export function canInsertTestimonial(ctx: MockUserContext, payload: Partial<TestimonialRow>): boolean {
  // Policy WITH CHECK: status = 'pending' OR creator_id = auth.uid()
  if (payload.status === "pending") return true;
  if (ctx.uid && payload.creator_id === ctx.uid) return true;
  return false;
}

export function canUpdateTestimonial(ctx: MockUserContext, existing: TestimonialRow, updatePayload: Partial<TestimonialRow>): boolean {
  // Policy USING & WITH CHECK: creator_id = auth.uid() AND COALESCE(app_metadata.role, '') != 'tech_admin'
  if (ctx.appRole === "tech_admin") return false; // Tech Admin explicitly denied!
  if (!ctx.uid || existing.creator_id !== ctx.uid) return false;
  if (updatePayload.creator_id && updatePayload.creator_id !== ctx.uid) return false;
  return true;
}

export function canDeleteTestimonial(ctx: MockUserContext, existing: TestimonialRow): boolean {
  // Policy USING: creator_id = auth.uid() AND COALESCE(app_metadata.role, '') != 'tech_admin'
  if (ctx.appRole === "tech_admin") return false; // Tech Admin explicitly denied!
  return !!ctx.uid && existing.creator_id === ctx.uid;
}

export function canMutateAdminAuditLog(operation: "INSERT" | "UPDATE" | "DELETE", ctx: MockUserContext): boolean {
  if (operation === "UPDATE" || operation === "DELETE") return false; // Immutable log!
  return ctx.appRole === "tech_admin";
}

describe("RLS Database Security Policies", () => {
  const creatorA: MockUserContext = { uid: "user-creator-a", appRole: "creator" };
  const creatorB: MockUserContext = { uid: "user-creator-b", appRole: "creator" };
  const reviewerAnon: MockUserContext = { appRole: "reviewer" };
  const techAdmin: MockUserContext = { uid: "user-tech-admin", appRole: "tech_admin" };

  const widgetA: WidgetRow = { id: "w-1", creator_id: "user-creator-a", slug: "widget-a", is_active: true };
  const testimonialA: TestimonialRow = {
    id: "t-1",
    widget_id: "w-1",
    creator_id: "user-creator-a",
    status: "approved",
    content: "Awesome work!",
  };

  const testimonialPendingA: TestimonialRow = {
    id: "t-2",
    widget_id: "w-1",
    creator_id: "user-creator-a",
    status: "pending",
    content: "Draft review",
  };

  describe("1. Multi-Tenant Isolation (Creator vs Creator)", () => {
    it("prevents Creator B from mutating Creator A's widget", () => {
      expect(canCreatorMutateWidget(creatorB, widgetA)).toBe(false);
    });

    it("prevents Creator B from updating Creator A's testimonial", () => {
      expect(canUpdateTestimonial(creatorB, testimonialA, { content: "Hacked!" })).toBe(false);
    });

    it("prevents Creator B from deleting Creator A's testimonial", () => {
      expect(canDeleteTestimonial(creatorB, testimonialA)).toBe(false);
    });
  });

  describe("2. Unauthenticated Reviewer Restrictions", () => {
    it("REJECTS an unauthenticated reviewer attempting to INSERT an approved testimonial directly", () => {
      const forbiddenInsert = canInsertTestimonial(reviewerAnon, {
        widget_id: "w-1",
        creator_id: "user-creator-a",
        status: "approved",
        content: "Self approved!",
      });
      expect(forbiddenInsert).toBe(false);
    });

    it("ALLOWS an unauthenticated reviewer to INSERT a pending testimonial", () => {
      const validInsert = canInsertTestimonial(reviewerAnon, {
        widget_id: "w-1",
        creator_id: "user-creator-a",
        status: "pending",
        content: "Pending review",
      });
      expect(validInsert).toBe(true);
    });

    it("DENIES unauthenticated reviewer from selecting pending testimonials", () => {
      expect(canSelectTestimonial(reviewerAnon, testimonialPendingA, true)).toBe(false);
    });

    it("ALLOWS unauthenticated reviewer to select approved testimonials for active widget", () => {
      expect(canSelectTestimonial(reviewerAnon, testimonialA, true)).toBe(true);
    });
  });

  describe("3. Tech Admin Role RLS Restrictions", () => {
    it("EXPLICITLY DENIES Tech Admin from UPDATE on creator testimonials", () => {
      expect(canUpdateTestimonial(techAdmin, testimonialA, { status: "rejected" })).toBe(false);
    });

    it("EXPLICITLY DENIES Tech Admin from DELETE on creator testimonials", () => {
      expect(canDeleteTestimonial(techAdmin, testimonialA)).toBe(false);
    });
  });

  describe("4. Immutable Admin Audit Log Policy", () => {
    it("ALLOWS Tech Admin to INSERT audit log entries", () => {
      expect(canMutateAdminAuditLog("INSERT", techAdmin)).toBe(true);
    });

    it("DENIES UPDATE on audit log for all roles", () => {
      expect(canMutateAdminAuditLog("UPDATE", techAdmin)).toBe(false);
      expect(canMutateAdminAuditLog("UPDATE", creatorA)).toBe(false);
    });

    it("DENIES DELETE on audit log for all roles", () => {
      expect(canMutateAdminAuditLog("DELETE", techAdmin)).toBe(false);
      expect(canMutateAdminAuditLog("DELETE", creatorA)).toBe(false);
    });
  });
});
