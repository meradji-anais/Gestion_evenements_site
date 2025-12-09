import { bootstrapApplication } from '@angular/platform-browser';
import 'zone.js';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app';  
import { provideHttpClient, withFetch } from '@angular/common/http';

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...(appConfig.providers || []),
    provideHttpClient(withFetch())
  ]
});
