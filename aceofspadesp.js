define([
    "dojo", "dojo/_base/declare",
    "ebg/core/gamegui",
    "ebg/counter"
],
function (dojo, declare) {
    return declare("bgagame.aceofspadesp", ebg.core.gamegui, {

        selectedCards: [],  // Definir la variable para almacenar las cartas seleccionadas

        constructor: function(){
            console.log('aceofspadesp constructor');
        },

        setup: function(gamedatas) {
            console.log("Starting game setup");

            // Agregar el contenedor para las mesas de jugadores
            document.getElementById('game_play_area').insertAdjacentHTML('beforeend', `
                <div id="player-tables"></div>
            `);
            
            // Agregar el contenedor de la mano
            document.getElementById('game_play_area').insertAdjacentHTML('beforeend', `
                <div id="myhand_wrap2" class="whiteblock">
                    <b id="myhand_label2">${_('Mano')}</b>
                    <div id="myhand"></div>
                </div>
            `);

            // Agregar area contadores
            document.getElementById('game_play_area').insertAdjacentHTML('beforeend', `
                <div id="MyPlayArea_wrap2" class="whiteblock">
                    <b id="MyPlayArea_label2">${_('Area de juego')}</b>
                    <div id="MyPlayArea"></div>
                </div>
            `);

            // Area de juego
            document.getElementById('game_play_area').insertAdjacentHTML('beforeend', `
                <div id="MyPlayAreaJuego_wrap2" class="whiteblock">
                    <b id="MyPlayAreaJuego_label2">${_('Contadores')}</b>
                    <div id="MyPlayAreaJuego"></div>
                </div>
            `);

            // Agregar el contenedor de ayuda
            document.getElementById('game_play_area').insertAdjacentHTML('beforeend', `
                <div id="help-container">
                    <div class="playertablecard-left"></div> <!-- Caja izquierda -->
                    <div class="playertablecard-right"></div> <!-- Caja derecha -->
                </div>
            `);

            // Procesar cada jugador
            Object.values(gamedatas.players).forEach(player => {
                // Ocultar la puntuación del jugador
                let scoreElement = document.getElementById("player_score_" + player.id);
                if (scoreElement) {
                    scoreElement.style.display = "none";
                }
            });

            // Agregar contadores a la derecha de la imagen
            let playArea = document.getElementById("MyPlayArea_wrap2");

            let playAreaJuego = document.getElementById("MyPlayAreaJuego_wrap2");

            let counterContainer = document.createElement("div");
            counterContainer.classList.add("counter-container");

            // Datos de imágenes y contadores
            let counters = [
                { id: "shot-counter", img: `${g_gamethemeurl}img/disparos.png`, alt: "Disparos", countId: "shot-number", initialCount: 2 },
                { id: "discard-counter", img: `${g_gamethemeurl}img/Descartes.png`, alt: "Descartes", countId: "discard-number", initialCount: 0 }
            ];

            counters.forEach(counter => {
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

            this.setupNotifications();
            console.log("Ending game setup");
        
   
        },

        onEnteringState: function(stateName, args) {
            console.log('Entering state: ' + stateName, args);
            switch(stateName) {
                case 'dummy':
                    break;
            } 
        },


              // Función para actualizar los contadores dinámicamente
              updateCounters: function(shots, discards) {
                document.getElementById("shot-number").textContent = shots;
                document.getElementById("discard-number").textContent = discards;
            },
    
            // Simulación: cambiar valores después de 3 segundos
            simulateCounterUpdate: function() {
                setTimeout(() => {
                    this.updateCounters(5, 2);
                }, 3000);
            },
    
 

        onUpdateActionButtons: function(stateName, args) {
            console.log('onUpdateActionButtons: ' + stateName, args);
            if (this.isCurrentPlayerActive()) {
                if (stateName === 'playerTurn') {
                    // Agregar el botón de "MEZCLA TODO"
                    this.statusBar.addActionButton(
                        _('MEZCLA TODO'),
                        () => {
                            this.bgaPerformAction("actShuffleDeck");

                            // Luego, crear el botón "Jugar" si aún no existe
                            if (!this.playButton) {
                                this.playButton = this.statusBar.addActionButton(
                                    _('Jugar'),
                                    () => {
                                        if (this.selectedCards.length > 0) {
                                            // Llamar a la acción "MyPlayArea" con las cartas seleccionadas
                                            this.bgaPerformAction("actShuffleDeck2");
                                        } else {
                                            alert('¡Selecciona al menos una carta !');
                                        }
                                    },
                                    { color: 'secondary' }
                                );
                            }
                        },
                        { color: 'primary' }
                    );
                }
            }
        },

        //Subscripciones
        setupNotifications: function() {
            console.log('notif');
            dojo.subscribe("newCards", this, "notif_newCards");
            dojo.subscribe("MyPlayArea", this, "notif_otherEvent"); // Ejemplo de otra notificación
        },


        //Eventos suscritos
        //El de la mano
        notif_newCards: function(notif) {
            this.displayCards(notif.args.cards);
        },

        //El de la zona de juego. 
        notif_otherEvent: function(notif) {
            this.displayCards2(notif.args.cards);
        },

        /**
         * Método para seleccionar cartas de la pantalla  
         * @param {Object} card 
         * @param {HTMLElement} cardElement
         */
        selectCard: function(card, cardElement) {
            // Verificar si la carta ya está seleccionada
            const index = this.selectedCards.findIndex(selectedCard => selectedCard.id === card.id);
            if (index === -1) {
                // Si no está seleccionada, agregarla
                this.selectedCards.push(card);
                cardElement.classList.add('selected');
            } else {
                // Si ya está seleccionada, eliminarla
                this.selectedCards.splice(index, 1);
                cardElement.classList.remove('selected');
            }

            console.log('Cartas seleccionadas:', this.selectedCards);
        },



        /**
         * 
         * @param {Array} cards 
         * Método para mostrar cartas en la pantalla. 
         */
        displayCards: function(cards) {
            let myHandContainer = document.getElementById('myhand');
            myHandContainer.innerHTML = '';
            let palosMap = {
                "Corazones": "hearts",
                "Diamantes": "diamonds",
                "Tréboles": "clubs",
                "Picas": "spades"
            };
            let figurasMap = {
                "11": "jack",
                "12": "queen",
                "13": "king",
                "1": "ace" // Agregamos el "Ace" para el 1
            };

            cards.forEach(card => {
                let cardElement = document.createElement('div');
                cardElement.className = 'playertablecard';
                let paloIngles = palosMap[card.palo];
                let numeroCarta = figurasMap[card.numero] || card.numero;
                let imageName = (card.es_joker == "1") ? "red_joker" : `${numeroCarta}_of_${paloIngles}`;
                let imgElement = document.createElement('img');
                imgElement.src = `${g_gamethemeurl}img/${imageName}.png`; 
                imgElement.alt = `${card.numero} de ${card.palo}`;
                imgElement.className = "card-image";
                cardElement.appendChild(imgElement);

                // Agregar un manejador de evento para seleccionar cartas
                cardElement.addEventListener('click', () => this.selectCard(card, cardElement));

                myHandContainer.appendChild(cardElement);
            });
        },



        /**
         * 
         * @param {Array} cards 
         * Método para mostrar cartas en la pantalla. 
         */
        displayCards2: function(cards) {
            let MyPlayAreaCont = document.getElementById('MyPlayArea');
            MyPlayAreaCont.innerHTML = '';
            let palosMap = {
                "Corazones": "hearts",
                "Diamantes": "diamonds",
                "Tréboles": "clubs",
                "Picas": "spades"
            };
            let figurasMap = {
                "11": "jack",
                "12": "queen",
                "13": "king",
                "1": "ace" // Agregamos el "Ace" para el 1
            };

            cards.forEach(card => {
                let cardElement = document.createElement('div');
                cardElement.className = 'playertablecard';
                let paloIngles = palosMap[card.palo];
                let numeroCarta = figurasMap[card.numero] || card.numero;
                let imageName = (card.es_joker == "1") ? "red_joker" : `${numeroCarta}_of_${paloIngles}`;
                let imgElement = document.createElement('img');
                imgElement.src = `${g_gamethemeurl}img/${imageName}.png`; 
                imgElement.alt = `${card.numero} de ${card.palo}`;
                imgElement.className = "card-image";
                cardElement.appendChild(imgElement);

                // Agregar un manejador de evento para seleccionar cartas
                cardElement.addEventListener('click', () => this.selectCard(card, cardElement));

                MyPlayAreaCont.appendChild(cardElement);
            });
        },



        
    });
});


