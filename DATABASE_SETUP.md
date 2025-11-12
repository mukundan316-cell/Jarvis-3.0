# Database Setup Instructions

This guide will help you restore your JARVIS IntelliAgent 3.0 database on a local or external PostgreSQL server.

## Files Included

- `database_export.sql` - Complete database dump (schema + data) - **14,783 lines**
- `database_schema_only.sql` - Schema only (for reference) - **3,761 lines**

## Prerequisites

- PostgreSQL 14+ installed locally or access to a PostgreSQL hosting service
- `psql` command-line tool
- Database files and secrets from Replit export

## Option 1: Local PostgreSQL Setup

### Step 1: Install PostgreSQL (if not installed)

**Mac:**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

### Step 2: Create Database

```bash
# Login to PostgreSQL
psql postgres

# Create database
CREATE DATABASE jarvis_intelliagent;

# Create user (optional)
CREATE USER jarvis_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE jarvis_intelliagent TO jarvis_user;

# Exit psql
\q
```

### Step 3: Restore Database

```bash
# Restore the complete database
psql jarvis_intelliagent < database_export.sql

# Or if using custom user:
psql -U jarvis_user -d jarvis_intelliagent < database_export.sql
```

### Step 4: Verify Import

```bash
psql jarvis_intelliagent

# Check tables
\dt

# Check record counts
SELECT 
  schemaname,
  tablename,
  (xpath('/row/cnt/text()', xml_count))[1]::text::int as row_count
FROM (
  SELECT 
    table_schema AS schemaname,
    table_name AS tablename,
    query_to_xml(format('SELECT COUNT(*) AS cnt FROM %I.%I', table_schema, table_name), false, true, '') AS xml_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
) t
ORDER BY tablename;

\q
```

## Option 2: External Hosting (Neon, Supabase, Railway, etc.)

### For Neon (Recommended - Same as Replit uses)

1. Sign up at https://neon.tech
2. Create a new project
3. Copy your connection string (looks like: `postgresql://user:password@host/database`)
4. Restore database:

```bash
psql "postgresql://user:password@host/database" < database_export.sql
```

### For Supabase

1. Create project at https://supabase.com
2. Go to Settings → Database
3. Copy connection string
4. Use pooler connection string for better performance:

```bash
psql "postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" < database_export.sql
```

### For Railway

1. Create PostgreSQL service at https://railway.app
2. Copy connection URL from service variables
3. Restore:

```bash
psql $DATABASE_URL < database_export.sql
```

## Update Environment Variables

After setting up your database, update your `.env` file:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Session
SESSION_SECRET=your_session_secret

# SendGrid (optional)
SENDGRID_API_KEY=your_sendgrid_api_key

# OpenAI (optional)
OPENAI_API_KEY=your_openai_api_key

# Google Analytics (optional)
GA_TRACKING_ID=your_ga_tracking_id
```

## Running the App Locally

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. The app will be available at `http://localhost:5000`

## Important: Update GitHub OAuth Callback

Update your GitHub OAuth App callback URL to:
- Development: `http://localhost:5000/api/callback`
- Production: `https://your-domain.com/api/callback`

## Troubleshooting

### Connection Errors

If you get connection errors, check:
- PostgreSQL service is running
- Connection string is correct
- Firewall allows connections (for external hosting)

### Permission Errors

If you get permission errors during restore:
```bash
# Grant all permissions to your user
psql postgres
GRANT ALL PRIVILEGES ON DATABASE jarvis_intelliagent TO your_user;
ALTER DATABASE jarvis_intelliagent OWNER TO your_user;
```

### SSL Errors (for external hosting)

Add `?sslmode=require` to your connection string:
```
postgresql://user:password@host/database?sslmode=require
```

## Database Schema Summary

The database includes these main tables:
- **users** - User accounts and profiles
- **agents** - AI agent definitions
- **commands** - Command history
- **activities** - User activity logs
- **emails** - Email communications
- **submissions** - Insurance submissions
- **commercial_property_workflows** - Underwriting workflows
- **config_registry & config_values** - Configuration system
- **agent_executions** - Agent execution history
- **user_preferences** - User settings
- **sessions** - User sessions (managed by connect-pg-simple)

Total: 50+ tables with relationships and indexes.
