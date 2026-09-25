-- ================================================================
-- NICORA GARDEN - SCHEMA DATABASE SUPABASE & ROW LEVEL SECURITY (RLS)
-- Sedi: Nicora Garden Gazzada & Nicora Garden Varese
-- Data creazione: 20 Settembre 2026
-- ================================================================

-- 1. Pulizia opzionale (usare con cautela per reset completo)
-- DROP TABLE IF EXISTS shift_requests CASCADE;
-- DROP TABLE IF EXISTS shifts CASCADE;
-- DROP TABLE IF EXISTS employees CASCADE;
-- DROP TABLE IF EXISTS locations CASCADE;

-- ----------------------------------------------------------------
-- 2. TABELLA SEDI (LOCATIONS)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,                       -- 'gazzada', 'varese'
    name TEXT NOT NULL,                        -- es. 'Nicora Garden Gazzada'
    short_name TEXT NOT NULL,                  -- es. 'Gazzada'
    city TEXT NOT NULL,                        -- es. 'Gazzada Schianno (VA)'
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    default_staff_count INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 3. TABELLA COLLABORATORI (EMPLOYEES)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,                       -- es. 'emp-gz-1', 'emp-va-1' o UUID
    name TEXT NOT NULL,                        -- Nome e iniziale cognome (es. 'Elena R.')
    location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    role TEXT NOT NULL,                        -- Reparto primario ('Cassa', 'Fioreria', 'Decor', 'Serra Calda', 'Serra Fredda')
    skills JSONB NOT NULL DEFAULT '{}'::jsonb, -- Punteggi 1-10 per reparto: {"Cassa": 10, "Fioreria": 4, ...}
    avatar TEXT NOT NULL DEFAULT 'NC',         -- Iniziali per icona avatar
    email TEXT NOT NULL,
    phone TEXT,
    pin TEXT NOT NULL DEFAULT '1234',          -- PIN a 4 cifre per accesso rapido collaboratori
    is_manager BOOLEAN NOT NULL DEFAULT FALSE, -- Flag responsabile/direzione
    contract_hours INTEGER NOT NULL DEFAULT 40,-- Ore settimanali da contratto
    is_active BOOLEAN NOT NULL DEFAULT TRUE,   -- Se FALSE: archiviato per cessazione senza perdere storico
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 4. TABELLA TURNI (SHIFTS)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shifts (
    id TEXT PRIMARY KEY,                       -- Chiave univoca turno (es. 'sh-emp-gz-1-2026-09-20' o UUID)
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    date DATE NOT NULL,                        -- Data turno (YYYY-MM-DD)
    type TEXT NOT NULL,                        -- 'mattina', 'pomeriggio', 'giornata', 'riposo', 'ferie', 'malattia'
    department TEXT,                           -- Reparto assegnato per il turno ('Cassa', 'Fioreria', ecc.)
    start_time TEXT,                           -- '08:30', '09:00'
    end_time TEXT,                             -- '12:30', '19:30'
    area_note TEXT,                            -- Note di reparto ('Cassa 1', 'Scarico Merci Serra', ecc.)
    is_manual_override BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_employee_date UNIQUE (employee_id, date)
);

-- ----------------------------------------------------------------
-- 5. TABELLA RICHIESTE FERIE & CAMBIO TURNO (SHIFT_REQUESTS)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shift_requests (
    id TEXT PRIMARY KEY,                       -- es. 'req-1' o UUID
    requester_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('swap', 'leave')), -- Scambio turno o Permesso/Ferie
    target_employee_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
    shift_date DATE NOT NULL,                  -- Data del turno interessato
    target_shift_date DATE,                    -- Data target in caso di scambio
    reason TEXT NOT NULL,                      -- Motivazione inserita dal collaboratore
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    manager_note TEXT,                         -- Eventuale nota della Direzione
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 6. INDICI PER PRESTAZIONI DI RICERCA E SYNC REALTIME
-- ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_employees_location ON employees(location_id);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(is_active);
CREATE INDEX IF NOT EXISTS idx_shifts_location_date ON shifts(location_id, date);
CREATE INDEX IF NOT EXISTS idx_shifts_employee ON shifts(employee_id);
CREATE INDEX IF NOT EXISTS idx_requests_location_status ON shift_requests(location_id, status);

-- ----------------------------------------------------------------
-- 7. ABILITAZIONE ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_requests ENABLE ROW LEVEL SECURITY;

-- Policy di lettura pubblica/anonima controllata per l'app
CREATE POLICY "Lettura sedi consentita a tutti" ON locations FOR SELECT USING (true);

CREATE POLICY "Lettura collaboratori attivi consentita a tutti" ON employees FOR SELECT USING (is_active = true);
CREATE POLICY "Gestione collaboratori per manager" ON employees FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Lettura turni consentita a tutti" ON shifts FOR SELECT USING (true);
CREATE POLICY "Modifica e salvataggio turni" ON shifts FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Lettura richieste consentita a tutti" ON shift_requests FOR SELECT USING (true);
CREATE POLICY "Inserimento richieste da collaboratori" ON shift_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Aggiornamento e approvazione richieste" ON shift_requests FOR UPDATE USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------
-- 8. ABILITAZIONE REALTIME (Per Sprint 2)
-- ----------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE locations;
ALTER PUBLICATION supabase_realtime ADD TABLE employees;
ALTER PUBLICATION supabase_realtime ADD TABLE shifts;
ALTER PUBLICATION supabase_realtime ADD TABLE shift_requests;

-- ----------------------------------------------------------------
-- 9. POPOLAMENTO INIZIALE (SEED DATA)
-- ----------------------------------------------------------------

-- Sedi
INSERT INTO locations (id, name, short_name, city, address, phone, default_staff_count) VALUES
('gazzada', 'Nicora Garden Gazzada', 'Gazzada', 'Gazzada Schianno (VA)', 'Via Gallarate 26, 21045 Gazzada Schianno (VA)', '0332 461144', 10),
('varese', 'Nicora Garden Varese', 'Varese', 'Varese Centro', 'Via Daverio 46, 21100 Varese (VA)', '0332 312101', 14)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone;

-- Collaboratori Gazzada (Collaboratori Reali)
INSERT INTO employees (id, name, location_id, role, skills, avatar, email, phone, pin, is_manager, contract_hours, is_active) VALUES
('emp-gz-1', 'Sabrina', 'gazzada', 'Cassa', '{"Cassa": 10, "Fioreria": 7, "Decor": 6, "Serra Calda": 4, "Serra Fredda": 3}', 'SA', 'sabrina@nicoragarden.it', '340 1000001', '1234', false, 40, true),
('emp-gz-2', 'Eleonora', 'gazzada', 'Fioreria', '{"Cassa": 6, "Fioreria": 10, "Decor": 8, "Serra Calda": 5, "Serra Fredda": 4}', 'EL', 'eleonora@nicoragarden.it', '340 1000002', '1234', false, 40, true),
('emp-gz-3', 'Teo', 'gazzada', 'Serra Calda', '{"Cassa": 5, "Fioreria": 4, "Decor": 5, "Serra Calda": 10, "Serra Fredda": 8}', 'TE', 'teo@nicoragarden.it', '340 1000003', '1234', false, 40, true),
('emp-gz-4', 'Vittore Nicora', 'gazzada', 'Serra Calda', '{"Cassa": 8, "Fioreria": 8, "Decor": 8, "Serra Calda": 10, "Serra Fredda": 10}', 'VN', 'vittore@nicoragarden.it', '335 1122334', 'admin', true, 40, true),
('emp-gz-5', 'Daniela', 'gazzada', 'Fioreria', '{"Cassa": 7, "Fioreria": 9, "Decor": 8, "Serra Calda": 5, "Serra Fredda": 4}', 'DA', 'daniela@nicoragarden.it', '340 1000005', '1234', false, 30, true),
('emp-gz-6', 'Ginevra', 'gazzada', 'Serra Fredda', '{"Cassa": 4, "Fioreria": 4, "Decor": 5, "Serra Calda": 8, "Serra Fredda": 9}', 'GI', 'ginevra@nicoragarden.it', '340 1000006', '1234', false, 40, true),
('emp-gz-7', 'Denis', 'gazzada', 'Decor', '{"Cassa": 3, "Fioreria": 2, "Decor": 4, "Serra Calda": 7, "Serra Fredda": 9}', 'DE', 'denis@nicoragarden.it', '340 1000007', '1234', false, 40, true),
('emp-gz-8', 'Laura', 'gazzada', 'Cassa', '{"Cassa": 8, "Fioreria": 5, "Decor": 6, "Serra Calda": 8, "Serra Fredda": 5}', 'LA', 'laura@nicoragarden.it', '340 1000008', '1234', false, 40, true),
('emp-gz-9', 'Ivano', 'gazzada', 'Serra Fredda', '{"Cassa": 3, "Fioreria": 2, "Decor": 4, "Serra Calda": 6, "Serra Fredda": 9}', 'IV', 'ivano@nicoragarden.it', '340 1000009', '1234', false, 40, true),
('emp-gz-10', 'Marco', 'gazzada', 'Serra Fredda', '{"Cassa": 4, "Fioreria": 3, "Decor": 4, "Serra Calda": 8, "Serra Fredda": 10}', 'MA', 'marco.gz@nicoragarden.it', '340 1000010', '1234', false, 40, true),
('emp-gz-11', 'Mattia', 'gazzada', 'Decor', '{"Cassa": 4, "Fioreria": 3, "Decor": 5, "Serra Calda": 7, "Serra Fredda": 8}', 'MT', 'mattia@nicoragarden.it', '340 1000011', '1234', false, 40, false),
('emp-gz-12', 'Davide', 'gazzada', 'Serra Calda', '{"Cassa": 6, "Fioreria": 5, "Decor": 5, "Serra Calda": 6, "Serra Fredda": 6}', 'DV', 'davide@nicoragarden.it', '340 1000012', '1234', false, 20, false)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    skills = EXCLUDED.skills,
    pin = EXCLUDED.pin,
    is_active = EXCLUDED.is_active;

-- Collaboratori Varese (Collaboratori Reali)
INSERT INTO employees (id, name, location_id, role, skills, avatar, email, phone, pin, is_manager, contract_hours, is_active) VALUES
('emp-va-1', 'Stefania', 'varese', 'Cassa', '{"Cassa": 10, "Fioreria": 6, "Decor": 7, "Serra Calda": 4, "Serra Fredda": 3}', 'ST', 'stefania@nicoragarden.it', '340 2000001', '1234', true, 40, true),
('emp-va-2', 'Katja', 'varese', 'Fioreria', '{"Cassa": 5, "Fioreria": 10, "Decor": 8, "Serra Calda": 5, "Serra Fredda": 4}', 'KA', 'katja@nicoragarden.it', '340 2000002', '1234', false, 40, true),
('emp-va-3', 'Luisa', 'varese', 'Fioreria', '{"Cassa": 6, "Fioreria": 9, "Decor": 7, "Serra Calda": 6, "Serra Fredda": 4}', 'LU', 'luisa@nicoragarden.it', '340 2000003', '1234', false, 40, true),
('emp-va-4', 'Giancarla', 'varese', 'Decor', '{"Cassa": 6, "Fioreria": 7, "Decor": 10, "Serra Calda": 4, "Serra Fredda": 3}', 'GC', 'giancarla@nicoragarden.it', '340 2000004', '1234', false, 40, true),
('emp-va-5', 'Giovanna', 'varese', 'Decor', '{"Cassa": 8, "Fioreria": 6, "Decor": 9, "Serra Calda": 4, "Serra Fredda": 3}', 'GO', 'giovanna@nicoragarden.it', '340 2000005', '1234', false, 40, true),
('emp-va-6', 'Matteo', 'varese', 'Serra Calda', '{"Cassa": 5, "Fioreria": 4, "Decor": 5, "Serra Calda": 10, "Serra Fredda": 8}', 'MO', 'matteo@nicoragarden.it', '340 2000006', '1234', false, 40, true),
('emp-va-7', 'Stefano', 'varese', 'Serra Calda', '{"Cassa": 4, "Fioreria": 3, "Decor": 4, "Serra Calda": 9, "Serra Fredda": 8}', 'SO', 'stefano@nicoragarden.it', '340 2000007', '1234', false, 40, true),
('emp-va-8', 'Andrea', 'varese', 'Serra Fredda', '{"Cassa": 3, "Fioreria": 2, "Decor": 4, "Serra Calda": 7, "Serra Fredda": 9}', 'AN', 'andrea@nicoragarden.it', '340 2000008', '1234', false, 40, true),
('emp-va-9', 'Francesca', 'varese', 'Fioreria', '{"Cassa": 6, "Fioreria": 9, "Decor": 8, "Serra Calda": 4, "Serra Fredda": 3}', 'FR', 'francesca@nicoragarden.it', '340 2000009', '1234', false, 40, true),
('emp-va-10', 'Cinzia', 'varese', 'Cassa', '{"Cassa": 9, "Fioreria": 5, "Decor": 6, "Serra Calda": 4, "Serra Fredda": 3}', 'CI', 'cinzia@nicoragarden.it', '340 2000010', '1234', false, 24, true),
('emp-va-11', 'Elina', 'varese', 'Serra Fredda', '{"Cassa": 4, "Fioreria": 4, "Decor": 4, "Serra Calda": 6, "Serra Fredda": 8}', 'EL', 'elina.va@nicoragarden.it', '340 2000011', '1234', false, 24, true),
('emp-va-12', 'Gionata', 'varese', 'Serra Fredda', '{"Cassa": 3, "Fioreria": 2, "Decor": 4, "Serra Calda": 7, "Serra Fredda": 10}', 'GN', 'gionata@nicoragarden.it', '340 2000012', '1234', false, 40, true),
('emp-va-13', 'Giulio', 'varese', 'Serra Fredda', '{"Cassa": 4, "Fioreria": 3, "Decor": 4, "Serra Calda": 6, "Serra Fredda": 9}', 'GL', 'giulio@nicoragarden.it', '340 2000013', '1234', false, 40, true),
('emp-va-14', 'Carlo', 'varese', 'Decor', '{"Cassa": 4, "Fioreria": 2, "Decor": 4, "Serra Calda": 6, "Serra Fredda": 8}', 'CA', 'carlo@nicoragarden.it', '340 2000014', '1234', false, 40, true),
('emp-va-15', 'Sara', 'varese', 'Decor', '{"Cassa": 6, "Fioreria": 6, "Decor": 7, "Serra Calda": 6, "Serra Fredda": 6}', 'SR', 'sara@nicoragarden.it', '340 2000015', '1234', false, 30, false),
('emp-va-16', 'Arianna', 'varese', 'Cassa', '{"Cassa": 6, "Fioreria": 5, "Decor": 6, "Serra Calda": 5, "Serra Fredda": 6}', 'AR', 'arianna@nicoragarden.it', '340 2000016', '1234', false, 24, false),
('emp-va-17', 'Gaia', 'varese', 'Fioreria', '{"Cassa": 5, "Fioreria": 6, "Decor": 7, "Serra Calda": 6, "Serra Fredda": 6}', 'GA', 'gaia@nicoragarden.it', '340 2000017', '1234', false, 24, false),
('emp-va-18', 'Claudio', 'varese', 'Serra Fredda', '{"Cassa": 3, "Fioreria": 2, "Decor": 4, "Serra Calda": 7, "Serra Fredda": 8}', 'CL', 'claudio@nicoragarden.it', '340 2000018', '1234', false, 40, false),
('emp-va-19', 'Debora', 'varese', 'Cassa', '{"Cassa": 7, "Fioreria": 5, "Decor": 6, "Serra Calda": 4, "Serra Fredda": 4}', 'DB', 'debora@nicoragarden.it', '340 2000019', '1234', false, 20, false),
('emp-va-20', 'Nancy', 'varese', 'Fioreria', '{"Cassa": 5, "Fioreria": 8, "Decor": 7, "Serra Calda": 4, "Serra Fredda": 4}', 'NA', 'nancy@nicoragarden.it', '340 2000020', '1234', false, 20, false)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    skills = EXCLUDED.skills,
    pin = EXCLUDED.pin,
    is_active = EXCLUDED.is_active;

-- Richieste dimostrative iniziali
INSERT INTO shift_requests (id, requester_id, location_id, type, target_employee_id, shift_date, target_shift_date, reason, status, manager_note) VALUES
('req-1', 'emp-gz-5', 'gazzada', 'swap', 'emp-gz-8', CURRENT_DATE, NULL, 'Visita dal dentista programmata al mattino', 'pending', NULL),
('req-2', 'emp-gz-3', 'gazzada', 'leave', NULL, CURRENT_DATE + INTERVAL '2 days', NULL, 'Gita in montagna programmata (giorno di riposo desiderato)', 'approved', 'Concordato giorno alternativo'),
('req-3', 'emp-va-3', 'varese', 'leave', NULL, CURRENT_DATE + INTERVAL '3 days', NULL, 'Permesso speciale fiera florovivaistica', 'pending', NULL)
ON CONFLICT (id) DO NOTHING;
