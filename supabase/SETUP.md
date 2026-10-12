# Sharing setup

This turns the app into one shared collection that you and the people you choose can open from any phone or computer, without anything running on your Mac. The app itself stays on GitHub Pages. Supabase holds the sign-ins, the shared history and the private photos.

About 10 minutes, all on supabase.com. Nothing to install.

## 1. Create the project

1. On [supabase.com/dashboard](https://supabase.com/dashboard), choose **New project**.
2. Name it `horology`, set a database password (save it in 1Password), pick the region closest to you, and create it.

## 2. Create the tables

1. Open **SQL Editor**, then **New query**.
2. Paste all of [`schema.sql`](schema.sql) and press **Run**. It should say "Success. No rows returned".

## 3. Let people sign in without an email step

Supabase's built-in email only reaches members of your Supabase team, so a confirmation email would never reach the other person.

1. **Authentication → Sign In / Providers → Email**.
2. Turn **Confirm email** off and save.

Nobody can see anything unless they've been added to your collection, so an open sign-up page is harmless. Once you've both created accounts, you can also turn off **Allow new users to sign up** (Authentication → Sign In / Providers).

## 4. Add the photo lookup

1. **Edge Functions → Deploy a new function → Via Editor**.
2. Name it exactly `lookup`.
3. Replace the example code with all of [`functions/lookup/index.ts`](functions/lookup/index.ts) and press **Deploy**.

## 5. Connect the app

1. **Project Settings → API Keys**. Copy the **Project URL** and the **publishable** key (it starts with `sb_publishable_`; on older projects it's the `anon` key).
2. Put them in `prototype/config.js`. Both are safe to publish: the database refuses everyone who isn't in your collection.

## 6. Start the collection

1. Open the app, choose **Create an account**, and sign up with your email.
2. Create the collection with your name. The Sharing panel opens: add the other person’s email and name.
3. Upload your stories, milestones and photos, which until now lived only on your Mac. In a terminal:

   ```bash
   cd prototype
   node tools/seed-cloud.mjs
   ```

   Sign in with the same email and password. It's safe to run again.

4. Send them the link. They choose **Create an account** with the email you added, and see everything.

## Surprise picks

From any wanted watch, either of you can choose **Pick as a surprise for …**. The other person sees that a watch was picked, never which one, until it's revealed. The rule lives in the database itself (an operation marked `private_to` is readable only by its author), not just in the app's screens.
