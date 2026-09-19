import { Employee, LocationInfo, Shift, WeekDayMeta } from '../domain/types';

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
