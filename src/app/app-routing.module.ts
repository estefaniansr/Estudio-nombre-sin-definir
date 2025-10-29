import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { RegistroPage } from './registro/registro.page'; // <-- importá tu página standalone
import { NoAuthGuard } from './guards/no-auth.guard';
import { AuthGuard } from './guards/auth.guard'; 
const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule),

  },
  {
    path: 'registro',
    component: RegistroPage, // <-- usá component en vez de loadChildren
     canActivate: [NoAuthGuard] // Solo usuarios NO logueados
  },
  {
    path: 'ajustes',
    loadComponent: () => import('./ajustes/ajustes.page').then(m => m.AjustesPage),
           canActivate: [AuthGuard] // Solo usuarios logueados
  },
  {
    path: 'comunidad',
    loadComponent: () => import('./comunidad/comunidad.page').then(m => m.ComunidadPage),
             canActivate: [AuthGuard] // Solo usuarios logueados
  },
   {
    path: '',
    redirectTo: 'tabs/tab1', // Redirigir al tab1 (login)
    pathMatch: 'full'
  }


];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
