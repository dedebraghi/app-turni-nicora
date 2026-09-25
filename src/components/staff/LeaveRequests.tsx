import React from 'react';
import { Employee, LocationId, ShiftRequest } from '../../domain/types';
import { LeaveRequestsMobile } from './LeaveRequestsMobile';
import { LeaveRequestsDesktop } from './LeaveRequestsDesktop';

interface LeaveRequestsProps {
  currentEmployeeId: string;
  employees: Employee[];
  requests: ShiftRequest[];
  onSubmitRequest: (newReq: Omit<ShiftRequest, 'id' | 'createdAt' | 'status'>) => void;
  isManagerMode: boolean;
  onUpdateStatus: (id: string, status: 'approved' | 'rejected', note?: string) => void;
  activeLocation: LocationId;
}

export const LeaveRequests: React.FC<LeaveRequestsProps> = (props) => {
  return (
    <>
      {/* Vista Mobile pura (< 768px): fedele al mockup Stitch 5d2fb10123aa4eceb547e4406a74e4b8 */}
      <div className="block md:hidden">
        <LeaveRequestsMobile {...props} />
      </div>

      {/* Vista Desktop / Tablet (>= 768px): fedele al mockup Stitch 212d1e3ff7974a8b8df857d245d42f94 */}
      <div className="hidden md:block">
        <LeaveRequestsDesktop {...props} />
      </div>
    </>
  );
};
