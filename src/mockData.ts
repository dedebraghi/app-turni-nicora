import { Employee, Shift, ShiftRequest } from './types';

export const MANAGER_MASTER_PASSWORD = 'admin'; // Password master del responsabile per l'MVP

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'emp-1', name: 'Marco V.', role: 'Serre e Piante', avatar: 'MV', email: 'marco@nicoragarden.it', password: '123', isManager: true },
  { id: 'emp-2', name: 'Elena R.', role: 'Cassa', avatar: 'ER', email: 'elena@nicoragarden.it', password: '123' },
  { id: 'emp-3', name: 'Luca B.', role: 'Vivaio Esterno', avatar: 'LB', email: 'luca@nicoragarden.it', password: '123' },
  { id: 'emp-4', name: 'Chiara M.', role: 'Decor & Vasi', avatar: 'CM', email: 'chiara@nicoragarden.it', password: '123' },
  { id: 'emp-5', name: 'Davide G.', role: 'Serre e Piante', avatar: 'DG', email: 'davide@nicoragarden.it', password: '123' },
  { id: 'emp-6', name: 'Simona T.', role: 'Cassa', avatar: 'ST', email: 'simona@nicoragarden.it', password: '123' },
  { id: 'emp-7', name: 'Paolo F.', role: 'Logistica / Consegne', avatar: 'PF', email: 'paolo@nicoragarden.it', password: '123' },
];

export const SHIFT_TIMES = {
  mattina: { start: '08:30', end: '12:30', label: 'Mattina (08:30 - 12:30)' },
  pomeriggio: { start: '14:30', end: '19:30', label: 'Pomeriggio (14:30 - 19:30)' },
  giornata: { start: '08:30', end: '19:30', label: 'Giornata Intera' },
};

// Generatore orari realistici per 7 giorni
export const generateWeeklyMockShifts = (): Shift[] => {
  const shifts: Shift[] = [];
  const today = new Date();
  
  // Ottieni Lunedì della settimana corrente
  const dayOfWeek = today.getDay(); // 0 = Dom, 1 = Lun
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }

  // Schema realistico per Garden Center:
  // Fine settimana (Sab/Dom) rinforzato con presenza massiccia
  const patterns: Record<string, ('mattina' | 'pomeriggio' | 'giornata' | 'riposo' | 'ferie')[]> = {
    'emp-1': ['giornata', 'mattina', 'pomeriggio', 'riposo', 'giornata', 'giornata', 'mattina'], // Marco (Resp)
    'emp-2': ['mattina', 'mattina', 'pomeriggio', 'giornata', 'riposo', 'giornata', 'pomeriggio'], // Elena (Cassa)
    'emp-3': ['pomeriggio', 'riposo', 'mattina', 'pomeriggio', 'giornata', 'giornata', 'giornata'], // Luca (Vivaio)
    'emp-4': ['mattina', 'pomeriggio', 'riposo', 'mattina', 'pomeriggio', 'giornata', 'pomeriggio'], // Chiara (Decor)
    'emp-5': ['riposo', 'giornata', 'giornata', 'mattina', 'pomeriggio', 'giornata', 'giornata'], // Davide (Serre)
    'emp-6': ['pomeriggio', 'pomeriggio', 'mattina', 'riposo', 'mattina', 'mattina', 'giornata'], // Simona (Cassa)
    'emp-7': ['mattina', 'mattina', 'pomeriggio', 'giornata', 'giornata', 'riposo', 'riposo'], // Paolo (Logistica)
  };

  const areas: Record<string, string> = {
    'emp-1': 'Serra Tropicale & Coordinamento',
    'emp-2': 'Cassa Centrale & Info Point',
    'emp-3': 'Piante da Esterno & Terricci',
    'emp-4': 'Fioristeria & Confezioni',
    'emp-5': 'Bonsai & Orchidee',
    'emp-6': 'Cassa 2 & Ricevimento Merci',
    'emp-7': 'Scarico Fornitori & Spedizioni',
  };

  INITIAL_EMPLOYEES.forEach((emp) => {
    const pattern = patterns[emp.id] || ['mattina', 'pomeriggio', 'riposo', 'giornata', 'mattina', 'giornata', 'riposo'];
    dates.forEach((date, idx) => {
      const type = pattern[idx];
      shifts.push({
        id: `shift-${emp.id}-${date}`,
        employeeId: emp.id,
        date,
        type,
        startTime: type === 'mattina' ? '08:30' : type === 'pomeriggio' ? '14:30' : type === 'giornata' ? '08:30' : undefined,
        endTime: type === 'mattina' ? '12:30' : type === 'pomeriggio' ? '19:30' : type === 'giornata' ? '19:30' : undefined,
        areaNote: areas[emp.id],
      });
    });
  });

  return shifts;
};

export const INITIAL_REQUESTS: ShiftRequest[] = [
  {
    id: 'req-1',
    requesterId: 'emp-3',
    type: 'swap',
    targetEmployeeId: 'emp-5',
    shiftDate: new Date().toISOString().split('T')[0],
    reason: 'Visita medica imprevista al mattino',
    status: 'pending',
    createdAt: 'Oggi alle 08:15',
  },
  {
    id: 'req-2',
    requesterId: 'emp-4',
    type: 'leave',
    shiftDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    reason: 'Corso aggiornamento floricoltura',
    status: 'approved',
    createdAt: 'Ieri alle 17:30',
  }
];
