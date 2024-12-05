import React, { useEffect } from "react";

class PenaltyStreakGame {
  streak: number = 0;
  highScore: number = 0;
  roundActive: boolean = true;

  constructor() {
    console.clear();
    this.displayTitle();
    this.startRound();
  }

  displayTitle() {
    console.log(`
***************************************
*                                     *
*       ⚽ PENALTY STREAKER! ⚽      *
*                                     *
***************************************
    `);
    console.log("Welcome to the Penalty Streak Game!");
    console.log("To play, use the following commands in the console:");
    console.log(" - PenaltyGame.shoot(1): Shoot left");
    console.log(" - PenaltyGame.shoot(2): Shoot center");
    console.log(" - PenaltyGame.shoot(3): Shoot right");
    console.log("\nCurrent streak will be displayed here as you play.\n");
  }

  renderGoal(position: number, marker: string) {
    console.log("_____");
    console.log("|" + (position === 1 ? marker : "   ") + (position === 2 ? ` ${marker} ` : "   ") + (position === 3 ? `  ${marker}` : "   ") + "|");
  }

  async powerBar(): Promise<number> {
    return new Promise((resolve) => {
      console.log("Power bar:");
      let power = 0;
      let direction = 1;
      const interval = setInterval(() => {
        power += direction * 5;
        if (power >= 100 || power <= 0) direction *= -1;

        console.clear();
        this.displayTitle();
        console.log("Power bar: [" + "🟩".repeat(Math.floor(power / 10)) + "⬜".repeat(10 - Math.floor(power / 10)) + "]");
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        resolve(power);
      }, 3000); // Simulates the player stopping after 3 seconds
    });
  }

  async precisionBar(): Promise<number> {
    return new Promise((resolve) => {
      console.log("Precision bar:");
      let precision = 0;
      let direction = 1;
      const interval = setInterval(() => {
        precision += direction * 5;
        if (precision >= 100 || precision <= 0) direction *= -1;

        console.clear();
        this.displayTitle();
        console.log("Precision bar: [" + "🟦".repeat(Math.floor(precision / 10)) + "⬜".repeat(10 - Math.floor(precision / 10)) + "]");
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        resolve(precision);
      }, 3000); // Simulates the player stopping after 3 seconds
    });
  }

  async shoot(choice: number) {
    if (!this.roundActive) {
      console.log("The round has ended. Start a new round by refreshing the page.");
      return;
    }

    if (choice < 1 || choice > 3) {
      console.log("Invalid choice! Use PenaltyGame.shoot(1), PenaltyGame.shoot(2), or PenaltyGame.shoot(3).");
      return;
    }

    const power = await this.powerBar();
    const precision = await this.precisionBar();
    const goalieChoice = Math.floor(Math.random() * 3) + 1;

    console.log(`You chose: ${choice}, Goalie chose: ${goalieChoice}`);
    console.log(`Power: ${power}, Precision: ${precision}`);

    if (goalieChoice === choice) {
      if (power < 70 || precision < 70) {
        console.log("\nSAVE!");
        this.renderGoal(goalieChoice, "🤾");
        console.log("The goalie saves it! Better luck next time.");
        this.endRound();
      } else {
        console.log("\nGOAL!");
        this.renderGoal(choice, "⚽");
        this.streak++;
        console.log(`Current streak: ${this.streak}`);
      }
    } else {
      if (power < 50 || precision < 50) {
        console.log("\nMISS!");
        this.renderGoal(choice, "⚽");
        console.log("You missed the goal! Work on your precision and power.");
        this.endRound();
      } else {
        console.log("\nGOAL!");
        this.renderGoal(choice, "⚽");
        this.streak++;
        console.log(`Current streak: ${this.streak}`);
      }
    }
  }

  endRound() {
    this.roundActive = false;
    if (this.streak > this.highScore) {
      this.highScore = this.streak;
      console.log("\nCongratulations! You set a new high score!");
    }
    console.log(`Your streak: ${this.streak}, High score: ${this.highScore}`);
    console.log("\nRefresh the page to start a new game.");
  }

  startRound() {
    this.streak = 0;
    this.roundActive = true;
    console.log("The round has started! Shoot by calling PenaltyGame.shoot(1), PenaltyGame.shoot(2), or PenaltyGame.shoot(3)."); 
  }
}

declare global {
  interface Window {
    PenaltyGame: PenaltyStreakGame;
  }
}

let PenaltyGame: PenaltyStreakGame;

const PenaltyStreakGameComponent: React.FC = () => {
  useEffect(() => {
    PenaltyGame = new PenaltyStreakGame();
    window.PenaltyGame = PenaltyGame;
  }, []);

  return null;
};

export default PenaltyStreakGameComponent;
