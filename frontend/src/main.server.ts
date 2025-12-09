import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';

import 'zone.js/node';
import { AppComponent } from './app/app';  
import { config } from './app/app.config.server';

const bootstrap = (context: BootstrapContext) =>
    bootstrapApplication(AppComponent, config, context);  

export default bootstrap;
