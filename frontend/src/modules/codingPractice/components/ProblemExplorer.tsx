import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, InputGroup, Table, Badge, Spinner } from 'react-bootstrap';
import { Problem, UserProgress } from '../types/problem';
import { getProblems } from '../services/problemService';

interface ProblemExplorerProps {
  userId: string;
  progressMap: Record<string, UserProgress>;
  bookmarks: string[];
  onSelectProblem: (problem: Problem) => void;
  onToggleBookmark: (problemId: string) => void;
}

const TOPICS = [
  'All', 'Math', 'Implementation', 'Greedy', 'DP', 'Data Structures', 'Brute Force',
  'Graphs', 'DFS', 'BFS', 'Trees', 'Strings', 'Sorting', 'Binary Search', 'Two Pointers'
];

const RATINGS = ['All', '800', '1000', '1200', '1400', '1600', '1800', '2000+'];

export const ProblemExplorer: React.FC<ProblemExplorerProps> = ({
  progressMap,
  bookmarks,
  onSelectProblem,
  onToggleBookmark,
}) => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [selectedDiff, setSelectedDiff] = useState('All');
  const [selectedRating, setSelectedRating] = useState('All');
  const [selectedSource, setSelectedSource] = useState('All');
  
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchProblemsList = async (loadMore = false) => {
    setLoading(true);
    try {
      const filters = {
        tag: selectedTopic !== 'All' ? selectedTopic : undefined,
        difficulty: selectedDiff !== 'All' ? selectedDiff : undefined,
        rating: selectedRating !== 'All' ? parseInt(selectedRating) : undefined,
        source: selectedSource !== 'All' ? selectedSource : undefined,
        pageSize: 15,
        lastDoc: loadMore ? lastDoc : null
      };

      const result = await getProblems(filters);
      
      if (loadMore) {
        setProblems((prev) => [...prev, ...result.problems]);
      } else {
        setProblems(result.problems);
      }
      
      setLastDoc(result.lastDoc);
      setHasMore(result.problems.length === 15);
    } catch (e) {
      console.error('Error fetching problems:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblemsList(false);
  }, [selectedTopic, selectedDiff, selectedRating, selectedSource]);

  // Clientside search filter
  const filteredProblems = problems.filter((p) => {
    if (!search.trim()) return true;
    return p.title.toLowerCase().includes(search.toLowerCase()) || 
           p.id.toLowerCase().includes(search.toLowerCase());
  });

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Easy': return 'success';
      case 'Medium': return 'warning';
      case 'Hard': return 'danger';
      case 'Expert': return 'dark';
      default: return 'secondary';
    }
  };

  return (
    <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
      <Card.Header className="bg-white py-3 border-bottom d-flex align-items-center justify-content-between">
        <h5 className="fw-bold mb-0 text-dark">
          <i className="bi bi-compass text-primary me-2"></i> Problem Explorer
        </h5>
      </Card.Header>
      
      <Card.Body className="p-4">
        {/* Filters */}
        <Row className="g-3 mb-4">
          <Col md={4}>
            <InputGroup size="sm">
              <InputGroup.Text className="bg-light border-end-0">
                <i className="bi bi-search"></i>
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search problems by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-light border-start-0"
              />
            </InputGroup>
          </Col>
          <Col xs={6} md={2}>
            <Form.Select
              size="sm"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="bg-light"
            >
              <option value="All">All Topics</option>
              {TOPICS.slice(1).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Form.Select>
          </Col>
          <Col xs={6} md={2}>
            <Form.Select
              size="sm"
              value={selectedDiff}
              onChange={(e) => setSelectedDiff(e.target.value)}
              className="bg-light"
            >
              <option value="All">Difficulty</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
              <option value="Expert">Expert</option>
            </Form.Select>
          </Col>
          <Col xs={6} md={2}>
            <Form.Select
              size="sm"
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className="bg-light"
            >
              <option value="All">Rating</option>
              {RATINGS.slice(1).map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </Form.Select>
          </Col>
          <Col xs={6} md={2}>
            <Form.Select
              size="sm"
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="bg-light"
            >
              <option value="All">Source</option>
              <option value="codeforces">Codeforces</option>
              <option value="placementpro">PlacementPro</option>
            </Form.Select>
          </Col>
        </Row>

        {/* Problem List Table */}
        <div className="table-responsive">
          <Table hover align="middle" className="mb-0 border-top">
            <thead>
              <tr className="text-muted fs-8 fw-semibold bg-light-subtle">
                <th style={{ width: '40px' }}>Status</th>
                <th>Title</th>
                <th>Difficulty</th>
                <th>Rating</th>
                <th>Tags</th>
                <th>Solved Count</th>
                <th style={{ width: '80px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && filteredProblems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <Spinner animation="border" variant="primary" role="status" className="mb-2" />
                    <div className="text-muted fs-7">Loading Coding Practice catalog...</div>
                  </td>
                </tr>
              ) : filteredProblems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted fs-7">
                    No problems found matching these criteria.
                  </td>
                </tr>
              ) : (
                filteredProblems.map((p) => {
                  const progress = progressMap[p.id];
                  const isSolved = progress?.solved;
                  const isAttempted = progress && !progress.solved;
                  const isBookmarked = bookmarks.includes(p.id);

                  return (
                    <tr key={p.id} className="cursor-pointer" onClick={() => onSelectProblem(p)}>
                      <td>
                        {isSolved ? (
                          <i className="bi bi-check-circle-fill text-success fs-5" title="Solved"></i>
                        ) : isAttempted ? (
                          <i className="bi bi-exclamation-circle-fill text-warning fs-5" title="Attempted"></i>
                        ) : (
                          <i className="bi bi-circle text-muted fs-5"></i>
                        )}
                      </td>
                      <td>
                        <div className="fw-semibold text-dark fs-7">{p.title}</div>
                        <small className="text-muted fs-8 text-capitalize">{p.source}</small>
                      </td>
                      <td>
                        <Badge bg={getDifficultyColor(p.difficulty)} className="px-2.5 py-1.5 fs-9 fw-semibold">
                          {p.difficulty}
                        </Badge>
                      </td>
                      <td>
                        <span className="fw-bold fs-7 text-secondary">{p.rating || 'N/A'}</span>
                      </td>
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          {p.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} bg="light" text="dark" className="border fs-9 font-normal">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className="text-muted fs-8">{(p.solvedCount / 1000).toFixed(1)}k Solved</span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Button
                            variant="link"
                            className="p-0 text-secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleBookmark(p.id);
                            }}
                          >
                            <i className={`bi ${isBookmarked ? 'bi-bookmark-fill text-primary' : 'bi-bookmark'} fs-5`}></i>
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            className="fw-bold py-1.5 px-3 fs-9"
                            onClick={() => onSelectProblem(p)}
                          >
                            Solve
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </div>

        {/* Load More Pagination */}
        {hasMore && !loading && (
          <div className="text-center mt-4">
            <Button
              variant="outline-primary"
              size="sm"
              className="fw-bold px-4 py-2"
              onClick={() => fetchProblemsList(true)}
            >
              Load More Problems
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};
