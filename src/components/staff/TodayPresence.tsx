import React from 'react';
import { Employee, LocationId, Shift } from '../../domain/types';
import { TodayPresenceMobile } from './TodayPresenceMobile';
import { TodayPresenceDesktop } from './TodayPresenceDesktop';

interface TodayPresenceProps {
  currentDate: string;
  currentEmployeeId: string;
  employees: Employee[];
  shifts: Shift[];
  isManagerMode: boolean;
  activeLocation: LocationId;
  onChangeLocation?: (loc: LocationId) => void;
  onEditShift: (shift: Shift) => void;
}

export const TodayPresence: React.FC<TodayPresenceProps> = (props) => {
  return (
    <>
      {/* Vista Mobile pura (< 768px): fedele al mockup Stitch 132668eb8842442486ad04adfa3a5308 */}
      <div className="block md:hidden">
        <TodayPresenceMobile {...props} />
      </div>

      {/* Vista Desktop / Tablet (>= 768px): fedele al mockup Stitch 0711c381e21247b3a46668de10aff1b5 */}
      <div className="hidden md:block">
        <TodayPresenceDesktop {...props} />
      </div>
    </>
  );
};
