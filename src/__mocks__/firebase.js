// Mock Firebase module
const mockAuth = {
  currentUser: null,
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  updateProfile: jest.fn(),
};

const mockFirestore = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      onSnapshot: jest.fn(),
    })),
    where: jest.fn(() => ({
      get: jest.fn(),
      onSnapshot: jest.fn(),
    })),
    orderBy: jest.fn(() => ({
      get: jest.fn(),
      onSnapshot: jest.fn(),
    })),
  })),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  onSnapshot: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
};

const mockFirebaseApp = {
  auth: jest.fn(() => mockAuth),
  firestore: jest.fn(() => mockFirestore),
};

const firebaseMock = {
  initializeApp: jest.fn(() => mockFirebaseApp),
  getAuth: jest.fn(() => mockAuth),
  getFirestore: jest.fn(() => mockFirestore),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  updateProfile: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn(() => 'mock-timestamp'),
};

module.exports = {
  initializeApp: firebaseMock.initializeApp,
  getAuth: firebaseMock.getAuth,
  getFirestore: firebaseMock.getFirestore,
  signInWithEmailAndPassword: firebaseMock.signInWithEmailAndPassword,
  createUserWithEmailAndPassword: firebaseMock.createUserWithEmailAndPassword,
  signOut: firebaseMock.signOut,
  onAuthStateChanged: firebaseMock.onAuthStateChanged,
  sendPasswordResetEmail: firebaseMock.sendPasswordResetEmail,
  updateProfile: firebaseMock.updateProfile,
  collection: firebaseMock.collection,
  doc: firebaseMock.doc,
  query: firebaseMock.query,
  where: firebaseMock.where,
  orderBy: firebaseMock.orderBy,
  limit: firebaseMock.limit,
  getDocs: firebaseMock.getDocs,
  getDoc: firebaseMock.getDoc,
  setDoc: firebaseMock.setDoc,
  updateDoc: firebaseMock.updateDoc,
  deleteDoc: firebaseMock.deleteDoc,
  onSnapshot: firebaseMock.onSnapshot,
  serverTimestamp: firebaseMock.serverTimestamp,
  auth: mockAuth,
  firestore: mockFirestore,
  __mockAuth: mockAuth,
  __mockFirestore: mockFirestore,
};

export default firebaseMock;