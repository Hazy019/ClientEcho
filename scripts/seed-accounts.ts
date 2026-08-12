import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

async function seedAccounts() {
  console.log("Seeding ClientEcho dummy accounts...");

  if (!serviceRoleKey || serviceRoleKey.includes("placeholder")) {
    console.log("Notice: SUPABASE_SERVICE_ROLE_KEY environment variable is not configured.");
    console.log("Please run the SQL script in `supabase/seed.sql` directly inside your Supabase SQL Editor.");
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Creator Account
  const { data: creator, error: creatorError } = await supabase.auth.admin.createUser({
    email: "creator@clientecho.com",
    password: "Password123!",
    email_confirm: true,
    user_metadata: { name: "Demo Creator" },
  });

  if (creatorError) {
    console.log("Creator account setup note:", creatorError.message);
  } else {
    console.log("Created Creator account:", creator.user.email);
  }

  // 2. Tech Admin Account
  const { data: admin, error: adminError } = await supabase.auth.admin.createUser({
    email: "admin@clientecho.com",
    password: "AdminPassword123!",
    email_confirm: true,
    app_metadata: { role: "tech_admin" },
    user_metadata: { name: "Tech System Admin" },
  });

  if (adminError) {
    console.log("Tech Admin account setup note:", adminError.message);
  } else {
    console.log("Created Tech Admin account:", admin.user.email);
  }
}

seedAccounts();
