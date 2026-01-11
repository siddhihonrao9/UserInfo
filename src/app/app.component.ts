import { Component } from '@angular/core';

import { UsersComponent } from './users/users.component';
@Component({
  selector: 'app-root',
  imports: [UsersComponent],
  template: '<app-users></app-users>',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'userinfo';
}
