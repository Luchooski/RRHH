import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCheckIn, useCheckOut, useRegisterBreak, useTodayAttendance, useAttendances } from './hooks';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '../auth/auth';
import { Clock, LogIn, LogOut, Coffee, MapPin } from 'lucide-react';
import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_COLORS } from './dto';

export default function AttendanceTrackingPage() {
  const { user } = useAuth();
  const { push } = useToast();
  const { data: todayAttendance, refetch: refetchToday } = useTodayAttendance();
  const { data: recentAttendances } = useAttendances({
    employeeId: user?.id,
    limit: 10,
  });

  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const registerBreak = useRegisterBreak();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [breakStarted, setBreakStarted] = useState(false);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Get geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }
  }, []);

  const handleCheckIn = async () => {
    try {
      await checkIn.mutateAsync({ location: location || undefined });
      push({ kind: 'success', title: 'Entrada registrada', message: 'Tu entrada fue registrada correctamente' });
      refetchToday();
    } catch (error: any) {
      push({ kind: 'error', title: 'Error', message: error?.message ?? 'No se pudo registrar la entrada' });
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOut.mutateAsync({ location: location || undefined });
      push({ kind: 'success', title: 'Salida registrada', message: 'Tu salida fue registrada correctamente' });
      refetchToday();
    } catch (error: any) {
      push({ kind: 'error', title: 'Error', message: error?.message ?? 'No se pudo registrar la salida' });
    }
  };

  const handleBreakStart = async () => {
    try {
      await registerBreak.mutateAsync({ breakStart: new Date().toISOString() });
      setBreakStarted(true);
      push({ kind: 'success', title: 'Inicio de descanso', message: 'Tu descanso fue registrado' });
      refetchToday();
    } catch (error: any) {
      push({ kind: 'error', title: 'Error', message: error?.message ?? 'No se pudo registrar el descanso' });
    }
  };

  const handleBreakEnd = async () => {
    try {
      await registerBreak.mutateAsync({ breakEnd: new Date().toISOString() });
      setBreakStarted(false);
      push({ kind: 'success', title: 'Fin de descanso', message: 'Tu regreso del descanso fue registrado' });
      refetchToday();
    } catch (error: any) {
      push({ kind: 'error', title: 'Error', message: error?.message ?? 'No se pudo registrar el fin del descanso' });
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '--:--';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatHours = (hours?: number) => {
    if (!hours) return '0.00';
    return hours.toFixed(2);
  };

  const attendance = todayAttendance as any;
  const hasCheckedIn = attendance && attendance.checkIn;
  const hasCheckedOut = attendance && attendance.checkOut;
  const recentItems = recentAttendances?.items ?? [];

  return (
    <div className="container space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Control de Asistencia</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Registra tu entrada, salida y descansos</p>
        </div>
      </div>

      {/* Current Time Card */}
      <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <CardBody className="text-center py-8">
          <Clock size={48} className="mx-auto mb-4" />
          <div className="text-5xl font-bold mb-2">
            {currentTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-xl opacity-90">
            {currentTime.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </CardBody>
      </Card>

      {/* Today's Attendance Card */}
      <Card>
        <CardHeader>
          <CardTitle>Hoy - {new Date().toLocaleDateString('es-AR')}</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">Entrada</div>
              <div className="text-2xl font-bold">{formatTime(attendance?.checkIn)}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">Salida</div>
              <div className="text-2xl font-bold">{formatTime(attendance?.checkOut)}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">Horas trabajadas</div>
              <div className="text-2xl font-bold">{formatHours(attendance?.hoursWorked)}h</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">Estado</div>
              <div>
                {attendance?.status && (
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${ATTENDANCE_STATUS_COLORS[attendance.status]}`}>
                    {ATTENDANCE_STATUS_LABELS[attendance.status]}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              onClick={handleCheckIn}
              disabled={hasCheckedIn || checkIn.isPending}
              variant="primary"
              className="w-full"
            >
              <LogIn size={18} />
              {hasCheckedIn ? 'Entrada registrada' : 'Registrar entrada'}
            </Button>

            <Button
              onClick={handleCheckOut}
              disabled={!hasCheckedIn || hasCheckedOut || checkOut.isPending}
              variant="primary"
              className="w-full"
            >
              <LogOut size={18} />
              {hasCheckedOut ? 'Salida registrada' : 'Registrar salida'}
            </Button>

            <Button
              onClick={handleBreakStart}
              disabled={!hasCheckedIn || hasCheckedOut || breakStarted || registerBreak.isPending}
              variant="ghost"
              className="w-full"
            >
              <Coffee size={18} />
              Inicio descanso
            </Button>

            <Button
              onClick={handleBreakEnd}
              disabled={!breakStarted || registerBreak.isPending}
              variant="ghost"
              className="w-full"
            >
              <Coffee size={18} />
              Fin descanso
            </Button>
          </div>

          {/* Location Info */}
          {location && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <MapPin size={16} />
              <span>Ubicación: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</span>
            </div>
          )}

          {/* Break Info */}
          {attendance?.breakMinutes > 0 && (
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              <Coffee size={16} className="inline mr-2" />
              Descanso: {attendance.breakMinutes} minutos
            </div>
          )}

          {/* Late Info */}
          {attendance?.lateMinutes > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200 text-sm">
              ⚠️ Llegaste {attendance.lateMinutes} minutos tarde
            </div>
          )}
        </CardBody>
      </Card>

      {/* Recent Attendances */}
      <Card>
        <CardHeader>
          <CardTitle>Historial Reciente</CardTitle>
        </CardHeader>
        <CardBody>
          {recentItems.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No hay registros de asistencia aún</p>
          ) : (
            <div className="space-y-2">
              {recentItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex-1">
                    <div className="font-medium">{new Date(item.date).toLocaleDateString('es-AR')}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {formatTime(item.checkIn)} - {formatTime(item.checkOut)}
                      {item.hoursWorked && ` (${formatHours(item.hoursWorked)}h)`}
                    </div>
                  </div>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${ATTENDANCE_STATUS_COLORS[item.status]}`}>
                    {ATTENDANCE_STATUS_LABELS[item.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
