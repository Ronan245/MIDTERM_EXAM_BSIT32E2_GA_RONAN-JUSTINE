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
        // Create a new game with players
        [HttpPost]
        public async Task<ActionResult<Game>> CreateGame([FromBody] List<string> playerNames)
        {
            // STUDENT TODO:
            // 1. Create a new Game entity.
            // 2. Create Player entities for each name provided.
            // 3. (Optional) Initialize 10 empty Frames for each player to simplify logic?
            // 4. Save to Database using _context.
            // 5. Return the created Game object (including Players).

            return StatusCode(501, "Student to implement: CreateGame");
        }

        // GET: api/Game/5
        // Get game details and current scores
        [HttpGet("{id}")]
        public async Task<ActionResult<Game>> GetGame(int id)
        {
            // STUDENT TODO:
            // 1. Find the Game by ID.
            // 2. Include Players and Frames in the query (use .Include()).
            // 3. Return the Game.

            return StatusCode(501, "Student to implement: GetGame");
        }

        // POST: api/Game/5/roll
        // Record a roll for a specific player
        [HttpPost("{gameId}/roll")]
        public async Task<IActionResult> Roll(int gameId, [FromBody] RollRequest request)
        {
            // STUDENT TODO:
            // 1. Find the Player and Game.
            // 2. Determine the Current Frame for the player (the first incompletion frame).
            // 3. Update the Frame with the rolled pins (Roll1, Roll2, or Roll3).
            // 4. BOWLING LOGIC:
            //    - Check for Strikes (10 on 1st roll) -> Mark frame as Strike.
            //    - Check for Spares (Total 10 on 2 rolls) -> Mark frame as Spare.
            // 5. SCORING CALCULATION:
            //    - Update the score for the current frame.
            //    - CRITICAL: Check *previous* frames. If they were strikes/spares, they might need this new roll to calculate their final score!
            // 6. Save changes to Database.

            return StatusCode(501, "Student to implement: Roll");
        }
    }

    public class RollRequest
    {
        public int PlayerId { get; set; }
        public int Pins { get; set; }
    }
}
