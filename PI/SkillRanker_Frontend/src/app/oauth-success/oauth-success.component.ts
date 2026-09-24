import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-oauth-success',
  templateUrl: './oauth-success.component.html',
  styleUrl: './oauth-success.component.css'
})
export class OAuthSuccessComponent implements OnInit{
  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (token) {
      sessionStorage.setItem('accessToken', token);
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        if (decoded?.role) {
          sessionStorage.setItem('role', decoded.role);
          sessionStorage.setItem('userId', decoded.id);

          if (decoded.role === 'HR_MANAGER') {
            this.router.navigate(['/hr-dashboard']);
            return;
          }
          if (decoded.role === 'MANAGER') {
            this.router.navigate(['/manager-dashboard']);
            return;
          }
          if (decoded.role === 'ADMINISTRATOR') {
            this.router.navigate(['/admin-dashboard']);
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to decode JWT on oauth success', err);
      }
      this.router.navigate(['/employee-dashboard']);
    } else {
      this.router.navigate(['/']);
    }
  }
}
