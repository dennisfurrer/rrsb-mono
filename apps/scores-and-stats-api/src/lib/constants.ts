export const TEST_PLAYERS = [
  "Spieler A",
  "Spieler B",
  "Player1",
  "Player2",
  "1",
  "2",
];

export const TEST_PLAYER_SQL_FILTER = `
  AND "player1Name" NOT IN ('Spieler A', 'Spieler B', 'Player1', 'Player2', '1', '2')
  AND "player2Name" NOT IN ('Spieler A', 'Spieler B', 'Player1', 'Player2', '1', '2')
  AND "player1Name" NOT LIKE '@Neuer Spieler%'
  AND "player2Name" NOT LIKE '@Neuer Spieler%'
`;

export const NUMBER_OF_TABLES = 9;
