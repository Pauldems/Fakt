import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../config/firebaseConfig';

export type SubscriptionType = 'lifetime' | 'annual' | 'monthly' | 'quarterly' | 'trial';

export interface ActivationCode {
  code: string;
  type: SubscriptionType;
  status: 'unused' | 'used' | 'expired';
  createdAt: Date;
  expiresAt?: Date | null;
  usedBy?: string;
  usedAt?: Date;
  userEmail?: string;
  price?: number;
  description?: string;
}

export interface UserSubscription {
  userId: string;
  email: string;
  name?: string;
  subscription: {
    type: SubscriptionType;
    activatedAt: Date;
    expiresAt: Date | null; // null pour lifetime
    code: string;
  };
  activated: boolean;
  createdAt: Date;
}

class AuthService {
  private currentUser: User | null = null;
  private userSubscription: UserSubscription | null = null;

  // Initialiser l'écouteur d'authentification
  initAuthListener(callback: (user: User | null, subscription: UserSubscription | null) => void) {
    return onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      if (user) {
        // Récupérer les infos d'abonnement
        const subscription = await this.getUserSubscription(user.uid);
        this.userSubscription = subscription;
        callback(user, subscription);
      } else {
        this.userSubscription = null;
        callback(null, null);
      }
    });
  }

  // Vérifier et activer un code
  async activateCode(code: string, email: string, name: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      // Vérifier le code dans Firestore
      const codeDoc = await getDoc(doc(db, 'activationCodes', code.toUpperCase()));
      
      if (!codeDoc.exists()) {
        return { success: false, message: 'Code invalide' };
      }

      const codeData = codeDoc.data() as ActivationCode;

      // Vérifier le statut du code
      if (codeData.status === 'used') {
        return { success: false, message: 'Ce code a déjà été utilisé' };
      }

      if (codeData.status === 'expired') {
        return { success: false, message: 'Ce code a expiré' };
      }

      // Créer le compte utilisateur
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Calculer la date d'expiration selon le type
      let expiresAt: Date | null = null;
      const now = new Date();
      
      switch (codeData.type) {
        case 'lifetime':
          expiresAt = null; // Pas d'expiration
          break;
        case 'annual':
          expiresAt = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
          break;
        case 'monthly':
          expiresAt = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
          break;
        case 'quarterly':
          expiresAt = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
          break;
        case 'trial':
          expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 jours
          break;
      }

      // Créer le document utilisateur
      const userSubscription: UserSubscription = {
        userId: user.uid,
        email: email,
        name: name,
        subscription: {
          type: codeData.type,
          activatedAt: now,
          expiresAt: expiresAt,
          code: code.toUpperCase()
        },
        activated: true,
        createdAt: now
      };

      await setDoc(doc(db, 'users', user.uid), userSubscription);

      // Marquer le code comme utilisé
      await updateDoc(doc(db, 'activationCodes', code.toUpperCase()), {
        status: 'used',
        usedBy: user.uid,
        usedAt: serverTimestamp(),
        userEmail: email
      });

      // Sauvegarder localement
      await AsyncStorage.setItem('userSubscription', JSON.stringify(userSubscription));

      return { success: true, message: 'Activation réussie !' };
    } catch (error: any) {
      console.error('Erreur activation:', error);
      if (error.code === 'auth/email-already-in-use') {
        return { success: false, message: 'Cet email est déjà utilisé' };
      }
      return { success: false, message: 'Erreur lors de l\'activation' };
    }
  }

  // Récupérer les infos d'abonnement
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        // Convertir les timestamps Firestore
        return {
          ...data,
          subscription: {
            ...data.subscription,
            activatedAt: data.subscription.activatedAt?.toDate?.() || data.subscription.activatedAt,
            expiresAt: data.subscription.expiresAt?.toDate?.() || data.subscription.expiresAt
          },
          createdAt: data.createdAt?.toDate?.() || data.createdAt
        } as UserSubscription;
      }
      return null;
    } catch (error) {
      console.error('Erreur récupération abonnement:', error);
      return null;
    }
  }

  // Vérifier si l'abonnement est actif
  isSubscriptionActive(subscription: UserSubscription | null): boolean {
    if (!subscription) return false;
    
    // Lifetime = toujours actif
    if (subscription.subscription.type === 'lifetime') return true;
    
    // Vérifier la date d'expiration
    if (subscription.subscription.expiresAt) {
      return new Date() < new Date(subscription.subscription.expiresAt);
    }
    
    return false;
  }

  // Se connecter
  async signIn(email: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true, message: 'Connexion réussie' };
    } catch (error: any) {
      console.error('Erreur connexion:', error);
      if (error.code === 'auth/user-not-found') {
        return { success: false, message: 'Utilisateur non trouvé' };
      }
      if (error.code === 'auth/wrong-password') {
        return { success: false, message: 'Mot de passe incorrect' };
      }
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  // Se déconnecter
  async signOutUser(): Promise<void> {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('userSubscription');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  }

  // Obtenir l'utilisateur actuel
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Obtenir l'abonnement actuel
  getCurrentSubscription(): UserSubscription | null {
    return this.userSubscription;
  }

  // Ajouter un nouveau code à un compte existant
  async addNewCode(code: string): Promise<{ success: boolean; message: string }> {
    if (!this.currentUser) {
      return { success: false, message: 'Non connecté' };
    }

    try {
      // Vérifier le nouveau code
      const codeDoc = await getDoc(doc(db, 'activationCodes', code.toUpperCase()));
      
      if (!codeDoc.exists()) {
        return { success: false, message: 'Code invalide' };
      }

      const codeData = codeDoc.data() as ActivationCode;

      if (codeData.status === 'used') {
        return { success: false, message: 'Ce code a déjà été utilisé' };
      }

      // Calculer la nouvelle date d'expiration
      let newExpiresAt: Date | null = null;
      const now = new Date();
      const currentExpiry = this.userSubscription?.subscription.expiresAt;
      
      // Si l'abonnement actuel n'est pas expiré, on ajoute à la date actuelle d'expiration
      const startDate = currentExpiry && new Date(currentExpiry) > now ? new Date(currentExpiry) : now;
      
      switch (codeData.type) {
        case 'lifetime':
          newExpiresAt = null;
          break;
        case 'annual':
          newExpiresAt = new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate());
          break;
        case 'monthly':
          newExpiresAt = new Date(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate());
          break;
        case 'quarterly':
          newExpiresAt = new Date(startDate.getFullYear(), startDate.getMonth() + 3, startDate.getDate());
          break;
      }

      // Mettre à jour l'abonnement utilisateur
      await updateDoc(doc(db, 'users', this.currentUser.uid), {
        'subscription.expiresAt': newExpiresAt,
        'subscription.type': codeData.type === 'lifetime' ? 'lifetime' : this.userSubscription?.subscription.type,
        'subscription.code': code.toUpperCase()
      });

      // Marquer le code comme utilisé
      await updateDoc(doc(db, 'activationCodes', code.toUpperCase()), {
        status: 'used',
        usedBy: this.currentUser.uid,
        usedAt: serverTimestamp(),
        userEmail: this.currentUser.email
      });

      return { success: true, message: 'Code ajouté avec succès !' };
    } catch (error) {
      console.error('Erreur ajout code:', error);
      return { success: false, message: 'Erreur lors de l\'ajout du code' };
    }
  }
}

export default new AuthService();