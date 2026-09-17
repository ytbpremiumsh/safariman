grant select on table public.staff_essay_reviews to authenticated;

drop policy if exists "Admins can read staff essay reviews" on public.staff_essay_reviews;
create policy "Admins can read staff essay reviews"
on public.staff_essay_reviews for select to authenticated
using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));