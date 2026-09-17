import { authenticatedUser, corsHeaders, json } from "../_shared/staff-auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { user, admin, authUser } = await authenticatedUser(req);
    if (!authUser) return json({ error: "Unauthorized" }, 401);
    const { data: isAdmin } = await user.rpc("has_role", { _user_id: authUser.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Khusus admin" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "list");

    if (action === "list") {
      const { data: staff, error } = await admin.from("staff_reviewers")
        .select("user_id,name,email,active,created_at,updated_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json({ staff: staff ?? [] });
    }

    if (action === "create") {
      const name = String(body.name ?? "").trim();
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");
      if (!name || !email || password.length < 8) {
        return json({ error: "Nama, email, dan password minimal 8 karakter wajib diisi" }, 400);
      }
      const { data: existingStaff, error: existingStaffError } = await admin
        .from("staff_reviewers")
        .select("user_id")
        .eq("email", email)
        .maybeSingle();
      if (existingStaffError) throw existingStaffError;
      if (existingStaff) return json({ error: "Email ini sudah terdaftar sebagai staff" }, 409);

      const { data: usersPage, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (usersError) throw usersError;
      let staffUser = usersPage.users.find((candidate) => candidate.email?.toLowerCase() === email);
      let newlyCreated = false;
      if (staffUser) {
        const { data: role } = await admin.from("user_roles")
          .select("role").eq("user_id", staffUser.id).eq("role", "admin").maybeSingle();
        if (role) return json({ error: "Email admin tidak dapat dijadikan akun staff" });
        const { data: updated, error: updateError } = await admin.auth.admin.updateUserById(staffUser.id, {
          password,
          email_confirm: true,
          app_metadata: { ...staffUser.app_metadata, access_role: "staff_reviewer" },
          user_metadata: { ...staffUser.user_metadata, name },
        });
        if (updateError || !updated.user) throw updateError ?? new Error("Gagal menyiapkan akun staff");
        staffUser = updated.user;
      } else {
        const { data: created, error: createError } = await admin.auth.admin.createUser({
          email, password, email_confirm: true,
          app_metadata: { access_role: "staff_reviewer" },
          user_metadata: { name },
        });
        if (createError || !created.user) throw createError ?? new Error("Gagal membuat akun");
        staffUser = created.user;
        newlyCreated = true;
      }
      const { error: profileError } = await admin.from("staff_reviewers").upsert({
        user_id: staffUser.id, name, email, active: true, created_by: authUser.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      if (profileError && newlyCreated) {
        await admin.auth.admin.deleteUser(staffUser.id);
      }
      if (profileError) {
        throw profileError;
      }
      return json({ ok: true });
    }

    if (action === "set_active") {
      const userId = String(body.user_id ?? "");
      const active = body.active === true;
      const { error } = await admin.from("staff_reviewers")
        .update({ active, updated_at: new Date().toISOString() }).eq("user_id", userId);
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "reset_password") {
      const userId = String(body.user_id ?? "");
      const password = String(body.password ?? "");
      if (password.length < 8) return json({ error: "Password minimal 8 karakter" }, 400);
      const { error } = await admin.auth.admin.updateUserById(userId, { password });
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "delete") {
      const userId = String(body.user_id ?? "");
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw error;
      return json({ ok: true });
    }

    return json({ error: "Aksi tidak dikenal" }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Terjadi kesalahan" }, 500);
  }
});
