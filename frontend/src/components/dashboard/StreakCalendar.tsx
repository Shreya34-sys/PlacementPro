import React, { useMemo, useState } from 'react';
import { Card, Button, OverlayTrigger, Tooltip, Alert } from 'react-bootstrap';

interface ActivityDay {
  date: Date;
  dateKey: string;
  count: number;
  activities: string[];
}

const MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
});

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const ACTIVITY_BANK = [
  'Quantitative aptitude drills',
  'Coding round practice',
  'Technical interview revision',
  'Company-wise preparation',
  'Resume improvement task',
  'Mock interview reflection',
  'Communication practice',
  'System design notes',
  'Logical reasoning sprint',
  'DBMS and SQL practice',
];

const getDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const isSameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

const getMondayFirstOffset = (date: Date) => (date.getDay() + 6) % 7;

const getActivityCount = (date: Date) => {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const seed = (year * 7 + month * 17 + day * 26) % 39;

  if (seed % 17 === 0) return 9;
  if (seed % 13 === 0) return 7;
  if (seed % 7 === 0) return 4;
  if (seed % 5 === 0) return 2;
  if (seed % 8 === 0) return 1;
  return 0;
};

const buildActivityDay = (date: Date): ActivityDay => {
  const count = getActivityCount(date);
  const activities = Array.from({ length: count }, (_, index) => {
    const activityIndex = (date.getDate() + date.getMonth() + index) % ACTIVITY_BANK.length;
    return ACTIVITY_BANK[activityIndex];
  });

  return {
    date,
    dateKey: getDateKey(date),
    count,
    activities,
  };
};

const getIntensityColor = (count: number) => {
  if (count === 0) return '#1d2530';
  if (count <= 2) return '#1f6f43';
  if (count <= 5) return '#2ea95f';
  if (count <= 8) return '#3fd66d';
  return '#6ff58f';
};

const getIntensityShadow = (count: number) => {
  if (count === 0) return 'none';
  if (count <= 5) return '0 0 0 1px rgba(79, 209, 124, 0.16)';
  return '0 0 18px rgba(63, 214, 109, 0.18), 0 0 0 1px rgba(111, 245, 143, 0.22)';
};

export const StreakCalendar: React.FC = () => {
  const today = useMemo(() => new Date(), []);
  const currentMonthStart = useMemo(() => getMonthStart(today), [today]);
  const [visibleMonth, setVisibleMonth] = useState<Date>(currentMonthStart);
  const [selectedDay, setSelectedDay] = useState<ActivityDay | null>(() => buildActivityDay(today));

  const selectedYear = visibleMonth.getFullYear();

  const yearActivityTotal = useMemo(() => {
    const endMonth = selectedYear === today.getFullYear() ? today.getMonth() : 11;
    let total = 0;

    for (let month = 0; month <= endMonth; month += 1) {
      const daysInMonth = new Date(selectedYear, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day += 1) {
        const date = new Date(selectedYear, month, day);
        if (date > today) continue;
        total += getActivityCount(date);
      }
    }

    return total;
  }, [selectedYear, today]);

  const monthDays = useMemo(() => {
    const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, index) =>
      buildActivityDay(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), index + 1))
    );
  }, [visibleMonth]);

  const leadingEmptyCells = getMondayFirstOffset(visibleMonth);
  const canGoNext = !isSameMonth(visibleMonth, currentMonthStart);

  const goToPreviousMonth = () => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    if (!canGoNext) return;
    setVisibleMonth((current) => {
      const next = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      return next > currentMonthStart ? currentMonthStart : next;
    });
    setSelectedDay(null);
  };

  return (
    <Card className="shadow-xs border border-secondary rounded-16 overflow-hidden mb-4 bg-dark text-white">
      <Card.Header className="bg-dark border-bottom border-secondary p-3.5">
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-fire fs-4 text-danger" aria-hidden="true"></i>
          <div>
            <h5 className="fw-bold text-white mb-0">Preparation Activity</h5>
            <small className="text-white-50 fs-8">
              {yearActivityTotal} activities in {selectedYear}
            </small>
          </div>
        </div>
      </Card.Header>

      <Card.Body className="p-3 p-sm-4 bg-dark">
        <div
          className="rounded-3 border border-secondary p-3 p-sm-4"
          style={{
            background: 'linear-gradient(180deg, rgba(8, 13, 24, 0.86), rgba(6, 10, 18, 0.72))',
          }}
        >
          <div className="d-flex justify-content-center align-items-center gap-2 gap-sm-3 mb-4 text-center">
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={goToPreviousMonth}
              className="text-white-50 text-decoration-none fw-semibold px-1 px-sm-2"
            >
              <i className="bi bi-arrow-left-short me-1" aria-hidden="true"></i>
              <span className="d-none d-sm-inline">Previous Month</span>
            </Button>

            <div
              className="fw-bold text-white px-3 py-2 rounded-3 border border-secondary"
              style={{ minWidth: '168px', backgroundColor: 'rgba(15, 23, 42, 0.78)' }}
            >
              {MONTH_FORMATTER.format(visibleMonth)}
            </div>

            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={goToNextMonth}
              disabled={!canGoNext}
              className={`text-decoration-none fw-semibold px-1 px-sm-2 ${
                canGoNext ? 'text-white-50' : 'text-secondary opacity-50'
              }`}
            >
              <span className="d-none d-sm-inline">Next Month</span>
              <i className="bi bi-arrow-right-short ms-1" aria-hidden="true"></i>
            </Button>
          </div>

          <div className="activity-month-calendar mx-auto">
            <div className="activity-weekday-grid mb-2">
              {WEEKDAYS.map((weekday) => (
                <div key={weekday} className="text-white-50 fw-semibold fs-8 text-center">
                  {weekday}
                </div>
              ))}
            </div>

            <div className="activity-date-grid">
              {Array.from({ length: leadingEmptyCells }).map((_, index) => (
                <div key={`empty-${index}`} aria-hidden="true" />
              ))}

              {monthDays.map((day) => {
                const fullDate = DATE_FORMATTER.format(day.date);
                const activityLabel = `${day.count} preparation ${day.count === 1 ? 'activity' : 'activities'}`;

                return (
                  <OverlayTrigger
                    key={day.dateKey}
                    placement="top"
                    overlay={
                      <Tooltip id={`activity-${day.dateKey}`}>
                        <div className="text-start">
                          <strong className="d-block">{fullDate}</strong>
                          <span>{activityLabel}</span>
                        </div>
                      </Tooltip>
                    }
                  >
                    <button
                      type="button"
                      className="activity-date-cell"
                      onClick={() => setSelectedDay(day)}
                      aria-label={`${fullDate}: ${activityLabel}`}
                      style={{
                        backgroundColor: getIntensityColor(day.count),
                        boxShadow: getIntensityShadow(day.count),
                      }}
                    >
                      <span>{day.date.getDate()}</span>
                    </button>
                  </OverlayTrigger>
                );
              })}
            </div>
          </div>

          <div className="d-flex justify-content-center align-items-center gap-1 mt-4 fs-8 text-white-50">
            <span className="me-1">Less</span>
            {[0, 1, 4, 7, 10].map((count) => (
              <span
                key={count}
                className="activity-legend-cell"
                style={{
                  backgroundColor: getIntensityColor(count),
                  boxShadow: getIntensityShadow(count),
                }}
              />
            ))}
            <span className="ms-1">More</span>
          </div>

          {selectedDay && (
            <Alert
              variant="dark"
              className="mt-4 mb-0 border border-secondary text-white"
              style={{ backgroundColor: 'rgba(15, 23, 42, 0.82)' }}
            >
              <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                <div>
                  <div className="fw-bold">{DATE_FORMATTER.format(selectedDay.date)}</div>
                  <div className="text-white-50 fs-8">
                    {selectedDay.count} preparation {selectedDay.count === 1 ? 'activity' : 'activities'}
                  </div>
                </div>
                {selectedDay.count > 0 && (
                  <span className="badge bg-success-subtle text-success border border-success-subtle">
                    Active day
                  </span>
                )}
              </div>

              {selectedDay.activities.length > 0 ? (
                <ul className="mt-3 mb-0 ps-3 fs-8">
                  {selectedDay.activities.map((activity, index) => (
                    <li key={`${selectedDay.dateKey}-${index}`}>{activity}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-white-50 fs-8 mb-0 mt-3">
                  No preparation activities were logged on this date.
                </p>
              )}
            </Alert>
          )}
        </div>
      </Card.Body>

      <style>{`
        .activity-month-calendar {
          max-width: 430px;
          width: 100%;
        }

        .activity-weekday-grid,
        .activity-date-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 0.42rem;
        }

        .activity-date-cell {
          align-items: center;
          aspect-ratio: 1;
          border: 1px solid rgba(148, 163, 184, 0.15);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.78);
          cursor: pointer;
          display: inline-flex;
          font-size: 0.72rem;
          font-weight: 700;
          justify-content: center;
          line-height: 1;
          min-height: 34px;
          padding: 0;
          transition: transform 0.18s ease, border-color 0.18s ease, filter 0.18s ease, box-shadow 0.18s ease;
          width: 100%;
        }

        .activity-date-cell:hover,
        .activity-date-cell:focus-visible {
          border-color: rgba(190, 242, 100, 0.52);
          filter: brightness(1.12);
          outline: none;
          transform: translateY(-2px) scale(1.04);
        }

        .activity-date-cell span {
          opacity: 0.82;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
        }

        .activity-legend-cell {
          border: 1px solid rgba(148, 163, 184, 0.15);
          border-radius: 4px;
          display: inline-block;
          height: 12px;
          width: 12px;
        }

        @media (max-width: 575.98px) {
          .activity-weekday-grid,
          .activity-date-grid {
            gap: 0.28rem;
          }

          .activity-date-cell {
            border-radius: 6px;
            font-size: 0.64rem;
            min-height: 28px;
          }
        }
      `}</style>
    </Card>
  );
};
