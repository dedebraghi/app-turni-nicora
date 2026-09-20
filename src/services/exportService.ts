import { Department, Employee, LocationId, LocationInfo, MonthlyEmployeeSummary, MonthlyStoreSummary, Shift, WeekDayMeta } from '../domain/types';
import { DEPARTMENTS } from '../domain/rules';
import { getLeaveHours, getShiftHours } from '../engine/schedulerEngine';

interface ExportParams {

  location: LocationInfo;
  weekDays: WeekDayMeta[];
  employees: Employee[];
  shifts: Shift[];
}

/**
 * Genera il testo formattato per la condivisione rapida della pianificazione turni su WhatsApp
 */
export const generateWhatsAppScheduleText = ({
  location,
  weekDays,
  employees,
  shifts,
}: ExportParams): string => {
  const storeStaff = employees.filter((e) => e.locationId === location.id);
  const startDay = weekDays[0];
  const endDay = weekDays[6];

  let msg = `🌿 *NICORA GARDEN - ${location.name.toUpperCase()}*\n`;
  msg += `📅 *Turni Settimana: ${startDay.dayShort} ${startDay.dayNum} ➔ ${endDay.dayShort} ${endDay.dayNum}*\n`;
  msg += `----------------------------------------\n\n`;

  weekDays.forEach((day) => {
    msg += `📆 *${day.dayName.toUpperCase()} ${day.dayNum}*\n`;

    const dayShifts = shifts.filter((s) => s.locationId === location.id && s.date === day.dateStr);

    const working = dayShifts.filter((s) => s.type !== 'riposo' && s.type !== 'ferie' && s.type !== 'malattia');
    const off = dayShifts.filter((s) => s.type === 'riposo' || s.type === 'ferie' || s.type === 'malattia');

    // Cassa
    const cassaStaff = working.filter((s) => s.department === 'Cassa');
    if (cassaStaff.length > 0) {
      msg += `  🔴 *Cassa:* ${cassaStaff.map((s) => {
        const emp = storeStaff.find((e) => e.id === s.employeeId);
        return `${emp?.name} (${s.startTime || '08:30'}-${s.endTime || '19:30'})`;
      }).join(', ')}\n`;
    } else {
      msg += `  ⚠️ *Cassa: SCOPERTA!*\n`;
    }

    // Altri Reparti
    const otherStaff = working.filter((s) => s.department !== 'Cassa');
    if (otherStaff.length > 0) {
      msg += `  🌱 *Reparti:* ${otherStaff.map((s) => {
        const emp = storeStaff.find((e) => e.id === s.employeeId);
        return `${emp?.name} [${s.department || emp?.role}]`;
      }).join(', ')}\n`;
    }

    // Riposo / Ferie
    if (off.length > 0) {
      msg += `  ☕ *Riposo/Ferie:* ${off.map((s) => {
        const emp = storeStaff.find((e) => e.id === s.employeeId);
        return `${emp?.name} (${s.type === 'ferie' ? '🌴 Ferie' : 'Riposo'})`;
      }).join(', ')}\n`;
    }

    msg += `\n`;
  });

  msg += `📌 *Note:* Rispettare puntualmente gli orari di apertura e le pause concordate.\n`;
  msg += `_Generato tramite App Turni Nicora Garden_`;

  return msg;
};

/**
 * Apre la finestra di stampa del browser con la griglia settimanale formattata ad alta risoluzione (A4 Orizzontale)
 */
export const printWeeklyBoard = ({
  location,
  weekDays,
  employees,
  shifts,
}: ExportParams) => {
  const storeStaff = employees.filter((e) => e.locationId === location.id);
  const startDay = weekDays[0];
  const endDay = weekDays[6];

  const printWindow = window.open('', '_blank', 'width=1100,height=800');
  if (!printWindow) {
    alert('Attiva i popup nel browser per stampare il tabellone.');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="utf-8">
      <title>Bacheca Turni - ${location.name}</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 10mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #222;
          margin: 0;
          padding: 10px;
          font-size: 11px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #035F64;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }
        .title {
          font-size: 18px;
          font-weight: 900;
          color: #035F64;
          margin: 0;
        }
        .subtitle {
          font-size: 12px;
          color: #E75113;
          font-weight: bold;
          margin-top: 2px;
        }
        .meta {
          text-align: right;
          font-size: 11px;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 6px 4px;
          text-align: center;
          vertical-align: middle;
        }
        th {
          background-color: #f3f7f7;
          color: #035F64;
          font-weight: 800;
          font-size: 11px;
        }
        th.emp-col {
          width: 150px;
          text-align: left;
          padding-left: 8px;
        }
        th.weekend {
          background-color: #fff6ed;
          color: #b43403;
        }
        td.emp-name {
          text-align: left;
          font-weight: bold;
          padding-left: 8px;
          background-color: #fafafa;
        }
        .dept-cassa {
          background-color: #fee2e2;
          color: #991b1b;
          font-weight: 900;
          border-radius: 4px;
          padding: 3px 2px;
        }
        .dept-fioreria {
          background-color: #fce7f3;
          color: #9d174d;
          font-weight: bold;
          border-radius: 4px;
          padding: 3px 2px;
        }
        .dept-decor {
          background-color: #f3e8ff;
          color: #6b21a8;
          font-weight: bold;
          border-radius: 4px;
          padding: 3px 2px;
        }
        .dept-serra {
          background-color: #e0f2fe;
          color: #0369a1;
          font-weight: bold;
          border-radius: 4px;
          padding: 3px 2px;
        }
        .type-riposo {
          color: #999;
          font-style: italic;
          background-color: #f9f9f9;
        }
        .type-ferie {
          background-color: #ede9fe;
          color: #5b21b6;
          font-weight: bold;
        }
        .hours {
          display: block;
          font-size: 9px;
          color: #555;
          margin-top: 2px;
        }
        .footer {
          margin-top: 15px;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #888;
          border-top: 1px dashed #ccc;
          padding-top: 6px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="title">NICORA GARDEN CENTER — ${location.name.toUpperCase()}</h1>
          <div class="subtitle">TABELLONE TURNI: DOMENICA ${startDay.dayNum} ➔ SABATO ${endDay.dayNum}</div>
        </div>
        <div class="meta">
          <div>Orario: Lun-Dom 08:30–19:30</div>
          <div>Stampato il: ${new Date().toLocaleDateString('it-IT')}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th class="emp-col">Collaboratore</th>
            ${weekDays.map((d) => `
              <th class="${d.isWeekend ? 'weekend' : ''}">
                ${d.dayShort.toUpperCase()}<br>${d.dayNum}
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${storeStaff.map((emp) => {
            return `
              <tr>
                <td class="emp-name">
                  ${emp.name}
                  <div style="font-size: 9px; color: #888; font-weight: normal;">${emp.role}</div>
                </td>
                ${weekDays.map((d) => {
                  const shift = shifts.find((s) => s.employeeId === emp.id && s.date === d.dateStr);
                  if (!shift) return '<td>-</td>';

                  if (shift.type === 'riposo') {
                    return '<td class="type-riposo">Riposo</td>';
                  }
                  if (shift.type === 'ferie') {
                    return '<td class="type-ferie">🌴 Ferie</td>';
                  }

                  let deptClass = 'dept-serra';
                  if (shift.department === 'Cassa') deptClass = 'dept-cassa';
                  else if (shift.department === 'Fioreria') deptClass = 'dept-fioreria';
                  else if (shift.department === 'Decor') deptClass = 'dept-decor';

                  return `
                    <td>
                      <div class="${deptClass}">${shift.department || emp.role}</div>
                      <span class="hours">${shift.startTime || '08:30'} - ${shift.endTime || '19:30'}</span>
                    </td>
                  `;
                }).join('')}
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <div class="footer">
        <div>Presidio Cassa contrassegnato in rosso • 5 giorni lavorativi su 7 garantiti</div>
        <div>Nicora Garden Management Suite</div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

const ITALIAN_MONTHS = [
  'Gennaio',
  'Febbraio',
  'Marzo',
  'Aprile',
  'Maggio',
  'Giugno',
  'Luglio',
  'Agosto',
  'Settembre',
  'Ottobre',
  'Novembre',
  'Dicembre',
];

/**
 * Calcola l'aggregazione analitica mensile delle ore per ciascun collaboratore e per reparto
 */
export const calculateMonthlyStoreReport = (
  employees: Employee[],
  shifts: Shift[],
  locationId: LocationId,
  year: number,
  month: number // 1 - 12
): MonthlyStoreSummary => {
  const monthStr = month.toString().padStart(2, '0');
  const monthPrefix = `${year}-${monthStr}`;
  const monthLabel = `${ITALIAN_MONTHS[month - 1]} ${year}`;

  // Calcolo giorni di calendario e giorni lavorativi teorici del mese (su base 5gg lavorativi a settimana)
  const daysInMonth = new Date(year, month, 0).getDate();
  const standardWorkingDays = Math.round((daysInMonth / 7) * 5);

  const storeEmployees = employees.filter((e) => e.locationId === locationId);

  const departmentTotals: Record<Department, number> = {
    Cassa: 0,
    Fioreria: 0,
    Decor: 0,
    'Serra Calda': 0,
    'Serra Fredda': 0,
  };

  let totalWorkedHours = 0;
  let totalLeaveHours = 0;
  let totalPresenceDays = 0;
  let totalRestDays = 0;
  let totalLeaveDays = 0;
  let totalSickDays = 0;

  const employeeSummaries: MonthlyEmployeeSummary[] = storeEmployees.map((emp) => {
    const empShifts = shifts.filter(
      (s) => s.employeeId === emp.id && s.date.startsWith(monthPrefix)
    );

    const deptHours: Record<Department, number> = {
      Cassa: 0,
      Fioreria: 0,
      Decor: 0,
      'Serra Calda': 0,
      'Serra Fredda': 0,
    };

    let empWorked = 0;
    let empLeave = 0;
    let presence = 0;
    let rest = 0;
    let leave = 0;
    let sick = 0;

    empShifts.forEach((shift) => {
      if (shift.type === 'riposo') {
        rest++;
      } else if (shift.type === 'ferie') {
        leave++;
        const lh = getLeaveHours(shift, emp);
        empLeave += lh;
      } else if (shift.type === 'malattia') {
        sick++;
        const lh = getLeaveHours(shift, emp);
        empLeave += lh;
      } else {
        // Turno lavorativo effettivo
        presence++;
        const hours = getShiftHours(shift);
        empWorked += hours;

        const assignedDept = (shift.department || emp.role) as Department;
        if (assignedDept && deptHours[assignedDept] !== undefined) {
          deptHours[assignedDept] = Math.round((deptHours[assignedDept] + hours) * 10) / 10;
        }
      }
    });

    // Aggregazione totali per reparto di sede
    DEPARTMENTS.forEach((dept) => {
      departmentTotals[dept] = Math.round((departmentTotals[dept] + deptHours[dept]) * 10) / 10;
    });

    const roundedWorked = Math.round(empWorked * 10) / 10;
    const roundedLeave = Math.round(empLeave * 10) / 10;
    const totalAccounted = Math.round((roundedWorked + roundedLeave) * 10) / 10;

    // Ore teoriche di contratto previste per il mese
    const weeklyContract = emp.contractHours || 40;
    const expectedMonthly = Math.round((weeklyContract / 5) * standardWorkingDays * 10) / 10;
    const deltaHours = Math.round((totalAccounted - expectedMonthly) * 10) / 10;

    totalWorkedHours += roundedWorked;
    totalLeaveHours += roundedLeave;
    totalPresenceDays += presence;
    totalRestDays += rest;
    totalLeaveDays += leave;
    totalSickDays += sick;

    return {
      employee: emp,
      workedHours: roundedWorked,
      leaveHours: roundedLeave,
      totalAccountedHours: totalAccounted,
      departmentHours: deptHours,
      daysCount: {
        presence,
        rest,
        leave,
        sick,
      },
      expectedMonthlyHours: expectedMonthly,
      deltaHours,
    };
  });

  return {
    year,
    month,
    monthLabel,
    locationId,
    totalWorkedHours: Math.round(totalWorkedHours * 10) / 10,
    totalLeaveHours: Math.round(totalLeaveHours * 10) / 10,
    totalAccountedHours: Math.round((totalWorkedHours + totalLeaveHours) * 10) / 10,
    departmentTotals,
    totalPresenceDays,
    totalRestDays,
    totalLeaveDays,
    totalSickDays,
    employeeSummaries,
  };
};

/**
 * Scarica il file CSV formattato specificamente per Microsoft Excel / Fogli Google (Standard Italiano: BOM UTF-8 e separatore ;)
 */
export const exportMonthlyReportCSV = (
  summary: MonthlyStoreSummary,
  locationName: string
) => {
  const headers = [
    'Collaboratore',
    'Sede',
    'Stato',
    'Ruolo Primario',
    'Ore Contratto Sett.',
    'Giorni Presenza',
    'Giorni Riposo',
    'Giorni Ferie',
    'Giorni Malattia',
    'Ore Cassa',
    'Ore Fioreria',
    'Ore Decor',
    'Ore Serra Calda',
    'Ore Serra Fredda',
    'Totale Ore Lavorate',
    'Ore Ferie/Malattia',
    'Totale Ore Rendicontate',
    'Ore Teoriche Mese',
    'Saldo Ore (+/-)',
  ];

  const escapeCell = (val: string | number) => {
    if (typeof val === 'number') {
      // Localizzazione decimale con virgola per Excel italiano
      return `"${val.toString().replace('.', ',')}"`;
    }
    const clean = (val || '').toString().replace(/"/g, '""');
    return `"${clean}"`;
  };

  const rows: string[] = [];
  rows.push(headers.map(escapeCell).join(';'));

  summary.employeeSummaries.forEach((s) => {
    const row = [
      s.employee.name,
      locationName,
      s.employee.isActive === false ? 'Archiviato' : 'Attivo',
      s.employee.role,
      s.employee.contractHours || 40,
      s.daysCount.presence,
      s.daysCount.rest,
      s.daysCount.leave,
      s.daysCount.sick,
      s.departmentHours.Cassa,
      s.departmentHours.Fioreria,
      s.departmentHours.Decor,
      s.departmentHours['Serra Calda'],
      s.departmentHours['Serra Fredda'],
      s.workedHours,
      s.leaveHours,
      s.totalAccountedHours,
      s.expectedMonthlyHours,
      s.deltaHours > 0 ? `+${s.deltaHours}` : s.deltaHours,
    ];
    rows.push(row.map(escapeCell).join(';'));
  });

  // Riga Totali Sede
  const totalRow = [
    'TOTALE PUNTO VENDITA',
    locationName,
    '-',
    '-',
    '-',
    summary.totalPresenceDays,
    summary.totalRestDays,
    summary.totalLeaveDays,
    summary.totalSickDays,
    summary.departmentTotals.Cassa,
    summary.departmentTotals.Fioreria,
    summary.departmentTotals.Decor,
    summary.departmentTotals['Serra Calda'],
    summary.departmentTotals['Serra Fredda'],
    summary.totalWorkedHours,
    summary.totalLeaveHours,
    summary.totalAccountedHours,
    '-',
    '-',
  ];
  rows.push(totalRow.map(escapeCell).join(';'));

  // Aggiunta BOM UTF-8 per compatibilità con Microsoft Excel
  const csvContent = '\uFEFF' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const monthFormatted = summary.month.toString().padStart(2, '0');
  link.setAttribute(
    'download',
    `nicora_report_ore_${summary.locationId}_${summary.year}_${monthFormatted}.csv`
  );
  link.setAttribute('href', url);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Apre la finestra di stampa per generare un report mensile A4 orizzontale formattato per amministrazione / consulente del lavoro
 */
export const printMonthlyReport = (
  summary: MonthlyStoreSummary,
  locationName: string
) => {
  const printWindow = window.open('', '_blank', 'width=1150,height=850');
  if (!printWindow) {
    alert('Attiva i popup nel browser per visualizzare e stampare il report.');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="utf-8">
      <title>Report Ore Lavorate - Nicora Garden ${locationName} (${summary.monthLabel})</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 10mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #222;
          margin: 0;
          padding: 8px;
          font-size: 11px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2.5px solid #035F64;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }
        .title {
          font-size: 18px;
          font-weight: 900;
          color: #035F64;
          margin: 0;
        }
        .subtitle {
          font-size: 12px;
          color: #E75113;
          font-weight: bold;
          margin-top: 2px;
        }
        .meta {
          text-align: right;
          font-size: 11px;
          color: #666;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }
        .stat-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 6px;
          text-align: center;
        }
        .stat-label {
          font-size: 9px;
          color: #64748b;
          text-transform: uppercase;
          font-weight: bold;
        }
        .stat-value {
          font-size: 15px;
          font-weight: 900;
          color: #035F64;
          margin-top: 2px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 10.5px;
        }
        th, td {
          border: 1px solid #cbd5e1;
          padding: 5px 4px;
          text-align: center;
          vertical-align: middle;
        }
        th {
          background-color: #f1f5f9;
          color: #035F64;
          font-weight: 800;
          font-size: 10px;
        }
        th.emp-col {
          width: 160px;
          text-align: left;
          padding-left: 6px;
        }
        td.emp-name {
          text-align: left;
          font-weight: bold;
          padding-left: 6px;
        }
        .highlight {
          background-color: #f8fafc;
          font-weight: bold;
        }
        .total-worked {
          font-weight: 900;
          color: #035F64;
          background-color: #f0fdf4;
        }
        .totals-row td {
          background-color: #e2e8f0;
          font-weight: 900;
          border-top: 2px solid #035F64;
        }
        .footer {
          margin-top: 20px;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #64748b;
          border-top: 1px dashed #cbd5e1;
          padding-top: 12px;
        }
        .signatures {
          display: flex;
          gap: 60px;
          margin-top: 25px;
        }
        .sig-block {
          border-top: 1px solid #94a3b8;
          width: 200px;
          padding-top: 4px;
          text-align: center;
          font-size: 10px;
          color: #475569;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="title">NICORA GARDEN — ${locationName.toUpperCase()}</h1>
          <div class="subtitle">CONSUNTIVO ORE LAVORATE E PRESENZE: ${summary.monthLabel.toUpperCase()}</div>
        </div>
        <div class="meta">
          <div>Uso: Consulente del Lavoro / Contabilità</div>
          <div>Data Stampa: ${new Date().toLocaleDateString('it-IT')}</div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Ore Lavorate Totali</div>
          <div class="stat-value">${summary.totalWorkedHours}h</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Ore Cassa</div>
          <div class="stat-value">${summary.departmentTotals.Cassa}h</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Ore Fioreria</div>
          <div class="stat-value">${summary.departmentTotals.Fioreria}h</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Ore Decor</div>
          <div class="stat-value">${summary.departmentTotals.Decor}h</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Ore Serre (C+F)</div>
          <div class="stat-value">${Math.round((summary.departmentTotals['Serra Calda'] + summary.departmentTotals['Serra Fredda']) * 10) / 10}h</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Ferie & Malattie</div>
          <div class="stat-value">${summary.totalLeaveDays + summary.totalSickDays} gg (${summary.totalLeaveHours}h)</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th class="emp-col">Collaboratore</th>
            <th style="width: 70px;">Ruolo</th>
            <th style="width: 50px;">Contr.</th>
            <th style="width: 45px;">Pres.</th>
            <th style="width: 45px;">Rip.</th>
            <th style="width: 45px;">Ferie</th>
            <th style="width: 45px;">Mal.</th>
            <th style="width: 50px;">Cassa</th>
            <th style="width: 50px;">Fioreria</th>
            <th style="width: 50px;">Decor</th>
            <th style="width: 50px;">S.Calda</th>
            <th style="width: 50px;">S.Fredda</th>
            <th style="width: 60px;">Tot. Lav.</th>
            <th style="width: 60px;">Ferie/Mal.</th>
            <th style="width: 65px;">Rendicont.</th>
            <th style="width: 55px;">Saldo</th>
          </tr>
        </thead>
        <tbody>
          ${summary.employeeSummaries.map((s) => `
            <tr>
              <td class="emp-name">${s.employee.name}</td>
              <td>${s.employee.role}</td>
              <td>${s.employee.contractHours || 40}h</td>
              <td>${s.daysCount.presence}</td>
              <td>${s.daysCount.rest}</td>
              <td>${s.daysCount.leave}</td>
              <td>${s.daysCount.sick}</td>
              <td>${s.departmentHours.Cassa > 0 ? `${s.departmentHours.Cassa}h` : '-'}</td>
              <td>${s.departmentHours.Fioreria > 0 ? `${s.departmentHours.Fioreria}h` : '-'}</td>
              <td>${s.departmentHours.Decor > 0 ? `${s.departmentHours.Decor}h` : '-'}</td>
              <td>${s.departmentHours['Serra Calda'] > 0 ? `${s.departmentHours['Serra Calda']}h` : '-'}</td>
              <td>${s.departmentHours['Serra Fredda'] > 0 ? `${s.departmentHours['Serra Fredda']}h` : '-'}</td>
              <td class="total-worked">${s.workedHours}h</td>
              <td>${s.leaveHours > 0 ? `${s.leaveHours}h` : '-'}</td>
              <td class="highlight">${s.totalAccountedHours}h</td>
              <td style="color: ${s.deltaHours >= 0 ? '#15803d' : '#b91c1c'}; font-weight: bold;">
                ${s.deltaHours > 0 ? `+${s.deltaHours}h` : `${s.deltaHours}h`}
              </td>
            </tr>
          `).join('')}
          <tr class="totals-row">
            <td class="emp-name">TOTALE SEDE</td>
            <td>-</td>
            <td>-</td>
            <td>${summary.totalPresenceDays}</td>
            <td>${summary.totalRestDays}</td>
            <td>${summary.totalLeaveDays}</td>
            <td>${summary.totalSickDays}</td>
            <td>${summary.departmentTotals.Cassa}h</td>
            <td>${summary.departmentTotals.Fioreria}h</td>
            <td>${summary.departmentTotals.Decor}h</td>
            <td>${summary.departmentTotals['Serra Calda']}h</td>
            <td>${summary.departmentTotals['Serra Fredda']}h</td>
            <td>${summary.totalWorkedHours}h</td>
            <td>${summary.totalLeaveHours}h</td>
            <td>${summary.totalAccountedHours}h</td>
            <td>-</td>
          </tr>
        </tbody>
      </table>

      <div class="signatures">
        <div class="sig-block">Firma Responsabile Sede</div>
        <div class="sig-block">Visto Consulente Paghe / Amministrazione</div>
      </div>

      <div class="footer">
        <div>Documento generato dall'App Turni Nicora Garden per la quadratura presenze del personale.</div>
        <div>Nicora Garden Management Suite</div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

