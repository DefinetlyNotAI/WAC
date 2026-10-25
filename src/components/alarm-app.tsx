'use client';

import { useAlarmController } from './use-alarm-controller.tsx';
import { AlarmView } from './alarm-view.tsx';

export default function AlarmApp() {
    const app = useAlarmController();
    return <AlarmView app={app}/>;
}
