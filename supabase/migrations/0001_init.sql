create extension if not exists pg_trgm;

create table profiles (
  user_id uuid primary key references auth.users on delete cascade,
  name text not null, sex text not null check (sex in ('male','female')),
  age int not null check (age between 14 and 80),
  weight_kg numeric not null check (weight_kg between 35 and 250),
  height_cm numeric not null check (height_cm between 130 and 220),
  goal text not null, pace text not null, activity text not null, level text not null,
  place text not null, days_per_week int not null check (days_per_week between 3 and 6),
  meals_per_day int not null check (meals_per_day between 3 and 5),
  allergies text[] not null default '{}', avoid text[] not null default '{}',
  kcal int, protein int, carbs int, fat int, tdee int,
  updated_at timestamptz not null default now()
);

create table foods (
  id text primary key, name_es text not null, emoji text, image_url text,
  kcal numeric not null, p numeric not null, c numeric not null, f numeric not null,   -- por 100 g
  role text check (role in ('P','C','V','F')), tag text, barcode text unique,
  source text not null default 'seed'                                                    -- seed | cenan | usda | off | user
);
create index foods_name_trgm on foods using gin (name_es gin_trgm_ops);

create table recipes (id text primary key, name text not null, slots text not null, how text not null);
create table recipe_items (
  recipe_id text references recipes on delete cascade,
  food_id text references foods,
  grams numeric not null,
  primary key (recipe_id, food_id)
);

create table meal_logs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
  day date not null default current_date, slot text not null, recipe_id text, created_at timestamptz default now()
);
create table meal_log_items (
  id uuid primary key default gen_random_uuid(), log_id uuid not null references meal_logs on delete cascade,
  food_id text not null references foods, grams numeric not null check (grams > 0), via text default 'manual'  -- manual | plan | scan | barcode
);
create table workout_sets (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
  day date not null default current_date, exercise text not null, set_no int not null, reps int, weight_kg numeric
);
create table water_logs (user_id uuid references auth.users on delete cascade, day date, glasses int not null default 0, primary key (user_id, day));
create table weight_logs (user_id uuid references auth.users on delete cascade, day date, kg numeric not null, primary key (user_id, day));
create table scan_usage (user_id uuid references auth.users on delete cascade, day date, n int not null default 0, primary key (user_id, day));

-- RLS: cada usuario solo ve y edita lo suyo; foods y recipes son de lectura pública
alter table profiles enable row level security;
create policy own on profiles using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table meal_logs enable row level security;
create policy own on meal_logs using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table workout_sets enable row level security;
create policy own on workout_sets using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table water_logs enable row level security;
create policy own on water_logs using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table weight_logs enable row level security;
create policy own on weight_logs using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table scan_usage enable row level security;     -- sin política: solo la Edge Function (service role)
alter table meal_log_items enable row level security;
create policy own on meal_log_items
  using (exists (select 1 from meal_logs l where l.id = log_id and l.user_id = auth.uid()))
  with check (exists (select 1 from meal_logs l where l.id = log_id and l.user_id = auth.uid()));
alter table foods enable row level security;
create policy read_all on foods for select using (true);
alter table recipes enable row level security;
create policy read_all on recipes for select using (true);
alter table recipe_items enable row level security;
create policy read_all on recipe_items for select using (true);
