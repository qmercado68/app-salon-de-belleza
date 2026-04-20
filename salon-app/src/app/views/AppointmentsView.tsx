'use client';

import React from 'react';
import StylistCalendarView from './StylistCalendarView';

interface AppointmentsViewProps {
  userId?: string;
  role?: string;
}

export default function AppointmentsView({ userId, role }: AppointmentsViewProps) {
  return <StylistCalendarView userId={userId} role={role} />;
}
