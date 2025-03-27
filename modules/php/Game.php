<?php
/**
 *------ 
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * AceOfSpadesP implementation : © <Montse Mkd> <xeta21@gmail.com>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * Game.php
 *
 * Main game logic file where the game rules are defined.
 */
declare(strict_types=1);

namespace Bga\Games\AceOfSpadesP;

require_once(APP_GAMEMODULE_PATH . "module/table/table.game.php");

class Game extends \Table
{
    private static array $CARD_TYPES;

    /**
     * Constructor: Initializes global variables and game options.
     */
    public function __construct()
    {
        parent::__construct();

        $this->initGameStateLabels([
            "my_first_global_variable" => 10,
            "my_second_global_variable" => 11,
            "my_first_game_variant" => 100,
            "my_second_game_variant" => 101,
        ]);
    }

    /**
     * Returns additional information specific to the `playerTurn` game state.
     *
     * @return array
     */
    public function argPlayerTurn(): array
    {
        return [
            "playableCardsIds" => [1, 2],
        ];
    }

    /**
     * Computes and returns the current game progression as a percentage.
     *
     * @return int
     */
    public function getGameProgression(): int
    {
        return 0; // Este valor debe ser calculado según el progreso del juego.
    }
 

    /**
     * Método para mezclar el mazo de cartas
     */
    public function actShuffleDeck()
    {
        self::checkAction("actShuffleDeck");

        // Resetear todas las cartas a disponibles
        $sqlReset = "UPDATE mazo_cartas SET disponible = 1";
        try {
            self::DbQuery($sqlReset);
            error_log("Todas las cartas están disponibles.");
        } catch (Exception $e) {
            error_log("Error al resetear el mazo: " . $e->getMessage());
        }

        // Seleccionar cartas aleatorias
        $sql = "SELECT id, numero, palo, es_joker 
                FROM mazo_cartas 
                WHERE disponible = 1 AND es_joker = FALSE
                ORDER BY RAND() LIMIT 8";
        
        $cards = self::getCollectionFromDb($sql);

        if (count($cards) < 2) {
            throw new \BgaUserException('No hay suficientes cartas disponibles para mezclar.');
        }

        // Marcar las cartas seleccionadas como no disponibles
        foreach ($cards as $card) {
            $sqlUpdate = "UPDATE mazo_cartas SET disponible = 0 WHERE id = " . $card['id'];
            try {
                self::DbQuery($sqlUpdate);
                error_log("Carta ID " . $card['id'] . " marcada como no disponible.");
            } catch (Exception $e) {
                error_log("Error al actualizar la carta ID " . $card['id'] . ": " . $e->getMessage());
            }
        }

        // Notificar a todos los jugadores
        self::notifyAllPlayers("newCards", clienttranslate('Se han mezclado las cartas.'), [
            'cards' => array_values($cards)
        ]);
    }



     /**
     * Método para mezclar el mazo de cartas
     */
    public function actShuffleDeck2()
    {
        self::checkAction("actShuffleDeck2");

        // Resetear todas las cartas a disponibles
        $sqlReset = "UPDATE mazo_cartas SET disponible = 1";
        try {
            self::DbQuery($sqlReset);
            error_log("Todas las cartas están disponibles.");
        } catch (Exception $e) {
            error_log("Error al resetear el mazo: " . $e->getMessage());
        }

        // Seleccionar cartas aleatorias
        $sql = "SELECT id, numero, palo, es_joker 
                FROM mazo_cartas 
                WHERE disponible = 1 AND es_joker = FALSE
                ORDER BY RAND() LIMIT 8";
        
        $cards = self::getCollectionFromDb($sql);

        if (count($cards) < 2) {
            throw new \BgaUserException('No hay suficientes cartas disponibles para mezclar.');
        }

        // Marcar las cartas seleccionadas como no disponibles
        foreach ($cards as $card) {
            $sqlUpdate = "UPDATE mazo_cartas SET disponible = 0 WHERE id = " . $card['id'];
            try {
                self::DbQuery($sqlUpdate);
                error_log("Carta ID " . $card['id'] . " marcada como no disponible.");
            } catch (Exception $e) {
                error_log("Error al actualizar la carta ID " . $card['id'] . ": " . $e->getMessage());
            }
        }

        // Notificar a todos los jugadores
        self::notifyAllPlayers("MyPlayArea", clienttranslate('Se han mezclado las cartas.'), [
            'cards' => array_values($cards)
        ]);
    }


    /**
     * Método para obtener todos los datos del juego visibles para el jugador
     */
    protected function getAllDatas(): array
    {
        $result = [];
        $current_player_id = (int) $this->getCurrentPlayerId();

        // Obtener información de los jugadores
        $result["players"] = $this->getCollectionFromDb(
            "SELECT `player_id` `id`, `player_score` `score` FROM `player`"
        );

        return $result;
    }

    /**
     * Método para obtener el nombre del juego
     */
    protected function getGameName(): string
    {
        return "aceofspadesp";
    }

    /**
     * Método para configurar un nuevo juego según las reglas y condiciones iniciales
     */
    protected function setupNewGame($players, $options = [])
    {
        $gameinfos = $this->getGameinfos();
        $default_colors = $gameinfos['player_colors'];

        foreach ($players as $player_id => $player) {
            $query_values[] = vsprintf("('%s', '%s', '%s', '%s', '%s')", [
                $player_id,
                array_shift($default_colors),
                $player["player_canal"],
                addslashes($player["player_name"]),
                addslashes($player["player_avatar"]),
            ]);
        }

        static::DbQuery(
            sprintf(
                "INSERT INTO player (player_id, player_color, player_canal, player_name, player_avatar) VALUES %s",
                implode(",", $query_values)
            )
        );

        $this->reattributeColorsBasedOnPreferences($players, $gameinfos["player_colors"]);
        $this->reloadPlayersBasicInfos();

        // Activar al primer jugador
        $this->activeNextPlayer();
    }
}
