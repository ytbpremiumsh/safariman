-- Protect application routes and reject unsafe or looping destinations.
alter table public.short_links
  add constraint short_links_reserved_slug check (slug <> all (array['admin','berkas','cek-hasil','cek-pengumuman','cek-tahapan','daftar-gelombang-1','daftar-gelombang-2','daftar-mandiri','daftar','essay-sukses','essay','faq','index','interview','kontribusi-sukses','kontribusi','panduan','pendaftaran-sukses','pendaftaran','peserta','seleksi','staff','statistik','sukses','tentang','twibbon','unsubscribe','go','api','assets','public','auth','functions','storage','robots','sitemap','favicon','www'])),
  add constraint short_links_external_target check (
    target_url ~* '^https?://[a-z0-9][a-z0-9.-]*(:[0-9]+)?([/?#][^[:space:]]*)?$'
    and target_url !~* '^https?://(www[.])?safariman[.]id(:[0-9]+)?([/?#]|$)'
  );
notify pgrst, 'reload schema';
