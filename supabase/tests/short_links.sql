begin;
insert into public.short_links (slug,target_url) values ('qa-internal-home','https://safariman.id'), ('qa-internal-page','https://www.safariman.id/peserta?from=shortlink');
insert into public.short_links (slug,target_url,is_active) values ('qa-shortlink-active','https://drive.google.com/file/d/test/view',true),('qa-shortlink-inactive','https://drive.google.com/file/d/test/view',false);
set local role anon;
do $$ begin
 if (select count(*) from public.short_links where slug like 'qa-shortlink-%') <> 1 then raise exception 'Public visibility failed'; end if;
 if has_table_privilege('anon','public.short_links','INSERT') then raise exception 'Public insert enabled'; end if;
end $$;
reset role;
set local role authenticated;
do $$ begin
 if exists(select 1 from public.short_links where slug='qa-shortlink-inactive') then raise exception 'Non-admin sees inactive'; end if;
 begin
 insert into public.short_links(slug,target_url) values('qa-unauthorized','https://drive.google.com/');
 raise exception 'Non-admin write allowed';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
do $$ begin
 begin
 insert into public.short_links(slug,target_url) values('peserta','https://drive.google.com/');
 raise exception 'Reserved slug allowed';
 exception when check_violation then null;
 end;
 begin
 insert into public.short_links(slug,target_url) values('qa-loop','https://safariman.id/qa-loop');
 raise exception 'Loop allowed';
 exception when check_violation then null;
 end;
 begin
 insert into public.short_links(slug,target_url) values('qa-invalid','javascript:alert(1)');
 raise exception 'Unsafe protocol allowed';
 exception when check_violation then null;
 end;
end $$;
select 'PASS: public active-only, unauthorized write denied, reserved paths and invalid targets rejected' as result;
rollback;
