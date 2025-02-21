interface TeamScoresProps {
  team0score?: number;
  team1score?: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const TeamScores = ({
  team0score,
  team1score,
  currentPage,
  totalPages,
  onPageChange,
}: TeamScoresProps) => (
  <div className="mb-4 flex flex-col place-items-center space-y-4">
    {team0score !== undefined && team1score !== undefined && (
      <div className="text-7xl">
        <span className="blue-team font-bold">{team0score}</span>
        <span> - </span>
        <span className="orange-team font-bold">{team1score}</span>
      </div>
    )}
    <div className="flex items-center space-x-4">
      <button
        className="btn"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </button>
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <button
        className="btn"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </button>
    </div>
  </div>
);
