-- Privat bucket för CV, bara PDF, max 5 MB
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cvs', 'cvs', false, 5242880, array['application/pdf'])
on conflict (id) do nothing;

-- Filerna ligger som {organization_id}/{candidate_id}.pdf
-- Åtkomst: admin, eller användare i samma organisation som första mappnamnet
create policy "cvs_org_access" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'cvs'
    and (public.is_admin() or (storage.foldername(name))[1] = public.current_org_id()::text)
  )
  with check (
    bucket_id = 'cvs'
    and (public.is_admin() or (storage.foldername(name))[1] = public.current_org_id()::text)
  );
