import React from 'react';
import { Table, Card } from 'react-bootstrap';

interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  emptyMessage = 'No records found.',
}: DataTableProps<T>) {
  return (
    <Card className="shadow-sm border-0">
      <Table responsive hover className="align-middle mb-0">
        <thead className="table-light">
          <tr>
            {columns.map((col, index) => (
              <th key={index} className="fw-semibold text-uppercase fs-7 py-3">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center text-muted py-4">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={item.id}>
                {columns.map((col, idx) => (
                  <td key={idx} className="py-3">
                    {col.accessor(item)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </Card>
  );
}
