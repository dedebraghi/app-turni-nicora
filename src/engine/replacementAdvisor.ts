import { Department, Employee, ReplacementSuggestion, Shift } from '../domain/types';

export interface FindReplacementParams {
  targetShift: Shift;
  targetDepartment: Department;
  employees: Employee[];
  shifts: Shift[];
}

/**
 * Consulente Intelligente per Emergenze e Sostituzioni Improvvise:
 * Quando un collaboratore si ammala o si assenta improvvisamente,
 * individua i migliori candidati della sede ordinati per punteggio di competenza,
 * stato attuale del turno nella giornata ed equilibrio orario.
 */
export const findBestReplacements = ({
  targetShift,
  targetDepartment,
  employees,
  shifts,
}: FindReplacementParams): ReplacementSuggestion[] => {
  const storeStaff = employees.filter(
    (e) => e.locationId === targetShift.locationId && e.isActive !== false
  );

  // Escludi il dipendente attualmente titolare del turno
  const candidates = storeStaff.filter((e) => e.id !== targetShift.employeeId);

  const suggestions: ReplacementSuggestion[] = candidates.map((emp) => {
    const reasons: string[] = [];
    let score = 50;

    // 1. Competenza nel reparto richiesto (peso principale: fino a 40 punti)
    const skillScore = emp.skills[targetDepartment] ?? 5;
    score += (skillScore - 5) * 8; // skill 10 -> +40, skill 1 -> -32
    reasons.push(`Competenza in ${targetDepartment}: ${skillScore}/10`);

    // 2. Stato del turno nella data interessata
    const dayShift = shifts.find((s) => s.employeeId === emp.id && s.date === targetShift.date);
    const currentShiftType = dayShift?.type || 'riposo';

    let isAvailableOnDay = false;

    if (currentShiftType === 'riposo') {
      score += 25;
      isAvailableOnDay = true;
      reasons.push('Attualmente a riposo (può subentrare a recupero)');
    } else if (currentShiftType === 'ferie' || currentShiftType === 'malattia') {
      score -= 80;
      isAvailableOnDay = false;
      reasons.push(`Non disponibile (${currentShiftType === 'ferie' ? 'In Ferie' : 'In Malattia'})`);
    } else {
      // È già in servizio: può essere riassegnato a questo reparto se il suo reparto attuale è meno critico
      isAvailableOnDay = true;
      const currentDept = dayShift?.department;
      if (currentDept === 'Cassa' && targetDepartment !== 'Cassa') {
        score -= 40;
        reasons.push('Già assegnato a presidio Cassa (non consigliato spostare)');
      } else if (currentDept === targetDepartment) {
        score -= 20;
        reasons.push(`Già assegnato a ${targetDepartment}`);
      } else {
        score += 10;
        reasons.push(`In servizio in ${currentDept || 'altro reparto'} (può essere riassegnato)`);
      }
    }

    // 3. Ruolo primario di riferimento
    if (emp.role === targetDepartment) {
      score += 15;
      reasons.push(`Reparto primario di riferimento (${emp.role})`);
    }

    return {
      employee: emp,
      score: Math.max(0, Math.min(100, score)),
      reasons,
      isAvailableOnDay,
      currentShiftType,
    };
  });

  // Ordina per disponibilità (liberi/subentro prima) e poi per punteggio decrescente
  return suggestions.sort((a, b) => {
    if (a.isAvailableOnDay !== b.isAvailableOnDay) {
      return a.isAvailableOnDay ? -1 : 1;
    }
    return b.score - a.score;
  });
};
