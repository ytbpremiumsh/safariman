import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  Link,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-8xl text-gradient-gold">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Halaman tidak ditemukan</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Halaman yang kamu cari tidak ada atau telah dipindahkan.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-gradient-emerald px-6 py-3 text-sm font-medium text-primary-foreground shadow-emerald hover-lift"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Terjadi kesalahan</h1>
        <p className="mt-2 text-sm text-muted-foreground">Silakan coba lagi.</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 inline-flex rounded-full bg-gradient-emerald px-6 py-3 text-sm text-primary-foreground"
        >
          Coba lagi
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Safar Iman — Umrah Gratis untuk Generasi Berprestasi" },
      { name: "description", content: "Program Umrah Gratis Fully Funded untuk anak muda Indonesia berprestasi. Hasanah x Prestasi Kita — Leadership, Seminar Internasional, Wakaf & Islamic Journey Experience." },
      { name: "author", content: "Safar Iman" },
      { property: "og:title", content: "Safar Iman — Umrah Gratis untuk Generasi Berprestasi" },
      { property: "og:description", content: "Program Umrah Gratis Fully Funded untuk anak muda Indonesia berprestasi. Hasanah x Prestasi Kita — Leadership, Seminar Internasional, Wakaf & Islamic Journey Experience." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Safar Iman — Umrah Gratis untuk Generasi Berprestasi" },
      { name: "twitter:description", content: "Program Umrah Gratis Fully Funded untuk anak muda Indonesia berprestasi. Hasanah x Prestasi Kita — Leadership, Seminar Internasional, Wakaf & Islamic Journey Experience." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/cb0b64b1-a349-49fc-8734-fd5f15aad393/id-preview-154c471c--690dcbd1-d1d7-422e-9de8-6f44f78a7eb1.lovable.app-1779547668252.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/cb0b64b1-a349-49fc-8734-fd5f15aad393/id-preview-154c471c--690dcbd1-d1d7-422e-9de8-6f44f78a7eb1.lovable.app-1779547668252.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Inter:wght@400;500;600;700&family=Sora:wght@500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
