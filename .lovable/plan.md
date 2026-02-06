
# Update Demo Account Emails in Supabase

## Summary

The code has already been updated to use `@miocfo.it` email addresses, but the actual demo user accounts in Supabase Auth still have the old `@finexa.it` emails. These need to be updated in the Supabase dashboard.

## Current State

- **Code**: Already updated to `@miocfo.it` in `AuthContext.tsx`
- **Supabase Auth**: Still using `@finexa.it` emails

## Required Action

You need to update the demo account emails directly in the Supabase Auth dashboard:

| Current Email | New Email |
|--------------|-----------|
| demo.user@finexa.it | demo.user@miocfo.it |
| demo.admin@finexa.it | demo.admin@miocfo.it |
| demo.superadmin@finexa.it | demo.superadmin@miocfo.it |

## How to Update

1. Go to the [Supabase Users Dashboard](https://supabase.com/dashboard/project/yzhonmuhywdiqaxxbnsj/auth/users)
2. For each demo account:
   - Click on the user row
   - Click "Edit user" 
   - Update the email address to the new `@miocfo.it` domain
   - Save changes
3. The demo login buttons will then work with the new email addresses

## Note

The migration file `20260206142007_e3dfdb9c-efd2-4c28-aa60-2ab60676f7b5.sql` contains comments with the old email addresses, but these are just documentation and don't affect functionality - no code change is needed there.
