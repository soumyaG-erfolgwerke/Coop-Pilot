"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  getIssuesForAuditOrg,
  createIssueForAuditOrg,
  getCommentsForIssue,
  createCommentForIssue,
  updateIssueStatus,
} from "@/lib/orgIssueService";

import IssueSkeleton from "./IssueSkeleton";
import IssueListView from "./IssueListView";
import IssueDetailView from "./IssueDetailView";

export default function Issues({ auditOrg }) {
  const router = useRouter();
  const params = useSearchParams();

  const issueId = params.get("issueId");

  /* ---------------- Constants ---------------- */
  const pageSize = 10;
  const orgId = auditOrg.id || auditOrg.$id;

  /* ---------------- Issues State ---------------- */
  const [issues, setIssues] = useState([]);
  const [issuesPage, setIssuesPage] = useState(1);
  const [issuesTotalPages, setIssuesTotalPages] = useState(1);
  const [issuesLoading, setIssuesLoading] = useState(true);

  /* ---------------- Comments State ---------------- */
  const [comments, setComments] = useState([]);
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsHasMore, setCommentsHasMore] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);

  /* ---------------- UI State ---------------- */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });

  /* ---------------- Derived State ---------------- */
  const selectedIssue = useMemo(() => {
    return issues.find((i) => i.id === issueId);
  }, [issues, issueId]);

  /* ---------------- Issues API ---------------- */
  const loadIssues = async (page = 1) => {
    setIssuesLoading(true);
    try {
      const res = await getIssuesForAuditOrg(orgId, page, pageSize);

      setIssues(res.issues || []);
      setIssuesPage(res.page || page);
      setIssuesTotalPages(res.totalPages || 1);
    } catch (error) {
      console.error("Failed to load issues", error);
    } finally {
      setIssuesLoading(false);
    }
  };

  useEffect(() => {
    loadIssues(issuesPage);
  }, [orgId, issuesPage]);

  /* ---------------- Comments API (Load More) ---------------- */
  const loadComments = async (id, page = 1, append = false) => {
    setCommentLoading(true);

    try {
      const res = await getCommentsForIssue(id, page, pageSize);

      const newComments = res.comments || [];

      setComments((prev) =>
        append ? [...prev, ...newComments] : newComments
      );

      setCommentsPage(res.page || page);
      setCommentsHasMore(
        res.hasMore ?? newComments.length === pageSize
      );
    } catch (error) {
      console.error("Failed to load comments", error);
    } finally {
      setCommentLoading(false);
    }
  };

  useEffect(() => {
    if (!issueId) return;

    setComments([]);
    setCommentsPage(1);
    setCommentsHasMore(true);

    loadComments(issueId, 1, false);
  }, [issueId]);

  /* ---------------- Actions ---------------- */
  const handleOpenIssue = (id) =>
    router.push(`?tab=issues&issueId=${id}`);

  const handleBackToList = () => router.push(`?tab=issues`);

  const handleCreateIssue = async () => {
    if (!form.title.trim()) return;

    setCreating(true);

    try {
      const res = await createIssueForAuditOrg(
        orgId,
        form.title,
        form.description
      );

      const newIssueId = res?.issue?.id;

      await loadIssues(1);

      setDrawerOpen(false);
      setForm({ title: "", description: "" });

      if (newIssueId) {
        router.push(`?tab=issues&issueId=${newIssueId}`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  const handlePostComment = async () => {
    if (!comment.trim() || !issueId) return;

    setPosting(true);

    try {
      await createCommentForIssue(issueId, comment);
      setComment("");

      // reload fresh first page (or you can optimistically append)
      await loadComments(issueId, 1, false);
    } catch (error) {
      console.error(error);
    } finally {
      setPosting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedIssue) return;

    const nextStatus =
      selectedIssue.status === "open" ? "resolved" : "open";

    try {
      await updateIssueStatus(selectedIssue.id, nextStatus);

      setIssues((prev) =>
        prev.map((i) =>
          i.id === selectedIssue.id
            ? { ...i, status: nextStatus }
            : i
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleLoadMoreComments = async () => {
    if (!issueId || commentLoading || !commentsHasMore) return;

    const nextPage = commentsPage + 1;
    await loadComments(issueId, nextPage, true);
  };

  /* ---------------- Render ---------------- */
  if (issuesLoading) {
    return <IssueSkeleton type="list" />;
  }

  if (issueId && selectedIssue) {
    return (
      <IssueDetailView
        issue={selectedIssue}
        comments={comments}
        commentLoading={commentLoading}
        commentText={comment}
        setCommentText={setComment}
        isPostingComment={posting}
        onPostComment={handlePostComment}
        onToggleStatus={handleToggleStatus}
        onBack={handleBackToList}
        onLoadMoreComments={handleLoadMoreComments}
        hasMoreComments={commentsHasMore}
      />
    );
  }

  return (
    <IssueListView
      auditOrgName={auditOrg.name}
      issues={issues}
      page={issuesPage}
      totalPages={issuesTotalPages}
      setPage={setIssuesPage}
      drawerOpen={drawerOpen}
      setDrawerOpen={setDrawerOpen}
      form={form}
      setForm={setForm}
      creating={creating}
      onCreateIssue={handleCreateIssue}
      onOpenIssue={handleOpenIssue}
    />
  );
}