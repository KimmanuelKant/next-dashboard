// src/components/LeagueSelectorModal.tsx
"use client";

import { useState } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { useRouter } from 'next/navigation';

interface LeagueSelectorModalProps {
  show: boolean;
  onHide: () => void;
}

interface League {
  id: number;
  name: string;
  entry_name: string;
}

export default function LeagueSelectorModal({ show, onHide }: LeagueSelectorModalProps) {
  const [userId, setUserId] = useState('');
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchLeagues = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`https://fantasy.premierleague.com/api/leagues/classic/standings/${userId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch leagues');
      }
      const data = await res.json();
      setLeagues(data.leagues || []);
    } catch (err) {
      setError('Failed to fetch leagues. Please check your user ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userId) {
      fetchLeagues();
    }
  };

  const handleLeagueSelect = (leagueId: number) => {
    router.push(`/dashboard/${leagueId}/team`);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Select League</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Enter your FPL User ID</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </Form.Group>
          <Button type="submit" variant="primary" className="w-100" disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : 'Find Leagues'}
          </Button>
        </Form>

        {error && <div className="alert alert-danger mt-3">{error}</div>}

        {leagues.length > 0 && (
          <div className="mt-3">
            <h6>Your Leagues:</h6>
            <div className="list-group">
              {leagues.map((league) => (
                <button
                  key={league.id}
                  className="list-group-item list-group-item-action"
                  onClick={() => handleLeagueSelect(league.id)}
                >
                  {league.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
}