import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';
import { MateriaPage } from './materias.page';
import { MateriaPageRoutingModule } from './materias-routing.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    MateriaPageRoutingModule,
    MateriaPage  
  ]
})
export class MateriaPageModule {}
