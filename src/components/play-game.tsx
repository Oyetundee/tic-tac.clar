"use client";

import { Game, Move, getPlayerStats } from "@/lib/contract";
import { GameBoard } from "./game-board";
import { abbreviateAddress, explorerAddress, formatStx } from "@/lib/stx-utils";
import Link from "next/link";
import { useStacks } from "@/hooks/use-stacks";
import { useState, useEffect } from "react";

interface PlayGameProps {
  game: Game;
}

export function PlayGame({ game }: PlayGameProps) {
  const { userData, handleJoinGame, handlePlayGame } = useStacks();

  // Initial game board is the current `game.board` state
  const [board, setBoard] = useState(game.board);

  // cell where user played their move. -1 denotes no move has been played
  const [playedMoveIndex, setPlayedMoveIndex] = useState(-1);

  // MY FEATURE
  // Store player one's stats (wins and losses)
  const [playerOneStats, setPlayerOneStats] = useState({ wins: 0, losses: 0 });
  // Store player two's stats (wins and losses)
  const [playerTwoStats, setPlayerTwoStats] = useState({ wins: 0, losses: 0 });
  // Track if we're still loading the stats
  const [loadingStats, setLoadingStats] = useState(true);

  // useEffect runs when the component loads
  // We use it to fetch both players' stats
  useEffect(() => {
    // This async function gets stats for both players
    async function loadStats() {
      // Get player one's stats directly from the blockchain
      const p1Stats = await getPlayerStats(game["player-one"]);
      setPlayerOneStats(p1Stats);

      // Get player two's stats if there is a player two
      if (game["player-two"]) {
        const p2Stats = await getPlayerStats(game["player-two"]);
        setPlayerTwoStats(p2Stats);
      }

      // We're done loading
      setLoadingStats(false);
    }

    // Start loading the stats
    loadStats();
  }, [game]); // Run this whenever the game changes
  //

  // If user is not logged in, don't show anything
  if (!userData) return null;

  const isPlayerOne =
    userData.profile.stxAddress.testnet === game["player-one"];
  const isPlayerTwo =
    userData.profile.stxAddress.testnet === game["player-two"];

  const isJoinable = game["player-two"] === null && !isPlayerOne;
  const isJoinedAlready = isPlayerOne || isPlayerTwo;
  const nextMove = game["is-player-one-turn"] ? Move.X : Move.O;
  const isMyTurn =
    (game["is-player-one-turn"] && isPlayerOne) ||
    (!game["is-player-one-turn"] && isPlayerTwo);
  const isGameOver = game.winner !== null;

  function onCellClick(index: number) {
    const tempBoard = [...game.board];
    tempBoard[index] = nextMove;
    setBoard(tempBoard);
    setPlayedMoveIndex(index);
  }

  return (
    <div className="flex flex-col gap-4 w-[400px]">
      <GameBoard
        board={board}
        onCellClick={onCellClick}
        nextMove={nextMove}
        cellClassName="size-32 text-6xl"
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-gray-500">Bet Amount: </span>
          <span>{formatStx(game["bet-amount"])} STX</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-gray-500">Player One: </span>
          <Link
            href={explorerAddress(game["player-one"])}
            target="_blank"
            className="hover:underline"
          >
            {abbreviateAddress(game["player-one"])}
          </Link>
        </div>

        {/*MY Feature*/}
        {!loadingStats && (
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-gray-500">Player One Record: </span>
            <span className="text-gray-400">
              {playerOneStats.wins}W - {playerOneStats.losses}L
            </span>
          </div>
        )}
        {/**/}

        <div className="flex items-center justify-between gap-2">
          <span className="text-gray-500">Player Two: </span>
          {game["player-two"] ? (
            <Link
              href={explorerAddress(game["player-two"])}
              target="_blank"
              className="hover:underline"
            >
              {abbreviateAddress(game["player-two"])}
            </Link>
          ) : (
            <span>Nobody</span>
          )}
        </div>

        {/*MY feature*/}
        {!loadingStats && game["player-two"] && (
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-gray-500">Player Two Record: </span>
            <span className="text-gray-400">
              {playerTwoStats.wins}W - {playerTwoStats.losses}L
            </span>
          </div>
        )}
        {/**/}

        {game["winner"] && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-500">Winner: </span>
            <Link
              href={explorerAddress(game["winner"])}
              target="_blank"
              className="hover:underline"
            >
              {abbreviateAddress(game["winner"])}
            </Link>
          </div>
        )}
      </div>

      {isJoinable && (
        <button
          onClick={() => handleJoinGame(game.id, playedMoveIndex, nextMove)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Join Game
        </button>
      )}

      {isMyTurn && (
        <button
          onClick={() => handlePlayGame(game.id, playedMoveIndex, nextMove)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Play
        </button>
      )}

      {isJoinedAlready && !isMyTurn && !isGameOver && (
        <div className="text-gray-500">Waiting for opponent to play...</div>
      )}
    </div>
  );
}