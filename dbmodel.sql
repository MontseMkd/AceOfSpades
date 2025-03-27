-- Crear la tabla del mazo de cartas
CREATE TABLE mazo_cartas (
    id SERIAL PRIMARY KEY,
    numero INT CHECK (numero BETWEEN 1 AND 12),
    palo VARCHAR(10) CHECK (palo IN ('Picas', 'Corazones', 'Diamantes', 'Tréboles')),
    es_joker BOOLEAN DEFAULT FALSE,
    disponible BOOLEAN DEFAULT TRUE
);

-- Insertar cartas en el mazo
INSERT INTO mazo_cartas (numero, palo, es_joker) VALUES
    -- Cartas de Picas
    (1, 'Picas', FALSE), (2, 'Picas', FALSE), (3, 'Picas', FALSE), (4, 'Picas', FALSE),
    (5, 'Picas', FALSE), (6, 'Picas', FALSE), (7, 'Picas', FALSE), (8, 'Picas', FALSE),
    (9, 'Picas', FALSE), (10, 'Picas', FALSE), (11, 'Picas', FALSE), (12, 'Picas', FALSE),

    -- Cartas de Corazones
    (1, 'Corazones', FALSE), (2, 'Corazones', FALSE), (3, 'Corazones', FALSE), (4, 'Corazones', FALSE),
    (5, 'Corazones', FALSE), (6, 'Corazones', FALSE), (7, 'Corazones', FALSE), (8, 'Corazones', FALSE),
    (9, 'Corazones', FALSE), (10, 'Corazones', FALSE), (11, 'Corazones', FALSE), (12, 'Corazones', FALSE),

    -- Cartas de Diamantes
    (1, 'Diamantes', FALSE), (2, 'Diamantes', FALSE), (3, 'Diamantes', FALSE), (4, 'Diamantes', FALSE),
    (5, 'Diamantes', FALSE), (6, 'Diamantes', FALSE), (7, 'Diamantes', FALSE), (8, 'Diamantes', FALSE),
    (9, 'Diamantes', FALSE), (10, 'Diamantes', FALSE), (11, 'Diamantes', FALSE), (12, 'Diamantes', FALSE),

    -- Cartas de Tréboles
    (1, 'Tréboles', FALSE), (2, 'Tréboles', FALSE), (3, 'Tréboles', FALSE), (4, 'Tréboles', FALSE),
    (5, 'Tréboles', FALSE), (6, 'Tréboles', FALSE), (7, 'Tréboles', FALSE), (8, 'Tréboles', FALSE),
    (9, 'Tréboles', FALSE), (10, 'Tréboles', FALSE), (11, 'Tréboles', FALSE), (12, 'Tréboles', FALSE),

    -- Joker
    (NULL, 'Joker', TRUE);
