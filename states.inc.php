<?php
/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * AceOfSpadesP implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * states.inc.php
 *
 * AceOfSpadesP game states description
 */

/*
   Game state machine is a tool used to facilitate game development by handling common tasks
   in an easy way through this configuration file.

   Summary of state types:
   - activeplayer: The game expects an action from a single active player.
   - multipleactiveplayer: The game expects actions from multiple active players.
   - game: An intermediary state where no player action is expected. The game logic decides the next state.
   - manager: Special type for initial and final states.

   State arguments:
   - name: The unique name of the GameState, used in the code.
   - description: Displayed in the action status bar at the top of the game (usually irrelevant for "game" states).
   - descriptionmyturn: Description displayed when it is the current player's turn.
   - type: Defines the type of state (activeplayer / multipleactiveplayer / game / manager).
   - action: The method called when entering this game state. Usually prefixed by "st" (e.g., "stMyGameState").
   - possibleactions: List of possible player actions in this state. Allows usage of "checkAction" on both
     client-side (JavaScript) and server-side (PHP).
   - transitions: Defines the possible transitions from this state to another. The transitions must be named,
     and their values are the corresponding state IDs.
   - args: The method that provides arguments for this game state. These are sent to the client for use in 
     "onEnteringState" or setting arguments in the game state description.
   - updateGameProgression: If set, the game progression is updated (calls `getGameProgression` method).
*/

// !! Avoid modifying this file while a game is running !!

$machinestates = [

    // Initial state. Do not modify.
    1 => [
        "name" => "gameSetup",
        "description" => "",
        "type" => "manager",
        "action" => "stGameSetup",
        "transitions" => ["" => 2]
    ],

// First active game state
2 => [
    "name" => "playerTurn",
    "description" => clienttranslate('${actplayer} must play a card or pass'),
    "descriptionmyturn" => clienttranslate('${you} must play a card or pass'),
    "type" => "activeplayer",
    "args" => "argPlayerTurn",
    "possibleactions" => ["actShuffleDeck", "actShuffleDeck2"], // Agregar ambas acciones en un solo array
    "transitions" => [
        "nextTurn" => 2, // Loop to the next player's turn
        "endGame" => 99  // Transition to game end state
    ]
],


    // Final state. Do not modify.
    99 => [
        "name" => "gameEnd",
        "description" => clienttranslate("End of game"),
        "type" => "manager",
        "action" => "stGameEnd",
        "args" => "argGameEnd"
    ],

];
