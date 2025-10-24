import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, doc, deleteDoc, collectionData, query, where } from '@angular/fire/firestore';
import { auth } from '../../firebase-config';
import { User } from 'firebase/auth';
import { Observable } from 'rxjs';

export interface Favorito {
  id?: string;        // ID del documento en Firestore
  titulo: string;
  descripcion: string;
  userId: string;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritosService {
  constructor(private firestore: Firestore) {}

   /**
   * @description Obtener los favoritos de un usuario específico.
   * @param user El objeto de usuario de Firebase.
   * @returns Observable que emite la lista de favoritos del usuario.
   */
  getFavoritos(user: User): Observable<Favorito[]> {
    const favRef = collection(this.firestore, 'favoritos');
    const q = query(favRef, where('userId', '==', user.uid));
    return collectionData(q, { idField: 'id' }) as Observable<Favorito[]>;
  }

   /**
   * @description Agregar un nuevo favorito a la base de datos de Firestore.
   * @param tarea Objeto que contiene el título y la descripción del favorito.
   * @param user El objeto de usuario de Firebase, para asociar el favorito al usuario.
   */
  async agregarFavorito(tarea: { titulo: string, descripcion: string }, user: User) {
    const favRef = collection(this.firestore, 'favoritos');
    await addDoc(favRef, { ...tarea, userId: user.uid });
  }

  /**
   * @description Eliminar un favorito por su ID.
   * @param favId El ID del favorito que se desea eliminar.
   */
  async eliminarFavorito(favId: string) {
    const docRef = doc(this.firestore, `favoritos/${favId}`);
    await deleteDoc(docRef);
  }
}
