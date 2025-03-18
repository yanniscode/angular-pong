// src/app/app.component.ts
import { Component } from '@angular/core';
import { PongGameComponent } from "./pong-game/pong-game.component";

@Component({
  selector: 'app-root',
  template: `
    <div class="container">
      <h1>Angular Pong</h1>
      <app-pong-game></app-pong-game>
    </div>
  `,
  styles: [`
    .container {
      text-align: center;
      font-family: Arial, sans-serif;
    }
    h1 {
      color: #333;
      margin-bottom: 20px;
    }
  `],
  imports: [PongGameComponent]
})
export class AppComponent {
  title = 'angular-pong';
}