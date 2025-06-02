<?php

declare(strict_types=1);

namespace Bga\Games\AceOfSpadesP;

use Bga\GameFramework\Actions\Types\IntArrayParam;

require_once(APP_GAMEMODULE_PATH . "module/table/table.game.php");

/**
 * Game Constructor.
 * Purpose: Initialize components like the card deck.
 */
class Game extends \Table
{
    // Constructor and global variable configuration
    public function __construct()
    {
        parent::__construct();

        $this->initGameStateLabels([
            "vida_monstruo" => 102,
            "remaining_shots"   => 103,
            "current_monster_level" => 104,
            "remaining_discards" => 105,
            "final_monster_level" => 106,
            "collected_powers" => 107,

        ]);
    }


    protected function getAllDatas(): array
    {
        return [
            "players" => $this->getCollectionFromDb("SELECT `player_id` `id`, `player_score` `score` FROM `player`"),
            "current_monster_level" => (int) self::getGameStateValue('current_monster_level'),
            "remaining_shots" => (int) self::getGameStateValue('remaining_shots'),
            "remaining_discards" => (int) self::getGameStateValue('remaining_discards'),
            "vida_monstruo" => (int) self::getGameStateValue('vida_monstruo'),
            "final_monster_level" => (int) self::getGameStateValue('final_monster_level'),
            "collected_powers" => json_decode(self::getGameStateValue('collected_powers'), true),

        ];
    }


    /**
     * Get the power image filename for a given monster level.
     *
     * @param int $level The level of the monster that was just defeated.
     * @return string The filename of the power image (e.g., 'enemy1_power.png').
     */
    protected function getMonsterPowerImage(int $level): string
    {
        // Define power images for each monster level.
        // If a monster level doesn't give a power, you can skip it here.
        $powerImages = [
            1 => 'enemy1_power.png',
            2 => 'enemy2_power.png',
            3 => 'enemy3_power.png',
            4 => 'enemy4_power.png',
            5 => 'enemy5_power.png',
            6 => 'enemy6_power.png',
            7 => 'enemy7_power.png',
            8 => 'enemy8_power.png',
            9 => 'enemy9_power.png',
            10 => 'enemy10_power.png',
            11 => 'enemy11_power.png',
        ];

        return $powerImages[$level] ?? ''; // Return the image name, or an empty string if no power for this level
    }


    /**
     * setupNewGame: Initial game setup.
     * Arguments: $players (array with player IDs), $options (game options).
     * Logic: shuffles the deck, deals initial cards, and sets state variables.
     * Return: void.
     */
    protected function setupNewGame($players, $options = [])
    {
        $gameinfos = $this->getGameinfos();
        $default_colors = $gameinfos['player_colors'];

        // Initial values based on level 1
        self::setGameStateValue('current_monster_level', 1);
        self::setGameStateValue('remaining_shots', $this->getMonsterShotsByLevel(1));
        self::setGameStateValue('remaining_discards', $this->getMonsterDiscardsByLevel(1)); // Use new function for initial discards
        self::setGameStateValue('vida_monstruo', $this->getMonsterHealthByLevel(1));
        self::setGameStateValue('collected_powers', json_encode([])); // NEW: Initialize collected powers as an empty JSON array
        self::setGameStateValue('final_monster_level', 12);

        $query_values = [];
        foreach ($players as $player_id => $player) {
            $query_values[] = vsprintf("('%s', '%s', '%s', '%s', '%s')", [
                $player_id,
                array_shift($default_colors),
                $player["player_canal"],
                addslashes($player["player_name"]),
                addslashes($player["player_avatar"]),
            ]);
        }

        if (!empty($query_values)) {
            static::DbQuery("INSERT INTO player (player_id, player_color, player_canal, player_name, player_avatar) VALUES " . implode(",", $query_values));
        }

        $this->reattributeColorsBasedOnPreferences($players, $gameinfos["player_colors"]);
        $this->reloadPlayersBasicInfos();

        $this->activeNextPlayer();
    }

    /**
     * Define the number of discards available based on the monster level.
     *
     * @param int $level The level of the monster.
     * @return int The number of discards for the given monster level.
     */
    protected function getMonsterDiscardsByLevel(int $level): int
    {
        if ($level >= 1 && $level <= 6) { // Enemy 1-6 have 2 discards
            return 2;
        } elseif ($level >= 7 && $level <= 9) { // Enemy 7-9 have 3 discards
            return 3;
        } elseif ($level >= 10 && $level <= 12) { // Enemy 10-12 have 4 discards
            return 4;
        }
        return 2; // Default to 2 discards for undefined levels
    }


    /**
     * Define the number of shots available based on the monster level.
     *
     * @param int $level The level of the monster.
     * @return int The number of shots for the given monster level.
     */
    protected function getMonsterShotsByLevel(int $level): int
    {
        if ($level >= 1 && $level <= 3) {
            return 2;
        } elseif ($level >= 4 && $level <= 9) { // Levels 4, 5, 6, 7, 8, 9
            return 3;
        } elseif ($level >= 10 && $level <= 12) { // Levels 10, 11, 12
            return 4;
        }
        return 2; // Default to 2 shots for undefined levels or initial setup
    }

    /**
     * Define monster health values based on their level.
     * This is a helper function to keep the monster data organized.
     *
     * @param int $level The level of the monster.
     * @return int The health points for the given monster level.
     */
    protected function getMonsterHealthByLevel(int $level): int
    {
        // Define monster health values in an array, keyed by monster level.
        // Level 0 is not used, so you can start from 1.
        $monsterHealths = [
            1 => 5,  // First boss
            2 => 7,
            3 => 10,
            4 => 12,
            5 => 15,
            6 => 20,
            7 => 22,
            8 => 25,
            9 => 30,
            10 => 35,
            11 => 40,
            12 => 50, // Last boss
            // You can add more levels if needed, or handle levels beyond 12
            // For levels beyond 12, you might return a default, or trigger a win condition
        ];

        // Return the health for the given level, or a default value if not defined (e.g., for error handling)
        return $monsterHealths[$level] ?? 5; // Default to 5 if level is not found, or throw an error
    }




    // -----------------------------------------------------------------------------------------
    // Functions related to plays and monster damage
    // -----------------------------------------------------------------------------------------

    /**
     * actPlayCard: Action to play a card from a player's hand.
     * Arguments: $cardIds (array) - IDs of the cards played.
     * Key Logic: validates the play according to rules, updates the state, and notifies the event.
     * Return: void.
     */


    public function actPlayCard(#[IntArrayParam(name: 'cardIds')] array $cardIds)
    {
        self::checkAction("actPlayCard");

        // 1. Check if shots are depleted for the *current* action.
        $currentShots = (int) self::getGameStateValue('remaining_shots');
        if ($currentShots <= 0) {
            throw new \BgaUserException("No te quedan disparos para atacar al monstruo.");
        }

        // 2. Decrement shots *before* applying damage.
        $shots = $currentShots - 1;
        self::setGameStateValue('remaining_shots', $shots);
        self::notifyAllPlayers('shotUsed', '', [
            'remaining_shots' => $shots,
        ]);

        // 3. Calculate damage based on the played cards.
        $cards = $this->getCardDetails($cardIds);
        $damage = $this->calcularDanioEscaleraDeColor($cards);
        if ($damage === 0) {
            $damage = $this->calcularDanioEscalera($cards);
        }
        if ($damage === 0) {
            $damage = $this->calcularDanioFull($cards);
        }
        if ($damage === 0) {
            $damage = $this->calcularDanioFourOfAKind($cards);
        }
        if ($damage === 0) {
            $damage = $this->calcularDanioFiveOfAKind($cards);
        }
        if ($damage === 0) {
            $damage = $this->calcularDanioColor($cards);
        }
        if ($damage === 0) {
            $damage = $this->calcularDanioTrio($cards);
        }
        if ($damage === 0) {
            $damage = $this->calcularDanioDoblePareja($cards);
        }
        if ($damage === 0) {
            $damage = $this->calcularDanioParejaYFiguras($cards);
        }

        // 4. Apply damage. This is where a monster *might* die and trigger a new monster.
        $this->aplicarDanioAlMonstruo($damage);

        // 5. IMPORTANT: Re-fetch remaining_shots AND monster life *AFTER* `aplicarDanioAlMonstruo` has run.
        $vidaMonstruoAfterDamage = (int) self::getGameStateValue('vida_monstruo');
        $remainingShotsAfterDamage = (int) self::getGameStateValue('remaining_shots');

        // 6. Check for Game Over condition.
        if ($vidaMonstruoAfterDamage > 0 && $remainingShotsAfterDamage <= 0) {
            self::notifyAllPlayers("gameOver", clienttranslate("¡HAS PERDIDO! Te quedaste sin disparos."), []);
            $this->gamestate->nextState('loseGame');
            return; // End the action if the game is over
        }


        // MODIFICACIÓN: NOTIFICACIÓN SIMPLIFICADA
        self::notifyAllPlayers("cardsPlayed", clienttranslate("Cards played"), [
            'player_id' => self::getActivePlayerId(),
            'player_name' => self::getActivePlayerName(),
            'damage' => $damage,
            'vida_monstruo' => $vidaMonstruoAfterDamage, // Usa la vida del monstruo actualizada después del daño
            'cards' => $cards, // Puedes mantener esto si necesitas los datos de las cartas en el cliente para otra lógica
        ]);

        // Mark played cards as 'played' and 'in table' (enMesa) and 'not available' (disponible)
        $idsSql = implode(',', array_map('intval', $cardIds));
        // Clear 'enMesa' for all cards first, then set for played cards
        self::DbQuery("UPDATE mazo_cartas SET enMesa = 0");
        self::DbQuery("UPDATE mazo_cartas SET jugada = 1, enMesa = 1, disponible = 0 WHERE id IN ($idsSql)");

        // Try to draw 5 new cards
        $newCards = self::getCollectionFromDb("SELECT id, numero, palo, es_joker
                                               FROM mazo_cartas
                                               WHERE disponible = 1 AND es_joker = 0
                                               ORDER BY RAND() LIMIT 5");

        // Only update if there are new cards to draw to prevent WHERE id IN () error
        if (!empty($newCards)) {
            $drawnIdsSql = implode(',', array_map(fn($c) => (int) $c['id'], $newCards));
            self::DbQuery("UPDATE mazo_cartas SET disponible = 0 WHERE id IN ($drawnIdsSql)");
        }

        // Notify the active player about new cards
        self::notifyPlayer(
            self::getActivePlayerId(),
            "newCards",
            '',
            ['cards' => array_values($newCards)]
        );
    }


    /**
     * Apply damage to the monster.
     */
    protected function aplicarDanioAlMonstruo($damage)
    {
        $currentMonsterLife = (int) self::getGameStateValue('vida_monstruo');
        $newMonsterLife = $currentMonsterLife - $damage;

        self::setGameStateValue('vida_monstruo', $newMonsterLife);

        self::notifyAllPlayers('monstruoDaniado', '', [
            'danio' => $damage,
            'vidaRestante' => $newMonsterLife,
        ]);

        if ($newMonsterLife <= 0) {
            $currentMonsterLevel = (int) self::getGameStateValue('current_monster_level');
            $finalMonsterLevel = (int) self::getGameStateValue('final_monster_level');

            // Handle collecting power if not the final monster
            if ($currentMonsterLevel < $finalMonsterLevel) {
                $powerImage = $this->getMonsterPowerImage($currentMonsterLevel);
                if (!empty($powerImage)) {
                    // Retrieve existing powers, decode, add new one, encode, and save
                    $collectedPowersJson = self::getGameStateValue('collected_powers');
                    $collectedPowers = json_decode($collectedPowersJson, true) ?: [];
                    $collectedPowers[] = $powerImage;
                    self::setGameStateValue('collected_powers', json_encode($collectedPowers));
                }
            }


            if ($currentMonsterLevel >= $finalMonsterLevel) {
                // Player wins the game
                self::notifyAllPlayers("gameWin", clienttranslate("¡HAS GANADO EL JUEGO!"), []);
                $this->gamestate->nextState('winGame');
            } else {
                // Advance to the next monster
                $nextMonsterLevel = $currentMonsterLevel + 1;
                self::setGameStateValue('current_monster_level', $nextMonsterLevel);

                // Get the health for the *new* monster level
                $newMonsterInitialLife = $this->getMonsterHealthByLevel($nextMonsterLevel);
                self::setGameStateValue('vida_monstruo', $newMonsterInitialLife);

                // Get the shots for the *new* monster level
                $newMonsterInitialShots = $this->getMonsterShotsByLevel($nextMonsterLevel);
                self::setGameStateValue('remaining_shots', $newMonsterInitialShots);

                // Get the discards for the *new* monster level
                $newMonsterInitialDiscards = $this->getMonsterDiscardsByLevel($nextMonsterLevel);
                self::setGameStateValue('remaining_discards', $newMonsterInitialDiscards);


                self::notifyAllPlayers('newEnemy', '', [
                    'current_level' => $nextMonsterLevel,
                    'vida_monstruo' => $newMonsterInitialLife, // New monster life
                    'initial_shots' => $newMonsterInitialShots, // New monster's initial shots
                    'initial_discards' => $newMonsterInitialDiscards, // Pass new discards
                    'collected_powers' => json_decode(self::getGameStateValue('collected_powers'), true), // Pass ALL collected powers
                ]);
            }
        }
    }




    // -----------------------------------------------------------------------------------------
    // Funciones relacionadas con el mazo de cartas y la acción "Shuffle Deck"
    // -----------------------------------------------------------------------------------------


    /**
     * actShuffleDeck: Acción de barajar el mazo de cartas.
     * No recibe argumentos.
     * Lógica clave: mezcla todas las cartas del mazo y notifica a los jugadores.
     * Retorno: void.
     */
    public function actShuffleDeck()
    {
        self::checkAction("actShuffleDeck");

        // Restablecer todas las cartas en la base de datos (disponibles nuevamente)
        self::DbQuery("UPDATE mazo_cartas SET disponible = 1, enMesa = 0, jugada = 0");


        self::notifyAllPlayers("deckShuffled", "", []);


        $newCards = self::getCollectionFromDb("SELECT id, numero, palo, es_joker 
                                               FROM mazo_cartas 
                                               WHERE disponible = 1 AND es_joker = 0 
                                               ORDER BY RAND() LIMIT 8");

        if (count($newCards) < 8) {
            throw new \BgaUserException("No hay suficientes cartas para repartir nuevas.");
        }

        // Marcar las cartas robadas como no disponibles
        $drawnIds = implode(',', array_map(fn($c) => intval($c['id']), $newCards));
        self::DbQuery("UPDATE mazo_cartas SET disponible = 0 WHERE id IN ($drawnIds)");

        // Notificar solo una vez con las cartas nuevas
        self::notifyPlayer(self::getActivePlayerId(), "newCards", '', [
            'cards' => array_values($newCards)
        ]);
    }



    // -----------------------------------------------------------------------------------------
    // Enviar al descarte las seleccionadas.
    // -----------------------------------------------------------------------------------------

    /**
     * actShuffleSelection: Descarta las cartas seleccionadas y rellena la mano hasta 8 cartas,
     * pero sólo si hay suficientes cartas en el mazo para reponer.
     */
    public function actShuffleSelection(#[IntArrayParam(name: 'cardIds')] array $cardIds)
    {
        self::checkAction("actShuffleSelection");

        // 1) Calculate how many cards are in hand before discarding
        $handCountBefore = intval(self::getUniqueValueFromDB(
            "SELECT COUNT(*) 
             FROM mazo_cartas 
             WHERE disponible = 0 AND jugada = 0 AND es_joker = 0"
        ));

        $numToDiscard = count($cardIds);
        // Hand after discarding these cards:
        $handCountAfterDiscard = $handCountBefore - $numToDiscard;

        // 2) How many cards need to be drawn to get back to 8
        $toDraw = max(0, 8 - $handCountAfterDiscard);

        // 3) Check if there are enough cards in the deck
        $deckCount = intval(self::getUniqueValueFromDB(
            "SELECT COUNT(*) 
             FROM mazo_cartas 
             WHERE disponible = 1 AND es_joker = 0"
        ));

        // If there are not enough cards in the deck, adjust $toDraw to what's available
        // or set to 0 if no cards are available.
        $toDraw = min($toDraw, $deckCount);
        // Note: The previous throw new \BgaUserException("No hay suficientes cartas...") is removed here
        // as per your request to not show an error if there's no discard.

        // 4) Now, discard the selected cards (this step will be skipped if $cardIds is empty)
        if (!empty($cardIds)) { // Only execute UPDATE if there are cards to discard
            $idsSql = implode(',', array_map('intval', $cardIds));
            self::DbQuery("
                UPDATE mazo_cartas
                SET jugada = 1, enMesa = 1, disponible = 0
                WHERE id IN ($idsSql)
            ");
        }


        // 5) Draw $toDraw random cards (can be 0)
        $newCards = [];
        if ($toDraw > 0) { // Only attempt to draw if $toDraw is positive
            $newCards = self::getCollectionFromDb("
                SELECT id, numero, palo, es_joker
                FROM mazo_cartas
                WHERE disponible = 1 AND es_joker = 0
                ORDER BY RAND()
                LIMIT $toDraw
            ");

            // Critical check: Ensure $newCards is not empty before imploding
            // This prevents the "WHERE id IN ()" error.
            if (!empty($newCards)) {
                $newIds = implode(',', array_map(fn($c) => intval($c['id']), $newCards));
                self::DbQuery("UPDATE mazo_cartas SET disponible = 0 WHERE id IN ($newIds)");
            }
            // else: If $newCards is empty here, it means getCollectionFromDb returned no cards
            // despite $toDraw being > 0 (which shouldn't happen if $deckCount was accurate).
            // No error is thrown, and no update is attempted, as requested.
        }

        // 6) Notify only the active player about the new cards
        self::notifyPlayer(
            self::getActivePlayerId(),
            "newCards",
            '',
            ['cards' => array_values($newCards)]
        );

        // 7) Global action log
        // The message is adjusted to reflect that discarding might not have happened,
        // but the hand was still replenished.
        self::notifyAllPlayers(
            "selectionShuffled",
            clienttranslate('${player_name} discard and draw cards'),
            [
                'player_name'    => self::getActivePlayerName(),
                'discard_action' => $numToDiscard > 0 ? clienttranslate('descarta ${count} carta(s)') : clienttranslate('no descarta ninguna carta'),
                'count'          => $numToDiscard,
            ]
        );

        // 8) Notification that discard was used
        self::notifyAllPlayers("discardUsed", '', []);
    }


    // -----------------------------------------------------------------------------------------
    // Enviar al descarte las seleccionadas.
    // -----------------------------------------------------------------------------------------


    public function actShuffleSelection2()
    {
        self::checkAction("actShuffleSelection2");

        // 1) Obtener cartas del descarte tal como lo hace actShowDiscard
        $discardCards = self::getObjectListFromDB("
            SELECT id 
            FROM mazo_cartas 
            WHERE disponible = 0 AND jugada = 1 or enMesa = 1 
        ");

        // 2) Resetear solo las cartas del descarte: marcarlas como disponibles y no jugadas/enMesa
        if (!empty($discardCards)) {
            $discardIds = implode(',', array_map(fn($c) => intval($c['id']), $discardCards));
            self::DbQuery("
                UPDATE mazo_cartas
                SET jugada = 0, enMesa = 0, disponible = 1
                WHERE id IN ($discardIds)
            ");
        }


        // 6) Notificación global
        self::notifyAllPlayers(
            "selectionShuffled",
            clienttranslate('${player_name} reinicia el descarte.'), // Mensaje ajustado
            [
                'player_name' => self::getActivePlayerName()
            ]
        );

        // ───────> Aquí TAMBIÉN EMITIMOS la notificación <───────
        self::notifyAllPlayers("discardUsed", '', []);
    }



    /**
     * Obtiene el descarte de cartas
     */
    public function actShowDiscard()
    {
        self::checkAction("actShowDiscard");

        $playerId = self::getCurrentPlayerId();
        $cartas   = self::getObjectListFromDB(
            "SELECT id, numero, palo, es_joker FROM mazo_cartas WHERE disponible = 0 and jugada=1"
        );

        $template = clienttranslate('${player_name} sees the discard pile');
        self::notifyPlayer(
            $playerId,
            "showDiscard",      // must match your JS subscription
            $template,          // the log template
            [
                'player_name' => self::getCurrentPlayerName(),
                'cards'       => $cartas
            ]
        );
    }





    // -----------------------------------------------------------------------------------------
    // Métodos de cálculo de daño según tipo de jugada
    // -----------------------------------------------------------------------------------------

    // Aquí van las funciones como calcularDanioEscaleraDeColor, calcularDanioEscalera, calcularDanioFull, etc.
    // Como están bien organizadas, puedes dejar esas funciones tal como están pero con los comentarios explicando su lógica.

    // -----------------------------------------------------------------------------------------
    // Métodos auxiliares
    // -----------------------------------------------------------------------------------------

    /**
     * Obtiene los detalles de las cartas jugadas.
     */
    private function getCardDetails(array $cardIds): array
    {
        $cardIds = array_map('intval', $cardIds);
        if (empty($cardIds)) return [];

        $sql = "SELECT id, numero, palo, es_joker FROM mazo_cartas WHERE id IN (" . implode(',', $cardIds) . ")";
        $cards = self::getObjectListFromDB($sql);

        $cardsById = [];
        foreach ($cards as $card) {
            $cardsById[$card['id']] = $card;
        }

        $orderedCards = [];
        foreach ($cardIds as $id) {
            if (isset($cardsById[$id])) {
                $orderedCards[] = $cardsById[$id];
            }
        }

        return $orderedCards;
    }

    /**
     * Daño por Five of a Kind (cinco cartas del mismo número)
     */
    private function calcularDanioFiveOfAKind(array $cards): int
    {
        $nums = array_map(fn($c) => intval($c['numero']), $cards);
        $counts = array_count_values($nums);
        $cincoIguales = array_filter($counts, fn($cnt) => $cnt == 5);

        if (count($cincoIguales) !== 1) return 0;

        $cincoNum = key($cincoIguales);
        $damage = 12;

        foreach ($cards as $c) {
            $n = intval($c['numero']);
            if ($n === $cincoNum) {
                $damage += ($n == 1) ? 3 : (($n >= 11 && $n <= 13) ? 1 : 0);
            }
        }

        return $damage;
    }

    /**
     * Daño por Doble Pareja
     */
    private function calcularDanioDoblePareja(array $cards): int
    {
        $nums = array_map(fn($c) => intval($c['numero']), $cards);
        $counts = array_count_values($nums);
        $pares = array_filter($counts, fn($cnt) => $cnt == 2);

        if (count($pares) < 2) return 0;

        $damage = 2;
        $parejaNums = array_keys($pares);

        foreach ($cards as $c) {
            $n = intval($c['numero']);
            if (in_array($n, $parejaNums)) {
                $damage += ($n == 1) ? 3 : (($n >= 11 && $n <= 13) ? 1 : 0);
            }
        }

        return $damage;
    }
    private function calcularDanioParejaYFiguras(array $cards): int
    {
        $nums = array_map(fn($c) => intval($c['numero']), $cards);
        $counts = array_count_values($nums);
        $pairs = array_filter($counts, fn($cnt) => $cnt >= 2);

        if (empty($pairs)) return 0;

        $pairNumber = max(array_keys($pairs));
        $damage = 1;

        foreach ($cards as $c) {
            $n = intval($c['numero']);
            if ($n !== $pairNumber) continue;

            if ($n == 1) {
                $damage += 3; // As
            } elseif ($n >= 11 && $n <= 13) {
                $damage += 1; // J, Q, K
            }
        }

        return $damage;
    }

    private function calcularDanioFourOfAKind(array $cards): int
    {
        $nums = array_map(fn($c) => intval($c['numero']), $cards);
        $counts = array_count_values($nums);

        // Buscar si hay 4 cartas iguales
        $cuatroIguales = array_filter($counts, fn($cnt) => $cnt == 4);

        if (count($cuatroIguales) != 1) {
            return 0; // No es Four of a Kind
        }

        $damage = 8; // Base por Four of a Kind

        // Obtener el número de la carta que tiene 4 veces
        $cuatroNum = key($cuatroIguales);

        // Aplicar bonificaciones por figuras y Ases
        foreach ($cards as $c) {
            $n = intval($c['numero']);
            if ($n == $cuatroNum) {
                if ($n == 1) {
                    $damage += 3; // As
                } elseif ($n >= 11 && $n <= 13) {
                    $damage += 1; // J, Q, K
                }
            }
        }

        return $damage;
    }


    /**
     * calcularDanioTrio: Calcula el daño de un trío (tres cartas del mismo valor).
     * Argumento: $cards (array) - Array de tres cartas (cada carta con 'rank' y 'suit').
     * Lógica: Si las tres cartas comparten el mismo 'rank', devuelve un daño base.
     * Retorno: int - daño calculado.
     */
    private function calcularDanioTrio(array $cards): int
    {
        $nums = array_map(fn($c) => intval($c['numero']), $cards);
        $counts = array_count_values($nums);
        $trios = array_filter($counts, fn($cnt) => $cnt >= 3);

        if (empty($trios)) return 0;

        $trioNumber = max(array_keys($trios));
        $damage = 3;

        foreach ($cards as $c) {
            $n = intval($c['numero']);
            if ($n !== $trioNumber) continue;

            if ($n == 1) {
                $damage += 3; // As
            } elseif ($n >= 11 && $n <= 13) {
                $damage += 1; // J, Q, K
            }
        }

        return $damage;
    }


    private function calcularDanioEscaleraDeColor(array $cards): int
    {
        if (count($cards) < 5) return 0;

        // Primero, verificamos que todas las cartas sean del mismo color
        $suits = array_map(fn($c) => $c['palo'], $cards);
        if (count(array_unique($suits)) > 1) {
            return 0; // Si no todas las cartas son del mismo palo, no es una Escalera de Color
        }

        // Obtenemos los números de las cartas
        $nums = array_unique(array_map(fn($c) => intval($c['numero']), $cards));
        sort($nums);

        // Manejo especial del As (1) como 14 para escalera alta
        $extendedNums = $nums;
        if (in_array(1, $nums)) {
            $extendedNums[] = 14;
            sort($extendedNums);
        }

        // Buscar secuencia de 5 consecutivos
        for ($i = 0; $i <= count($extendedNums) - 5; $i++) {
            $slice = array_slice($extendedNums, $i, 5);
            $esEscalera = true;
            for ($j = 1; $j < 5; $j++) {
                if ($slice[$j] !== $slice[$j - 1] + 1) {
                    $esEscalera = false;
                    break;
                }
            }

            if ($esEscalera) {
                // Base de daño por Escalera de Color
                $damage = 10;

                // Bonificaciones por figuras y ases dentro de la escalera de color
                foreach ($slice as $n) {
                    if ($n == 1 || $n == 14) {
                        $damage += 3; // As
                    } elseif ($n >= 11 && $n <= 13) {
                        $damage += 1; // J, Q, K
                    }
                }

                return $damage;
            }
        }

        return 0; // No es una Escalera de Color
    }


    private function calcularDanioEscalera(array $cards): int
    {
        if (count($cards) < 5) return 0;

        $nums = array_unique(array_map(fn($c) => intval($c['numero']), $cards));
        sort($nums);

        // Manejo especial del As (1) como 14 para escalera alta
        $extendedNums = $nums;
        if (in_array(1, $nums)) {
            $extendedNums[] = 14;
            sort($extendedNums);
        }

        // Buscar secuencia de 5 consecutivos
        for ($i = 0; $i <= count($extendedNums) - 5; $i++) {
            $slice = array_slice($extendedNums, $i, 5);
            $esEscalera = true;
            for ($j = 1; $j < 5; $j++) {
                if ($slice[$j] !== $slice[$j - 1] + 1) {
                    $esEscalera = false;
                    break;
                }
            }

            if ($esEscalera) {
                // Base de daño
                $damage = 4;

                // Bonificaciones por figuras y ases dentro de la escalera
                foreach ($slice as $n) {
                    if ($n == 1 || $n == 14) {
                        $damage += 3;
                    } elseif ($n >= 11 && $n <= 13) {
                        $damage += 1;
                    }
                }

                return $damage;
            }
        }

        return 0;
    }


    private function calcularDanioFull(array $cards): int
    {
        if (count($cards) != 5) return 0;

        $nums = array_map(fn($c) => intval($c['numero']), $cards);
        $counts = array_count_values($nums);

        $trioNum = null;
        $parejaNum = null;

        foreach ($counts as $num => $cnt) {
            if ($cnt == 3 && $trioNum === null) {
                $trioNum = $num;
            } elseif ($cnt == 2 && $parejaNum === null) {
                $parejaNum = $num;
            }
        }

        if ($trioNum === null || $parejaNum === null) {
            return 0; // No hay full válido
        }

        $damage = 6;

        foreach ($cards as $c) {
            $n = intval($c['numero']);
            if ($n == $trioNum || $n == $parejaNum) {
                if ($n == 1) {
                    $damage += 3;
                } elseif ($n >= 11 && $n <= 13) {
                    $damage += 1;
                }
            }
        }

        return $damage;
    }


    public function argPlayerTurn(): array
    {
        return [];
    }

    protected function getGameName(): string
    {
        return "aceofspadesp";
    }

    public function getGameProgression(): int
    {
        return 0;
    }



    private function calcularDanioColor(array $cards): int
    {
        if (count($cards) < 5) return 0;

        // Agrupar por palo
        $palos = [];
        foreach ($cards as $c) {
            $palo = $c['palo'];
            if (!isset($palos[$palo])) {
                $palos[$palo] = [];
            }
            $palos[$palo][] = $c;
        }

        // Buscar un grupo de exactamente 5 cartas del mismo palo
        foreach ($palos as $grupo) {
            if (count($grupo) < 5) continue;

            // Solo tomamos 5 cartas
            $grupo = array_slice($grupo, 0, 5);
            $damage = 6;

            foreach ($grupo as $c) {
                $n = intval($c['numero']);
                if ($n == 1) {
                    $damage += 3;
                } elseif ($n >= 11 && $n <= 13) {
                    $damage += 1;
                }
            }

            return $damage;
        }

        return 0;
    }
}
