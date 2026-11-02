import React from 'react';

interface HighlightMatchProps {
  text: string;
  query: string;
  className?: string;
  highlightClassName?: string;
}

export const HighlightMatch: React.FC<HighlightMatchProps> = ({
  text,
  query,
  className = '',
  highlightClassName = 'bg-emerald-100 text-emerald-900 font-bold px-0.5 rounded',
}) => {
  if (!query || !query.trim()) {
    return <span className={className}>{text}</span>;
  }

  const trimmedQuery = query.trim();
  // Escape regex special chars
  const escaped = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark key={index} className={highlightClassName}>
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  );
};
