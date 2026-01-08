# Migration Instructions for Account System

## Important: Run these commands to enable the new Account Management System

The Account and AccountTransaction models have been added to the schema, but you need to:

1. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

2. **Create Migration:**
   ```bash
   npx prisma migrate dev --name add_account_system
   ```

3. **Restart your development server:**
   ```bash
   npm run dev
   ```

After running these commands, the account management system will be fully functional.

## What was added:

- `Account` model - for collector and admin accounts
- `AccountTransaction` model - for tracking all account transactions

The payment system will automatically credit collector accounts when payments are recorded.

