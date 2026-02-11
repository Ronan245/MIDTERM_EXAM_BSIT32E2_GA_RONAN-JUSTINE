import React from 'react';

const GameOverModal = ({ isOpen, players, onPlayAgain, onNewGame }) => {
  if (!isOpen) return null;

  // Sort players by cumulative score (descending)
  const sortedPlayers = [...players].sort((a, b) => {
    const scoreA =
      a.frames.length > 0
        ? a.frames[a.frames.length - 1].score ?? 0
        : 0;

    const scoreB =
      b.frames.length > 0
        ? b.frames[b.frames.length - 1].score ?? 0
        : 0;

    return scoreB - scoreA;
  });

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full animate-fade-in">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-blue-900 mb-2">
            Game Over! 🎳
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Final Standings
          </p>

          <div className="space-y-4 mb-8">
            {sortedPlayers.map((player, index) => {
              const finalScore =
                player.frames.length > 0
                  ? player.frames[player.frames.length - 1].score ?? 0
                  : 0;

              const isWinner = index === 0;

              return (
                <div
                  key={player.id}
                  className={`flex justify-between items-center p-3 rounded-lg border transition
                    ${
                      isWinner
                        ? 'bg-yellow-100 border-yellow-300'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-bold text-xl ${
                        isWinner
                          ? 'text-yellow-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {isWinner ? '👑' : `#${index + 1}`}
                    </span>

                    <span className="font-semibold text-gray-800">
                      {player.name}
                    </span>
                  </div>

                  <span className="font-bold text-2xl text-blue-600">
                    {finalScore}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onPlayAgain}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold shadow-md hover:bg-blue-700 transition transform hover:scale-105"
            >
              🔄 Play Again
            </button>

            <button
              onClick={onNewGame}
              className="w-full py-3 bg-gray-200 text-gray-800 rounded-lg font-bold shadow-sm hover:bg-gray-300 transition"
            >
              ➕ Create New Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameOverModal;
