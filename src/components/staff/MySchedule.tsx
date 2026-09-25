import React from 'react';
import { Employee, LocationId, Shift } from '../../domain/types';
import { MyScheduleMobile } from './MyScheduleMobile';
import { MyScheduleDesktop } from './MyScheduleDesktop';

interface MyScheduleProps {
  currentEmployee: Employee;
  shifts: Shift[];
  activeLocation: LocationId;
  onSaveEmployee?: (emp: Employee) => void;
}

export const MySchedule: React.FC<MyScheduleProps> = (props) => {
  return (
    <>
      {/* Vista Mobile pura (< 768px): fedele al mockup Stitch 6f1cba320977492e8b9cb8a083cd39a7 */}
      <div className="block md:hidden">
        <MyScheduleMobile {...props} />
      </div>

      {/* Vista Desktop / Tablet (>= 768px): fedele al mockup Stitch 428e28affb1f484ea6ae7760ad8e26b0 */}
      <div className="hidden md:block">
        <MyScheduleDesktop {...props} />
      </div>
    </>
  );
};
