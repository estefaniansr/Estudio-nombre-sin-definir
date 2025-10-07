import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { RegistroPage } from './registro/registro.page'; // <-- importá tu página standalone

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'registro',
    component: RegistroPage // <-- usá component en vez de loadChildren
  },
  {
    path: 'ajustes',
    loadComponent: () => import('./ajustes/ajustes.page').then(m => m.AjustesPage)
  }

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
