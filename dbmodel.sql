-- Crear la tabla del mazo de cartas
CREATE TABLE mazo_cartas (
    id SERIAL PRIMARY KEY,
    numero INT CHECK (numero BETWEEN 1 AND 13 OR numero IS NULL),
    palo VARCHAR(10) CHECK (palo IN ('Picas', 'Corazones', 'Diamantes', 'Tréboles', 'Joker')),
    es_joker BOOLEAN DEFAULT FALSE,
    disponible BOOLEAN DEFAULT TRUE,
    enMesa BOOLEAN DEFAULT FALSE,
    jugada BOOLEAN DEFAULT FALSE
);

-- Insertar cartas en el mazo
INSERT INTO mazo_cartas (numero, palo, es_joker, enMesa, jugada) VALUES
    -- Cartas de Picas
    (1, 'Picas', FALSE, FALSE, FALSE), (2, 'Picas', FALSE, FALSE, FALSE), (3, 'Picas', FALSE, FALSE, FALSE), (4, 'Picas', FALSE, FALSE, FALSE),
    (5, 'Picas', FALSE, FALSE, FALSE), (6, 'Picas', FALSE, FALSE, FALSE), (7, 'Picas', FALSE, FALSE, FALSE), (8, 'Picas', FALSE, FALSE, FALSE),
    (9, 'Picas', FALSE, FALSE, FALSE), (10, 'Picas', FALSE, FALSE, FALSE), (11, 'Picas', FALSE, FALSE, FALSE), (12, 'Picas', FALSE, FALSE, FALSE),
    (13, 'Picas', FALSE, FALSE, FALSE),

    -- Cartas de Corazones
    (1, 'Corazones', FALSE, FALSE, FALSE), (2, 'Corazones', FALSE, FALSE, FALSE), (3, 'Corazones', FALSE, FALSE, FALSE), (4, 'Corazones', FALSE, FALSE, FALSE),
    (5, 'Corazones', FALSE, FALSE, FALSE), (6, 'Corazones', FALSE, FALSE, FALSE), (7, 'Corazones', FALSE, FALSE, FALSE), (8, 'Corazones', FALSE, FALSE, FALSE),
    (9, 'Corazones', FALSE, FALSE, FALSE), (10, 'Corazones', FALSE, FALSE, FALSE), (11, 'Corazones', FALSE, FALSE, FALSE), (12, 'Corazones', FALSE, FALSE, FALSE),
    (13, 'Corazones', FALSE, FALSE, FALSE),

    -- Cartas de Diamantes
    (1, 'Diamantes', FALSE, FALSE, FALSE), (2, 'Diamantes', FALSE, FALSE, FALSE), (3, 'Diamantes', FALSE, FALSE, FALSE), (4, 'Diamantes', FALSE, FALSE, FALSE),
    (5, 'Diamantes', FALSE, FALSE, FALSE), (6, 'Diamantes', FALSE, FALSE, FALSE), (7, 'Diamantes', FALSE, FALSE, FALSE), (8, 'Diamantes', FALSE, FALSE, FALSE),
    (9, 'Diamantes', FALSE, FALSE, FALSE), (10, 'Diamantes', FALSE, FALSE, FALSE), (11, 'Diamantes', FALSE, FALSE, FALSE), (12, 'Diamantes', FALSE, FALSE, FALSE),
    (13, 'Diamantes', FALSE, FALSE, FALSE),

    -- Cartas de Tréboles
    (1, 'Tréboles', FALSE, FALSE, FALSE), (2, 'Tréboles', FALSE, FALSE, FALSE), (3, 'Tréboles', FALSE, FALSE, FALSE), (4, 'Tréboles', FALSE, FALSE, FALSE),
    (5, 'Tréboles', FALSE, FALSE, FALSE), (6, 'Tréboles', FALSE, FALSE, FALSE), (7, 'Tréboles', FALSE, FALSE, FALSE), (8, 'Tréboles', FALSE, FALSE, FALSE),
    (9, 'Tréboles', FALSE, FALSE, FALSE), (10, 'Tréboles', FALSE, FALSE, FALSE), (11, 'Tréboles', FALSE, FALSE, FALSE), (12, 'Tréboles', FALSE, FALSE, FALSE),
    (13, 'Tréboles', FALSE, FALSE, FALSE),

    -- Joker
    (NULL, 'Joker', TRUE, FALSE, FALSE);


