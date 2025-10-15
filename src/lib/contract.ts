import { STACKS_TESTNET } from "@stacks/network";
import {
  BooleanCV,
  cvToValue,
  fetchCallReadOnlyFunction,
  ListCV,
  OptionalCV,
  PrincipalCV,
  TupleCV,
  uintCV,
  UIntCV,
  principalCV,
} from "@stacks/transactions";

const CONTRACT_ADDRESS = "ST1B95HGVJ45TG1970HCTCVZMZJYVAMJ4VV8SZGRC";
const CONTRACT_NAME = "tic-tac-toe-v2";

type GameCV = {
  "player-one": PrincipalCV;
  "player-two": OptionalCV<PrincipalCV>;
  "is-player-one-turn": BooleanCV;
  "bet-amount": UIntCV;
  board: ListCV<UIntCV>;
  winner: OptionalCV<PrincipalCV>;
};

export type Game = {
  id: number;
  "player-one": string;
  "player-two": string | null;
  "is-player-one-turn": boolean;
  "bet-amount": number;
  board: number[];
  winner: string | null;
};

// ========== NEW FEATURE: PLAYER STATS TYPE ==========
// This type describes what player stats look like
export type PlayerStats = {
  wins: number;
  losses: number;
};
// ========== END NEW FEATURE ==========

export enum Move {
  EMPTY = 0,
  X = 1,
  O = 2,
}

export const EMPTY_BOARD = [
  Move.EMPTY,
  Move.EMPTY,
  Move.EMPTY,
  Move.EMPTY,
  Move.EMPTY,
  Move.EMPTY,
  Move.EMPTY,
  Move.EMPTY,
  Move.EMPTY,
];

export async function getAllGames() {
  const latestGameIdCV = (await fetchCallReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "get-latest-game-id",
    functionArgs: [],
    senderAddress: CONTRACT_ADDRESS,
    network: STACKS_TESTNET,
  })) as UIntCV;

  const latestGameId = parseInt(latestGameIdCV.value.toString());

  const games: Game[] = [];
  for (let i = 0; i < latestGameId; i++) {
    const game = await getGame(i);
    if (game) games.push(game);
  }
  return games;
}

export async function getGame(gameId: number) {
  const gameDetails = await fetchCallReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "get-game",
    functionArgs: [uintCV(gameId)],
    senderAddress: CONTRACT_ADDRESS,
    network: STACKS_TESTNET,
  });

  const responseCV = gameDetails as OptionalCV<TupleCV<GameCV>>;
  if (responseCV.type === "none") return null;
  if (responseCV.value.type !== "tuple") return null;

  const gameCV = responseCV.value.value;

  const game: Game = {
    id: gameId,
    "player-one": gameCV["player-one"].value,
    "player-two":
      gameCV["player-two"].type === "some"
        ? gameCV["player-two"].value.value
        : null,
    "is-player-one-turn": cvToValue(gameCV["is-player-one-turn"]),
    "bet-amount": parseInt(gameCV["bet-amount"].value.toString()),
    board: gameCV["board"].value.map((cell) => parseInt(cell.value.toString())),
    winner:
      gameCV["winner"].type === "some" ? gameCV["winner"].value.value : null,
  };
  return game;
}

// ========== NEW FEATURE: GET PLAYER STATS START ==========
// This function gets a player's wins and losses from the smart contract
export async function getPlayerStats(playerAddress: string): Promise<PlayerStats> {
  try {
    // Call the smart contract's get-player-stats function
    const statsCV = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "get-player-stats",
      functionArgs: [principalCV(playerAddress)],
      senderAddress: CONTRACT_ADDRESS,
      network: STACKS_TESTNET,
    });

    // The contract returns a tuple with wins and losses
    const statsTuple = statsCV as TupleCV;
    
    // Get the wins and losses values from the tuple
    const wins = parseInt((statsTuple.value["wins"] as UIntCV).value.toString());
    const losses = parseInt((statsTuple.value["losses"] as UIntCV).value.toString());

    // Return the stats as an object
    return { wins, losses };
  } catch (error) {
    // If something goes wrong, just return 0 for both
    console.error("Error fetching player stats:", error);
    return { wins: 0, losses: 0 };
  }
}
// ========== NEW FEATURE: GET PLAYER STATS END ==========

export async function createNewGame(
  betAmount: number,
  moveIndex: number,
  move: Move
) {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "create-game",
    functionArgs: [uintCV(betAmount), uintCV(moveIndex), uintCV(move)],
    network: STACKS_TESTNET,
  };

  return txOptions;
}

export async function joinGame(gameId: number, moveIndex: number, move: Move) {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "join-game",
    functionArgs: [uintCV(gameId), uintCV(moveIndex), uintCV(move)],
    network: STACKS_TESTNET,
  };

  return txOptions;
}

export async function play(gameId: number, moveIndex: number, move: Move) {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "play",
    functionArgs: [uintCV(gameId), uintCV(moveIndex), uintCV(move)],
    network: STACKS_TESTNET,
  };

  return txOptions;
}