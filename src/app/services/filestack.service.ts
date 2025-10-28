import { Injectable } from '@angular/core';
import * as filestack from 'filestack-js';

@Injectable({
  providedIn: 'root'
})
export class FilestackService {
  private client: any;

  constructor() {
    this.client = filestack.init('AxL4duZu3RaaRBCWWA8WPz');
  }

    /**
   * @function uploadFile
   * @description Toma un archivo como parámetro y lo carga en el servidor de Filestack.
   * @param { File } file El archivo que se va a subir. Debe ser un objeto `File` obtenido desde un input o un archivo local.
   * @return { Promise<any> } Retorna una promesa que resuelve el resultado de la carga del archivo.
   */
  async uploadFile(file: File) {
    try {
      const result = await this.client.upload(file);
      return result;
    } catch (error) {
      console.error('Error subiendo archivo:', error);
      throw error;
    }
  }

   /**
   * @function openPicker
   * @description Abre el picker de Filestack, permitiendo al usuario seleccionar un archivo para subir.  
   * @return { Promise<any> } Retorna una promesa que se resuelve con la información del archivo cargado o se rechaza con el error.
   */
  async openPicker() {
    return new Promise((resolve, reject) => {
      this.client.picker({
        onUploadDone: (res: any) => {
          resolve(res);
        },
        onFileUploadFailed: (err: any) => {
          reject(err);
        }
      }).open();
    });
  }
}
