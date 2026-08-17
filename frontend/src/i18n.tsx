import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type Lang = 'fr' | 'en';

const STORAGE_KEY = 'private-vote:lang';

const dict = {
  fr: {
    'app.subtitle': 'Vote communautaire privé sur Midnight',
    'nav.home': 'Accueil',
    'nav.history': 'Historique',
    'wallet.title': 'Wallet',
    'wallet.connected': 'Connecté',
    'wallet.disconnected': 'Déconnecté',
    'wallet.connect': 'Connecter le wallet',
    'wallet.connecting': 'Connexion…',
    'wallet.disconnect': 'Déconnecter',
    'wallet.hint': 'Connecte ton wallet Midnight (ex. Lace — édition Midnight) pour voter.',
    'wallet.copyAddress': "Copier l'adresse",
    'wallet.addressCopied': 'Adresse copiée',
    'wallet.viewOnExplorer': "Voir sur l'explorateur",
    'wallet.network': 'Réseau',
    'wallet.balance': 'Solde (Night)',
    'wallet.refreshBalance': 'Actualiser le solde',
    'poll.title': 'Poll',
    'poll.contractAddress': 'Adresse du contrat',
    'poll.join': 'Rejoindre',
    'poll.deploy': 'Déployer un nouveau poll',
    'poll.deployed': 'Poll déployé avec succès',
    'poll.deployedFinal': 'Poll déployé avec succès (finalisé)',
    'poll.joined': 'Poll rejoint — récupération des résultats…',
    'poll.status': 'Statut',
    'poll.statusOpen': 'Ouvert',
    'poll.statusClosed': 'Fermé',
    'poll.total': 'Total',
    'poll.yes': 'Oui',
    'poll.no': 'Non',
    'poll.voteYes': 'Voter Oui',
    'poll.voteNo': 'Voter Non',
    'poll.voteRegistered': 'Vote "{choice}" enregistré',
    'poll.closePoll': 'Fermer le poll',
    'poll.closed': 'Poll fermé',
    'poll.copy': 'Copier',
    'poll.copied': 'Adresse copiée',
    'poll.emptyHint': 'Connecte ton wallet pour déployer ou rejoindre un vote.',
    'poll.deployWaiting': 'Attente prolongée — vérifie ton wallet.',
    'poll.deployStop': 'Stop',
    'poll.deployTimeoutMsg':
      "Le déploiement prend plus de 30s — vérifie ton wallet. Si la tx a été soumise, le contrat apparaîtra automatiquement une fois finalisé.",
    'poll.copyTxId': 'Copier tx id',
    'poll.txIdCopied': 'Tx id copié',
    'poll.txIdUnavailable': 'Tx id non disponible',
    'poll.alreadyVoted': 'Tu as déjà voté sur ce poll',
    'poll.alreadyVotedHint':
      'Ce wallet a déjà soumis un vote pour ce contrat. Un seul vote par identité est autorisé — ton choix reste privé, mais impossible de revoter.',
    'poll.alreadyVotedToast':
      "Tu as déjà voté sur ce poll avec ce wallet — un seul vote par identité est autorisé.",
    'poll.deployedBadge': 'Déployé par toi',
    'poll.joinedBadge': 'Rejoint',
    'history.title': 'Historique des votes',
    'history.subtitle': 'Uniquement les polls que tu as déployés ou rejoints sur cet appareil.',
    'history.empty': "Tu n'as encore rejoint ou déployé aucun poll.",
    'history.privacyNote':
      "Seuls les résultats agrégés (total, oui, non) sont affichés — aucune identité de votant n'est jamais exposée, ici ou sur la chaîne.",
    'history.refresh': 'Actualiser',
    'history.role.deployed': 'Déployé',
    'history.role.joined': 'Rejoint',
    'history.viewInPoll': 'Ouvrir dans Poll',
    'history.updatedAt': 'Mis à jour',
    'common.copy': 'Copier',
    'common.error': 'Erreur',
    'error.walletMissing':
      'Aucun wallet Midnight détecté. Installe une extension compatible (ex. Lace — édition Midnight) et recharge la page.',
    'error.walletConnectFailed': 'La connexion au wallet a échoué.',
    'wallet.connectShort': 'Connecter',
  },
  en: {
    'app.subtitle': 'Private community voting on Midnight',
    'nav.home': 'Home',
    'nav.history': 'History',
    'wallet.title': 'Wallet',
    'wallet.connected': 'Connected',
    'wallet.disconnected': 'Disconnected',
    'wallet.connect': 'Connect Wallet',
    'wallet.connecting': 'Connecting…',
    'wallet.disconnect': 'Disconnect',
    'wallet.hint': 'Connect your Midnight wallet (e.g. Lace — Midnight edition) to vote.',
    'wallet.copyAddress': 'Copy address',
    'wallet.addressCopied': 'Address copied',
    'wallet.viewOnExplorer': 'View on explorer',
    'wallet.network': 'Network',
    'wallet.balance': 'Balance (Night)',
    'wallet.refreshBalance': 'Refresh balance',
    'poll.title': 'Poll',
    'poll.contractAddress': 'Contract address',
    'poll.join': 'Join',
    'poll.deploy': 'Deploy a new poll',
    'poll.deployed': 'Poll deployed successfully',
    'poll.deployedFinal': 'Poll deployed successfully (finalized)',
    'poll.joined': 'Poll joined — fetching results…',
    'poll.status': 'Status',
    'poll.statusOpen': 'Open',
    'poll.statusClosed': 'Closed',
    'poll.total': 'Total',
    'poll.yes': 'Yes',
    'poll.no': 'No',
    'poll.voteYes': 'Vote Yes',
    'poll.voteNo': 'Vote No',
    'poll.voteRegistered': 'Vote "{choice}" recorded',
    'poll.closePoll': 'Close poll',
    'poll.closed': 'Poll closed',
    'poll.copy': 'Copy',
    'poll.copied': 'Address copied',
    'poll.emptyHint': 'Connect your wallet to deploy or join a poll.',
    'poll.deployWaiting': 'Taking longer than usual — check your wallet.',
    'poll.deployStop': 'Stop',
    'poll.deployTimeoutMsg':
      'Deployment is taking more than 30s — check your wallet. If the tx was submitted, the contract will appear automatically once finalized.',
    'poll.copyTxId': 'Copy tx id',
    'poll.txIdCopied': 'Tx id copied',
    'poll.txIdUnavailable': 'Tx id unavailable',
    'poll.alreadyVoted': "You've already voted on this poll",
    'poll.alreadyVotedHint':
      'This wallet already submitted a vote for this contract. Only one vote per identity is allowed — your choice stays private, but you can’t vote again.',
    'poll.alreadyVotedToast':
      "You've already voted on this poll with this wallet — only one vote per identity is allowed.",
    'poll.deployedBadge': 'Deployed by you',
    'poll.joinedBadge': 'Joined',
    'history.title': 'Voting history',
    'history.subtitle': 'Only the polls you deployed or joined on this device.',
    'history.empty': "You haven't joined or deployed any poll yet.",
    'history.privacyNote':
      'Only aggregate results (total, yes, no) are shown — no voter identity is ever exposed, here or on-chain.',
    'history.refresh': 'Refresh',
    'history.role.deployed': 'Deployed',
    'history.role.joined': 'Joined',
    'history.viewInPoll': 'Open in Poll',
    'history.updatedAt': 'Updated',
    'common.copy': 'Copy',
    'common.error': 'Error',
    'error.walletMissing':
      'No Midnight wallet detected. Install a compatible extension (e.g. Lace — Midnight edition) and reload the page.',
    'error.walletConnectFailed': 'Wallet connection failed.',
    'wallet.connectShort': 'Connect',
  },
} as const;

export type TKey = keyof typeof dict.fr;

type I18nContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey, vars?: Record<string, string>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function getInitialLang(): Lang {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'fr' || stored === 'en') return stored;
  return navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);

  const t = useCallback(
    (key: TKey, vars?: Record<string, string>) => {
      let str: string = dict[lang][key] ?? dict.fr[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(`{${k}}`, v);
        }
      }
      return str;
    },
    [lang],
  );

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider');
  return ctx;
}
