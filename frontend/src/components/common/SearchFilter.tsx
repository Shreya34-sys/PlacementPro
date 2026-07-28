import React from 'react';
import { Form, InputGroup, Row, Col } from 'react-bootstrap';

interface SearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter?: string;
  onCategoryChange?: (value: string) => void;
  categories?: string[];
  placeholder?: string;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  categories = [],
  placeholder = 'Search by company, role, keywords...',
}) => {
  return (
    <Row className="g-2 mb-3 align-items-center">
      <Col md={categoryFilter !== undefined ? 8 : 12}>
        <InputGroup>
          <InputGroup.Text className="bg-white text-muted">
            <i className="bi bi-search"></i>
          </InputGroup.Text>
          <Form.Control
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </InputGroup>
      </Col>
      {categoryFilter !== undefined && onCategoryChange && (
        <Col md={4}>
          <Form.Select value={categoryFilter} onChange={(e) => onCategoryChange(e.target.value)}>
            <option value="All">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Form.Select>
        </Col>
      )}
    </Row>
  );
};
