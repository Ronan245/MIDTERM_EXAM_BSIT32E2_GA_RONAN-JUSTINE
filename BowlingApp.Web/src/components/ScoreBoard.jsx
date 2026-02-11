import React from 'react';

const ScoreBoard = ({ gameData, activePlayerIndex, onFrameClick }) => {
  const players = gameData?.players || [];

  return (
    <div className="mt-8 overflow-x-auto">
      <table className="min-w-full border-collapse border border-gray-300 shadow-sm">
        <thead className="bg-gray-800 text-white">
          <tr>
            <th className="p-3 text-left w-48">Player</th>
            {Array.from({ length: 10 }).map((_, i) => (
              <th key={i} className="p-3 border-l border-gray-600 w-16 text-center">{i + 1}</th>
            ))}
            <th className="p-3 border-l border-gray-600 w-20 text-center">Total</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {players.length > 0 ? (
            players.map((player, index) => {
              const isActivePlayer = index === activePlayerIndex;

              // Total score: cumulative score from last frame
                const totalScore = player.frames.length > 0 
                ? player.frames[player.frames.length - 1]?.score ?? 0 
                : 0;

              // Highlight the first incomplete frame
              let currentFrameIndex = player.frames.length;
              for (let i = 0; i < player.frames.length; i++) {
                const f = player.frames[i];
                const isTenth = i === 9;
                if (!isTenth) {
                  if (f.roll1 == null || (f.roll2 == null && f.roll1 !== 10)) {
                    currentFrameIndex = i;
                    break;
                  }
                } else {
                  if (
                    f.roll1 == null ||
                    f.roll2 == null ||
                    ((f.roll1 === 10 || (f.roll1 + f.roll2 === 10)) && f.roll3 == null)
                  ) {
                    currentFrameIndex = i;
                    break;
                  }
                }
              }

              return (
                <tr
                  key={player.id}
                  className={`border-b border-gray-200 transition-colors duration-200
                    ${isActivePlayer ? 'bg-blue-50 ring-2 ring-blue-500 ring-inset' : 'hover:bg-gray-50'}
                  `}
                >
                  <td className="p-3 font-semibold text-gray-800 border-r border-gray-200 flex items-center gap-2">
                    {player.name}
                    {isActivePlayer && (
                      <span className="text-blue-600 animate-pulse text-xs">● Active</span>
                    )}
                  </td>

                  {Array.from({ length: 10 }).map((_, i) => {
                    const frame = player.frames[i] || {};
                    let roll1Display = '';
                    let roll2Display = '';
                    let roll3Display = '';

                    // ---------- Frames 1-9 ----------
                    if (i < 9) {
                      if (frame.roll1 === 10) {
                        roll1Display = 'X';
                        roll2Display = '';
                      } else {
                        roll1Display = frame.roll1 ?? '';
                        if ((frame.roll1 ?? 0) + (frame.roll2 ?? 0) === 10) {
                          roll2Display = '/';
                        } else {
                          roll2Display = frame.roll2 ?? '';
                        }
                      }
                    } 
                    // ---------- 10th Frame ----------
                    else {
                      // Roll 1
                      roll1Display = frame.roll1 === 10 ? 'X' : frame.roll1 ?? '';

                      // Roll 2
                      if (frame.roll2 != null) {
                        if (frame.roll2 === 10) roll2Display = 'X';
                        else if ((frame.roll1 ?? 0) + (frame.roll2 ?? 0) === 10 && frame.roll1 !== 10) roll2Display = '/';
                        else roll2Display = frame.roll2;
                      }

                      // Roll 3
                      if (frame.roll3 != null) {
                        if (frame.roll3 === 10) roll3Display = 'X';
                        else if ((frame.roll2 ?? 0) + (frame.roll3 ?? 0) === 10 && frame.roll2 !== 10) roll3Display = '/';
                        else roll3Display = frame.roll3;
                      }
                    }

                    const isCurrentFrame = isActivePlayer && i === currentFrameIndex;
                    const isClickable = isActivePlayer;

                    return (
                      <td
                        key={i}
                        className={`p-0 border-r border-gray-200 align-top 
                          ${isClickable ? 'cursor-pointer hover:bg-blue-100' : ''} 
                          ${isCurrentFrame ? 'bg-yellow-50 ring-2 ring-yellow-400 ring-inset z-10' : ''}
                        `}
                        onClick={() => isClickable && onFrameClick && onFrameClick(index, i + 1)}
                      >
                        <div className="flex flex-col h-full">
                          <div className="flex h-8 border-b border-gray-100">
                            <span className="w-1/3 flex items-center justify-center border-r border-gray-100 text-sm h-full">
                              {roll1Display}
                            </span>
                            <span className="w-1/3 flex items-center justify-center border-r border-gray-100 text-sm h-full">
                              {roll2Display}
                            </span>
                            {i === 9 && (
                              <span className="w-1/3 flex items-center justify-center text-sm h-full">
                                {roll3Display}
                              </span>
                            )}
                          </div>
                          <div className="h-8 flex items-center justify-center font-bold text-gray-900">
                            {frame.score ?? ''}
                          </div>
                        </div>
                      </td>
                    );
                  })}

                  <td className="p-3 text-center font-bold text-xl text-blue-600">
                    {totalScore}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="12" className="p-4 text-center text-gray-400 italic">
                No players added yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ScoreBoard;
