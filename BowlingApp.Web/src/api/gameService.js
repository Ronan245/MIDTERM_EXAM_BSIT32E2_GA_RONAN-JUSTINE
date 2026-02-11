const API_BASE_URL = "http://localhost:5035/api/game"; // Match your backend URL

// ---------------- Create Game ----------------
export const createGame = async (playerNames) => {
  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(playerNames),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create game: ${errorText}`);
  }

  return response.json(); // Returns the created Game object
};

// ---------------- Get Game ----------------
export const getGame = async (gameId) => {
  const response = await fetch(`${API_BASE_URL}/${gameId}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch game: ${errorText}`);
  }

  return response.json(); // Returns full game state
};

// ---------------- Roll Ball ----------------
export const rollBall = async (gameId, playerId, pins) => {
  const response = await fetch(`${API_BASE_URL}/${gameId}/roll`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId, pins }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to submit roll: ${errorText}`);
  }

  return response.json(); // Returns updated game state
};
