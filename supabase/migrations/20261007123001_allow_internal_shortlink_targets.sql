alter table public.short_links drop constraint if exists short_links_external_target;
alter table public.short_links add constraint short_links_safe_target check (
 target_url ~* '^https?://[a-z0-9][a-z0-9.-]*(:[0-9]+)?([/?#][^[:space:]]*)?$'
 and target_url !~* ('^https?://(www[.])?safariman[.]id(:[0-9]+)?/' || slug || '/?([?#]|$)')
);
notify pgrst, 'reload schema';
