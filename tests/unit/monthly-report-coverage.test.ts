import { describe, it, expect } from 'vitest';
import { calculateMonthlyStoreReport } from '../../src/services/exportService';
import { Employee, Shift } from '../../src/domain/types';

describe('Monthly Store Report & Coverage Audit', () => {
  const employees: Employee[] = [
    {
      id: 'emp-gz-1',
      name: 'Sabrina',
      role: 'Cassa',
      locationId: 'gazzada',
      contractHours: 40,
      skills: { Cassa: 9, Fioreria: 5, Decor: 5, 'Serra Calda': 5, 'Serra Fredda': 5 },
      avatar: 'S',
      isActive: true,
    },
    {
      id: 'emp-mob-1',
      name: 'Marco Mobile',
      role: 'Fioreria',
      locationId: 'varese', // Base a Varese
      isMobile: true,       // Personale mobile
      contractHours: 40,
      skills: { Cassa: 5, Fioreria: 9, Decor: 5, 'Serra Calda': 5, 'Serra Fredda': 5 },
      avatar: 'M',
      isActive: true,
    },
    {
      id: 'emp-archived',
      name: 'Ex Dipendente',
      role: 'Cassa',
      locationId: 'gazzada',
      contractHours: 40,
      skills: { Cassa: 5, Fioreria: 5, Decor: 5, 'Serra Calda': 5, 'Serra Fredda': 5 },
      avatar: 'E',
      isActive: false, // Archiviato senza turni
    },
  ];

  it('detects partial coverage and generates specific missing days warning', () => {
    // Turni a Gazzada solo dal giorno 8 al 31 ottobre (giorni 1-7 mancanti)
    const shifts: Shift[] = [];
    for (let day = 8; day <= 31; day++) {
      const dateStr = `2026-10-${day.toString().padStart(2, '0')}`;
      shifts.push({
        id: `s-${day}`,
        employeeId: 'emp-gz-1',
        locationId: 'gazzada',
        date: dateStr,
        type: 'giornata',
        startTime: '08:30',
        endTime: '19:30',
        department: 'Cassa',
      });
    }

    const report = calculateMonthlyStoreReport(employees, shifts, 'gazzada', 2026, 10);

    expect(report.coverage).toBeDefined();
    expect(report.coverage?.isFullyCovered).toBe(false);
    expect(report.coverage?.recordedDaysCount).toBe(24);
    expect(report.coverage?.daysInMonth).toBe(31);
    expect(report.coverage?.missingRangesText).toContain("dall'1 al 7 Ottobre");
    expect(report.coverage?.coverageWarning).toContain("dall'1 al 7 Ottobre");
    expect(report.coverage?.coverageWarning).toContain("non risultavano segnati sull'applicazione");
  });

  it('strictly isolates location shifts and handles mobile staff correctly', () => {
    const shifts: Shift[] = [
      // Sabrina a Gazzada: 8h Cassa
      {
        id: 's1',
        employeeId: 'emp-gz-1',
        locationId: 'gazzada',
        date: '2026-10-10',
        type: 'giornata',
        startTime: '08:30',
        endTime: '19:30',
        department: 'Cassa',
      },
      // Marco Mobile fa 8h a Gazzada (Fioreria)
      {
        id: 's2',
        employeeId: 'emp-mob-1',
        locationId: 'gazzada',
        date: '2026-10-10',
        type: 'giornata',
        startTime: '08:30',
        endTime: '19:30',
        department: 'Fioreria',
      },
      // Marco Mobile fa anche 16h a Varese
      {
        id: 's3',
        employeeId: 'emp-mob-1',
        locationId: 'varese',
        date: '2026-10-11',
        type: 'giornata',
        startTime: '08:30',
        endTime: '19:30',
        department: 'Fioreria',
      },
      {
        id: 's4',
        employeeId: 'emp-mob-1',
        locationId: 'varese',
        date: '2026-10-12',
        type: 'giornata',
        startTime: '08:30',
        endTime: '19:30',
        department: 'Fioreria',
      },
    ];

    // Report di Gazzada
    const gazzadaReport = calculateMonthlyStoreReport(employees, shifts, 'gazzada', 2026, 10);

    // Marco Mobile deve essere incluso nel report di Gazzada perché ha lavorato a Gazzada
    const marcoGz = gazzadaReport.employeeSummaries.find((s) => s.employee.id === 'emp-mob-1');
    expect(marcoGz).toBeDefined();
    expect(marcoGz?.isMobile).toBe(true);
    expect(marcoGz?.workedHours).toBe(8); // Solo le 8 ore fatte a Gazzada!
    expect(marcoGz?.otherLocationHours).toBe(16); // 16 ore fatte a Varese
    expect(marcoGz?.otherLocationName).toBe('Varese Centro');

    // Totale ore lavorate su Gazzada
    expect(gazzadaReport.totalWorkedHours).toBe(16); // 8h Sabrina + 8h Marco

    // Ex dipendente archiviato senza turni non deve essere incluso
    const archived = gazzadaReport.employeeSummaries.find((s) => s.employee.id === 'emp-archived');
    expect(archived).toBeUndefined();

    // Report di Varese
    const vareseReport = calculateMonthlyStoreReport(employees, shifts, 'varese', 2026, 10);
    const marcoVa = vareseReport.employeeSummaries.find((s) => s.employee.id === 'emp-mob-1');
    expect(marcoVa).toBeDefined();
    expect(marcoVa?.workedHours).toBe(16); // A Varese ha fatto 16 ore
    expect(marcoVa?.otherLocationHours).toBe(8); // A Gazzada ne ha fatte 8
  });
});
