import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/peserta/reguler")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/peserta/reguler/pendaftaran" });
  },
});
