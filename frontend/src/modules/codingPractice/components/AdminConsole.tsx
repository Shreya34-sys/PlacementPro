import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner, Alert, Table, Form } from 'react-bootstrap';
import { getSyncMetadata } from '../services/problemService';
import axios from 'axios';

export const AdminConsole: React.FC = () => {
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchMeta = async () => {
    setLoading(true);
    try {
      const data = await getSyncMetadata();
      setMeta(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  const handleSyncNow = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const hostname = window.location.hostname;
      const functionsUrl = (hostname === 'localhost' || hostname === '127.0.0.1')
        ? 'http://127.0.0.1:5001/placementpro-22829/us-central1'
        : 'https://us-central1-placementpro-22829.cloudfunctions.net';

      const response = await axios.post(`${functionsUrl}/manualCodeforcesSync`);
      if (response.status === 200) {
        setSyncResult({
          success: true,
          message: `Successfully synchronized ${response.data.totalSynced} problems from Codeforces API!`
        });
        fetchMeta();
      } else {
        throw new Error('Synchronization endpoint returned failure');
      }
    } catch (e) {
      setSyncResult({
        success: false,
        message: e instanceof Error ? e.message : 'Manual synchronization failed. Please check backend logs.'
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
      <Card.Header className="bg-white py-3 border-bottom">
        <h5 className="fw-bold mb-0 text-dark">
          <i className="bi bi-shield-lock text-primary me-2"></i> Coding Practice Admin Console
        </h5>
      </Card.Header>
      
      <Card.Body className="p-4">
        <div className="mb-4">
          <h6 className="fw-bold text-dark fs-7 mb-3">Codeforces Problemset Synchronization</h6>
          <p className="text-secondary fs-8 leading-relaxed">
            The platform periodically pulls problems from Codeforces. You can trigger a manual fetch here. Note that batch processes write in chunks of 500 and will update statistics for duplicates idempotently.
          </p>
        </div>

        {syncResult && (
          <Alert variant={syncResult.success ? 'success' : 'danger'} className="py-2.5 mb-4 fs-8 fw-semibold">
            <i className={`bi ${syncResult.success ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'} me-2`}></i>
            {syncResult.message}
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" size="sm" className="mb-2" />
            <div className="text-muted fs-8">Fetching synchronization status...</div>
          </div>
        ) : (
          <div className="bg-light p-3 rounded-3 border mb-4">
            <Table borderless size="sm" className="mb-0 fs-8 text-secondary">
              <tbody>
                <tr>
                  <td className="fw-semibold text-dark" style={{ width: '160px' }}>Last Synchronization:</td>
                  <td>
                    {meta?.lastSyncAt
                      ? new Date(meta.lastSyncAt.seconds * 1000).toLocaleString()
                      : 'Never'}
                  </td>
                </tr>
                <tr>
                  <td className="fw-semibold text-dark">Sync Status:</td>
                  <td>
                    <span className={`badge bg-${meta?.status === 'success' ? 'success' : 'danger'} fs-9`}>
                      {meta?.status || 'Unknown'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="fw-semibold text-dark">Total Logged Problems:</td>
                  <td className="fw-bold text-dark">{meta?.totalProblems || 0}</td>
                </tr>
                {meta?.lastError && (
                  <tr>
                    <td className="fw-semibold text-danger">Last Error message:</td>
                    <td className="text-danger font-monospace fs-9">{meta.lastError}</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        )}

        <Button
          variant="primary"
          className="fw-bold py-2 px-4 shadow-xs"
          onClick={handleSyncNow}
          disabled={syncing}
        >
          {syncing ? (
            <>
              <Spinner size="sm" animation="border" className="me-2" /> Syncing Problems...
            </>
          ) : (
            <>
              <i className="bi bi-arrow-repeat me-1.5"></i> Trigger Manual Sync
            </>
          )}
        </Button>
      </Card.Body>
    </Card>
  );
};
