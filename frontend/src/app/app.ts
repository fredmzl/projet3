import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  imports: [
    RouterOutlet,
    RouterModule,
    CommonModule
  ],
  styleUrl: './app.css'
})

export class App implements OnInit {
  title = 'etudiant-frontend';
  showNavigation = true;

  constructor(
    private router: Router,
    // private userService: UserService
  ) {}

  ngOnInit() {
    // Cacher la navigation sur certaines pages si nécessaire
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Pour l'instant, on affiche toujours la navigation
        this.showNavigation = true;
      });
  }

  get isLoggedIn(): boolean {
    // return this.userService.isLoggedIn();
    return false;
  }

  logout(): void {
    // this.userService.logout();
    this.router.navigate(['/login']);
  }
}
