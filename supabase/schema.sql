-- ====================================================================
-- EventControl.pe - Database Initial Schema (Supabase PostgreSQL)
-- Developed by Tech Innova (https://tech-innova.online)
-- ====================================================================

-- 1. ENUMS DEFINITIONS
CREATE TYPE user_role AS ENUM ('SUPER_USER', 'ADMIN', 'STAFF', 'GUEST');
CREATE TYPE plan_code AS ENUM ('STARTER', 'PRO', 'BUSINESS');
CREATE TYPE account_status AS ENUM ('ACTIVA', 'SUSPENDIDA', 'VENCIDA');
CREATE TYPE event_status AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- 2. WORKSPACES TABLE
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    plan_code plan_code NOT NULL DEFAULT 'STARTER',
    status account_status NOT NULL DEFAULT 'ACTIVA',
    max_events INT NOT NULL DEFAULT 1,
    contract_start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    contract_end_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ADMIN ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.admin_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    admin_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) UNIQUE NOT NULL,
    contact_phone VARCHAR(50),
    plan_code plan_code NOT NULL DEFAULT 'STARTER',
    status account_status NOT NULL DEFAULT 'ACTIVA',
    contract_end_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    venue_name VARCHAR(255),
    status event_status NOT NULL DEFAULT 'ACTIVE',
    total_authorized_passes INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. GUEST GROUPS TABLE (Pases & Invitados)
CREATE TABLE IF NOT EXISTS public.guest_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    group_name VARCHAR(255) NOT NULL,
    responsible_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    max_passes INT NOT NULL DEFAULT 1,
    table_number VARCHAR(50),
    qr_code VARCHAR(255) UNIQUE NOT NULL,
    whatsapp_sent BOOLEAN DEFAULT FALSE,
    whatsapp_sent_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. CHECK-INS TABLE (Asistencia & Scanner)
CREATE TABLE IF NOT EXISTS public.check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.guest_groups(id) ON DELETE CASCADE,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    passes_checked_in INT NOT NULL DEFAULT 1,
    scanner_staff_name VARCHAR(255),
    device_info TEXT
);

-- 7. CUTS TABLE (Cortes de Catering)
CREATE TABLE IF NOT EXISTS public.cuts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    cut_number INT NOT NULL,
    cut_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_entered INT NOT NULL DEFAULT 0,
    total_authorized INT NOT NULL DEFAULT 0,
    is_frozen BOOLEAN DEFAULT FALSE,
    notes TEXT
);

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuts ENABLE ROW LEVEL SECURITY;

-- Default Read/Write Policies for Authenticated Users
CREATE POLICY "Allow public select for active events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access to guest_groups" ON public.guest_groups FOR ALL USING (true);
CREATE POLICY "Allow authenticated full access to check_ins" ON public.check_ins FOR ALL USING (true);
