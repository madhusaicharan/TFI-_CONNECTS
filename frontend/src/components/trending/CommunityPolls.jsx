import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { voteOnPoll } from '../../services/api';
import './CommunityPolls.css';

const CommunityPolls = ({ polls, onVoteSuccess }) => {
  const { user, token } = useAuth();
  const [votingOn, setVotingOn] = useState(null);
  const [error, setError] = useState('');

  if (!polls || polls.length === 0) return <p className="no-data">No active polls right now.</p>;

  const handleVote = async (pollId, optionId) => {
    if (!user) {
      setError('You must be logged in to vote.');
      return;
    }
    
    setVotingOn(pollId);
    setError('');
    
    try {
      const updatedPoll = await voteOnPoll(pollId, optionId, token);
      if (updatedPoll && !updatedPoll.message) {
        onVoteSuccess(updatedPoll);
      } else {
        setError(updatedPoll?.message || 'Failed to vote');
      }
    } catch (err) {
      setError('An error occurred while voting.');
    } finally {
      setVotingOn(null);
    }
  };

  return (
    <div className="polls-container">
      {error && <div className="poll-error">{error}</div>}
      
      {polls.map(poll => {
        const hasVoted = user && poll.voters.includes(user._id);
        const totalVotes = poll.totalVotes || 1; // Prevent division by zero

        return (
          <div key={poll._id} className="poll-card glass-panel">
            <h3 className="poll-question">{poll.question}</h3>
            
            <div className="poll-options">
              {poll.options.map(option => {
                const percentage = hasVoted ? Math.round((option.votes / totalVotes) * 100) : 0;
                
                return (
                  <button 
                    key={option._id} 
                    className={`poll-option-btn ${hasVoted ? 'voted-view' : ''}`}
                    onClick={() => !hasVoted && handleVote(poll._id, option._id)}
                    disabled={hasVoted || votingOn === poll._id}
                  >
                    <div 
                      className="poll-option-progress" 
                      style={{ width: `${hasVoted ? percentage : 0}%` }}
                    ></div>
                    <span className="poll-option-text">{option.text}</span>
                    {hasVoted && <span className="poll-option-percent">{percentage}%</span>}
                  </button>
                );
              })}
            </div>
            
            <div className="poll-footer">
              <span>{poll.totalVotes} votes</span>
              {hasVoted && <span className="voted-badge">You voted</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CommunityPolls;
