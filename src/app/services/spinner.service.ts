import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class SpinnerService {
  private loading: HTMLIonLoadingElement | null = null;

  constructor(private loadingCtrl: LoadingController) {}

    /**
   * @function show
   * @description Muestra un loading en pantalla con un mensaje. Si ya hay un loading activo, no hace nada.
   * 
   * @param { string } message El mensaje que se muestra dentro del loading. Por defecto es 'Cargando...'.
   * @return { Promise<void> } Retorna una promesa que resuelve cuando el loading ha sido mostrado.
   */
  async show(message: string = 'Cargando...') {
    if (!this.loading) {
      this.loading = await this.loadingCtrl.create({
        message,
        spinner: 'crescent',
        backdropDismiss: false
      });
      await this.loading.present();
    }
  }

  /**
   * @function hide
   * @description Oculta el loading si está activo.
   * @return { Promise<void> } Retorna una promesa que resuelve cuando el loading ha sido ocultado.
   */
  async hide() {
    if (this.loading) {
      await this.loading.dismiss();
      this.loading = null;
    }
  }

  /**
   * @function run
   * @description Muestra un loading, ejecuta una función asíncrona y luego oculta el loading. 
   * @param { () => Promise<T> } fn La función asíncrona que se ejecuta mientras el loading está visible.
   * @param { string } message El mensaje que se muestra en el loading.
   * @return { Promise<T> } Retorna la promesa que resuelve con el resultado de la función asíncrona.
   */
  async run<T>(fn: () => Promise<T>, message: string = 'Cargando...'): Promise<T> {
    try {
      await this.show(message);
      return await fn();
    } finally {
      await this.hide();
    }
  }
}
