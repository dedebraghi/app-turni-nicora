import { Employee, Shift } from '../domain/types';

export interface EmployeeFairnessMetrics {
  employeeId: string;
  employeeName: string;
  totalWorkingShifts: number;
  weekendWorkingShifts: number; // Sabato + Domenica lavorati
  weekendRestDays: number;     // Sabato o Domenica di riposo goduti
  ferieDays: number;
  malattiaDays: number;
  fairnessScore: number;       // Indice di equità (0 - 100)
  alerts: string[];
}

/**
 * Calcola le metriche di equità della pianificazione:
 * Aiuta a prevenire le tensioni tra il personale ("hai dato a quello 2 giorni nel weekend e a me mai").
 */
export const calculateFairnessMetrics = (
  employees: Employee[],
  shifts: Shift[]
): Record<string, EmployeeFairnessMetrics> => {
  const result: Record<string, EmployeeFairnessMetrics> = {};

  employees.forEach((emp) => {
    const empShifts = shifts.filter((s) => s.employeeId === emp.id);

    let totalWorkingShifts = 0;
    let weekendWorkingShifts = 0;
    let weekendRestDays = 0;
    let ferieDays = 0;
    let malattiaDays = 0;
    const alerts: string[] = [];

    empShifts.forEach((s) => {
      const date = new Date(s.date);
      const day = date.getDay(); // 0 = Dom, 6 = Sab
      const isWeekend = day === 0 || day === 6;

      if (s.type === 'riposo') {
        if (isWeekend) weekendRestDays++;
      } else if (s.type === 'ferie') {
        ferieDays++;
      } else if (s.type === 'malattia') {
        malattiaDays++;
      } else {
        totalWorkingShifts++;
        if (isWeekend) weekendWorkingShifts++;
      }
    });

    // Alert controlli
    if (totalWorkingShifts > 5) {
      alerts.push(`Superati 5 giorni lavorativi nella settimana (${totalWorkingShifts} turni)`);
    } else if (totalWorkingShifts < 5 && ferieDays === 0 && malattiaDays === 0) {
      alerts.push(`Meno di 5 giorni lavorativi programmati (${totalWorkingShifts} turni)`);
    }

    if (weekendWorkingShifts === 2) {
      // Ha lavorato sia Sabato che Domenica
      // alerts.push('In servizio sia Sabato che Domenica');
    }

    // Punteggio equità base 100
    let fairnessScore = 100;
    if (alerts.length > 0) fairnessScore -= alerts.length * 15;

    result[emp.id] = {
      employeeId: emp.id,
      employeeName: emp.name,
      totalWorkingShifts,
      weekendWorkingShifts,
      weekendRestDays,
      ferieDays,
      malattiaDays,
      fairnessScore: Math.max(20, fairnessScore),
      alerts,
    };
  });

  return result;
};
