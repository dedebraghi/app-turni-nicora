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

-- Collaboratori Gazzada (10 dipendenti con PIN '1234')
INSERT INTO employees (id, name, location_id, role, skills, avatar, email, phone, pin, is_manager, contract_hours) VALUES
('emp-gz-1', 'Marco V.', 'gazzada', 'Serra Calda', '{"Cassa": 7, "Fioreria": 5, "Decor": 6, "Serra Calda": 10, "Serra Fredda": 8}', 'MV', 'marco.v@nicoragarden.it', '340 1234567', '1234', true, 40),
('emp-gz-2', 'Elena R.', 'gazzada', 'Cassa', '{"Cassa": 10, "Fioreria": 4, "Decor": 5, "Serra Calda": 3, "Serra Fredda": 2}', 'ER', 'elena.r@nicoragarden.it', '347 2345678', '1234', false, 40),
('emp-gz-3', 'Cecilia T.', 'gazzada', 'Fioreria', '{"Cassa": 8, "Fioreria": 10, "Decor": 7, "Serra Calda": 4, "Serra Fredda": 3}', 'CT', 'cecilia.t@nicoragarden.it', '333 3456789', '1234', false, 40),
('emp-gz-4', 'Davide G.', 'gazzada', 'Cassa', '{"Cassa": 10, "Fioreria": 6, "Decor": 5, "Serra Calda": 7, "Serra Fredda": 6}', 'DG', 'davide.g@nicoragarden.it', '339 4567890', '1234', false, 40),
('emp-gz-5', 'Luca B.', 'gazzada', 'Serra Fredda', '{"Cassa": 3, "Fioreria": 2, "Decor": 4, "Serra Calda": 7, "Serra Fredda": 10}', 'LB', 'luca.b@nicoragarden.it', '328 5678901', '1234', false, 40),
('emp-gz-6', 'Chiara M.', 'gazzada', 'Decor', '{"Cassa": 6, "Fioreria": 7, "Decor": 10, "Serra Calda": 3, "Serra Fredda": 2}', 'CM', 'chiara.m@nicoragarden.it', '349 6789012', '1234', false, 40),
('emp-gz-7', 'Simona T.', 'gazzada', 'Cassa', '{"Cassa": 9, "Fioreria": 4, "Decor": 6, "Serra Calda": 3, "Serra Fredda": 2}', 'ST', 'simona.t@nicoragarden.it', '338 7890123', '1234', false, 40),
('emp-gz-8', 'Paolo F.', 'gazzada', 'Serra Fredda', '{"Cassa": 4, "Fioreria": 2, "Decor": 3, "Serra Calda": 8, "Serra Fredda": 9}', 'PF', 'paolo.f@nicoragarden.it', '345 8901234', '1234', false, 40),
('emp-gz-9', 'Valentina B.', 'gazzada', 'Fioreria', '{"Cassa": 6, "Fioreria": 9, "Decor": 8, "Serra Calda": 4, "Serra Fredda": 3}', 'VB', 'valentina.b@nicoragarden.it', '342 9012345', '1234', false, 40),
('emp-gz-10', 'Matteo R.', 'gazzada', 'Decor', '{"Cassa": 5, "Fioreria": 5, "Decor": 9, "Serra Calda": 6, "Serra Fredda": 7}', 'MR', 'matteo.r@nicoragarden.it', '331 0123456', '1234', false, 40)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    skills = EXCLUDED.skills,
    pin = EXCLUDED.pin;

-- Collaboratori Varese (14 dipendenti con PIN '1234' e Vittore con 'admin')
INSERT INTO employees (id, name, location_id, role, skills, avatar, email, phone, pin, is_manager, contract_hours) VALUES
('emp-va-1', 'Vittore Nicora', 'varese', 'Serra Calda', '{"Cassa": 8, "Fioreria": 8, "Decor": 8, "Serra Calda": 10, "Serra Fredda": 10}', 'VN', 'vittore@nicoragarden.it', '335 1122334', 'admin', true, 40),
('emp-va-2', 'Andrea P.', 'varese', 'Cassa', '{"Cassa": 10, "Fioreria": 5, "Decor": 7, "Serra Calda": 7, "Serra Fredda": 6}', 'AP', 'andrea.p@nicoragarden.it', '348 2233445', '1234', true, 40),
('emp-va-3', 'Silvia M.', 'varese', 'Fioreria', '{"Cassa": 7, "Fioreria": 10, "Decor": 8, "Serra Calda": 4, "Serra Fredda": 3}', 'SM', 'silvia.m@nicoragarden.it', '339 3344556', '1234', false, 40),
('emp-va-4', 'Roberto C.', 'varese', 'Serra Calda', '{"Cassa": 5, "Fioreria": 4, "Decor": 4, "Serra Calda": 10, "Serra Fredda": 9}', 'RC', 'roberto.c@nicoragarden.it', '320 4455667', '1234', false, 40),
('emp-va-5', 'Francesca L.', 'varese', 'Cassa', '{"Cassa": 10, "Fioreria": 6, "Decor": 6, "Serra Calda": 3, "Serra Fredda": 3}', 'FL', 'francesca.l@nicoragarden.it', '347 5566778', '1234', false, 40),
('emp-va-6', 'Giorgio D.', 'varese', 'Serra Fredda', '{"Cassa": 3, "Fioreria": 2, "Decor": 3, "Serra Calda": 7, "Serra Fredda": 10}', 'GD', 'giorgio.d@nicoragarden.it', '333 6677889', '1234', false, 40),
('emp-va-7', 'Giulia B.', 'varese', 'Decor', '{"Cassa": 6, "Fioreria": 7, "Decor": 10, "Serra Calda": 3, "Serra Fredda": 3}', 'GB', 'giulia.b@nicoragarden.it', '340 7788990', '1234', false, 40),
('emp-va-8', 'Stefano F.', 'varese', 'Serra Calda', '{"Cassa": 4, "Fioreria": 3, "Decor": 4, "Serra Calda": 10, "Serra Fredda": 8}', 'SF', 'stefano.f@nicoragarden.it', '329 8899001', '1234', false, 40),
('emp-va-9', 'Laura G.', 'varese', 'Cassa', '{"Cassa": 9, "Fioreria": 8, "Decor": 5, "Serra Calda": 4, "Serra Fredda": 3}', 'LG', 'laura.g@nicoragarden.it', '346 9900112', '1234', false, 40),
('emp-va-10', 'Carlo V.', 'varese', 'Decor', '{"Cassa": 4, "Fioreria": 5, "Decor": 9, "Serra Calda": 6, "Serra Fredda": 6}', 'CV', 'carlo.v@nicoragarden.it', '338 0011223', '1234', false, 40),
('emp-va-11', 'Monica S.', 'varese', 'Fioreria', '{"Cassa": 6, "Fioreria": 9, "Decor": 7, "Serra Calda": 3, "Serra Fredda": 3}', 'MS', 'monica.s@nicoragarden.it', '335 1122445', '1234', false, 40),
('emp-va-12', 'Alessandro N.', 'varese', 'Serra Fredda', '{"Cassa": 4, "Fioreria": 3, "Decor": 4, "Serra Calda": 8, "Serra Fredda": 10}', 'AN', 'alessandro.n@nicoragarden.it', '349 2233556', '1234', false, 40),
('emp-va-13', 'Elisa M.', 'varese', 'Cassa', '{"Cassa": 9, "Fioreria": 5, "Decor": 6, "Serra Calda": 3, "Serra Fredda": 2}', 'EM', 'elisa.m@nicoragarden.it', '347 3344667', '1234', false, 40),
('emp-va-14', 'Federico P.', 'varese', 'Serra Fredda', '{"Cassa": 5, "Fioreria": 3, "Decor": 4, "Serra Calda": 7, "Serra Fredda": 9}', 'FP', 'federico.p@nicoragarden.it', '328 4455778', '1234', false, 40)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    skills = EXCLUDED.skills,
    pin = EXCLUDED.pin;

-- Richieste dimostrative iniziali
INSERT INTO shift_requests (id, requester_id, location_id, type, target_employee_id, shift_date, target_shift_date, reason, status, manager_note) VALUES
('req-1', 'emp-gz-5', 'gazzada', 'swap', 'emp-gz-8', CURRENT_DATE, NULL, 'Visita dal dentista programmata al mattino', 'pending', NULL),
('req-2', 'emp-gz-3', 'gazzada', 'leave', NULL, CURRENT_DATE + INTERVAL '2 days', NULL, 'Gita in montagna programmata (giorno di riposo desiderato)', 'approved', 'Concordato giorno alternativo'),
('req-3', 'emp-va-3', 'varese', 'leave', NULL, CURRENT_DATE + INTERVAL '3 days', NULL, 'Permesso speciale fiera florovivaistica', 'pending', NULL)
ON CONFLICT (id) DO NOTHING;
