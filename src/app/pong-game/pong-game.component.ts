import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pong-game',
  templateUrl: 'pong-game.component.html',
  styleUrl: 'pong-game.component.css',
  imports: [
    CommonModule
  ],
})
export class PongGameComponent implements OnInit {
  @ViewChild('gameCanvas', { static: true }) gameCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('ballImage', { static: true }) ballImage!: ElementRef<HTMLImageElement>;
  private ctx!: CanvasRenderingContext2D;
  private ballImageLoaded = false;

  // Dimensions
  private width = 1330;
  private height = 1000;
  private paddleHeight = 100;
  private paddleWidth = 15;
  private ballSize = 150; // 150px comme demandé

  // Positions et vitesses
  private playerY = 250;
  private computerY = 250;
  private ballX = 400;
  private ballY = 300;
  private ballSpeedX = 5;
  private ballSpeedY = 5;
  private playerSpeed = 0;
  private computerSpeed = 4;
  private ballRotation = 0; // Angle de rotation du ballon

  // État du jeu
  playerScore = 0;
  computerScore = 0;
  gameStarted = false;
  gameOver = false;
  winner = '';

  // Variables pour l'IA
  private aiReactionDelay = 0;
  private aiErrorMargin = 0;
  private lastAiUpdate = 0;
  private aiTargetY = 0;
  private aiDifficulty = 0.75; // Niveau de difficulté (0.0 - très facile, 1.0 - impossible)

  ngOnInit() {
    this.ctx = this.gameCanvas.nativeElement.getContext('2d')!;
    this.resetAiParams();

    // Chargement de l'image du ballon
    this.ballImage.nativeElement.onload = () => {
      this.ballImageLoaded = true;
      this.drawEverything();
    };

    // Si l'image est déjà chargée (cache du navigateur)
    if (this.ballImage.nativeElement.complete) {
      this.ballImageLoaded = true;
      this.drawEverything();
    }
  }

  @HostListener('window:keydown', ['$event'])
  keyDown(event: KeyboardEvent) {
    if (event.code === 'ArrowUp') {
      this.playerSpeed = -8;
    } else if (event.code === 'ArrowDown') {
      this.playerSpeed = 8;
    } else if (event.code === 'Space' && !this.gameStarted && !this.gameOver) {
      this.gameStarted = true;
      this.gameLoop();
    }
  }

  @HostListener('window:keyup', ['$event'])
  keyUp(event: KeyboardEvent) {
    if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
      this.playerSpeed = 0;
    }
  }

  private gameLoop(): void {
    if (!this.gameStarted) return;

    this.moveEverything();
    this.drawEverything();

    if (!this.gameOver) {
      requestAnimationFrame(() => this.gameLoop());
    }
  }

  private resetAiParams(): void {
    // Paramètres qui rendent l'IA imparfaite
    this.aiReactionDelay = Math.random() * 500 + 100; // Entre 100ms et 600ms de délai de réaction
    this.aiErrorMargin = Math.random() * 60 + 20; // Entre 20px et 80px d'erreur
    this.lastAiUpdate = 0;
    this.aiTargetY = this.computerY;
  }

  private updateAiPosition(): void {
    const now = Date.now();

    // Mettre à jour la cible seulement après le délai de réaction
    if (now - this.lastAiUpdate > this.aiReactionDelay) {
      this.lastAiUpdate = now;

      // Décision aléatoire si l'IA va faire une erreur
      if (Math.random() > this.aiDifficulty) {
        // Position aléatoire avec erreur
        this.aiTargetY = this.ballY - this.paddleHeight / 2 +
                        (Math.random() * this.aiErrorMargin * 2 - this.aiErrorMargin);
      } else {
        // Position optimale avec une petite marge d'erreur
        this.aiTargetY = this.ballY - this.paddleHeight / 2 +
                        (Math.random() * 20 - 10);
      }

      // S'assurer que la cible est dans les limites
      if (this.aiTargetY < 0) this.aiTargetY = 0;
      if (this.aiTargetY > this.height - this.paddleHeight) this.aiTargetY = this.height - this.paddleHeight;
    }

    // Déplacer l'IA vers la cible avec une vitesse limitée
    if (this.computerY < this.aiTargetY - 5) {
      this.computerY += this.computerSpeed;
    } else if (this.computerY > this.aiTargetY + 5) {
      this.computerY -= this.computerSpeed;
    }
  }

  private moveEverything(): void {
    // Déplacement de la raquette du joueur
    this.playerY += this.playerSpeed;

    // Limites pour la raquette du joueur
    if (this.playerY < 0) this.playerY = 0;
    if (this.playerY > this.height - this.paddleHeight) this.playerY = this.height - this.paddleHeight;

    // IA améliorée - seulement active quand la balle va vers l'ordinateur
    if (this.ballSpeedX > 0) {
      this.updateAiPosition();
    } else {
      // Quand la balle s'éloigne, l'IA bouge plus lentement et de façon moins précise
      if (Math.random() < 0.02) { // Seulement 2% des frames
        const centerY = this.height / 2 - this.paddleHeight / 2;
        this.aiTargetY = centerY + (Math.random() * 100 - 50);

        if (this.computerY < this.aiTargetY - 5) {
          this.computerY += this.computerSpeed * 0.5;
        } else if (this.computerY > this.aiTargetY + 5) {
          this.computerY -= this.computerSpeed * 0.5;
        }
      }
    }

    // Limites pour la raquette de l'ordinateur
    if (this.computerY < 0) this.computerY = 0;
    if (this.computerY > this.height - this.paddleHeight) this.computerY = this.height - this.paddleHeight;

    // Déplacement de la balle
    this.ballX += this.ballSpeedX;
    this.ballY += this.ballSpeedY;

    // Rotation du ballon
    this.ballRotation += 0.03 * Math.sqrt(Math.pow(this.ballSpeedX/15, 2) + Math.pow(this.ballSpeedY/15, 2));

    // Collision avec le haut et le bas
    if (this.ballY < 0 || this.ballY > this.height - this.ballSize) {
      this.ballSpeedY = -this.ballSpeedY;
    }

    // Collision avec la raquette du joueur
    if (this.ballX < this.paddleWidth) {
      if (this.ballY > this.playerY - this.ballSize / 2 &&
          this.ballY < this.playerY + this.paddleHeight - this.ballSize / 2) {
        this.ballSpeedX = -this.ballSpeedX;

        // Variation de l'angle en fonction du point d'impact
        const deltaY = this.ballY - (this.playerY + this.paddleHeight/2);
        this.ballSpeedY = deltaY * 0.3;
      }
    }

    // Collision avec la raquette de l'ordinateur
    if (this.ballX > this.width - this.paddleWidth - this.ballSize) {
      if (this.ballY > this.computerY - this.ballSize / 2 &&
          this.ballY < this.computerY + this.paddleHeight - this.ballSize / 2) {
        this.ballSpeedX = -this.ballSpeedX;

        // Variation de l'angle en fonction du point d'impact
        const deltaY = this.ballY - (this.computerY + this.paddleHeight/2);
        this.ballSpeedY = deltaY * 0.3;
      }
    }

    // But pour l'ordinateur
    if (this.ballX < 0) {
      this.computerScore++;
      this.resetBall();
      this.resetAiParams(); // Reset de l'IA à chaque point

      if (this.computerScore >= 5) {
        this.endGame("L'ordinateur");
      }
    }

    // But pour le joueur
    if (this.ballX > this.width) {
      this.playerScore++;
      this.resetBall();
      this.resetAiParams(); // Reset de l'IA à chaque point

      // Augmenter légèrement la difficulté quand le joueur marque
      this.aiDifficulty = Math.min(0.9, this.aiDifficulty + 0.02);

      if (this.playerScore >= 5) {
        this.endGame("Le joueur");
      }
    }
  }

  private drawEverything(): void {
    // Effacer le canvas
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Ligne centrale
    this.ctx.strokeStyle = 'white';
    this.ctx.setLineDash([10, 10]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.width / 2, 0);
    this.ctx.lineTo(this.width / 2, this.height);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Raquette du joueur
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, this.playerY, this.paddleWidth, this.paddleHeight);

    // Raquette de l'ordinateur
    this.ctx.fillRect(this.width - this.paddleWidth, this.computerY, this.paddleWidth, this.paddleHeight);

    // Balle avec image
    if (this.ballImageLoaded) {
      this.ctx.save();
      // Translater au centre de la balle
      this.ctx.translate(this.ballX + this.ballSize / 2, this.ballY + this.ballSize / 2);
      // Rotation de la balle
      this.ctx.rotate(this.ballRotation);
      // Dessiner l'image centrée
      this.ctx.drawImage(
        this.ballImage.nativeElement,
        -this.ballSize / 2,
        -this.ballSize / 2,
        this.ballSize,
        this.ballSize
      );
      this.ctx.restore();
    } else {
      // Fallback si l'image n'est pas chargée
      this.ctx.fillStyle = 'white';
      this.ctx.beginPath();
      this.ctx.arc(this.ballX + this.ballSize / 2, this.ballY + this.ballSize / 2, this.ballSize / 2, 0, Math.PI * 2, true);
      this.ctx.fill();
    }
  }

  private resetBall(): void {
    this.ballX = this.width / 2 - this.ballSize / 2;
    this.ballY = this.height / 2 - this.ballSize / 2;
    this.ballSpeedX = -this.ballSpeedX;
    this.ballSpeedY = (Math.random() * 8 - 4);
  }

  private endGame(winner: string): void {
    this.gameOver = true;
    this.gameStarted = false;
    this.winner = winner;
  }

  resetGame(): void {
    this.playerScore = 0;
    this.computerScore = 0;
    this.gameOver = false;
    this.resetBall();
    this.playerY = 250;
    this.computerY = 250;
    this.aiDifficulty = 0.75; // Réinitialiser la difficulté
    this.resetAiParams();
    this.ballRotation = 0;
    this.drawEverything();
  }
}
