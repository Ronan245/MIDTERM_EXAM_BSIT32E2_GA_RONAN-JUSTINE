import { useState, useEffect } from 'react'
import PlayerSetup from './components/PlayerSetup'
import ScoreBoard from './components/ScoreBoard'

import RollModal from './components/RollModal'
import GameOverModal from './components/GameOverModal'
import { createGame, getGame, rollBall } from './api/gameService'

// Environment Toggle: 'MOCK' or 'LIVE'
const isLive = import.meta.env.VITE_APP_MODE === 'LIVE'

function App() {
  const [game, setGame] = useState(null)
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [loading, setLoading] = useState(false)

  const [isRollModalOpen, setIsRollModalOpen] = useState(false)
  const [selectedFrame, setSelectedFrame] = useState(null)
  const [isGameOver, setIsGameOver] = useState(false)

  // ---------------- Start Game ----------------
  const handleStartGame = async (players) => {
    setLoading(true)
    setIsGameOver(false)
    try {
      if (isLive) {
        const newGame = await createGame(players)
        setGame(newGame)
      } else {
        await new Promise(resolve => setTimeout(resolve, 300))
        setGame({
          id: Math.floor(Math.random() * 10000),
          players: players.map((p, i) => ({
            id: i,
            name: p,
            frames: []
          }))
        })
      }
      setCurrentPlayerIndex(0)
    } catch (error) {
      console.error('Failed to start game', error)
      alert('Error starting game. Check console.')
    } finally {
      setLoading(false)
    }
  }

  // ---------------- Play Again (Same Players) ----------------
  const handlePlayAgain = async () => {
    if (!game) return

    const playerNames = game.players.map(p => p.name)

    setIsGameOver(false)
    setCurrentPlayerIndex(0)
    setSelectedFrame(null)
    setIsRollModalOpen(false)

    if (isLive) {
      const newGame = await createGame(playerNames)
      setGame(newGame)
    } else {
      setGame({
        id: Math.floor(Math.random() * 10000),
        players: playerNames.map((name, i) => ({
          id: i,
          name,
          frames: []
        }))
      })
    }
  }

  // ---------------- Create New Game ----------------
  const handleCreateNewGame = () => {
    setGame(null)
    setIsGameOver(false)
    setCurrentPlayerIndex(0)
    setSelectedFrame(null)
    setIsRollModalOpen(false)
  }

  // ---------------- Roll Ball ----------------
  const handleRoll = async (pins) => {
    if (!game) return

    const playerIndex = selectedFrame ? selectedFrame.playerIndex : currentPlayerIndex
    const player = game.players[playerIndex]

    try {
      if (isLive) {
        await rollBall(game.id, player.id, pins)
        const updatedGame = await getGame(game.id)
        setGame(updatedGame)
        if (updatedGame.isFinished) setIsGameOver(true)
      } else {
        const newPlayers = [...game.players]
        const currentPlayer = newPlayers[playerIndex]
        let currentFrame = currentPlayer.frames[currentPlayer.frames.length - 1]

        const isRoll2 = currentFrame && currentFrame.roll2 === null && currentFrame.roll1 !== 10
        const isTenthFrame = currentPlayer.frames.length === 10

        if (isRoll2 || (isTenthFrame && currentFrame && currentFrame.roll2 !== null && currentFrame.roll3 === null)) {
          if (isTenthFrame && currentFrame.roll2 !== null) {
            currentFrame.roll3 = pins
          } else {
            const remaining = 10 - currentFrame.roll1
            if (pins > remaining) {
              alert(`Invalid Roll! Only ${remaining} pins left.`)
              return
            }
            currentFrame.roll2 = pins
          }
        } else {
          currentPlayer.frames.push({
            roll1: pins,
            roll2: null,
            roll3: null
          })
          currentFrame = currentPlayer.frames[currentPlayer.frames.length - 1]
        }

        // ---- Cumulative scoring ----
        const calculateCumulativeScores = (frames) => {
          for (let i = 0; i < frames.length; i++) {
            const frame = frames[i]
            const r1 = frame.roll1 ?? 0
            const r2 = frame.roll2 ?? 0
            const r3 = frame.roll3 ?? 0

            let frameScore = 0

            if (i < 9) {
              if (r1 === 10) {
                const nextFrame = frames[i + 1] ?? {}
                const nextNextFrame = frames[i + 2] ?? {}
                const bonus1 = nextFrame.roll1 ?? 0
                const bonus2 =
                  nextFrame.roll2 != null
                    ? nextFrame.roll2
                    : nextNextFrame.roll1 ?? 0

                frameScore = 10 + bonus1 + bonus2
              } else if (r1 + r2 === 10) {
                const nextFrame = frames[i + 1] ?? {}
                frameScore = 10 + (nextFrame.roll1 ?? 0)
              } else {
                frameScore = r1 + r2
              }
            } else {
              frameScore = r1 + r2 + r3
            }

            frame.score =
              (i > 0 ? frames[i - 1].score ?? 0 : 0) + frameScore
          }
        }

        calculateCumulativeScores(currentPlayer.frames)

        setGame({ ...game, players: newPlayers })

        // ---- Switch Player ----
        const totalPlayers = newPlayers.length
        let nextIndex = playerIndex
        for (let offset = 1; offset <= totalPlayers; offset++) {
          const idx = (playerIndex + offset) % totalPlayers
          const p = newPlayers[idx]
          const firstIncompleteFrame = p.frames.findIndex((f, i) => {
            if (i < 9) return f.roll1 == null || (f.roll2 == null && f.roll1 !== 10)
            return f.roll1 == null || f.roll2 == null || ((f.roll1 + f.roll2 >= 10) && f.roll3 == null)
          })
          if (firstIncompleteFrame !== -1 || p.frames.length < 10) {
            nextIndex = idx
            break
          }
        }
        setCurrentPlayerIndex(nextIndex)

        // ---- Check Game Over ----
        const allFinished = newPlayers.every(p => {
          if (p.frames.length < 10) return false
          const f = p.frames[9]
          const tenthComplete =
            f.roll1 != null &&
            f.roll2 != null &&
            ((f.roll1 + f.roll2 >= 10) ? f.roll3 != null : true)
          return tenthComplete
        })

        if (allFinished) setIsGameOver(true)
      }

      setIsRollModalOpen(false)
      setSelectedFrame(null)
    } catch (error) {
      console.error('Error submitting roll', error)
    }
  }

  const activePlayer = game?.players[currentPlayerIndex]

  const onFrameClick = (playerIndex, frameNumber) => {
    setSelectedFrame({ playerIndex, frameNumber })
    setIsRollModalOpen(true)
  }

  useEffect(() => {
    if (!game) return
    const totalPlayers = game.players.length
    for (let offset = 0; offset < totalPlayers; offset++) {
      const idx = (currentPlayerIndex + offset) % totalPlayers
      const player = game.players[idx]
      const firstIncompleteFrame = player.frames.findIndex((f, i) => {
        if (i < 9) return f.roll1 == null || (f.roll2 == null && f.roll1 !== 10)
        return f.roll1 == null || f.roll2 == null || ((f.roll1 + f.roll2 >= 10) && f.roll3 == null)
      })
      if (firstIncompleteFrame !== -1 || player.frames.length < 10) {
        setCurrentPlayerIndex(idx)
        return
      }
    }
  }, [game])

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      {!isLive ? (
        <div className="bg-red-600 text-white text-center py-2 font-bold shadow-md">
          ⚠️ MOCK MODE: Not Connected to API
        </div>
      ) : (
        <div className="bg-green-600 text-white text-center py-2 font-bold shadow-md">
          ✅ LIVE MODE: Connected to API
        </div>
      )}

      <div className="px-4 py-10">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight">
            Bowling Score Keeper 🎳
          </h1>
          <p className="text-gray-600 mt-2">Midterm Exam Application</p>
        </header>

        <main className="max-w-6xl mx-auto">
          {!game ? (
            <PlayerSetup onStartGame={handleStartGame} />
          ) : (
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-xl shadow-lg relative">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Game #{game.id}
                  </h2>
                  <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-bold">
                    Current Turn: {activePlayer?.name}
                  </span>
                </div>

                <ScoreBoard
                  gameData={game}
                  activePlayerIndex={currentPlayerIndex}
                  onFrameClick={onFrameClick}
                />
              </div>
            </div>
          )}
        </main>

        {game && (
          <RollModal
            isOpen={isRollModalOpen}
            onClose={() => setIsRollModalOpen(false)}
            onRoll={handleRoll}
            playerName={selectedFrame ? game.players[selectedFrame.playerIndex].name : ''}
            frameNumber={selectedFrame?.frameNumber}
          />
        )}

        <GameOverModal
          isOpen={isGameOver}
          players={game?.players || []}
          onPlayAgain={handlePlayAgain}
          onNewGame={handleCreateNewGame}
        />
      </div>
    </div>
  )
}

export default App
