define([
  "dojo",
  "dojo/_base/declare",
  "ebg/core/gamegui",
  "ebg/counter",
], function (dojo, declare) {
  return declare("bgagame.aceofspadesp", ebg.core.gamegui, {
    selectedCards: [],
    buttonsAdded: false,
    currentMonsterLevel: 1,
    isDiscardVisible: false, 
    selectedPowerCard: null, 
    availableSuits: ['corazones', 'diamantes', 'picas', 'treboles'], 
    constructor: function () {},


    setup: function (gamedatas) {
      this.interfaceVisible = false;

      this.currentMonsterLevel =
        parseInt(gamedatas.current_monster_level, 10) || 1;
      this.shotCount = parseInt(gamedatas.remaining_shots, 10) || 10;
      this.discardCount = parseInt(gamedatas.remaining_discards, 10) || 10;
      const initialLife = parseInt(gamedatas.vida_monstruo, 10) || 5;
      this.finalMonsterLevel = parseInt(gamedatas.final_monster_level, 10) || 2;
            this.collectedPowers = gamedatas.collected_powers || []; 


      document.getElementById("game_play_area").insertAdjacentHTML(
        "afterbegin",
        `
                <div id="introOverlay">
                    <button id="startGameButton" class="intro-button">
                        ¡PLAY!
                    </button>
                </div>
            `
      );

      const startBtn = document.getElementById("startGameButton");

      const startGameButton = document.getElementById("startGameButton");

      if (startGameButton) {
        // Aplicar los mismos estilos que loseMessageDiv
        startGameButton.style.fontSize = "4em"; // Mantén 4em por ahora, si el tamaño es el deseado
        startGameButton.style.fontWeight = "bold";
        startGameButton.style.color = "red";
        startGameButton.style.textShadow = "2px 4px 4px rgba(0,0,0,0.7)";
        startGameButton.style.zIndex = "1000";
        startGameButton.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
          // *** MODIFICACIÓN CLAVE PARA CENTRADO Y PADDING EXPLÍCITO ***
    startGameButton.style.paddingLeft = '70px';  // Padding izquierdo
    startGameButton.style.paddingRight = '300px'; // Padding derecho
    startGameButton.style.paddingTop = '15px';   // Padding superior
    startGameButton.style.paddingBottom = '15px';// Padding inferior
        startGameButton.style.borderRadius = "20px";
        startGameButton.style.whiteSpace = "nowrap";
        startGameButton.style.boxSizing = "border-box";

        // AÑADIDO: Asegurarse de que el line-height no comprima verticalmente el texto
        startGameButton.style.lineHeight = "1.2"; // <--- Añade un line-height explícito (puedes probar 1, 1.1, 1.2, etc.)

        // Propiedades adicionales para botones (opcional, ajusta según necesites)
        startGameButton.style.border = "2px solid red";
        startGameButton.style.cursor = "pointer";
        startGameButton.style.display = "inline-block";
        startGameButton.style.textDecoration = "none";
        startGameButton.style.transition =
          "background-color 0.3s ease, color 0.3s ease";

        // Efecto hover simple (opcional)
        startGameButton.onmouseover = function () {
          this.style.backgroundColor = "rgba(255, 0, 0, 0.8)";
          this.style.color = "white";
        };
        startGameButton.onmouseout = function () {
          this.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
          this.style.color = "red";
        };
      }


      

      // Hide BGA UI elements initially
      setTimeout(() => {
        const header = document.querySelector(".bga-ui-header");
        const actions = document.querySelector(".bga-action-bar");
        if (header) header.style.display = "none";
        if (actions) actions.style.display = "none";
      }, 100); // Small wait for BGA to finish building the interface

      if (startBtn) {
        startBtn.addEventListener("click", () => {
          document.getElementById("introOverlay").style.display = "none";

          // Show BGA UI elements after game starts
          const status0 = document.querySelector(".bga-ui-status");
          const actions0 = document.querySelector(".bga-action-bar");
          if (status0) status0.style.display = "";
          if (actions0) actions0.style.display = "";

          startBtn.disabled = true;

          // Trigger the server-side shuffle and initial card deal
          this.bgaPerformAction("actShuffleDeck");

          this.interfaceVisible = true;

          // Force buttons if it's your turn
          if (this.isCurrentPlayerActive()) {
            this.onUpdateActionButtons("playerTurn", {});
          }
        });
      }

      // Setting up the game environment by adding HTML elements for game components
      document.getElementById("game_play_area").insertAdjacentHTML(
        "beforeend",
        `
                <div id="player-tables"></div>
            `
      );
      // Hand container
      document.getElementById("game_play_area").insertAdjacentHTML(
        "beforeend",
        `
                <div id="myhand_wrap2" class="whiteblock">
                    <div id="myhand"></div>
                </div>
            `
      );


      // Discard Area (for cards shown from discard pile)
      document.getElementById("game_play_area").insertAdjacentHTML(
        "beforeend",
        `
                <div id="MyPlayAreaD_wrap2" class="whiteblock">
                    <div id="MyPlayAreaD"></div>
                </div>
            `
      );

      // Counters Area
      document.getElementById("game_play_area").insertAdjacentHTML(
        "beforeend",
        `
                <div id="MyPlayAreaJuego_wrap2" class="whiteblock">
                    <div id="MyPlayAreaJuego"></div>
                </div>
            `
      );

// After MyPlayAreaD_wrap2
document.getElementById("game_play_area").insertAdjacentHTML(
  "beforeend",
  `
        <div id="MyPlayArea_wrap2" class="whiteblock">
            <div id="MyPlayArea"></div>
        </div>
    `
);
// ... rest of your setup

         // Help/Monster Display Area
            document.getElementById("game_play_area").insertAdjacentHTML(
                "beforeend",
                `
                    <div id="help-container">
                        <div class="playertablecard-left"></div>
                        <div class="playertablecard-right"></div>
                        <div id="collected-powers-container"></div> </div>
                `
            );

      // Hide player score elements (common for solo/co-op games)
      Object.values(gamedatas.players).forEach((player) => {
        let scoreElement = document.getElementById("player_score_" + player.id);
        if (scoreElement) {
          scoreElement.style.display = "none";
        }
      });

      // Display initial monster image
      this.displayMonsterImage(this.currentMonsterLevel);
                  this.displayCollectedPowers(); // NEW: Display any powers loaded on setup


      // Setup counters (shots, discards, monster life)
      let playAreaJuego = document.getElementById("MyPlayAreaJuego_wrap2");
      let counterContainer = document.createElement("div");
      counterContainer.classList.add("counter-container");

      let counters = [
        {
          id: "shot-counter",
          img: `${g_gamethemeurl}img/disparos.png`,
          alt: "Disparos",
          countId: "shot-number",
          initialCount: this.shotCount,
        },
        {
          id: "discard-counter",
          img: `${g_gamethemeurl}img/Descartes.png`,
          alt: "Descartes",
          countId: "discard-number",
          initialCount: this.discardCount,
        },
      ];

      counters.forEach((counter) => {
        let imgBox = document.createElement("div");
        imgBox.classList.add("counter-box");
        let img = document.createElement("img");
        img.src = counter.img;
        img.alt = counter.alt;
        imgBox.appendChild(img);

        let numberBox = document.createElement("div");
        numberBox.classList.add("counter-box");
        numberBox.id = counter.countId;
        numberBox.textContent = counter.initialCount;

        counterContainer.appendChild(imgBox);
        counterContainer.appendChild(numberBox);
      });
      playAreaJuego.appendChild(counterContainer);

      // Monster life display
      const monsterBox = document.createElement("div");
      monsterBox.classList.add("monster-life-box");

      const label = document.createElement("div");
      label.classList.add("life-label");
      label.innerText = "Monster Life";

      const value = document.createElement("div");
      value.classList.add("life-value");
      value.id = "monster-life-value";
      value.innerText = initialLife; // Set initial monster life here

      monsterBox.appendChild(label);
      monsterBox.appendChild(value);
      counterContainer.appendChild(monsterBox);

      this.setupNotifications();
    },




 notif_newCards: function (notif) {
      // Añadir las nuevas cartas a la mano sin duplicados
      this.addCardsToHand(notif.args.cards);
      //console.log("New Cards Notification:", notif.args.cards);
    },


    // ---
    // Notifications Setup
    // ---
    setupNotifications: function () {
      dojo.subscribe("cardsPlayed", this, "notif_cardsPlayed");
      dojo.subscribe("newCards", this, "notif_newCards");
      dojo.subscribe("deckShuffled", this, "notif_deckShuffled");
      dojo.subscribe("showDiscard", this, "notif_showDiscard");
      dojo.subscribe("selectionShuffled", this, "notif_selectionShuffled");
      dojo.subscribe("monstruoDaniado", this, "notif_monstruoDaniado");
      dojo.subscribe("shotUsed", this, "notif_shotUsed");
      dojo.subscribe("discardUsed", this, "notif_discardUsed");
      dojo.subscribe("newEnemy", this, "notif_newEnemy");
      dojo.subscribe("gameWin", this, "notif_gameWin"); // Subscribed to the server-side 'gameWin' notification
      dojo.subscribe("gameOver", this, "notif_gameOver"); // NEW: Subscribe to the 'gameOver' notification
    },

    // Notificaciones que restan un disparo o un descarte
    notif_shotUsed: function () {
      this.shotCount -= 1;
      this.updateCounters(this.shotCount, this.discardCount);
    },

    notif_discardUsed: function () {
      this.discardCount -= 1;
      this.updateCounters(this.shotCount, this.discardCount);
    },

    //Esta funcion sirve para ocultar la info del descarte.
    hideDiscard: function () {
      document.getElementById("MyPlayAreaD").innerHTML = "";
      this.isDiscardVisible = false;
    },

    notif_cardsPlayed: function (notif) {
     // console.log("Cards Played Notification:", notif.args.cards);
     // console.log("Player Damage:", notif.args.danio);

      if (Array.isArray(notif.args.cards)) {
        this.updateCounters(this.shotCount, this.discardCount);

        this.removeCardsFromHand(notif.args.cards);
      } else {
        console.error(
          "Expected cards to be an array, but got:",
          notif.args.cards
        );
      }
    },


displayCollectedPowers: function () {
   // console.log("Entering displayCollectedPowers. Collected powers:", this.collectedPowers);
    const powersContainer = document.getElementById("collected-powers-container");
    if (!powersContainer) {
        console.error("collected-powers-container not found!");
        return;
    }
    //console.log("Container cleared. Now adding images...");
    this.collectedPowers.forEach(powerFilename => {
        const img = document.createElement('img');
        img.src = `${g_gamethemeurl}img/${powerFilename}`;
        img.alt = powerFilename.replace('_power.png', '');
        powersContainer.appendChild(img);
      //  console.log("Added image:", img.src);
    });
   // console.log("Finished displayCollectedPowers.");
},



    notif_monstruoDaniado: function (notif) {
      const { danio, vidaRestante } = notif.args;

      // Actualizar la vida del monstruo inmediatamente
      const vidaEl = document.getElementById("monster-life-value");
      if (vidaEl) vidaEl.textContent = vidaRestante;

      // Efecto de daño
      const effect = document.createElement("div");
      effect.className = "damage-effect";
      effect.textContent = `–${danio}`;
      effect.style.left = "50%";
      effect.style.top = "40%";
      document.body.appendChild(effect);
      setTimeout(() => effect.remove(), 2000);

      // Si el monstruo muere, mostraremos la calavera y *luego* el nuevo monstruo.
      // La calavera NO debe impedir la actualización del nuevo monstruo.
      if (vidaRestante <= 0) {
        const skull = document.createElement("div");
        skull.className = "death-skull";
        skull.innerHTML = "💀"; // Emoji o imagen
        skull.style.left = "60%";
        skull.style.top = "50%";
        document.body.appendChild(skull);

        setTimeout(() => skull.remove(), 2000);
      }
    },




notif_newEnemy: function (notif) {
 //   console.log("newEnemy args:", notif.args);
    // 1) Actualizar nivel
    this.currentMonsterLevel =
        parseInt(notif.args.current_level, 10) || this.currentMonsterLevel;
    //console.log("Nivel actualizado a:", this.currentMonsterLevel);

    // 2) Actualizar vida
    const vidaEl = document.getElementById("monster-life-value");
    if (vidaEl && notif.args.vida_monstruo != null) {
        vidaEl.textContent = notif.args.vida_monstruo;
    }

    // 3) Contadores (actualiza shotCount y discardCount)
    this.shotCount = parseInt(notif.args.initial_shots, 10) || this.shotCount;
    this.discardCount =
        parseInt(notif.args.initial_discards, 10) || this.discardCount;
    // La siguiente línea 'this.updateCounters(this.shotCount, this.discardCount);'
    // es un duplicado de la de abajo. La dejaremos solo una vez.

    // ************ ESTA ES LA LÍNEA CRÍTICA A AÑADIR ************
    // Actualiza el array de poderes recolectados con los nuevos datos del servidor
    this.collectedPowers = notif.args.collected_powers || [];
    // ************************************************************

    // Actualiza los contadores (disparos y descartes) y también los que se usaron en el paso anterior.
    // Esta línea es la que realmente aplica los cambios a la UI.
    this.updateCounters(this.shotCount, this.discardCount);

    this.displayCollectedPowers(); // Ahora esta función recibirá los datos correctos de 'this.collectedPowers'

    // 4) Mensaje y animación
    this.displayMonsterImage(this.currentMonsterLevel);
    this.showNewEnemyAnimation();
},

showNewEnemyAnimation: function () {
    const rightContainer = document.querySelector(".playertablecard-right");
    if (rightContainer) {
        rightContainer.style.opacity = 0;
        rightContainer.style.transition = "opacity 1s ease-in-out";
        setTimeout(() => {
            rightContainer.style.opacity = 1;
        }, 10);
    }
},



  displayMonsterImage: function (monsterLevel) {
    if (monsterLevel > 12) {
        // Assuming 12 is the last monster level, so 13+ means victory
        const rightContainer = document.querySelector(".playertablecard-right");
        rightContainer.innerHTML = '<div style="text-align: center; color: green; font-size: 2em; padding-top: 50%;">¡HAS GANADO!</div>';

        // --- NEW: Call gameEnd to officially end the game ---
        if (typeof bgaProcess !== "undefined" && bgaProcess.gameEnd) {
            bgaProcess.gameEnd("soloVictorious", 0);
        } else {
            console.error("bgaProcess.gameEnd is not defined. Game will not officially end.");
        }
        // --- END NEW ---
        return;
    }

    if (monsterLevel < 1) {
        console.warn(`Nivel de monstruo inválido: ${monsterLevel}. Mostrando imagen de inicio o error.`);
        const rightContainer = document.querySelector(".playertablecard-right");
        rightContainer.innerHTML = '<div style="text-align: center; color: red;">Error: Nivel de monstruo inválido.</div>';
        return;
    }

    const rightContainer = document.querySelector(".playertablecard-right");
    rightContainer.innerHTML = ""; // Limpia el contenedor

    let img = document.createElement("img");
    img.src = `${g_gamethemeurl}img/enemigos/${monsterLevel}.png`; // Corrected path based on your image name
    img.alt = `Monster Level ${monsterLevel}`;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "contain";

    img.onerror = () => {
        console.error(`Error al cargar la imagen del monstruo: ${img.src}. Asegúrate de que existe.`);
        rightContainer.innerHTML = `<div style="text-align: center; color: red;">Error: Monstruo ${monsterLevel}.png no encontrado.</div>`;
    };

    rightContainer.appendChild(img);
},


    // --- FUNCIÓN MODIFICADA: displayMonsterImage para cargar el monstruo secuencialmente ---
    displayMonsterImage: function (monsterLevel) {
      if (monsterLevel > 12) {
        // Assuming 12 is the last monster level, so 13+ means victory

        const rightContainer = document.querySelector(".playertablecard-right");
        rightContainer.innerHTML =
          '<div style="text-align: center; color: green; font-size: 2em; padding-top: 50%;">¡HAS GANADO!</div>';

        // --- NEW: Call gameEnd to officially end the game ---
        if (typeof bgaProcess !== "undefined" && bgaProcess.gameEnd) {
          // Assuming a single-player game or a cooperative win, you might pass a generic score or 0.
          // You might need to adjust the score based on your game's victory conditions.
          bgaProcess.gameEnd("soloVictorious", 0); // 'soloVictorious' is a common BGA result type for solo games
        } else {
          console.error(
            "bgaProcess.gameEnd is not defined. Game will not officially end."
          );
        }

        return;
      }

      if (monsterLevel < 1) {
        // Handle cases where level might be unexpectedly low
        console.warn(
          `Nivel de monstruo inválido: ${monsterLevel}. Mostrando imagen de inicio o error.`
        );
        // Optionally show a default image or message for invalid levels
        const rightContainer = document.querySelector(".playertablecard-right");
        rightContainer.innerHTML =
          '<div style="text-align: center; color: red;">Error: Nivel de monstruo inválido.</div>';
        return;
      }

      const rightContainer = document.querySelector(".playertablecard-right");
      rightContainer.innerHTML = ""; // Limpia el contenedor

      let img = document.createElement("img");
      // Asume que tus imágenes están en 'img/monsters/' y se llaman '1.png', '2.png', etc.
      img.src = `${g_gamethemeurl}img/enemigos/${monsterLevel}.png`;
      img.alt = `Monster Level ${monsterLevel}`;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "contain";

      img.onerror = () => {
        console.error(
          `Error al cargar la imagen del monstruo: ${img.src}. Asegúrate de que existe.`
        );
        rightContainer.innerHTML = `<div style="text-align: center; color: red;">Error: Monstruo ${monsterLevel}.png no encontrado.</div>`;
      };

      rightContainer.appendChild(img);
    },

   
    notif_selectionShuffled: function (notif) {
   //   console.log("Selection shuffled:", notif.args);

      // 1) Mostrar el descarte completo (si lo deseas)
      if (Array.isArray(notif.args.discardedCards)) {
        this.displayCardsInPlayArea(notif.args.discardedCards);
        this.isDiscardVisible = true;
      }

      // 2) Añadir las cartas nuevas a la mano
      if (Array.isArray(notif.args.newCards)) {
        this.addCardsToHand(notif.args.newCards);
      }
    },

    notif_deckShuffled: function (notif) {
      // Limpiar mano y mesa
      document.getElementById("myhand").innerHTML = "";
      document.getElementById("MyPlayAreaD").innerHTML = "";
      this.selectedCards = [];
     // console.log("Deck shuffled: everything has been reset.");
    },

    // BLOQUEAR LOS BOTONES. Los de mezclar, el de atacar si se acaba y no hemos matado al monstruo acaba la partida.
    updateCounters: function (shots, discards) {
      this.shotCount = shots;
      this.discardCount = discards;
      document.getElementById("shot-number").textContent = shots;
      document.getElementById("discard-number").textContent = discards;

      // Deshabilitar botones si llegan a 0
      //const playBtn = document.getElementById('play-5-cards-button');
      //if (playBtn) playBtn.disabled = shots <= 0;

      const shuffleSelBtn = document.getElementById("shuffle-selection-button");
      if (shuffleSelBtn) shuffleSelBtn.disabled = discards <= 0;

      const shuffleSelBtn2 = document.getElementById(
        "shuffle-selection2-button"
      );
      if (shuffleSelBtn2) shuffleSelBtn2.disabled = discards <= 0;
    },

    notif_showDiscard: function (notif) {
     // console.log("Show discard notification:", notif.args.cards);




      // Verifica que notif.args.cards sea un arreglo válido
      if (Array.isArray(notif.args.cards)) {
        this.displayCardsInPlayArea(notif.args.cards);
        this.isDiscardVisible = true; //ocultamo descate
      } else {
        console.error(
          "Expected cards to be an array, but got:",
          notif.args.cards
        );
      }
    },

    onUpdateActionButtons: function (stateName, args) {
      if (!this.interfaceVisible) return;
      if (
        this.isCurrentPlayerActive() &&
        stateName == "playerTurn" &&
        !this.buttonsAdded
      ) {
        // 2. PLAY 5 CARDS
        if (!document.getElementById("play-5-cards-button")) {
          this.playButton = this.statusBar.addActionButton(
            _("PLAY 5 CARDS"),
            () => {
              const selectedCount = this.selectedCards.length;
              const cardIds = this.selectedCards.map((card) =>
                parseInt(card.id)
              );
              if (selectedCount === 5) {
                if (this.isDiscardVisible) this.hideDiscard();
                this.bgaPerformAction("actPlayCard", {
                  cardIds: cardIds.join(","),
                });
              } else {
                alert("You must select exactly 5 cards!");
              }
            },
            { id: "play-5-cards-button" }
          );
          document
            .getElementById("play-5-cards-button")
            .classList.add("red-button");
        }

        // 3. SHUFFLE SELECTION (descartar seleccionadas)
        if (!document.getElementById("shuffle-selection-button")) {
          const shuffleSelectionButton = this.statusBar.addActionButton(
            _("Descartar cartas seleccionadas"),
            () => {
              const selectedCount = this.selectedCards.length;
              if (this.isDiscardVisible) this.hideDiscard();

              const cardIds = this.selectedCards.map((c) => parseInt(c.id));
              this.bgaPerformAction("actShuffleSelection", {
                cardIds: cardIds.join(","),
              });

              this.removeCardsFromHand(cardIds.map((id) => ({ id })));
              this.selectedCards = [];
            },
            { id: "shuffle-selection-button" }
          );
          shuffleSelectionButton.classList.add("red-button");
        }

        // 4. SHUFFLE SELECTION2 (mezclar descarte)
        if (!document.getElementById("shuffle-selection2-button")) {
          const shuffleSelection2Button = this.statusBar.addActionButton(
            _("MEZCLAR DESCARTE"),
            () => {
              if (this.isDiscardVisible) this.hideDiscard();
              this.bgaPerformAction("actShuffleSelection2", {});
              this.clearSelectionClientSide();
            },
            { id: "shuffle-selection2-button" }
          );
          shuffleSelection2Button.classList.add("red-button");
        }

        // 5. SHOW DISCARD
        if (!document.getElementById("show-discard-button")) {
          const showDiscardButton = this.statusBar.addActionButton(
            _("SHOW DISCARD"),
            () => {
              const cardIds = this.selectedCards.map((card) =>
                parseInt(card.id)
              );
              this.bgaPerformAction("actShowDiscard", {
                cardIds: cardIds.join(","),
              });
            },
            { id: "show-discard-button" }
          );
          showDiscardButton.classList.add("red-button");
          showDiscardButton.style.marginLeft = "150px";
        }

        // Marcar que los botones ya están añadidos
        this.buttonsAdded = true;
      }
    },

    clearSelectionClientSide: function () {
      this.selectedCards.forEach((card) => {
        const cardElement = document.querySelector(
          `[data-card-id='${card.id}']`
        );
        if (cardElement) {
          cardElement.classList.remove("selected");
        }
      });
      this.selectedCards = [];
    },
    selectCard: function (card, cardElement) {
      // Ensure that no more than 5 cards are selected
      const index = this.selectedCards.findIndex(
        (selectedCard) => selectedCard.id === card.id
      );
      if (index === -1 && this.selectedCards.length < 8) {
        // If not selected and less than 5 cards, add it
        this.selectedCards.push(card);
        cardElement.classList.add("selected");
      } else if (index !== -1) {
        // If already selected, remove it
        this.selectedCards.splice(index, 1);
        cardElement.classList.remove("selected");
      } else {
        // If 5 cards already selected, show alert
        alert("You can only select 9 cards!");
      }
    },

    displayCards: function (cards) {
      let myHandContainer = document.getElementById("myhand");
      myHandContainer.innerHTML = ""; // Clear the container before displaying new cards
      let palosMap = {
        Corazones: "corazon",
        Diamantes: "rombo",
        Tréboles: "trebol",
        Picas: "pica",
      };
      let figurasMap = {
        11: "jack",
        12: "queen",
        13: "king",
        1: "ace", // Add "Ace" for 1
      };

      cards.forEach((card) => {
        let cardElement = document.createElement("div");
        cardElement.className = "playertablecard";
        let paloIngles = palosMap[card.palo];
        let numeroCarta = figurasMap[card.numero] || card.numero;
        let imageName =
          card.es_joker == "1" ? "joker" : `${numeroCarta}_${paloIngles}`;
        let imgElement = document.createElement("img");
        imgElement.src = `${g_gamethemeurl}img/${imageName}.png`;
        imgElement.alt = `${card.numero} de ${card.palo}`;
        imgElement.className = "card-image";
        cardElement.appendChild(imgElement);

        cardElement.addEventListener("click", () =>
          this.selectCard(card, cardElement)
        );

        myHandContainer.appendChild(cardElement);
      });
    },

    //Cartas descarte zona de juego
    displayCardsInPlayArea: function (cards) {
    //  console.log("Displaying cards in play area:", cards);
      let playAreaContainer = document.getElementById("MyPlayAreaD");
      playAreaContainer.innerHTML = ""; // Limpia el área

      let palosMap = {
        Corazones: "corazon",
        Diamantes: "rombo",
        Tréboles: "trebol",
        Picas: "pica",
      };
      let figurasMap = {
        11: "jack",
        12: "queen",
        13: "king",
        1: "ace",
      };

      cards.forEach((card) => {
        let cardElement = document.createElement("div");
        cardElement.className = "playertablecard";

      //  console.log(`Card ${card.numero} of ${card.palo}`);
        playAreaContainer.appendChild(cardElement);

        let paloIngles = palosMap[card.palo];
        let numeroCarta = figurasMap[card.numero] || card.numero;
        let imageName =
          card.es_joker == "1" ? "joker" : `${numeroCarta}_${paloIngles}`;

        let imgElement = document.createElement("img");
        imgElement.src = `${g_gamethemeurl}img/${imageName}.png`;
        imgElement.alt = `${card.numero} de ${card.palo}`;
        imgElement.className = "card-image";

        cardElement.appendChild(imgElement);
        playAreaContainer.appendChild(cardElement);
      });
    },

    



    addCardsToHand: function (cards) {
      let myHandContainer = document.getElementById("myhand");
      let palosMap = {
        Corazones: "corazon",
        Diamantes: "rombo",
        Tréboles: "trebol",
        Picas: "pica",
      };
      let figurasMap = {
        11: "jack",
        12: "queen",
        13: "king",
        1: "ace",
      };

      cards.forEach((card) => {
        let cardElement = document.createElement("div");
        cardElement.className = "playertablecard";
        cardElement.dataset.cardId = card.id; // Marca única para facilitar borrado

        let paloIngles = palosMap[card.palo];
        let numeroCarta = figurasMap[card.numero] || card.numero;
        let imageName =
          card.es_joker == "1" ? "joker" : `${numeroCarta}_${paloIngles}`;

        let imgElement = document.createElement("img");
        imgElement.src = `${g_gamethemeurl}img/${imageName}.png`;
        imgElement.alt = `${card.numero} de ${card.palo}`;
        imgElement.className = "card-image";

        cardElement.appendChild(imgElement);
        cardElement.addEventListener("click", () =>
          this.selectCard(card, cardElement)
        );

        myHandContainer.appendChild(cardElement);
      });
    },

    removeCardsFromHand: function (cards) {
      let myHandContainer = document.getElementById("myhand");

      cards.forEach((card) => {
        let cardDiv = myHandContainer.querySelector(
          `[data-card-id='${card.id}']`
        );
        if (cardDiv) {
          myHandContainer.removeChild(cardDiv);
        }

        // También la quitamos del array de seleccionadas (por si estaba seleccionada)
        this.selectedCards = this.selectedCards.filter((c) => c.id !== card.id);
      });
    },

    notif_gameWon: function (notif) {
    //  console.log("Game Won Notification:", notif.args.message);

      // 1. Clear the monster image container
      const rightContainer = document.querySelector(".playertablecard-right");
      if (rightContainer) {
        rightContainer.innerHTML = ""; // Clear any existing monster image
      }

      // 2. Create and display your "¡HAS GANADO!" message
      const winMessageDiv = document.createElement("div");
      winMessageDiv.style.textAlign = "center";
      winMessageDiv.style.color = "green";
      winMessageDiv.style.fontSize = "2em"; // Adjust font size as desired
      winMessageDiv.style.fontWeight = "bold"; // Make it stand out
      winMessageDiv.style.paddingTop = "50px"; // Add some top padding
      winMessageDiv.style.position = "absolute"; // Position it absolutely
      winMessageDiv.style.top = "0";
      winMessageDiv.style.left = "0";
      winMessageDiv.style.width = "100%";
      winMessageDiv.style.height = "100%";
      winMessageDiv.style.display = "flex";
      winMessageDiv.style.alignItems = "center";
      winMessageDiv.style.justifyContent = "center";
      winMessageDiv.style.zIndex = "100"; // Ensure it's on top of other elements

      // Use the message from the notification if available, otherwise a default
      winMessageDiv.innerHTML = notif.args.message || _("¡HAS GANADO!");

      if (rightContainer) {
        rightContainer.appendChild(winMessageDiv);
      } else {
        // Fallback if rightContainer is not found, try to append to main game area
        document.getElementById("game_play_area").appendChild(winMessageDiv);
      }
    },

    // NEW: Function to clear all game display elements
    clearGameDisplay: function () {
      // Clear cards from hand and play areas
      document.getElementById("myhand").innerHTML = "";
      document.getElementById("MyPlayArea").innerHTML = "";

      // Clear monster image and related elements
      const rightContainer = document.querySelector(".playertablecard-right");
      if (rightContainer) {
        rightContainer.innerHTML = "";
      }
      const monsterLifeValue = document.getElementById("monster-life-value");
      if (monsterLifeValue) {
        monsterLifeValue.textContent = ""; // Clear the life counter
      }

      // Clear counters (shots, discards)
      const shotNumber = document.getElementById("shot-number");
      const discardNumber = document.getElementById("discard-number");
      if (shotNumber) shotNumber.textContent = "";
      if (discardNumber) discardNumber.textContent = "";

      // Hide/remove action buttons if they exist
      this.removeActionButtons(); // Implement this function if you add dynamic buttons
      this.buttonsAdded = false; // Reset button flag

      // Optional: Hide the entire game area or display a "Game Over" overlay
      const gamePlayArea = document.getElementById("game_play_area");
      if (gamePlayArea) {
        // You might want to hide it completely or replace its content
        // gamePlayArea.style.display = 'none';
        // Or add an overlay:
        gamePlayArea.innerHTML =
          '<div id="gameOverOverlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; color: white; font-size: 3em; z-index: 999;">¡HAS PERDIDO!</div>';
      }

      // Clear selected cards array
      this.selectedCards = [];
    },

    notif_gameOver: function (notif) {
     // console.log("Game Over Notification:", notif.args.message);

      // Ocultar los elementos de la interfaz de usuario de BGA
      const bgaHeader = document.querySelector(".bga-ui-header");
      if (bgaHeader) bgaHeader.style.display = "none";
      const bgaActionBar = document.querySelector(".bga-action-bar");
      if (bgaActionBar) bgaActionBar.style.display = "none";
      const bgaStatusBar = document.querySelector(".bga-ui-status");
      if (bgaStatusBar) bgaStatusBar.style.display = "none";
      const bgaBottomActions = document.querySelector(".bga-ui-actions-line");
      if (bgaBottomActions) bgaBottomActions.style.display = "none";
      const bgaDebugArea = document.getElementById("debug_area");
      if (bgaDebugArea) bgaDebugArea.style.display = "none";

      const gamePlayArea = document.getElementById("game_play_area");
      if (!gamePlayArea) {
        console.error(
          "No se encontró el elemento #game_play_area. No se puede mostrar el mensaje de derrota."
        );
        return;
      }

      gamePlayArea.style.position = "relative";
      gamePlayArea.style.width = "100%"; // <--- CAMBIO AQUI: Ocupar todo el ancho disponible
      gamePlayArea.style.height = "100vh"; // <--- Opcional: Si quieres que ocupe toda la altura de la ventana.
      // Si 70vh ya te gusta, déjalo.

      // AÑADIR LA CLASE CSS PARA EL FONDO
      gamePlayArea.classList.add("game-over-background");

      // Elimina estas líneas si usas la clase CSS, ya que el CSS las manejará
      // gamePlayArea.style.backgroundSize = 'cover';
      // gamePlayArea.style.backgroundRepeat = 'no-repeat';
      // gamePlayArea.style.backgroundPosition = 'center';

      gamePlayArea.style.display = "flex";
      gamePlayArea.style.justifyContent = "center";
      gamePlayArea.style.alignItems = "flex-start"; // <--- Alinea al inicio (arriba)

      gamePlayArea.innerHTML = "";

      // Calcular monstruos derrotados
      // Si pierdes en el nivel 1, has derrotado 0. Si pierdes en el nivel 5, has derrotado 4.
      const monstersKilled = Math.max(0, this.currentMonsterLevel - 1);
      const totalMonsters = this.finalMonsterLevel;
      const monstersInfoText = `Monstruos derrotados: ${monstersKilled} / ${totalMonsters}`;

      // Crear el mensaje de "¡HAS PERDIDO!"
      const loseMessageDiv = document.createElement("div");
      loseMessageDiv.id = "gameOverMessageContent";

      loseMessageDiv.style.marginTop = "50px"; // <--- AÑADE ESTO para un margen desde arriba

      // Estilos del contenedor del mensaje
      loseMessageDiv.style.fontSize = "4em";
      loseMessageDiv.style.fontWeight = "bold";
      loseMessageDiv.style.color = "red";
      loseMessageDiv.style.textShadow = "2px 2px 4px rgba(0,0,0,0.7)";
      loseMessageDiv.style.zIndex = "1000";
      loseMessageDiv.style.textAlign = "center";
      loseMessageDiv.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
      loseMessageDiv.style.padding = "10px 30px";
      loseMessageDiv.style.borderRadius = "20px";
      loseMessageDiv.style.whiteSpace = "nowrap";
      loseMessageDiv.style.display = "flex";
      loseMessageDiv.style.flexDirection = "column";
      loseMessageDiv.style.alignItems = "center";

      // Contenido HTML del mensaje: "¡HAS PERDIDO!" y luego la información de los monstruos
      loseMessageDiv.innerHTML = `
        <span>${notif.args.message || _("¡HAS PERDIDO!")}</span>
        <span style="font-size: 0.4em; color: white; margin-top: 10px; font-weight: normal;">${monstersInfoText}</span>
    `;

      gamePlayArea.appendChild(loseMessageDiv);

      if (typeof bgaProcess !== "undefined" && bgaProcess.gameEnd) {
        bgaProcess.gameEnd("soloLost", 0);
      }
    },

    notif_gameWin: function (notif) {
     // console.log("Game Won Notification:", notif.args.message);

      // 1. Clear the monster image container
      const rightContainer = document.querySelector(".playertablecard-right");
      if (rightContainer) {
        rightContainer.innerHTML = ""; // Clear any existing monster image
      }

      // 2. Create and display your "¡HAS GANADO!" message
      const winMessageDiv = document.createElement("div");
      // Apply styles to make it big and centered
      winMessageDiv.style.position = "absolute";
      winMessageDiv.style.top = "50%";
      winMessageDiv.style.left = "50%";
      winMessageDiv.style.transform = "translate(-50%, -50%)"; // Center horizontally and vertically
      winMessageDiv.style.fontSize = "4em"; // Make it bigger
      winMessageDiv.style.fontWeight = "bold";
      winMessageDiv.style.color = "gold"; // Or any color you prefer
      winMessageDiv.style.textShadow = "2px 2px 4px rgba(0,0,0,0.7)"; // Add a shadow for readability
      winMessageDiv.style.zIndex = "1000"; // Ensure it's on top
      winMessageDiv.style.textAlign = "center";
      winMessageDiv.style.backgroundColor = "rgba(0, 0, 0, 0.5)"; // Semi-transparent background
      winMessageDiv.style.padding = "20px";
      winMessageDiv.style.borderRadius = "15px";
      winMessageDiv.style.whiteSpace = "nowrap"; // Prevent text wrapping

      // Use the message from the notification if available, otherwise a default
      winMessageDiv.innerHTML = notif.args.message || _("¡HAS GANADO!");

      // Append to the main game play area to ensure it's centered relative to the whole game
      document.getElementById("game_play_area").appendChild(winMessageDiv);

      // The actual game ending is handled by the server (PHP) when `gamestate->nextState('winGame')` is called.
      // No client-side `bgaProcess.gameEnd` is needed here.
    },
  });
});
