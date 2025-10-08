import { Injectable } from '@angular/core';
import * as filestack from 'filestack-js';

@Injectable({
  providedIn: 'root'
})
export class FilestackService {
  private client: any;

  constructor() {
    this.client = filestack.init('ARiMNESXtThyfmSJpoKgmz');
  }

  async uploadFile(file: File) {
    try {
      const result = await this.client.upload(file);
      return result;
    } catch (error) {
      console.error('Error subiendo archivo:', error);
      throw error;
    }
  }

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
