using BowlingApp.API.Data;
using BowlingApp.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BowlingApp.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GameController : ControllerBase
    {
        private readonly BowlingContext _context;

        public GameController(BowlingContext context)
        {
            _context = context;
        }

        // POST: api/Game
        [HttpPost]
        public async Task<ActionResult<Game>> CreateGame([FromBody] List<string> playerNames)
        {
            if (playerNames == null || !playerNames.Any())
                return BadRequest("At least one player is required.");

            var game = new Game();

            foreach (var name in playerNames)
            {
                var player = new Player { Name = name };

                // Initialize 10 frames for each player
                for (int i = 1; i <= 10; i++)
                {
                    player.Frames.Add(new Frame { FrameNumber = i });
                }

                game.Players.Add(player);
            }

            _context.Games.Add(game);
            await _context.SaveChangesAsync();

            return Ok(game);
        }

        // GET: api/Game/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Game>> GetGame(int id)
        {
            var game = await _context.Games
                .Include(g => g.Players)
                    .ThenInclude(p => p.Frames)
                .FirstOrDefaultAsync(g => g.Id == id);

            if (game == null)
                return NotFound();

            return Ok(game);
        }

        // POST: api/Game/5/roll
        [HttpPost("{gameId}/roll")]
        public async Task<IActionResult> Roll(int gameId, [FromBody] RollRequest request)
        {
            var game = await _context.Games
                .Include(g => g.Players)
                    .ThenInclude(p => p.Frames)
                .FirstOrDefaultAsync(g => g.Id == gameId);

            if (game == null) return NotFound("Game not found.");
            var player = game.Players.FirstOrDefault(p => p.Id == request.PlayerId);
            if (player == null) return NotFound("Player not found.");
            if (request.Pins < 0 || request.Pins > 10)
                return BadRequest("Pins must be between 0 and 10.");

            var frame = GetCurrentFrame(player);
            if (frame == null) return BadRequest("Player has completed all frames.");

            // Apply roll
            if (frame.Roll1 == null)
            {
                frame.Roll1 = request.Pins;
            }
            else if (frame.Roll2 == null)
            {
                if (frame.FrameNumber < 10 && frame.Roll1 + request.Pins > 10)
                    return BadRequest("Total pins in a frame cannot exceed 10.");

                frame.Roll2 = request.Pins;
            }
            else if (frame.FrameNumber == 10 && frame.Roll3 == null)
            {
                frame.Roll3 = request.Pins;
            }

            // Recalculate scores according to Ten-Pin rules
            RecalculateScores(player);

            if (game.Players.All(p => IsPlayerFinished(p)))
                game.IsFinished = true;

            await _context.SaveChangesAsync();

            return Ok(game);
        }

        // ---------------- Helper Methods ----------------

        private Frame? GetCurrentFrame(Player player)
        {
            var frames = player.Frames.OrderBy(f => f.FrameNumber).ToList();

            foreach (var frame in frames)
            {
                if (frame.FrameNumber < 10)
                {
                    if (frame.Roll1 == null) return frame;
                    if (frame.Roll1 != 10 && frame.Roll2 == null) return frame;
                }
                else
                {
                    // 10th frame logic
                    if (frame.Roll1 == null) return frame;
                    if (frame.Roll2 == null) return frame;

                    bool isStrikeOrSpare = frame.Roll1 == 10 || frame.Roll1 + frame.Roll2 == 10;
                    if (isStrikeOrSpare && frame.Roll3 == null) return frame;
                }
            }

            return null;
        }

        private void RecalculateScores(Player player)
        {
            var frames = player.Frames.OrderBy(f => f.FrameNumber).ToList();
            var rolls = new List<int>();

            // Collect all rolls in order
            foreach (var f in frames)
            {
                if (f.Roll1.HasValue) rolls.Add(f.Roll1.Value);
                if (f.Roll2.HasValue) rolls.Add(f.Roll2.Value);
                if (f.Roll3.HasValue) rolls.Add(f.Roll3.Value);
            }

            int rollIndex = 0;
            int cumulativeScore = 0;

            for (int i = 0; i < 10; i++)
            {
                if (rollIndex >= rolls.Count)
                {
                    frames[i].Score = null;
                    continue;
                }

                // STRIKE
                if (rolls[rollIndex] == 10)
                {
                    if (rollIndex + 2 < rolls.Count)
                    {
                        int frameScore = 10 + rolls[rollIndex + 1] + rolls[rollIndex + 2];
                        cumulativeScore += frameScore;
                        frames[i].Score = cumulativeScore;
                    }
                    else
                    {
                        frames[i].Score = null;
                    }

                    rollIndex += 1;
                }
                else
                {
                    if (rollIndex + 1 >= rolls.Count)
                    {
                        frames[i].Score = null;
                        break;
                    }

                    int frameTotal = rolls[rollIndex] + rolls[rollIndex + 1];

                    // SPARE
                    if (frameTotal == 10)
                    {
                        if (rollIndex + 2 < rolls.Count)
                        {
                            int frameScore = 10 + rolls[rollIndex + 2];
                            cumulativeScore += frameScore;
                            frames[i].Score = cumulativeScore;
                        }
                        else
                        {
                            frames[i].Score = null;
                        }
                    }
                    else
                    {
                        cumulativeScore += frameTotal;
                        frames[i].Score = cumulativeScore;
                    }

                    rollIndex += 2;
                }
            }
        }

        private bool IsPlayerFinished(Player player)
        {
            var lastFrame = player.Frames.OrderBy(f => f.FrameNumber).Last();

            if (!lastFrame.Roll1.HasValue || !lastFrame.Roll2.HasValue)
                return false;

            bool isStrikeOrSpare = lastFrame.Roll1 == 10 || lastFrame.Roll1 + lastFrame.Roll2 == 10;

            if (isStrikeOrSpare && !lastFrame.Roll3.HasValue)
                return false;

            return true;
        }
    }

    public class RollRequest
    {
        public int PlayerId { get; set; }
        public int Pins { get; set; }
    }
}
