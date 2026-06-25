import { deleteDoc, doc, setDoc } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import type { Dispatch, SetStateAction } from "react";

type Identifiable = { id: string };

export async function firestoreCreate<T extends Identifiable>(
  firestore: Firestore | null,
  collectionName: string,
  item: T,
  setItems: Dispatch<SetStateAction<T[]>>
): Promise<void> {
  if (firestore) {
    await setDoc(doc(firestore, collectionName, item.id), item);
    return;
  }
  setItems((previous) => [item, ...previous]);
}

export async function firestoreUpdate<T extends Identifiable>(
  firestore: Firestore | null,
  collectionName: string,
  itemId: string,
  patch: Partial<T>,
  setItems: Dispatch<SetStateAction<T[]>>
): Promise<void> {
  if (firestore) {
    await setDoc(doc(firestore, collectionName, itemId), patch, { merge: true });
    return;
  }
  setItems((previous) =>
    previous.map((item) =>
      item.id === itemId ? { ...item, ...patch } : item
    )
  );
}

export async function firestoreDelete<T extends Identifiable>(
  firestore: Firestore | null,
  collectionName: string,
  itemId: string,
  setItems: Dispatch<SetStateAction<T[]>>
): Promise<void> {
  if (firestore) {
    await deleteDoc(doc(firestore, collectionName, itemId));
    return;
  }
  setItems((previous) => previous.filter((item) => item.id !== itemId));
}
