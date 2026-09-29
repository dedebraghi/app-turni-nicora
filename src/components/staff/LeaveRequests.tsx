import React from 'react';
import { Employee, LocationId, Shift, ShiftRequest, ShiftRequestStatus } from '../../domain/types';
import { LeaveRequestsMobile } from './LeaveRequestsMobile';
import { LeaveRequestsDesktop } from './LeaveRequestsDesktop';

export interface LeaveRequestsProps {
  currentEmployee: Employee;
  currentEmployeeId: string;
  employees: Employee[];
  shifts: Shift[];
  requests: ShiftRequest[];
  onSubmitRequest: (newReq: Omit<ShiftRequest, 'id' | 'createdAt' | 'status'>) => void;
  isManagerMode: boolean;
  onUpdateStatus: (id: string, status: ShiftRequestStatus, note?: string, colleagueNote?: string) => void;
  activeLocation: LocationId;
  onChangeLocation?: (loc: LocationId) => void;
  onLogout?: () => void;
  onSaveEmployee?: (emp: Employee) => void;
}

export const LeaveRequests: React.FC<LeaveRequestsProps> = (props) => {
  return (
    <>
      {/* Vista Mobile pura (< 768px): con MobileHeader e UX due-step scambio turno */}
      <div className="block md:hidden">
        <LeaveRequestsMobile {...props} />
      </div>

      {/* Vista Desktop / Tablet (>= 768px): fedele allo stile Stitch con header e KPI */}
      <div className="hidden md:block">
        <LeaveRequestsDesktop {...props} />
      </div>
    </>
  );
};

