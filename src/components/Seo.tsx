import { Helmet } from "react-helmet-async";

const SITE = "https://safariman.my.id";
const DEFAULT_OG = "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/9005f625-04d9-4e34-a478-538502135623";

interface SeoProps {
  title: string;
  description: string;
  path: string; // route path, e.g. "/tentang"
  image?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export function Seo({ title, description, path, image, noindex, jsonLd }: SeoProps) {
  const url = `${SITE}${path}`;
  const img = image ?? DEFAULT_OG;
  const ldArr = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, follow" />}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Safar Iman" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={img} />
      <meta property="og:locale" content="id_ID" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={img} />

      {ldArr.map((obj, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(obj)}</script>
      ))}
    </Helmet>
  );
}
