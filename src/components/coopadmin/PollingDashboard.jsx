"use client";
import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import {
  Plus,
  X,
  Calendar,
  BarChart2,
  Clock,
  CheckCircle,
  Users,
  TrendingUp,
} from "lucide-react";
import { createPolls, getPollsByCoopId } from "@/lib/votingService.js";

const PollsView = ({ selectedCoop }) => {
  const [polls, setPolls] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch polls when component mounts or coop changes
  //   useEffect(() => {
  //     if (selectedCoop) {
  //       fetchPolls();
  //     }
  //   }, [selectedCoop]);

  const fetchPolls = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedPolls = await getPollsByCoopId(selectedCoop);
      setPolls(fetchedPolls);
    } catch (error) {
      console.error("Failed to fetch polls:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedCoop]);

  useEffect(() => {
    if (selectedCoop) {
      fetchPolls();
    }
  }, [selectedCoop, fetchPolls]);

  const handleCreatePoll = async (pollData) => {
    try {
      const newPoll = await createPolls(
        selectedCoop,
        pollData.options,
        pollData.endTime,
        pollData.title,
        pollData.description,
        pollData.isCritical || false,
        ""
      );
      setPolls([newPoll, ...polls]);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Failed to create poll:", error);
    }
  };

  const isPollLive = (endTime) => {
    return new Date(endTime) > new Date();
  };

  return (
    <div className="p-4 sm:p-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Polls Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create and manage polls for your cooperative
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center px-4 py-2 space-x-2 text-white transition-colors bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Create Poll</span>
        </button>
      </div>

      {/* Polls Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : polls.length === 0 ? (
        <div className="p-12 text-center bg-white shadow-lg dark:bg-slate-800 rounded-xl">
          <BarChart2
            size={48}
            className="mx-auto mb-4 text-gray-400 dark:text-gray-600"
          />
          <h3 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">
            No polls yet
          </h3>
          <p className="mb-4 text-gray-500 dark:text-gray-400">
            Create your first poll to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {polls.map((poll) => (
            <PollCard
              key={poll.$id}
              poll={poll}
              onClick={() => setSelectedPoll(poll)}
              isLive={poll.status ? poll.status === "live" : isPollLive(poll.endTime)}
            />
          ))}
        </div>
      )}

      {/* Create Poll Modal */}
      {isCreateModalOpen && (
        <CreatePollModal
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreatePoll}
        />
      )}

      {/* Poll Details Modal */}
      {selectedPoll && (
        <PollDetailsModal
          poll={selectedPoll}
          onClose={() => setSelectedPoll(null)}
          isLive={selectedPoll.status ? selectedPoll.status === "live" : isPollLive(selectedPoll.endTime)}
        />
      )}
    </div>
  );
};

const PollCard = ({ poll, onClick, isLive }) => {
  const optionCount = 3;

  return (
    <div
      onClick={onClick}
      className="p-6 transition-all duration-300 transform bg-white shadow-lg cursor-pointer dark:bg-slate-800 rounded-xl hover:shadow-xl hover:-translate-y-1"
    >
      {/* Status Badge */}
      <div className="flex items-center justify-start gap-4 mb-4">
        {isLive ? (
          <span className="flex items-center px-3 py-1 space-x-2 text-xs font-semibold text-green-700 bg-green-100 rounded-full dark:bg-green-900/30 dark:text-green-300">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live</span>
          </span>
        ) : (
          <span className="flex items-center px-3 py-1 space-x-2 text-xs font-semibold text-blue-700 rounded-full bg-tint dark:bg-teal-300/80 dark:text-black">
            <CheckCircle size={14} />
            <span>Ended</span>
          </span>
        )}

        {poll.isCritical && (
          <span className="px-3 py-1 ml-0 text-xs font-semibold text-red-700 bg-red-100 rounded-full dark:bg-red-900/30 dark:text-red-300">
            Critical
          </span>
        )}
        <span className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
          <Users size={14} />
          <span>{poll.votes?.length || 0} voted</span>
        </span>
      </div>

      {/* Title & Description */}
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
        {poll.title}
      </h3>

      {/* Stats */}
      <div className="flex items-center justify-between pt-4 text-xs text-gray-500 border-t dark:text-gray-400 dark:border-slate-700">
        <div className="flex items-center space-x-1">
          <BarChart2 size={14} />
          <span>{optionCount} options</span>
        </div>
        <div className="flex items-center space-x-1">
          <Clock size={14} />
          <span>Ends {new Date(poll.endTime).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

const CreatePollModal = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState([
    { name: "JA (Yes)", votes: 0 },
    { name: "NEIN (No)", votes: 0 },
    { name: "ENTHALTUNG (Abstain)", votes: 0 },
  ]);
  const [endTime, setEndTime] = useState("");
  const [isCritical, setIsCritical] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = "Title is required";
    if (!endTime) newErrors.endTime = "End time is required";
    if (new Date(endTime) <= new Date())
      newErrors.endTime = "End time must be in the future";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ title, description, options, endTime, isCritical });
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transform animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-slate-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Create New Poll
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]"
        >
          {/* Title */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white"
              placeholder="Enter poll title"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg resize-none dark:border-slate-600 focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white"
              rows="3"
              placeholder="Add a description for your poll"
            />
          </div>

          {/* Options */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Options *
              </label>
            </div>
            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={option.name}
                    className="flex-1 px-4 py-2 border rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white"
                    readOnly
                    disabled
                  />
                </div>
              ))}
            </div>
          </div>

          {/* End Time */}
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              End Time *
            </label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white"
            />
            {errors.endTime && (
              <p className="mt-1 text-xs text-red-500">{errors.endTime}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isCritical}
                onChange={(e) => setIsCritical(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-primary dark:border-slate-600 dark:bg-slate-700"
              />
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mark as Critical Poll
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Critical polls will be highlighted for members to prioritize
                </p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-4 space-x-3 border-t dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border rounded-lg dark:text-gray-300 dark:bg-slate-700 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg shadow-md hover:bg-blue-700"
            >
              Create Poll
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

const PollDetailsModal = ({ poll, onClose, isLive }) => {
  // const [showResults, setShowResults] = useState(false);
  const [animateResults, setAnimateResults] = useState(false);

  const options = poll.options.map((opt) => JSON.parse(opt));
  const totalVotes = options.reduce((sum, opt) => sum + (opt.votes || 0), 0);

  // Determine highest votes to highlight winner (only if no tie)
  const maxVotes = Math.max(...options.map((o) => o.votes));
  const winnerCount = options.filter((o) => o.votes === maxVotes).length;
  const hasTie = winnerCount > 1;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transform animate-scaleIn">
        {/* Header */}
        <div className="p-6 border-b dark:border-slate-700">
          <div className="flex items-start justify-between mb-2">
            <h3 className="pr-8 text-xl font-semibold text-gray-900 dark:text-white">
              {poll.title}
            </h3>
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
            {isLive ? (
              <span className="flex items-center px-3 py-1 space-x-2 font-semibold text-green-700 bg-green-100 rounded-full dark:bg-green-900/30 dark:text-green-300">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Poll is Live</span>
              </span>
            ) : (
              !isLive && (
                <button
                  className="flex items-center px-4 py-2 space-x-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                  onClick={() => setAnimateResults(true)}
                >
                  <TrendingUp size={16} />
                  <span>View Results</span>
                </button>
              )
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
              const percentage =
                totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;

              const isWinner =
                !hasTie && option.votes === maxVotes && animateResults;

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
                      {option.votes || 0} votes ({percentage.toFixed(1)}%)
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
      </div>
    </div>,
    document.body
  );
};

export default PollsView;
