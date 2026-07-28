"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Vote,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  X,
  AlertCircle,
  ThumbsUp,
  BarChart2,
  Award,
} from "lucide-react";
import { getMemberPollsByCoopId, castVote } from "../../lib/votingService.js";
import { useAuth } from "../../hooks/useAuth.js";
import TiltPopUp from "@/components/pop-ups/TiltPopUp";

const VotingView = ({ coopId }) => {
  const [activePolls, setActivePolls] = useState([]);
  const [castedPolls, setCastedPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [voting, setVoting] = useState(false);
  const [resultsModal, setResultsModal] = useState(null);
  const { user } = useAuth();

  const fetchPolls = useCallback(async () => {
    if (!coopId || !user?.userId) return;

    try {
      setLoading(true);
      const currentTime = new Date().toISOString();
      const { activePolls: active, castedPolls: casted } =
        await getMemberPollsByCoopId(coopId, user.userId, currentTime);
      setActivePolls(active);
      setCastedPolls(casted);
    } catch (error) {
      console.error("Failed to fetch polls:", error);
    } finally {
      setLoading(false);
    }
  }, [coopId, user?.userId]);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  const handleVote = async () => {
    if (!selectedPoll || selectedOption === null || !user?.userId) return;

    try {
      setVoting(true);
      await castVote(selectedPoll.$id, user.userId, selectedOption);

      // Move poll from active to casted
      setActivePolls(activePolls.filter((p) => p.$id !== selectedPoll.$id));
      setCastedPolls([selectedPoll, ...castedPolls]);
      setSelectedPoll(null);
      setSelectedOption(null);
    } catch (error) {
      console.error("Failed to cast vote:", error);
      alert(error.message || "Failed to cast vote");
    } finally {
      setVoting(false);
    }
  };

  const isPollEnded = (poll) => {
    if (poll?.status) return poll.status === "closed";
    return new Date(poll.endTime) <= new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 h-96">
        <div className="w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 animate-fadeIn">
      {/* Header */}
      <div className="mb-6">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          Polls
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Participate in cooperative decision-making
        </p>
      </div>

      {/* Active Polls Section */}
      {activePolls.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
            Active Polls
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activePolls.map((poll) => (
              <PollCard
                key={poll.$id}
                poll={poll}
                status="active"
                onClick={() => {
                  setSelectedPoll(poll);
                  setSelectedOption(null);
                }}
                onShowResults={null}
              />
            ))}
          </div>
        </div>
      )}

      {/* Casted Polls Section */}
      {castedPolls.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
            Your Votes
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {castedPolls.map((poll) => (
              <PollCard
                key={poll.$id}
                poll={poll}
                status={isPollEnded(poll) ? "ended" : "voted"}
                onClick={null}
                onShowResults={() =>
                  isPollEnded(poll) && setResultsModal(poll)
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {activePolls.length === 0 && castedPolls.length === 0 && (
        <div className="p-12 text-center bg-white shadow-lg dark:bg-slate-800 rounded-xl">
          <Vote
            size={48}
            className="mx-auto mb-4 text-gray-400 dark:text-gray-600"
          />
          <h3 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">
            No polls available
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            There are no polls available at the moment
          </p>
        </div>
      )}

      {/* Vote Modal */}
      {selectedPoll && (
        <VoteModal
          poll={selectedPoll}
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
          onClose={() => {
            setSelectedPoll(null);
            setSelectedOption(null);
          }}
          onVote={handleVote}
          voting={voting}
        />
      )}

      {/* Results Modal */}
      {resultsModal && (
        <ResultsModal
          poll={resultsModal}
          onClose={() => setResultsModal(null)}
        />
      )}
    </div>
  );
};

const PollCard = ({ poll, status, onClick, onShowResults }) => {
  const daysLeft = Math.ceil(
    (new Date(poll.endTime) - new Date()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="p-6 transition-all duration-300 transform bg-white shadow-lg dark:bg-slate-800 rounded-xl hover:-translate-y-1">
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {status === "active" && (
            <span className="flex items-center px-3 py-1 space-x-2 text-xs font-semibold text-green-700 bg-green-100 rounded-full dark:bg-green-900/30 dark:text-green-300">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Active</span>
            </span>
          )}
          {status === "voted" && (
            <span className="flex items-center px-3 py-1 space-x-2 text-xs font-semibold text-gray-700 bg-gray-100 rounded-full dark:bg-gray-700 dark:text-gray-300">
              <CheckCircle size={14} />
              <span>Voted</span>
            </span>
          )}
          {status === "ended" && (
            <span className="flex items-center px-3 py-1 space-x-2 text-xs font-semibold text-blue-700 rounded-full bg-tint dark:bg-green-300 dark:text-green-900">
              <Award size={14} />
              <span>Ended</span>
            </span>
          )}
          {poll.isCritical && (
            <span className="px-3 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full dark:bg-red-900/30 dark:text-red-300">
              Critical
            </span>
          )}
        </div>
        <span className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
          <Clock size={14} />
          <span>{daysLeft > 0 ? `${daysLeft}d left` : "Ended"}</span>
        </span>
      </div>

      {/* Title & Description */}
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
        {poll.title}
      </h3>
      {poll.description && (
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {poll.description}
        </p>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between pt-4 text-xs text-gray-500 border-t dark:text-gray-400 dark:border-slate-700">
        <div className="flex items-center space-x-1">
          <BarChart2 size={14} />
          <span>3 options</span>
        </div>
        <div className="flex items-center space-x-1">
          <Users size={14} />
          <span>{poll.votes?.length || 0} voted</span>
        </div>
      </div>

      {/* Action Button */}
      {status === "active" && (
        <button
          onClick={onClick}
          className="flex items-center justify-center w-full px-4 py-2 mt-4 space-x-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Vote size={16} />
          <span>Cast Your Vote</span>
        </button>
      )}
      {status === "voted" && (
        <button
          disabled
          className="flex items-center justify-center w-full px-4 py-2 mt-4 space-x-2 text-sm font-medium text-gray-600 bg-gray-300 rounded-lg cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
        >
          <CheckCircle size={16} />
          <span>Vote Casted</span>
        </button>
      )}
      {status === "ended" && (
        <button
          onClick={onShowResults}
          className="flex items-center justify-center w-full px-4 py-2 mt-4 space-x-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <TrendingUp size={16} />
          <span>Results Available</span>
        </button>
      )}
    </div>
  );
};

const VoteModal = ({
  poll,
  selectedOption,
  setSelectedOption,
  onClose,
  onVote,
  voting,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const options = ["JA (Yes)", "NEIN (No)", "ENTHALTUNG (Abstain)"];

  const handleClose = () => {
    if (voting) return;
    setIsOpen(false);
    setTimeout(onClose, 300);
  };

  return (
    <TiltPopUp
      isOpen={isOpen}
      onClose={handleClose}
      closeOnOverlayClick={!voting}
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-150 dark:border-slate-700"
    >
        {/* Header */}
        <div className="p-6 border-b dark:border-slate-700">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="pr-8 text-xl font-semibold text-gray-900 dark:text-white">
                {poll.title}
              </h3>
              {poll.isCritical && (
                <span className="inline-flex items-center px-3 py-1 mt-2 text-xs font-semibold text-red-700 bg-red-100 rounded-full dark:bg-red-900/30 dark:text-red-300">
                  Critical Poll
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              <X size={20} />
            </button>
          </div>
          {poll.description && (
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
              {poll.description}
            </p>
          )}
          <div className="flex items-center space-x-4 text-sm">
            <span className="flex items-center px-3 py-1 space-x-2 font-semibold text-green-700 bg-green-100 rounded-full dark:bg-green-900/30 dark:text-green-300">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Poll is Live</span>
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              {poll.votes?.length || 0} votes cast
            </span>
          </div>
        </div>

        {/* Options */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          <p className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
            Select your choice:
          </p>
          <div className="space-y-3">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedOption(index)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedOption === index
                    ? "border-blue-600 bg-blue-50 dark:bg-primary-dark-900/20"
                    : "border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {option}
                  </span>
                  {selectedOption === index && (
                    <CheckCircle
                      size={20}
                      className="text-blue-600 dark:text-primary/80"
                    />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Poll Info */}
          <div className="grid grid-cols-2 gap-4 pt-6 mt-6 text-sm border-t dark:border-slate-700">
            <div>
              <p className="mb-1 text-gray-500 dark:text-gray-400">
                Created On
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date(poll.$createdAt).toLocaleDateString()}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {new Date(poll.$createdAt).toLocaleTimeString()}
              </p>
            </div>
            <div>
              <p className="mb-1 text-gray-500 dark:text-gray-400">Ends On</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date(poll.endTime).toLocaleDateString()}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {new Date(poll.endTime).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50 dark:bg-slate-800/50 dark:border-slate-700">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <AlertCircle size={16} />
            <span>You can only vote once</span>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={voting}
              className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border rounded-lg dark:text-gray-300 dark:bg-slate-700 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onVote}
              disabled={selectedOption === null || voting}
              className="flex items-center px-6 py-2 space-x-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {voting ? (
                <>
                  <div className="w-4 h-4 border-b-2 border-white rounded-full animate-spin"></div>
                  <span>Voting...</span>
                </>
              ) : (
                <>
                  <ThumbsUp size={16} />
                  <span>Submit Vote</span>
                </>
              )}
            </button>
          </div>
        </div>
    </TiltPopUp>
  );
};

const ResultsModal = ({ poll, onClose }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [animateResults, setAnimateResults] = useState(false);
  const yesCount = Number(poll.yesCount || 0);
  const noCount = Number(poll.noCount || 0);
  const abstainCount = Number(poll.abstainCount || 0);
  const totalVotes = yesCount + noCount + abstainCount;
  const maxVotes = Math.max(yesCount, noCount, abstainCount);
  const winnersCount = [yesCount, noCount, abstainCount].filter(
    (count) => count === maxVotes,
  ).length;
  const hasTie = winnersCount > 1;
  const options = [
    { name: "JA (Yes)", votes: yesCount },
    { name: "NEIN (No)", votes: noCount },
    { name: "ENTHALTUNG (Abstain)", votes: abstainCount },
  ];

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300);
  };

  return (
    <TiltPopUp
      isOpen={isOpen}
      onClose={handleClose}
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-150 dark:border-slate-700"
    >
        {/* Header */}
        <div className="p-6 border-b dark:border-slate-700">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="pr-8 text-xl font-semibold text-gray-900 dark:text-white">
                {poll.title}
              </h3>
              {poll.isCritical && (
                <span className="inline-flex items-center px-3 py-1 mt-2 text-xs font-semibold text-red-700 bg-red-100 rounded-full dark:bg-red-900/30 dark:text-red-300">
                  Critical Poll
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              <X size={20} />
            </button>
          </div>
          {poll.description && (
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
              {poll.description}
            </p>
          )}
          <div className="flex items-center space-x-4 text-sm">
            {!animateResults ? (
              <button
                className="flex items-center px-4 py-2 space-x-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                onClick={() => setAnimateResults(true)}
              >
                <TrendingUp size={16} />
                <span>View Results</span>
              </button>
            ) : (
              <span className="flex items-center px-3 py-1 space-x-2 font-semibold text-blue-700 rounded-full bg-tint dark:bg-green-300 dark:text-green-900">
                <Award size={14} />
                <span>Poll Ended</span>
              </span>
            )}
            <span className="text-gray-500 dark:text-gray-400">
              {poll.votes?.length || 0} votes cast
            </span>
          </div>
        </div>

        {/* Results */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="mt-6 space-y-4">
            {options.map((option, index) => {
              const voteCount = option.vote || option.votes || 0;
              const percentage =
                totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
              const isWinner =
                !hasTie && voteCount === maxVotes && animateResults;

              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg bg-gray-50 dark:bg-slate-700/50 ${
                    isWinner
                      ? "border border-green-500 dark:border-green-400"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`font-medium ${
                        isWinner
                          ? "text-green-700 dark:text-green-300"
                          : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {option.name}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {voteCount} votes ({percentage.toFixed(1)}%)
                    </span>
                  </div>

                  {/* Bar Background */}
                  <div className="w-full h-3 overflow-hidden bg-gray-200 rounded-full dark:bg-slate-600">
                    {/* Bar Fill (starts at 0, animates if animateResults=true) */}
                    <div
                      className={`h-full rounded-full transition-all duration-[1500ms] ease-out ${
                        isWinner && !hasTie ? "bg-green-600" : "bg-blue-600"
                      }`}
                      style={{
                        width: animateResults ? `${percentage}%` : "0%",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Poll Info */}
          <div className="grid grid-cols-2 gap-4 pt-6 mt-6 text-sm border-t dark:border-slate-700">
            <div>
              <p className="mb-1 text-gray-500 dark:text-gray-400">
                Created On
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date(poll.$createdAt).toLocaleDateString()}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {new Date(poll.$createdAt).toLocaleTimeString()}
              </p>
            </div>
            <div>
              <p className="mb-1 text-gray-500 dark:text-gray-400">Ended On</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date(poll.endTime).toLocaleDateString()}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {new Date(poll.endTime).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
    </TiltPopUp>
  );
};

export default VotingView;
