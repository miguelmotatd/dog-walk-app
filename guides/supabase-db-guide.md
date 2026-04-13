# Guide: versioning and pushing your Supabase database changes

This guide shows how to take the database changes you already made in Supabase, save them into your GitHub repo as migration files, and reuse them later to create a separate development environment.

---

## What you want to achieve

You already have a working Supabase project and made schema changes in the dashboard.

Now you want to:

- save those database changes in your repository
- recreate the same database structure in another Supabase project
- stop relying on manual changes in the dashboard

The right approach is to use the **Supabase CLI** and **database migrations**.

---

## What gets stored in GitHub

You should store:

- your frontend code
- the `supabase/` folder
- migration files inside `supabase/migrations/`
- optional seed files like `supabase/seed.sql`
- an `.env.example` file

You should **not** store:

- real `.env` files with secrets
- service role keys
- Supabase personal access tokens

---

## Recommended repo structure

A good structure looks like this:

```text
your-project/
  src/
  public/
  supabase/
    config.toml
    migrations/
    seed.sql
  .env.example
  package.json
  README.md
```

---

## Prerequisites

Before starting, make sure you have:

- Node.js installed
- Git installed
- a GitHub repository created
- your existing Supabase project already set up

---

## Step 1: install the Supabase CLI

From the root of your project, install the CLI as a dev dependency:

```bash
npm install -D supabase
```

You can also use the CLI through `npx`.

---

## Step 2: initialize Supabase in your repo

Run:

```bash
npx supabase init
```

This creates the local `supabase/` folder.

After this step, your project will contain something like:

```text
supabase/
  config.toml
```

---

## Step 3: log in to the Supabase CLI

Run:

```bash
npx supabase login
```

This opens a browser and asks you to authenticate.

---

## Step 4: find your project reference

In the Supabase dashboard, open your existing project.

Find the **project ref**. You will use it in the next step.

It looks something like:

```text
abcdefghijklmnopqrs
```

---

## Step 5: link your local repo to the current Supabase project

Run:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

Example:

```bash
npx supabase link --project-ref abcdefghijklmnopqrs
```

This tells the CLI which hosted project your local repo is connected to.

---

## Step 6: pull the current database schema into migrations

Because you already created tables, functions, triggers, and policies directly in Supabase, you now want to pull all of that into a migration file.

Run:

```bash
npx supabase db pull
```

This creates a migration file inside:

```text
supabase/migrations/
```

Example:

```text
supabase/migrations/20260413_remote_schema.sql
```

This file is the important part. It contains your current database structure.

---

## Step 7: review the migration file

Open the generated SQL file and check that it includes your important objects, such as:

- tables like `dogs`, `people`, `walks`, `notes`, `volunteer_profiles`
- indexes
- RLS policies
- functions like:
  - `start_walk`
  - `return_walk`
  - `add_walk_note`
  - `public_get_walk`
  - `public_get_walk_notes`
  - `public_get_my_active_walks`
- triggers such as your volunteer profile trigger

This is a good moment to verify that everything important is captured.

---

## Step 8: add an `.env.example`

Create a file called `.env.example` in the project root:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

This helps when setting up other environments later.

Do not commit your real `.env` file.

---

## Step 9: update `.gitignore`

Make sure your `.gitignore` includes at least:

```gitignore
node_modules
dist
.env
.env.local
```

If you use multiple env files, also include:

```gitignore
.env.development
.env.production
.env.*.local
```

---

## Step 10: commit the Supabase files to Git

Now save everything to Git:

```bash
git add .
git commit -m "Add Supabase schema migrations"
```

Then push to GitHub:

```bash
git push origin main
```

If the remote is not configured yet:

```bash
git remote add origin YOUR_GITHUB_REPO_URL
git branch -M main
git push -u origin main
```

---

## What you now have

At this point, your repository contains:

- the application code
- the Supabase project config
- migration files representing your database schema

That means your database structure is now reusable.

---

## How to create a separate dev environment later

When you want a dev environment, create a **new Supabase project**.

Then use the same migration files to recreate the database there.

### Step 1: create a new Supabase project

In the Supabase dashboard, create a new project for development.

Example naming:

- `dog-walk-prod`
- `dog-walk-dev`

---

### Step 2: link your repo to the new dev project

Run:

```bash
npx supabase link --project-ref YOUR_DEV_PROJECT_REF
```

---

### Step 3: push migrations into the dev project

Run:

```bash
npx supabase db push
```

This applies the migration files in your repo to the new project.

That recreates your schema in the dev environment.

---

## Important note about data

Migrations recreate the **database structure**, not your existing production data.

That means they recreate:

- tables
- views
- functions
- triggers
- policies
- indexes

But not necessarily:

- dog records
- people
- walk history

If you want sample data in development, create a seed file.

---

## Optional: create a seed file

You can create:

```text
supabase/seed.sql
```

Example:

```sql
insert into public.dogs (name, status, size, age_text, notes_summary)
values
('Bobby', 'available', 'medium', '3 years', 'Friendly and energetic'),
('Luna', 'available', 'small', '2 years', 'Can be nervous at first'),
('Max', 'unavailable', 'large', '6 years', 'Resting today');
```

This is useful for testing in the dev environment.

---

## Recommended workflow from now on

Now that you have migrations in Git, try to stop making important schema changes only in the dashboard.

A better workflow is:

### Option A: migration-first
1. create a migration
2. apply it
3. commit it
4. push it to GitHub

### Option B: dashboard change, then capture it
1. make the change in the dashboard
2. immediately run:

```bash
npx supabase db pull
```

3. commit the generated migration

This keeps GitHub as the source of truth.

---

## Suggested commands for future changes

### Pull remote changes into migrations

```bash
npx supabase db pull
```

### Push local migrations to the linked project

```bash
npx supabase db push
```

### Start local Supabase stack (optional)

```bash
npx supabase start
```

This requires Docker and is useful if you want local backend development later.

---

## Practical workflow for your project

Since your app is already working, the best next steps are:

1. run `npx supabase init`
2. run `npx supabase login`
3. run `npx supabase link --project-ref YOUR_CURRENT_PROJECT_REF`
4. run `npx supabase db pull`
5. commit the generated files
6. push to GitHub

Then later, for a dev environment:

1. create a new Supabase project
2. run `npx supabase link --project-ref YOUR_DEV_PROJECT_REF`
3. run `npx supabase db push`

---

## Common mistakes to avoid

### 1. Committing secrets
Do not commit:
- `.env`
- service role keys
- personal access tokens

### 2. Forgetting to capture dashboard changes
If you change the schema in Supabase but do not create or pull a migration, GitHub becomes outdated.

### 3. Assuming migrations copy data
They usually copy structure, not production records.

### 4. Using one project for everything
Keep at least:
- one production project
- one development project

---

## Good environment naming

A simple setup:

- `dog-walk-prod`
- `dog-walk-dev`

Then keep separate frontend env values for each one.

Example:

```env
# local dev frontend
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

---

## Final recommendation

For your app, the cleanest setup is:

- GitHub stores the app code and Supabase migrations
- production uses one Supabase project
- development uses another Supabase project
- migrations are the source of truth for the database structure

This will make your first version much easier to maintain and reuse.

---

## Quick command summary

```bash
npm install -D supabase
npx supabase init
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db pull
git add .
git commit -m "Add Supabase migrations"
git push origin main
```

Later, for a dev project:

```bash
npx supabase link --project-ref YOUR_DEV_PROJECT_REF
npx supabase db push
```
