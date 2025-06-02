<?php
$machinestates = [
  // -------------------------------------------------------------------------
  //  1) Game setup
  // -------------------------------------------------------------------------
  1 => [
    "name" => "gameSetup",
    "type" => "manager",
    "action" => "stGameSetup",
    "transitions" => [
      "shuffleDeck" => 2
    ],
  ],

  // -------------------------------------------------------------------------
  //  2) Main turn (Ahora puede transicionar a gameEnd o loseGame)
  // -------------------------------------------------------------------------
  2 => [
    "name" => "playerTurn",
    "description" => clienttranslate('Welcome to the hell'),
    "descriptionmyturn" => clienttranslate('It is your turn'),
    "type" => "activeplayer",
    "args" => "argPlayerTurn",
    "possibleactions" => [
      "actShuffleDeck",
      "actPlayCard",
      "actShowDiscard",
      "actShuffleSelection",
      "actShuffleSelection2"
    ],
    "transitions" => [
      // Añadimos estas transiciones para que el juego pueda terminar
      "winGame" => 99, // Transición a gameEnd en caso de victoria
      "loseGame" => 10, // Transición al nuevo estado de derrota
    ],
  ],




  // -------------------------------------------------------------------------
  // 10) Game Lost (Estado de derrota)
  // -------------------------------------------------------------------------
  10 => [
    "name"        => "gameOver",
    "type"        => "manager",
    "action"      => "stGameEnd",
    "args"        => "argGameEnd",
    "final_state" => true,
  ],

  // -------------------------------------------------------------------------
  // 99) Final manager state (Victoria)
  // -------------------------------------------------------------------------
  99 => [
    "name"        => "gameEnd",
    "type"        => "manager",
    "action"      => "stGameEnd",
    "args"        => "argGameEnd",
    "final_state" => true,
  ],

];
