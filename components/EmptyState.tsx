import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  href?: string;
  onActionClick?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  href,
  onActionClick,
}) => {
  const content = (
    <>
      <p className="text-lg text-slate-600">{title}</p>
      {description && (
        <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">{description}</p>
      )}
      {actionLabel && (
        <button
          type="button"
          onClick={onActionClick}
          className="mt-4 btn-primary px-5 py-3 font-medium"
        >
          {actionLabel}
        </button>
      )}
    </>
  );

  if (href) {
    return (
      <div className="py-16 text-center">
        {content}
      </div>
    );
  }

  return (
    <div className="py-16 text-center">
      {content}
    </div>
  );
};

export default EmptyState;
