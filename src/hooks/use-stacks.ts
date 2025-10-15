import { createNewGame, joinGame, Move, play } from "@/lib/contract";
import { getStxBalance } from "@/lib/stx-utils";
import {
  AppConfig,
  openContractCall,
  type UserData,
  UserSession,
} from "@stacks/connect";
import { PostConditionMode } from "@stacks/transactions";
import { useEffect, useState } from "react";

const appDetails = {
  name: "Tic Tac Toe",
  icon: "https://cryptologos.cc/logos/stacks-stx-logo.png",
};

const appConfig = new AppConfig(["store_write"]);
const userSession = new UserSession({ appConfig });

export function useStacks() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [stxBalance, setStxBalance] = useState(0);

  async function connectWallet() {
    try {
      const connectModule = await import("@stacks/connect");
      
      // Type assertion to handle unknown properties
      type AuthModalFunction = (args: {
        appDetails: typeof appDetails;
        onFinish: () => void;
        userSession: typeof userSession;
      }) => void;

      type ExtendedConnectModule = {
        openAuthModal?: AuthModalFunction;
        showConnect?: AuthModalFunction;
        authenticate?: AuthModalFunction;
        default?: {
          openAuthModal?: AuthModalFunction;
          showConnect?: AuthModalFunction;
          authenticate?: AuthModalFunction;
        };
      };
      
      // Use 'as unknown as' to bypass TypeScript's strict checking
      const typedModule = connectModule as unknown as ExtendedConnectModule;
      
      // LOG EVERYTHING to see what's available
      console.log("Connect module:", connectModule);
      console.log("Available exports:", Object.keys(connectModule));
      console.log("Default exports:", connectModule.default ? Object.keys(connectModule.default) : "none");
      
      // Try all possible variations
      const authModal = 
        typedModule.openAuthModal || 
        typedModule.default?.openAuthModal ||
        typedModule.showConnect ||
        typedModule.default?.showConnect ||
        typedModule.authenticate ||
        typedModule.default?.authenticate;
      
      if (!authModal) {
        console.error("No auth modal function found.");
        console.error("Available in connectModule:", Object.keys(connectModule));
        return;
      }
      
      authModal({
        appDetails,
        onFinish: () => {
          const userData = userSession.loadUserData();
          setUserData(userData);
        },
        userSession,
      });
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  }

  function disconnectWallet() {
    userSession.signUserOut();
    setUserData(null);
  }

  async function handleCreateGame(
    betAmount: number,
    moveIndex: number,
    move: Move
  ) {
    if (typeof window === "undefined") return;
    if (moveIndex < 0 || moveIndex > 8) {
      window.alert("Invalid move. Please make a valid move.");
      return;
    }
    if (betAmount === 0) {
      window.alert("Please make a bet");
      return;
    }

    try {
      if (!userData) throw new Error("User not connected");
      const txOptions = await createNewGame(betAmount, moveIndex, move);
      await openContractCall({
        ...txOptions,
        appDetails,
        onFinish: (data) => {
          console.log(data);
          window.alert("Sent create game transaction");
        },
        postConditionMode: PostConditionMode.Allow,
      });
    } catch (_err) {
      const err = _err as Error;
      console.error(err);
      window.alert(err.message);
    }
  }

  async function handleJoinGame(gameId: number, moveIndex: number, move: Move) {
    if (typeof window === "undefined") return;
    if (moveIndex < 0 || moveIndex > 8) {
      window.alert("Invalid move. Please make a valid move.");
      return;
    }

    try {
      if (!userData) throw new Error("User not connected");
      const txOptions = await joinGame(gameId, moveIndex, move);
      await openContractCall({
        ...txOptions,
        appDetails,
        onFinish: (data) => {
          console.log(data);
          window.alert("Sent join game transaction");
        },
        postConditionMode: PostConditionMode.Allow,
      });
    } catch (_err) {
      const err = _err as Error;
      console.error(err);
      window.alert(err.message);
    }
  }

  async function handlePlayGame(gameId: number, moveIndex: number, move: Move) {
    if (typeof window === "undefined") return;
    if (moveIndex < 0 || moveIndex > 8) {
      window.alert("Invalid move. Please make a valid move.");
      return;
    }

    try {
      if (!userData) throw new Error("User not connected");
      const txOptions = await play(gameId, moveIndex, move);
      await openContractCall({
        ...txOptions,
        appDetails,
        onFinish: (data) => {
          console.log(data);
          window.alert("Sent play game transaction");
        },
        postConditionMode: PostConditionMode.Allow,
      });
    } catch (_err) {
      const err = _err as Error;
      console.error(err);
      window.alert(err.message);
    }
  }

  useEffect(() => {
    if (userSession.isSignInPending()) {
      userSession.handlePendingSignIn().then((userData) => {
        setUserData(userData);
      });
    } else if (userSession.isUserSignedIn()) {
      setUserData(userSession.loadUserData());
    }
  }, []);

  useEffect(() => {
    if (userData) {
      const address = userData.profile.stxAddress.testnet;
      getStxBalance(address).then((balance) => {
        setStxBalance(balance);
      });
    }
  }, [userData]);

  return {
    userData,
    stxBalance,
    connectWallet,
    disconnectWallet,
    handleCreateGame,
    handleJoinGame,
    handlePlayGame,
  };
}