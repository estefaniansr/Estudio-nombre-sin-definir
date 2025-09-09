import { NgModule } from '@angular/core';
import { Tab1Page } from './tab1.page';
import { Tab1PageRoutingModule } from './tab1-routing.module';

@NgModule({
  imports: [
    Tab1Page, // 🔹 importás el componente standalone en vez de declararlo
    Tab1PageRoutingModule
  ]
})
export class Tab1PageModule {}
