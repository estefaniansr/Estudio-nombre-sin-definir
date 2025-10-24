import { Injectable } from '@angular/core';
import { db } from '../../firebase-config';
import { collection, getDocs } from 'firebase/firestore';
import { Materia } from '../models/materia.model';
@Injectable({
  providedIn: 'root'
})
export class MateriasService {

  constructor() { }

  /**
   * @function getAllMaterias
   * @description Realiza una consulta y obtiene todas las materias desde la base de datos. 
   *  Devuelve los datos de las materias en un array. 
   * @return { Promise<Materia[]> } Retorna una promesa que resuelve un array de objetos `Materia`.
   */
  async getAllMaterias(): Promise<Materia[]> {
    const materiasRef = collection(db, 'materias');
    const snapshot = await getDocs(materiasRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Materia));
  }
}