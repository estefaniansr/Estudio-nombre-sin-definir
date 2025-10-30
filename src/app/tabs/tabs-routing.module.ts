import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { Tab3Page } from '../tab3/tab3.page';
import { AuthGuard } from '../guards/auth.guard';
const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
      
    children: [
      {
        path: 'tab1',
        loadChildren: () => import('../tab1/tab1.module').then(m => m.Tab1PageModule)
      },
      {
        path: 'tab2',
        loadChildren: () => import('../materias/materias.module').then(m => m.MateriaPageModule),
         canActivate: [AuthGuard]
      },
      {
        path: 'tab3',
        component: Tab3Page,
              canActivate: [AuthGuard] 
      },
      {
        path: '',
        redirectTo: '/tabs/tab1',
        pathMatch: 'full'
      },
      {
        path: 'comunidad',
        loadComponent: () => import('../comunidad/comunidad.page').then(m => m.ComunidadPage),
        canActivate: [AuthGuard] 
      },
 {
    path: 'ajustes',
    loadComponent: () => import('../ajustes/ajustes.page').then(m => m.AjustesPage),
           canActivate: [AuthGuard] 
  },

    ]
  },
  {
    path: '',
    redirectTo: '/tabs/tab1',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule { }
