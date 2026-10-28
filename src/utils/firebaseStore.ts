import { firestore } from './firebaseClient';
import { FirestoreSnapshotData } from './firestoreAdapter';

export function subscribeToReviewData(
  onData: (data: FirestoreSnapshotData) => void,
  onError: (error: Error) => void
): () => void {
  const state: FirestoreSnapshotData = { projects: [], weeks: [], lessons: [], videos: [] };
  const loaded = new Set<keyof FirestoreSnapshotData>();
  const unsubs = (['projects', 'weeks', 'lessons', 'videos'] as const).map(collectionName =>
    firestore.collection(collectionName).onSnapshot(snapshot => {
      state[collectionName] = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      loaded.add(collectionName);
      if (loaded.size === 4) onData({ ...state });
    }, error => onError(error))
  );
  return () => unsubs.forEach(unsubscribe => unsubscribe());
}

export function subscribeToSharedVideo(
  videoId: string,
  onData: (data: FirestoreSnapshotData) => void,
  onError: (error: Error) => void
): () => void {
  const state: FirestoreSnapshotData = { projects: [], weeks: [], lessons: [], videos: [] };
  const subscriptions = new Map<string, { id: string; unsubscribe: () => void }>();
  let closed = false;
  const publish = () => {
    if (!closed) onData({
      projects: [...state.projects],
      weeks: [...state.weeks],
      lessons: [...state.lessons],
      videos: [...state.videos]
    });
  };

  const watchDocument = (
    collection: 'projects' | 'weeks' | 'lessons' | 'videos',
    id: string,
    stateKey: keyof FirestoreSnapshotData,
    onRecord?: (record: FirestoreDocument | undefined) => void
  ) => {
    const current = subscriptions.get(collection);
    if (current?.id === id) return;
    current?.unsubscribe();
    subscriptions.delete(collection);
    state[stateKey] = [];
    publish();
    if (!id) {
      onRecord?.(undefined);
      return;
    }

    const unsubscribe = firestore.collection(collection).doc(id).onSnapshot(snapshot => {
      const record = snapshot.exists ? { ...(snapshot.data() || {}), id: snapshot.id } : undefined;
      state[stateKey] = record ? [record] : [];
      onRecord?.(record);
      publish();
    }, error => onError(error));
    subscriptions.set(collection, { id, unsubscribe });
  };

  const watchVideoRelations = (video: FirestoreDocument | undefined) => {
    if (!video) {
      watchDocument('lessons', '', 'lessons');
      watchDocument('projects', '', 'projects');
      watchDocument('weeks', '', 'weeks');
      return;
    }

    const directProjectId = String(video.projectId || '');
    watchDocument('projects', directProjectId, 'projects');
    watchDocument('lessons', String(video.lessonId || ''), 'lessons', lesson => {
      const projectId = String(lesson?.projectId || directProjectId || '');
      watchDocument('projects', projectId, 'projects');
      watchDocument('weeks', String(lesson?.weekId || ''), 'weeks');
    });
  };

  watchDocument('videos', videoId, 'videos', video => {
    watchVideoRelations(video);
    publish();
  });

  return () => {
    closed = true;
    subscriptions.forEach(subscription => subscription.unsubscribe());
    subscriptions.clear();
  };
}

export function newFirestoreId(collectionName: string): string {
  return firestore.collection(collectionName).doc().id;
}

export async function saveFirestoreDocument(collectionName: string, id: string, data: Record<string, unknown>): Promise<void> {
  await firestore.collection(collectionName).doc(id).set(data, { merge: true });
}

export async function updateFirestoreDocument(collectionName: string, id: string, data: Record<string, unknown>): Promise<void> {
  await firestore.collection(collectionName).doc(id).update(data);
}

export async function deleteFirestoreDocument(collectionName: string, id: string): Promise<void> {
  await firestore.collection(collectionName).doc(id).delete();
}

export async function deleteFirestoreBatch(collections: Array<{ collection: string; ids: string[] }>): Promise<void> {
  const references = collections.flatMap(group => group.ids.map(id => firestore.collection(group.collection).doc(id)));
  for (let offset = 0; offset < references.length; offset += 450) {
    const batch = firestore.batch();
    references.slice(offset, offset + 450).forEach(reference => batch.delete(reference));
    await batch.commit();
  }
}
