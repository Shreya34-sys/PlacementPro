import React, { useState } from 'react';
import { Card, Form, Badge } from 'react-bootstrap';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export const PlacementAnalyticsChart: React.FC = () => {
  const [metric, setMetric] = useState<'placed' | 'avgCtc'>('placed');

  const departmentStats = [
    { dept: 'CSE', fullDept: 'Computer Science', total: 120, placed: 106, rate: 88, avgCtc: 115000 },
    { dept: 'IT', fullDept: 'Information Tech', total: 95, placed: 78, rate: 82, avgCtc: 102000 },
    { dept: 'ECE', fullDept: 'Electronics & Comm', total: 80, placed: 59, rate: 74, avgCtc: 88000 },
    { dept: 'EEE', fullDept: 'Electrical Eng', total: 60, placed: 41, rate: 68, avgCtc: 82000 },
    { dept: 'ME', fullDept: 'Mechanical Eng', total: 70, placed: 42, rate: 60, avgCtc: 75000 },
  ];

  const colors = ['#0d6efd', '#198754', '#0dcaf0', '#ffc107', '#6c757d'];

  return (
    <Card className="shadow-sm border-0 h-100">
      <Card.Header className="bg-white fw-bold py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div className="d-flex align-items-center">
          <i className="bi bi-bar-chart-line-fill text-primary me-2 fs-5"></i>
          <span>Department Placement Performance</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Form.Select
            size="sm"
            style={{ width: '160px' }}
            value={metric}
            onChange={(e) => setMetric(e.target.value as 'placed' | 'avgCtc')}
          >
            <option value="placed">Placement Rate (%)</option>
            <option value="avgCtc">Average CTC ($)</option>
          </Form.Select>
          <Badge bg="success" className="px-2.5 py-1.5 fs-8">
            Overall Rate: 78%
          </Badge>
        </div>
      </Card.Header>

      <Card.Body className="p-4">
        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={departmentStats} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ecef" />
              <XAxis dataKey="dept" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(val) => (metric === 'avgCtc' ? `$${val / 1000}k` : `${val}%`)}
              />
              <Tooltip
                formatter={(value: any) =>
                  metric === 'avgCtc'
                    ? [`$${Number(value).toLocaleString()} / yr`, 'Avg CTC']
                    : [`${value}%`, 'Placement Rate']
                }
                labelFormatter={(label) => {
                  const item = departmentStats.find((d) => d.dept === label);
                  return item ? item.fullDept : label;
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar
                dataKey={metric === 'avgCtc' ? 'avgCtc' : 'rate'}
                name={metric === 'avgCtc' ? 'Average CTC ($)' : 'Placed Percentage (%)'}
                radius={[6, 6, 0, 0]}
              >
                {departmentStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="row g-2 pt-3 border-top text-center fs-7">
          {departmentStats.map((d) => (
            <div key={d.dept} className="col">
              <div className="fw-bold text-dark">{d.dept}</div>
              <small className="text-muted d-block">{d.placed}/{d.total} ({d.rate}%)</small>
            </div>
          ))}
        </div>
      </Card.Body>
    </Card>
  );
};

