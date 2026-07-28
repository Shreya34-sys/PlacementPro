import React, { useState, useMemo } from 'react';
import { Card, Row, Col, Badge, Button, OverlayTrigger, Tooltip, Alert } from 'react-bootstrap';

interface DayData {
  dateStr: string;
  count: number;
  activities: string[];
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  weekIndex: number;
  monthName: string;
}

export const StreakCalendar: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [currentStreak, setCurrentStreak] = useState(14);
  const [longestStreak] = useState(28);
  const [showToast, setShowToast] = useState(false);
  const [extraTodayLogs, setExtraTodayLogs] = useState<number>(0);

  // Generate 52 weeks (364/365 days) grid data for selected year
  const { weeksData, monthLabels, totalYearActivities, activeDaysCount } = useMemo(() => {
    const is2026 = selectedYear === 2026;
    
    // We construct 52 weeks starting from Aug 1 of previous year to July 31 of selected year
    // Or full Jan 1 to Dec 31 of selected year.
    // In GitHub/LeetCode, selecting a year displays full year (Jan 1 to Dec 31).
    const startDate = new Date(selectedYear, 0, 1); // Jan 1
    const endDate = new Date(selectedYear, 11, 31); // Dec 31

    // Find day of week for Jan 1
    const days: DayData[] = [];
    const months: { name: string; weekIndex: number }[] = [];
    
    let currentDate = new Date(startDate);
    let currentWeek = 0;
    let lastMonth = -1;

    // Seeded pseudo-random activity counts for rich heatmap visual matching screenshot
    const getActivityCount = (dayOfYear: number, month: number, day: number) => {
      if (!is2026 && month > 10) return 0; // future in 2025
      
      // Clusters in Jan, Apr, May, Jun, Jul like user's screenshot
      if (month === 0 && (day === 12 || day === 13 || day === 14 || day === 28)) return Math.floor((day % 3) + 2);
      if (month === 3 && (day === 18 || day === 24)) return 2;
      if (month === 4 && (day === 10 || day === 11 || day === 15 || day === 16 || day === 22)) return Math.floor((day % 4) + 1);
      if (month === 5 && (day === 2 || day === 3 || day === 8 || day === 9 || day === 10 || day === 15 || day === 16 || day === 17 || day === 24 || day === 25)) return Math.floor((day % 4) + 1);
      if (month === 6) { // July (current month)
        if (day <= 26) {
          if (day === 26) return 2 + extraTodayLogs;
          return (day * 7) % 5 > 1 ? Math.floor((day % 4) + 1) : 0;
        }
      }
      if (dayOfYear % 7 === 2 || dayOfYear % 13 === 0) return Math.floor((dayOfYear % 3) + 1);
      return 0;
    };

    let dayIndex = 0;
    while (currentDate <= endDate) {
      const month = currentDate.getMonth();
      const day = currentDate.getDate();
      const dayOfWeek = currentDate.getDay(); // 0=Sun, 1=Mon...

      if (month !== lastMonth && dayOfWeek < 3) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        months.push({ name: monthNames[month], weekIndex: currentWeek });
        lastMonth = month;
      }

      const count = getActivityCount(dayIndex, month, day);
      const dateStr = currentDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      const sampleActivities = [
        'Quantitative Aptitude Quiz',
        'LeetCode Medium Solution',
        'TCS Digital Mock Test',
        'DBMS SQL Joins Practice',
        'Versant Voice Test',
        'System Design Basics',
      ];

      const activities: string[] = [];
      for (let k = 0; k < count; k++) {
        activities.push(sampleActivities[(day + k) % sampleActivities.length]);
      }

      days.push({
        dateStr,
        count,
        activities,
        dayOfWeek,
        weekIndex: currentWeek,
        monthName: currentDate.toLocaleString('default', { month: 'short' }),
      });

      // Advance to next day
      currentDate.setDate(currentDate.getDate() + 1);
      dayIndex++;
      if (dayOfWeek === 6) {
        currentWeek++;
      }
    }

    // Group days by week (0 to 52)
    const weeks: DayData[][] = [];
    days.forEach((d) => {
      if (!weeks[d.weekIndex]) weeks[d.weekIndex] = [];
      weeks[d.weekIndex].push(d);
    });

    let totalActivities = 0;
    let activeDays = 0;
    days.forEach((d) => {
      totalActivities += d.count;
      if (d.count > 0) activeDays++;
    });

    return {
      weeksData: weeks,
      monthLabels: months,
      totalYearActivities: totalActivities,
      activeDaysCount: activeDays,
    };
  }, [selectedYear, extraTodayLogs]);

  const handleLogTodayActivity = () => {
    setExtraTodayLogs((prev) => prev + 1);
    setCurrentStreak((prev) => prev + 1);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  // Color intensity logic for GitHub/LeetCode green theme
  const getCellColor = (count: number) => {
    if (count === 0) return '#161b22'; // Dark subtle cell
    if (count === 1) return '#0e4429'; // Low green
    if (count === 2) return '#006d32'; // Medium green
    if (count === 3) return '#26a641'; // High green
    return '#39d353';                  // Vibrant green
  };

  const dayRowLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <Card className="shadow-xs border-0 rounded-16 overflow-hidden mb-4 bg-dark text-white">
      <Card.Header className="bg-dark border-bottom border-secondary p-3.5 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <span className="fs-4">🔥</span>
          <div>
            <h5 className="fw-bold text-white mb-0">Preparation Activity Heatmap</h5>
            <small className="text-white-50 fs-8">
              {totalYearActivities} preparation activities in {selectedYear}
            </small>
          </div>
        </div>
      </Card.Header>

      <Card.Body className="p-4 bg-dark">
        {/* Heatmap Section */}
        <div className="p-3 rounded-3 border border-secondary bg-black bg-opacity-40">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <span className="fw-semibold text-white-50 fs-8">
              Activity frequency graph — {selectedYear}
            </span>

            {/* Year Toggle Buttons (Matching User Image) */}
            <div className="d-flex flex-column align-items-end gap-1">
              {[2026, 2025].map((yr) => (
                <Button
                  key={yr}
                  variant={selectedYear === yr ? 'primary' : 'link'}
                  size="sm"
                  onClick={() => setSelectedYear(yr)}
                  className={`py-1 px-3 fs-8 fw-bold rounded-2 text-decoration-none ${
                    selectedYear === yr
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-white-50 hover-text-white'
                  }`}
                >
                  {yr}
                </Button>
              ))}
            </div>
          </div>

          {/* Heatmap Canvas Grid Container */}
          <div className="overflow-auto pb-2">
            <div style={{ minWidth: '720px' }}>
              {/* Month Labels Header */}
              <div className="d-flex mb-1 ps-4 ms-2" style={{ position: 'relative', height: '20px' }}>
                {monthLabels.map((m, idx) => (
                  <span
                    key={idx}
                    className="fs-8 text-white-50 position-absolute fw-medium"
                    style={{ left: `${m.weekIndex * 15 + 32}px` }}
                  >
                    {m.name}
                  </span>
                ))}
              </div>

              {/* Grid with Day Labels on Left */}
              <div className="d-flex">
                {/* Day of Week Labels (Mon, Wed, Fri) */}
                <div className="d-flex flex-column justify-content-between me-2 pe-1 text-end" style={{ width: '32px', height: '105px' }}>
                  {dayRowLabels.map((lbl, idx) => (
                    <span key={idx} className="fs-8 text-white-50 leading-none" style={{ height: '13px' }}>
                      {lbl}
                    </span>
                  ))}
                </div>

                {/* 52 Week Columns */}
                <div className="d-flex gap-1">
                  {weeksData.map((week, weekIdx) => (
                    <div key={weekIdx} className="d-flex flex-column gap-1">
                      {Array.from({ length: 7 }).map((_, dayIdx) => {
                        const dayObj = week?.find((d) => d.dayOfWeek === dayIdx);
                        const count = dayObj ? dayObj.count : 0;
                        const cellBg = getCellColor(count);

                        const tooltipContent = dayObj ? (
                          <Tooltip id={`tooltip-${weekIdx}-${dayIdx}`}>
                            <div className="p-1 text-start fs-8">
                              <strong className="d-block mb-1 border-bottom border-secondary pb-1">
                                {dayObj.dateStr}
                              </strong>
                              {count > 0 ? (
                                <div>
                                  <span className="text-success fw-bold d-block mb-1">
                                    {count} {count === 1 ? 'activity' : 'activities'} completed
                                  </span>
                                  <ul className="mb-0 ps-3">
                                    {dayObj.activities.map((act, aIdx) => (
                                      <li key={aIdx}>{act}</li>
                                    ))}
                                  </ul>
                                </div>
                              ) : (
                                <span className="text-white-50">No activities on this date</span>
                              )}
                            </div>
                          </Tooltip>
                        ) : (
                          <Tooltip id={`tooltip-empty-${weekIdx}-${dayIdx}`}>No data</Tooltip>
                        );

                        return (
                          <OverlayTrigger key={dayIdx} placement="top" overlay={tooltipContent}>
                            <div
                              className="rounded-1 cursor-pointer transition-all hover-glow"
                              style={{
                                width: '11px',
                                height: '11px',
                                backgroundColor: cellBg,
                                border: '1px solid rgba(255,255,255,0.05)',
                              }}
                            />
                          </OverlayTrigger>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Heatmap Legend (Bottom Right) */}
              <div className="d-flex justify-content-end align-items-center gap-1 mt-3 me-2 fs-8 text-white-50">
                <span className="me-1">Less</span>
                {[0, 1, 2, 3, 4].map((lvl) => (
                  <div
                    key={lvl}
                    className="rounded-1"
                    style={{
                      width: '11px',
                      height: '11px',
                      backgroundColor: getCellColor(lvl),
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  />
                ))}
                <span className="ms-1">More</span>
              </div>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};
