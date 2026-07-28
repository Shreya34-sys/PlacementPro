import React, { useState } from 'react';
import { Card, Form, Badge } from 'react-bootstrap';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export const RecruitmentTrendsChart: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'6m' | '1y'>('6m');

  const data6m = [
    { month: 'Mar', drives: 4, applications: 120, offers: 18 },
    { month: 'Apr', drives: 6, applications: 210, offers: 32 },
    { month: 'May', drives: 8, applications: 310, offers: 45 },
    { month: 'Jun', drives: 12, applications: 480, offers: 68 },
    { month: 'Jul', drives: 15, applications: 590, offers: 85 },
    { month: 'Aug', drives: 18, applications: 720, offers: 110 },
  ];

  const data1y = [
    { month: 'Sep 25', drives: 2, applications: 80, offers: 10 },
    { month: 'Oct 25', drives: 3, applications: 110, offers: 14 },
    { month: 'Nov 25', drives: 5, applications: 160, offers: 22 },
    { month: 'Dec 25', drives: 4, applications: 140, offers: 19 },
    { month: 'Jan 26', drives: 7, applications: 250, offers: 38 },
    { month: 'Feb 26', drives: 9, applications: 340, offers: 52 },
    ...data6m,
  ];

  const currentData = timeRange === '6m' ? data6m : data1y;

  return (
    <Card className="shadow-sm border-0 mb-4">
      <Card.Header className="bg-white fw-bold py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div className="d-flex align-items-center">
          <i className="bi bi-graph-up-arrow text-primary me-2 fs-5"></i>
          <span>Campus Drive & Offer Trends</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Form.Select
            size="sm"
            style={{ width: '130px' }}
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '6m' | '1y')}
          >
            <option value="6m">Last 6 Months</option>
            <option value="1y">Full Academic Year</option>
          </Form.Select>
          <Badge bg="primary" className="px-2.5 py-1.5 fs-8">
            Live Analytics
          </Badge>
        </div>
      </Card.Header>

      <Card.Body className="p-4">
        <div style={{ width: '100%', height: '280px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={currentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d6efd" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0d6efd" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorOffers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#198754" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#198754" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ecef" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Legend verticalAlign="top" height={36} />
              <Area
                type="monotone"
                dataKey="applications"
                name="Applications Submitted"
                stroke="#0d6efd"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorApplications)"
              />
              <Area
                type="monotone"
                dataKey="offers"
                name="Offers Extended"
                stroke="#198754"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorOffers)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="d-flex flex-wrap justify-content-around bg-light p-3 rounded mt-3 text-center fs-7">
          <div>
            <span className="text-muted d-block text-uppercase fs-8">Total Job Drives</span>
            <strong className="text-dark fs-6">18 Recruitment Drives</strong>
          </div>
          <div className="border-start ps-3">
            <span className="text-muted d-block text-uppercase fs-8">Submissions</span>
            <strong className="text-primary fs-6">720 Applications</strong>
          </div>
          <div className="border-start ps-3">
            <span className="text-muted d-block text-uppercase fs-8">Accepted Offers</span>
            <strong className="text-success fs-6">110 Students Placed</strong>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};
