import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Lang = "fr" | "en";

const STORAGE_KEY = "private-vote:lang";

const dict = {
  fr: {
    "app.subtitle": "Vote communautaire privé sur Midnight",
    "nav.home": "Accueil",
    "nav.history": "Historique",
    "wallet.title": "Wallet",
    "wallet.connected": "Connecté",
    "wallet.disconnected": "Déconnecté",
    "wallet.connect": "Connecter le wallet",
    "wallet.connecting": "Connexion…",
    "wallet.disconnect": "Déconnecter",
    "wallet.hint":
      "Connecte ton wallet Midnight (ex. Lace — édition Midnight) pour voter.",
    "wallet.copyAddress": "Copier l'adresse",
    "wallet.addressCopied": "Adresse copiée",
    "wallet.viewOnExplorer": "Voir sur l'explorateur",
    "wallet.network": "Réseau",
    "wallet.balance": "Solde (Night)",
    "wallet.refreshBalance": "Actualiser le solde",
    "poll.title": "Poll",
    "poll.contractAddress": "Adresse du contrat",
    "poll.join": "Rejoindre",
    "poll.deploy": "Déployer un nouveau poll",
    "poll.deployed": "Poll déployé avec succès",
    "poll.deployedFinal": "Poll déployé avec succès (finalisé)",
    "poll.joined": "Poll rejoint — récupération des résultats…",
    "poll.status": "Statut",
    "poll.statusOpen": "Ouvert",
    "poll.statusClosed": "Fermé",
    "poll.total": "Total",
    "poll.yes": "Oui",
    "poll.no": "Non",
    "poll.voteYes": "Voter Oui",
    "poll.voteNo": "Voter Non",
    "poll.voteRegistered": 'Vote "{choice}" enregistré',
    "poll.closePoll": "Fermer le poll",
    "poll.closed": "Poll fermé",
    "poll.copy": "Copier",
    "poll.copied": "Adresse copiée",
    "poll.emptyHint": "Connecte ton wallet pour déployer ou rejoindre un vote.",
    "poll.deployWaiting": "Attente prolongée — vérifie ton wallet.",
    "poll.deployStop": "Stop",
    "poll.deployTimeoutMsg":
      "Le déploiement prend plus de 30s — vérifie ton wallet. Si la tx a été soumise, le contrat apparaîtra automatiquement une fois finalisé.",
    "poll.copyTxId": "Copier tx id",
    "poll.txIdCopied": "Tx id copié",
    "poll.txIdUnavailable": "Tx id non disponible",
    "poll.alreadyVoted": "Tu as déjà voté sur ce poll",
    "poll.alreadyVotedHint":
      "Ce wallet a déjà soumis un vote pour ce contrat. Un seul vote par identité est autorisé — ton choix reste privé, mais impossible de revoter.",
    "poll.alreadyVotedToast":
      "Tu as déjà voté sur ce poll avec ce wallet — un seul vote par identité est autorisé.",
    "poll.deployedBadge": "Déployé par toi",
    "poll.joinedBadge": "Rejoint",
    "history.title": "Historique des votes",
    "history.subtitle":
      "Uniquement les polls que tu as déployés ou rejoints sur cet appareil.",
    "history.empty": "Tu n'as encore rejoint ou déployé aucun poll.",
    "history.privacyNote":
      "Seuls les résultats agrégés (total, oui, non) sont affichés — aucune identité de votant n'est jamais exposée, ici ou sur la chaîne.",
    "history.refresh": "Actualiser",
    "history.role.deployed": "Déployé",
    "history.role.joined": "Rejoint",
    "history.viewInPoll": "Ouvrir dans Poll",
    "history.updatedAt": "Mis à jour",
    "common.copy": "Copier",
    "common.error": "Erreur",
    "error.walletMissing":
      "Aucun wallet Midnight détecté. Installe une extension compatible (ex. Lace — édition Midnight) et recharge la page.",
    "error.walletConnectFailed": "La connexion au wallet a échoué.",
    "error.contractNotFound":
      "Aucun contrat de vote trouvé à cette adresse. Vérifie l'adresse et réessaie.",
    "wallet.connectShort": "Connecter",
    "nav.howItWorks": "Comment ça marche",
    "howItWorks.title": "Comment ça marche",
    "howItWorks.intro":
      "PrivateVote permet à n'importe quelle communauté de voter de façon vérifiable, sans jamais révéler qui a voté quoi. Voici le déroulé, étape par étape.",
    "howItWorks.step1":
      "Tu connectes ton wallet Midnight (ex. Lace — édition Midnight).",
    "howItWorks.step2":
      "Tu crées un nouveau sondage, ou tu rejoins un sondage existant en collant son adresse de contrat.",
    "howItWorks.step3":
      "Ton identité sert localement, dans ton navigateur, à produire une preuve cryptographique d'éligibilité — elle ne quitte jamais ton appareil sous sa forme brute.",
    "howItWorks.step4":
      "Cette preuve permet de voter sans jamais envoyer ton identité sur la chaîne : seul un engagement (hash) non réversible est publié.",
    "howItWorks.step5":
      "Le contrat empêche un second vote en vérifiant que cet engagement n'a pas déjà été utilisé — impossible de voter deux fois avec la même identité.",
    "howItWorks.step6":
      "Seuls les totaux publics — Oui, Non, Total — restent consultables par tout le monde, jamais le détail d'un vote individuel.",
    "howItWorks.step7":
      "Une fois le sondage fermé, plus aucun vote n'est accepté et le résultat final reste vérifiable par n'importe qui.",
    "howItWorks.networkSeesTitle": "Ce que le réseau voit",
    "howItWorks.sees1": "Que le sondage existe, et s'il est ouvert ou fermé",
    "howItWorks.sees2":
      "Les totaux agrégés : nombre de votes Oui, Non et Total",
    "howItWorks.sees3":
      "Un engagement cryptographique (hash) prouvant qu'un vote légitime a eu lieu — jamais l'identité ni le choix qui s'y rattachent",
    "howItWorks.networkDoesNotSeeTitle": "Ce que le réseau ne voit pas",
    "howItWorks.notSees1":
      "Qui a voté — aucune identité de votant n'est jamais publiée",
    "howItWorks.notSees2":
      "Ce que chaque personne a voté — seul le total agrégé est public",
    "howItWorks.caveat":
      "Le contrat protège l'identité et le choix de vote sur la chaîne, mais ne masque pas les métadonnées réseau : l'adresse IP de ta connexion ou la provenance des fonds de ton wallet ne sont pas couvertes par cette garantie.",
  },
  en: {
    "app.subtitle": "Private community voting on Midnight",
    "nav.home": "Home",
    "nav.history": "History",
    "wallet.title": "Wallet",
    "wallet.connected": "Connected",
    "wallet.disconnected": "Disconnected",
    "wallet.connect": "Connect Wallet",
    "wallet.connecting": "Connecting…",
    "wallet.disconnect": "Disconnect",
    "wallet.hint":
      "Connect your Midnight wallet (e.g. Lace — Midnight edition) to vote.",
    "wallet.copyAddress": "Copy address",
    "wallet.addressCopied": "Address copied",
    "wallet.viewOnExplorer": "View on explorer",
    "wallet.network": "Network",
    "wallet.balance": "Balance (Night)",
    "wallet.refreshBalance": "Refresh balance",
    "poll.title": "Poll",
    "poll.contractAddress": "Contract address",
    "poll.join": "Join",
    "poll.deploy": "Deploy a new poll",
    "poll.deployed": "Poll deployed successfully",
    "poll.deployedFinal": "Poll deployed successfully (finalized)",
    "poll.joined": "Poll joined — fetching results…",
    "poll.status": "Status",
    "poll.statusOpen": "Open",
    "poll.statusClosed": "Closed",
    "poll.total": "Total",
    "poll.yes": "Yes",
    "poll.no": "No",
    "poll.voteYes": "Vote Yes",
    "poll.voteNo": "Vote No",
    "poll.voteRegistered": 'Vote "{choice}" recorded',
    "poll.closePoll": "Close poll",
    "poll.closed": "Poll closed",
    "poll.copy": "Copy",
    "poll.copied": "Address copied",
    "poll.emptyHint": "Connect your wallet to deploy or join a poll.",
    "poll.deployWaiting": "Taking longer than usual — check your wallet.",
    "poll.deployStop": "Stop",
    "poll.deployTimeoutMsg":
      "Deployment is taking more than 30s — check your wallet. If the tx was submitted, the contract will appear automatically once finalized.",
    "poll.copyTxId": "Copy tx id",
    "poll.txIdCopied": "Tx id copied",
    "poll.txIdUnavailable": "Tx id unavailable",
    "poll.alreadyVoted": "You've already voted on this poll",
    "poll.alreadyVotedHint":
      "This wallet already submitted a vote for this contract. Only one vote per identity is allowed — your choice stays private, but you can’t vote again.",
    "poll.alreadyVotedToast":
      "You've already voted on this poll with this wallet — only one vote per identity is allowed.",
    "poll.deployedBadge": "Deployed by you",
    "poll.joinedBadge": "Joined",
    "history.title": "Voting history",
    "history.subtitle": "Only the polls you deployed or joined on this device.",
    "history.empty": "You haven't joined or deployed any poll yet.",
    "history.privacyNote":
      "Only aggregate results (total, yes, no) are shown — no voter identity is ever exposed, here or on-chain.",
    "history.refresh": "Refresh",
    "history.role.deployed": "Deployed",
    "history.role.joined": "Joined",
    "history.viewInPoll": "Open in Poll",
    "history.updatedAt": "Updated",
    "common.copy": "Copy",
    "common.error": "Error",
    "error.walletMissing":
      "No Midnight wallet detected. Install a compatible extension (e.g. Lace — Midnight edition) and reload the page.",
    "error.walletConnectFailed": "Wallet connection failed.",
    "error.contractNotFound":
      "No voting contract found at this address. Check the address and try again.",
    "wallet.connectShort": "Connect",
    "nav.howItWorks": "How it works",
    "howItWorks.title": "How it works",
    "howItWorks.intro":
      "PrivateVote lets any community run a verifiable vote without ever revealing who voted for what. Here's the flow, step by step.",
    "howItWorks.step1":
      "You connect your Midnight wallet (e.g. Lace — Midnight edition).",
    "howItWorks.step2":
      "You create a new poll, or join an existing one by pasting its contract address.",
    "howItWorks.step3":
      "Your identity is used locally, in your browser, to produce a cryptographic proof of eligibility — it never leaves your device in raw form.",
    "howItWorks.step4":
      "That proof lets you vote without ever sending your identity on-chain: only a non-reversible commitment (hash) is published.",
    "howItWorks.step5":
      "The contract prevents a second vote by checking that this commitment hasn't already been used — voting twice with the same identity is impossible.",
    "howItWorks.step6":
      "Only the public totals — Yes, No, Total — remain readable by anyone, never an individual vote's detail.",
    "howItWorks.step7":
      "Once the poll is closed, no further votes are accepted and the final result stays verifiable by anyone.",
    "howItWorks.networkSeesTitle": "What the network sees",
    "howItWorks.sees1":
      "That the poll exists, and whether it is open or closed",
    "howItWorks.sees2": "The aggregate totals: Yes votes, No votes, and Total",
    "howItWorks.sees3":
      "A cryptographic commitment (hash) proving a legitimate vote happened — never the identity or choice behind it",
    "howItWorks.networkDoesNotSeeTitle": "What the network does not see",
    "howItWorks.notSees1": "Who voted — no voter identity is ever published",
    "howItWorks.notSees2":
      "What each person voted — only the aggregate total is public",
    "howItWorks.caveat":
      "The contract protects your identity and vote choice on-chain, but it does not hide network-level metadata: your connection's IP address or where your wallet's funds came from are not covered by this guarantee.",
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
  if (stored === "fr" || stored === "en") return stored;
  return navigator.language?.toLowerCase().startsWith("fr") ? "fr" : "en";
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  useEffect(() => {
    document.documentElement.setAttribute("lang", lang);
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

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}
