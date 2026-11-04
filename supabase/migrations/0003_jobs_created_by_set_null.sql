-- När en användare tas bort ska jobben finnas kvar, men utan skapare
alter table public.jobs drop constraint jobs_created_by_fkey;

alter table public.jobs
  add constraint jobs_created_by_fkey
  foreign key (created_by) references auth.users (id) on delete set null;
