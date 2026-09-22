-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  name text,
  settings jsonb default '{"tafsirMode": "On Request", "difficulty": "Medium"}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. User Ayah Progress Table
create table public.user_ayah_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  surah_number integer not null,
  ayah_number integer not null,
  status text not null check (status in ('Not Started', 'In Progress', 'Memorized')),
  first_memorized_at timestamp with time zone,
  last_reviewed_at timestamp with time zone,
  last_score integer,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, surah_number, ayah_number)
);

-- 3. Memorization Sessions Table
create table public.memorization_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  surah_number integer not null,
  start_ayah integer not null,
  end_ayah integer not null,
  reciter_identifier text not null,
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  sheikh_repetitions integer not null,
  user_attempts integer not null,
  number_of_tests integer not null,
  tafsir_mode text not null,
  status text not null check (status in ('In Progress', 'Completed', 'Abandoned')),
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- 4. Session Ayahs Table
create table public.session_ayahs (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.memorization_sessions(id) on delete cascade not null,
  surah_number integer not null,
  ayah_number integer not null,
  order_index integer not null,
  status text not null check (status in ('Pending', 'Passed', 'Failed'))
);

-- 5. Recitation Attempts Table
create table public.recitation_attempts (
  id uuid default uuid_generate_v4() primary key,
  session_ayah_id uuid references public.session_ayahs(id) on delete cascade not null,
  attempt_number integer not null,
  audio_url text, -- Storage path if saved
  duration interval,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Recitation Evaluations Table
create table public.recitation_evaluations (
  id uuid default uuid_generate_v4() primary key,
  attempt_id uuid references public.recitation_attempts(id) on delete cascade not null,
  status text not null check (status in ('Correct', 'Possible Mistake', 'Could Not Evaluate')),
  score integer,
  confidence decimal,
  transcription text,
  error_data jsonb,
  evaluated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Memorization Tests Table
create table public.memorization_tests (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.memorization_sessions(id) on delete cascade not null,
  test_number integer not null,
  test_type text not null,
  target_ayah_number integer not null,
  missing_start text,
  missing_end text,
  status text not null check (status in ('Pending', 'Passed', 'Failed'))
);

-- 8. Test Attempts Table
create table public.test_attempts (
  id uuid default uuid_generate_v4() primary key,
  test_id uuid references public.memorization_tests(id) on delete cascade not null,
  transcription text,
  score integer,
  confidence decimal,
  status text not null check (status in ('Correct', 'Incorrect', 'Could Not Evaluate')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Revision Sessions Table
create table public.revision_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  surah_number integer not null,
  start_ayah integer not null,
  end_ayah integer not null,
  status text not null check (status in ('In Progress', 'Completed', 'Abandoned')),
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- 10. Revision Ayahs Table
create table public.revision_ayahs (
  id uuid default uuid_generate_v4() primary key,
  revision_session_id uuid references public.revision_sessions(id) on delete cascade not null,
  surah_number integer not null,
  ayah_number integer not null,
  score integer,
  status text not null check (status in ('Pending', 'Passed', 'Failed'))
);

-- Set up Row Level Security (RLS)

-- Profiles
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- User Ayah Progress
alter table public.user_ayah_progress enable row level security;
create policy "Users can view own progress" on public.user_ayah_progress for select using (auth.uid() = user_id);
create policy "Users can insert own progress" on public.user_ayah_progress for insert with check (auth.uid() = user_id);
create policy "Users can update own progress" on public.user_ayah_progress for update using (auth.uid() = user_id);

-- Memorization Sessions
alter table public.memorization_sessions enable row level security;
create policy "Users can view own sessions" on public.memorization_sessions for select using (auth.uid() = user_id);
create policy "Users can insert own sessions" on public.memorization_sessions for insert with check (auth.uid() = user_id);
create policy "Users can update own sessions" on public.memorization_sessions for update using (auth.uid() = user_id);

-- Session Ayahs
alter table public.session_ayahs enable row level security;
create policy "Users can view own session ayahs" on public.session_ayahs for select using (
  exists (select 1 from public.memorization_sessions ms where ms.id = session_id and ms.user_id = auth.uid())
);
create policy "Users can insert own session ayahs" on public.session_ayahs for insert with check (
  exists (select 1 from public.memorization_sessions ms where ms.id = session_id and ms.user_id = auth.uid())
);
create policy "Users can update own session ayahs" on public.session_ayahs for update using (
  exists (select 1 from public.memorization_sessions ms where ms.id = session_id and ms.user_id = auth.uid())
);

-- Recitation Attempts
alter table public.recitation_attempts enable row level security;
create policy "Users can view own attempts" on public.recitation_attempts for select using (
  exists (
    select 1 from public.session_ayahs sa
    join public.memorization_sessions ms on sa.session_id = ms.id
    where sa.id = session_ayah_id and ms.user_id = auth.uid()
  )
);
create policy "Users can insert own attempts" on public.recitation_attempts for insert with check (
  exists (
    select 1 from public.session_ayahs sa
    join public.memorization_sessions ms on sa.session_id = ms.id
    where sa.id = session_ayah_id and ms.user_id = auth.uid()
  )
);

-- Recitation Evaluations
alter table public.recitation_evaluations enable row level security;
create policy "Users can view own evaluations" on public.recitation_evaluations for select using (
  exists (
    select 1 from public.recitation_attempts ra
    join public.session_ayahs sa on ra.session_ayah_id = sa.id
    join public.memorization_sessions ms on sa.session_id = ms.id
    where ra.id = attempt_id and ms.user_id = auth.uid()
  )
);
create policy "Users can insert own evaluations" on public.recitation_evaluations for insert with check (
  exists (
    select 1 from public.recitation_attempts ra
    join public.session_ayahs sa on ra.session_ayah_id = sa.id
    join public.memorization_sessions ms on sa.session_id = ms.id
    where ra.id = attempt_id and ms.user_id = auth.uid()
  )
);

-- Memorization Tests
alter table public.memorization_tests enable row level security;
create policy "Users can view own tests" on public.memorization_tests for select using (
  exists (select 1 from public.memorization_sessions ms where ms.id = session_id and ms.user_id = auth.uid())
);
create policy "Users can insert own tests" on public.memorization_tests for insert with check (
  exists (select 1 from public.memorization_sessions ms where ms.id = session_id and ms.user_id = auth.uid())
);
create policy "Users can update own tests" on public.memorization_tests for update using (
  exists (select 1 from public.memorization_sessions ms where ms.id = session_id and ms.user_id = auth.uid())
);

-- Test Attempts
alter table public.test_attempts enable row level security;
create policy "Users can view own test attempts" on public.test_attempts for select using (
  exists (
    select 1 from public.memorization_tests mt
    join public.memorization_sessions ms on mt.session_id = ms.id
    where mt.id = test_id and ms.user_id = auth.uid()
  )
);
create policy "Users can insert own test attempts" on public.test_attempts for insert with check (
  exists (
    select 1 from public.memorization_tests mt
    join public.memorization_sessions ms on mt.session_id = ms.id
    where mt.id = test_id and ms.user_id = auth.uid()
  )
);

-- Revision Sessions
alter table public.revision_sessions enable row level security;
create policy "Users can view own revision sessions" on public.revision_sessions for select using (auth.uid() = user_id);
create policy "Users can insert own revision sessions" on public.revision_sessions for insert with check (auth.uid() = user_id);
create policy "Users can update own revision sessions" on public.revision_sessions for update using (auth.uid() = user_id);

-- Revision Ayahs
alter table public.revision_ayahs enable row level security;
create policy "Users can view own revision ayahs" on public.revision_ayahs for select using (
  exists (select 1 from public.revision_sessions rs where rs.id = revision_session_id and rs.user_id = auth.uid())
);
create policy "Users can insert own revision ayahs" on public.revision_ayahs for insert with check (
  exists (select 1 from public.revision_sessions rs where rs.id = revision_session_id and rs.user_id = auth.uid())
);
create policy "Users can update own revision ayahs" on public.revision_ayahs for update using (
  exists (select 1 from public.revision_sessions rs where rs.id = revision_session_id and rs.user_id = auth.uid())
);

-- Trigger to automatically create a profile for new users
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data->>'name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
