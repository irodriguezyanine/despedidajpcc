"use client";

import { useEffect, useRef } from "react";
import * as Phaser from "phaser";
import PenaltyScene from "./scenes/PenaltyScene";

const GAME_W = 360;
const GAME_H = 600;

interface PhaserGameProps {
  className?: string;
  onGameReady?: (game: Phaser.Game) => void;
  onGoal?: () => void;
  onSaved?: () => void;
  disabled?: boolean;
}

export default function PhaserGame({ className = "", onGameReady, onGoal, onSaved, disabled = false }: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const onGoalRef = useRef(onGoal);
  const onSavedRef = useRef(onSaved);
  onGoalRef.current = onGoal;
  onSavedRef.current = onSaved;

  useEffect(() => {
    if (!containerRef.current || typeof window === "undefined") return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: GAME_W,
      height: GAME_H,
      parent: containerRef.current,
      backgroundColor: "#0d2818",
      physics: {
        default: "arcade",
        arcade: {
          gravity: { x: 0, y: 300 },
          debug: false,
        },
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [PenaltyScene],
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    game.events.once("ready", () => {
      onGameReady?.(game);
      game.events.on("penalty-result", (result: "goal" | "saved") => {
        if (result === "goal") onGoalRef.current?.();
        else onSavedRef.current?.();
      });
    });

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, [onGameReady]);

  return (
    <div className="relative">
      <div ref={containerRef} className={className} style={{ minHeight: GAME_H }} />
      {disabled && (
        <div
          className="absolute inset-0 z-10"
          style={{ minHeight: GAME_H }}
          aria-hidden
        />
      )}
    </div>
  );
}
