import React, { useState } from 'react';
import { Card, Button, Form, ProgressBar } from 'react-bootstrap';

interface ResumeUploaderProps {
  resumeUrl?: string;
  onUploadComplete?: (url: string) => void;
}

export const ResumeUploader: React.FC<ResumeUploaderProps> = ({ resumeUrl, onUploadComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const handleUpload = () => {
    if (!file) return;
    setUploading(true);
    setProgress(30);
    setTimeout(() => setProgress(70), 500);
    setTimeout(() => {
      setProgress(100);
      setUploading(false);
      if (onUploadComplete) onUploadComplete(`https://placementpro.edu/resumes/${file.name}`);
    }, 1200);
  };

  return (
    <Card className="shadow-sm border-0">
      <Card.Header className="bg-white fw-bold py-3">
        <i className="bi bi-file-earmark-pdf text-danger me-2"></i> Placement Resume
      </Card.Header>
      <Card.Body>
        {resumeUrl ? (
          <div className="p-3 bg-light rounded d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center">
              <i className="bi bi-file-pdffile-fill text-danger fs-3 me-3"></i>
              <div>
                <h6 className="mb-0 fw-bold">Primary_Placement_Resume.pdf</h6>
                <small className="text-muted">Verified & ATS Parsing Ready</small>
              </div>
            </div>
            <Button variant="outline-primary" size="sm" href={resumeUrl} target="_blank">
              <i className="bi bi-download me-1"></i> View
            </Button>
          </div>
        ) : (
          <p className="text-muted fs-7 mb-3">
            Upload your latest resume (PDF) to auto-apply for upcoming campus job drives.
          </p>
        )}

        <Form.Group className="mb-3">
          <Form.Control
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              if (e.target.files && e.target.files[0]) {
                setFile(e.target.files[0]);
              }
            }}
          />
        </Form.Group>

        {uploading && <ProgressBar animated now={progress} className="mb-3" />}

        <Button
          variant="primary"
          size="sm"
          disabled={!file || uploading}
          onClick={handleUpload}
          className="w-100"
        >
          <i className="bi bi-cloud-upload me-1"></i>
          {uploading ? 'Uploading...' : 'Upload & Set Active Resume'}
        </Button>
      </Card.Body>
    </Card>
  );
};
