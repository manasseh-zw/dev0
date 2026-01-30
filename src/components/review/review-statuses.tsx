import React from "react";

export type ReviewStatus = "PENDING_REVIEW" | "ACCEPTED" | "REJECTED";

export interface ReviewStatusConfig {
  id: ReviewStatus;
  name: string;
  color: string;
  icon: React.FC;
}

export const PendingReviewIcon: React.FC = () => {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle
        cx="7"
        cy="7"
        r="6"
        fill="none"
        stroke="#8b5cf6"
        strokeWidth="2"
        strokeDasharray="3.14 0"
        strokeDashoffset="-0.7"
      ></circle>
      <circle
        className="progress"
        cx="7"
        cy="7"
        r="2"
        fill="none"
        stroke="#8b5cf6"
        strokeWidth="4"
        strokeDasharray="4.167846253762459 100"
        strokeDashoffset="0"
        transform="rotate(-90 7 7)"
      ></circle>
    </svg>
  );
};

export const AcceptedIcon: React.FC = () => {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle
        cx="7"
        cy="7"
        r="6"
        fill="none"
        stroke="#22c55e"
        strokeWidth="2"
        strokeDasharray="3.14 0"
        strokeDashoffset="-0.7"
      ></circle>
      <path
        d="M4.5 7L6.5 9L9.5 5"
        stroke="#22c55e"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const RejectedIcon: React.FC = () => {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle
        cx="7"
        cy="7"
        r="6"
        fill="none"
        stroke="#ef4444"
        strokeWidth="2"
        strokeDasharray="3.14 0"
        strokeDashoffset="-0.7"
      ></circle>
      <path
        d="M5 5L9 9M9 5L5 9"
        stroke="#ef4444"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const reviewStatuses: ReviewStatusConfig[] = [
  {
    id: "PENDING_REVIEW",
    name: "Pending Review",
    color: "#8b5cf6",
    icon: PendingReviewIcon,
  },
  {
    id: "ACCEPTED",
    name: "Accepted",
    color: "#22c55e",
    icon: AcceptedIcon,
  },
  {
    id: "REJECTED",
    name: "Rejected",
    color: "#ef4444",
    icon: RejectedIcon,
  },
];

export const ReviewStatusIcon: React.FC<{ statusId: ReviewStatus }> = ({
  statusId,
}) => {
  const currentStatus = reviewStatuses.find((s) => s.id === statusId);
  if (!currentStatus) return null;

  const IconComponent = currentStatus.icon;
  return <IconComponent />;
};
