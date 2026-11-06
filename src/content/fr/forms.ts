/**
 * Textes d'INTERFACE des formulaires et des pages de don (agent C).
 *
 * Règle : uniquement des libellés neutres et des explications sur le
 * fonctionnement du site. Aucun chiffre, engagement de délai, témoignage ni
 * texte de l'ONG inventé : les coordonnées, instructions de don et montants
 * viennent de l'administration (getSiteSettings()).
 */

export const FORM_TEXT = {
  common: {
    requiredNote: "Les champs marqués d'un astérisque (*) sont obligatoires.",
    optional: "facultatif",
    send: "Envoyer",
    sending: "Envoi en cours…",
    consentLead: "J'accepte qu'INA-AFRICA utilise ces informations uniquement pour traiter ma demande (voir la ",
    consentLink: "politique de confidentialité",
    consentEnd: ").",
    fixErrors: (count: number) =>
      count <= 1
        ? "Le formulaire contient une erreur : corrigez le champ indiqué."
        : `Le formulaire contient ${count} erreurs : corrigez les champs indiqués.`,
    errorTitle: "Envoi impossible",
    successTitle: "Merci, c'est bien enregistré",
    anotherRequest: "Envoyer une autre demande",
    honeypotLabel: "Ne remplissez pas ce champ",
    turnstileLabel: "Vérification anti-robot",
    turnstileNeedsJs:
      "La vérification anti-robot nécessite JavaScript. Activez-le, ou contactez-nous directement.",
  },

  /** Messages renvoyés par les actions serveur (jamais de détail technique). */
  errors: {
    unavailableTitle: "Ce formulaire n'est pas encore disponible",
    unavailable:
      "Le site est en cours de mise en service : rien n'a été envoyé ni enregistré.",
    unavailableContact: "En attendant, vous pouvez joindre INA-AFRICA directement :",
    unavailableLater: "Revenez bientôt : le formulaire sera activé dès la mise en service du site.",
    rejected:
      "Votre envoi n'a pas pu être accepté. Si le problème persiste, contactez-nous directement.",
    tooFast: "Envoi trop rapide : patientez quelques secondes, puis cliquez à nouveau sur le bouton.",
    refreshed:
      "Pour votre sécurité, le formulaire vient d'être actualisé. Vérifiez vos informations, puis envoyez-le à nouveau.",
    turnstile: "La vérification anti-robot n'a pas abouti. Recommencez-la, puis envoyez à nouveau le formulaire.",
    rateLimited:
      "Plusieurs envois ont déjà été faits depuis cette connexion. Réessayez dans une heure, ou contactez-nous directement.",
    generic: "Une erreur est survenue : rien n'a été enregistré. Réessayez dans un instant.",
  },

  contactAlternatives: {
    email: "Email",
    phone: "Téléphone",
    whatsapp: "WhatsApp",
  },

  fields: {
    fullName: "Nom et prénom",
    email: "Adresse email",
    phone: "Téléphone",
    phoneHint: "Avec l'indicatif du pays si vous êtes hors du Bénin.",
    subject: "Sujet",
    message: "Votre message",
    profession: "Profession ou études",
    city: "Ville de résidence",
    organization: "Organisation",
    organizationHint: "Entreprise, institution, association, fondation…",
  },

  contact: {
    metaTitle: "Contact",
    metaDescription: "Écrire à l'ONG INA-AFRICA : une question, une proposition, une demande d'information.",
    eyebrow: "Contact",
    title: "Écrivez-nous",
    intro: "Une question, une idée, une demande d'information ? Remplissez ce formulaire, il sera lu par l'équipe d'INA-AFRICA.",
    formTitle: "Votre message",
    success: "Votre message a bien été enregistré. Il sera lu par l'équipe d'INA-AFRICA.",
    detailsTitle: "Nos coordonnées",
    detailsEmpty: "Les coordonnées de l'ONG seront publiées ici prochainement.",
    whatsappAction: "Écrire sur WhatsApp",
    joinTitle: "Vous souhaitez vous engager ?",
    joinText: "Bénévolat, adhésion, partenariat : utilisez le formulaire dédié, plus rapide à traiter.",
    joinAction: "Nous rejoindre",
  },

  join: {
    metaTitle: "Nous rejoindre",
    metaDescription:
      "Devenir bénévole, membre ou partenaire de l'ONG INA-AFRICA : choisissez votre façon de vous engager.",
    eyebrow: "Nous rejoindre",
    title: "Agir avec INA-AFRICA",
    intro: "Bénévole, membre ou partenaire : choisissez la façon de vous engager qui vous ressemble.",
    pathsTitle: "Trois façons de s'engager",
    volunteer: {
      title: "Devenir bénévole",
      text: "Donnez de votre temps et partagez vos compétences lors des actions de l'ONG.",
      action: "Je deviens bénévole",
    },
    member: {
      title: "Devenir membre",
      text: "Rejoignez l'ONG et prenez part à sa vie et à ses projets.",
      action: "Je deviens membre",
    },
    partner: {
      title: "Devenir partenaire",
      text: "Entreprises, institutions, associations : proposez un partenariat ou un sponsoring.",
      action: "Proposer un partenariat",
    },
    formLength: "Formulaire court",
    donateTitle: "Vous préférez soutenir financièrement ?",
    donateText: "Un don, même modeste, aide l'ONG à mener ses actions.",
    donateAction: "Faire un don",
    contactAction: "Une question ? Écrivez-nous",
    stepsTitle: "Comment ça se passe ?",
    steps: [
      "Vous remplissez ce formulaire.",
      "Votre demande est enregistrée et lue par l'équipe d'INA-AFRICA.",
      "L'équipe prend contact avec vous par email ou par téléphone.",
    ],
    privacyNote: "Vos informations servent uniquement à traiter votre demande.",
    breadcrumb: "Nous rejoindre",
    otherPathsTitle: "Autres façons de s'engager",
  },

  volunteer: {
    metaTitle: "Devenir bénévole",
    metaDescription: "Proposer votre aide comme bénévole à l'ONG INA-AFRICA.",
    title: "Devenir bénévole",
    intro: "Vous souhaitez donner de votre temps et partager vos compétences aux côtés d'INA-AFRICA ? Présentez-vous en quelques lignes.",
    formTitle: "Votre candidature de bénévole",
    phoneLabel: "Téléphone (WhatsApp si possible)",
    skills: "Vos compétences",
    skillsHint: "Ce que vous savez faire ou aimeriez apporter : animation, communication, informatique, logistique…",
    motivation: "Votre motivation",
    motivationHint: "Quelques phrases suffisent.",
    success: "Votre candidature de bénévole a bien été enregistrée. Elle sera lue par l'équipe d'INA-AFRICA.",
  },

  member: {
    metaTitle: "Devenir membre",
    metaDescription: "Demander à devenir membre de l'ONG INA-AFRICA.",
    title: "Devenir membre",
    intro:
      "Rejoignez INA-AFRICA en tant que membre et prenez part à la vie de l'ONG et à ses initiatives en faveur des femmes, des jeunes, des enfants vulnérables et des personnes en situation de handicap.",
    conditionsNote: "Chaque demande est étudiée par l'organisation, qui vous présentera les conditions d'adhésion.",
    formTitle: "Votre demande d'adhésion",
    motivation: "Pourquoi souhaitez-vous devenir membre ?",
    success: "Votre demande d'adhésion a bien été enregistrée. Elle sera lue par l'équipe d'INA-AFRICA.",
  },

  partner: {
    metaTitle: "Devenir partenaire",
    metaDescription: "Proposer un partenariat ou un sponsoring à l'ONG INA-AFRICA.",
    title: "Devenir partenaire",
    intro: "Entreprise, institution, association ou fondation : proposez un partenariat ou un sponsoring au service des actions d'INA-AFRICA.",
    formTitle: "Votre proposition",
    fullName: "Votre nom et prénom",
    kindLegend: "Type de collaboration",
    kinds: {
      partnership: { label: "Partenariat", hint: "Collaborer sur un projet ou une action." },
      sponsorship: { label: "Sponsoring", hint: "Soutenir une action, financièrement ou en nature." },
    },
    message: "Votre proposition",
    messageHint: "Présentez votre organisation et l'idée de collaboration.",
    success: "Votre proposition a bien été enregistrée. Elle sera lue par l'équipe d'INA-AFRICA.",
  },

  newsletter: {
    footerTitle: "Restez informé",
    footerText: "Recevez les nouvelles d'INA-AFRICA par email.",
    emailLabel: "Votre adresse email",
    consent: "J'accepte de recevoir la lettre d'information d'INA-AFRICA. Désinscription possible à tout moment.",
    submit: "S'inscrire",
    submitting: "Inscription…",
    doubleOptIn: "Un email de confirmation vous sera envoyé : l'inscription n'est validée qu'après un clic sur son lien.",
    success:
      "Merci ! Si cette adresse n'est pas déjà inscrite, vous allez recevoir un email de confirmation : cliquez sur son lien pour valider l'inscription (pensez à regarder dans les courriers indésirables).",
    sendFailed: "L'email de confirmation n'a pas pu être envoyé. Réessayez dans quelques minutes.",
    noJs: "Votre navigateur n'a pas envoyé le formulaire complet. Inscrivez-vous depuis la page Lettre d'information.",
    noJsLink: "Aller à la page Lettre d'information",
    pageMetaTitle: "Lettre d'information",
    pageMetaDescription: "S'inscrire à la lettre d'information de l'ONG INA-AFRICA.",
    pageTitle: "Lettre d'information",
    pageIntro:
      "Recevez par email les nouvelles d'INA-AFRICA. Votre adresse ne sert qu'à cela, et vous pouvez vous désinscrire à tout moment.",
    pageUnavailableTitle: "La lettre d'information n'est pas encore disponible",
    pageUnavailableText: "L'envoi d'emails n'est pas encore activé sur ce site. Revenez bientôt.",

    confirmMetaTitle: "Confirmer votre inscription",
    confirmTitle: "Confirmer votre inscription",
    confirmIntro: "Cliquez sur le bouton ci-dessous pour confirmer votre inscription à la lettre d'information d'INA-AFRICA.",
    confirmAction: "Confirmer mon inscription",
    confirmPending: "Confirmation…",
    confirmSuccess: "Votre inscription est confirmée. Merci, et à bientôt dans votre boîte mail !",
    confirmInvalid: "Ce lien de confirmation n'est pas valide ou a déjà été utilisé.",
    confirmExpired: "Ce lien de confirmation a expiré : inscrivez-vous à nouveau pour en recevoir un nouveau.",

    unsubscribeMetaTitle: "Se désinscrire",
    unsubscribeTitle: "Se désinscrire de la lettre d'information",
    unsubscribeIntro: "Cliquez sur le bouton ci-dessous pour ne plus recevoir la lettre d'information d'INA-AFRICA.",
    unsubscribeAction: "Me désinscrire",
    unsubscribePending: "Désinscription…",
    unsubscribeSuccess: "Votre désinscription est enregistrée : vous ne recevrez plus la lettre d'information.",
    unsubscribeInvalid: "Ce lien de désinscription n'est pas valide.",

    linkSafety: "Pour votre sécurité, rien n'est fait tant que vous n'avez pas cliqué sur le bouton.",
    linkMissing: "Ce lien est incomplet. Ouvrez le lien reçu par email en entier, ou copiez-le dans la barre d'adresse.",
    backHome: "Retour à l'accueil",
  },

  emails: {
    requestTypes: {
      contact: "Message de contact",
      volunteer: "Candidature de bénévole",
      membership: "Demande d'adhésion",
      sponsorship: "Proposition de partenariat",
    },
    newsletterSubject: "Confirmez votre inscription à la lettre d'information d'INA-AFRICA",
  },
} as const;

export const DONATE_TEXT = {
  metaTitle: "Faire un don",
  metaDescription:
    "Soutenir l'ONG INA-AFRICA par un don : Mobile Money, virement bancaire et appels aux dons en cours.",
  eyebrow: "Faire un don",
  title: "Soutenir INA-AFRICA",
  intro: "Votre don aide l'ONG à mener ses actions auprès des communautés.",

  online: {
    title: "Don en ligne",
    soonTitle: "Le paiement en ligne arrive bientôt",
    soonText: "Le paiement en ligne n'est pas encore disponible sur ce site.",
    soonWithOffline: "En attendant, vous pouvez donner par Mobile Money ou par virement grâce aux coordonnées ci-dessous.",
    soonWithoutOffline: "En attendant, contactez INA-AFRICA pour faire un don.",
    formTitle: "Faire un don en ligne",
    amountLegend: "Montant du don",
    otherAmount: "Autre montant",
    customAmount: "Autre montant, en francs CFA",
    customAmountHint: (min: string) => `Nombre entier, ${min} minimum. Choisissez « Autre montant » ci-dessus.`,
    campaignNote: (title: string) => `Votre don soutient l'appel « ${title} ».`,
    donorTitle: "Vos coordonnées",
    donorName: "Nom et prénom",
    reachHint: "Indiquez au moins un email ou un numéro de téléphone (pour le reçu et le suivi du paiement).",
    anonymous: "Rester anonyme (votre nom ne sera jamais affiché publiquement)",
    message: "Un message pour l'équipe",
    consent: "J'accepte qu'INA-AFRICA utilise ces informations pour traiter mon don (voir la ",
    submit: "Continuer vers le paiement",
    submitting: "Redirection vers le paiement…",
    providerNote: (provider: string) => `Le paiement est réalisé sur la page sécurisée de ${provider}.`,
    unavailable: "Le paiement en ligne n'est pas disponible pour le moment : aucun don n'a été créé.",
    providerFailed: "Le prestataire de paiement n'a pas répondu : aucun montant n'a été débité. Réessayez dans un instant.",
    rateLimited: "Plusieurs tentatives de don ont déjà été faites depuis cette connexion. Réessayez dans une heure.",
    campaignInactive: "Cet appel aux dons n'est plus actif.",
  },

  offline: {
    title: "Donner par Mobile Money ou virement",
    intro: "Utilisez les coordonnées ci-dessous, indiquées par l'administration de l'ONG.",
    methods: { mobile_money: "Mobile Money", bank_transfer: "Virement bancaire" },
    holder: "Titulaire",
    number: "Numéro",
    copy: "Copier le numéro",
    copied: "Numéro copié",
    copiedAnnounce: "Numéro copié dans le presse-papiers",
    copyFailed: "Impossible de copier le numéro",
    afterTitle: "Après votre don",
    afterText:
      "Vous pouvez nous écrire en indiquant la date, le montant et la référence de l'opération : cela nous aide à enregistrer votre don.",
    afterAction: "Nous écrire",
    emptyTitle: "Coordonnées bientôt publiées",
    emptyText: "Les coordonnées pour donner par Mobile Money ou par virement seront publiées ici prochainement.",
    emptyContact: "Pour faire un don dès maintenant, contactez l'ONG :",
    emptyAction: "Contacter l'ONG",
  },

  amounts: {
    title: "Quelques repères",
    text: "Montants suggérés par l'ONG. Tout don compte, quel que soit son montant.",
  },

  campaigns: {
    title: "Nos appels aux dons",
    intro: "Soutenez une action précise et partagez son lien autour de vous.",
    action: "Voir l'appel aux dons",
  },

  otherWays: {
    title: "D'autres façons d'agir",
    volunteer: "Devenir bénévole",
    member: "Devenir membre",
    partner: "Devenir partenaire",
  },

  campaign: {
    eyebrow: "Appel aux dons",
    breadcrumb: "Faire un don",
    from: "Depuis le",
    until: "Jusqu'au",
    between: (start: string, end: string) => `Du ${start} au ${end}`,
    supportTitle: "Soutenir cet appel",
    shareTitle: "Partager cet appel",
    shareText: "Le lien de cette page est fait pour être partagé : il affiche un aperçu sur WhatsApp et Facebook.",
    shareLabel: "Partager",
    contentTitle: "Présentation",
    notFound: "Appel aux dons introuvable",
  },

  progress: {
    title: "Où en est la collecte",
    collected: "collectés",
    goal: (goal: string) => `sur un objectif de ${goal}`,
    percent: (value: number) => `${value} % de l'objectif`,
    count: (count: number) => (count <= 1 ? `${count} don enregistré` : `${count} dons enregistrés`),
    split: (online: string, offline: string) => `Dont ${online} en ligne et ${offline} par Mobile Money ou virement.`,
    note: "Dons en ligne confirmés par le prestataire et dons hors ligne enregistrés par l'ONG.",
    barLabel: "Avancement de la collecte",
  },

  tracking: {
    metaTitle: "Suivi de votre don",
    title: "Suivi de votre don",
    pendingTitle: "Paiement en cours de vérification",
    pendingText:
      "Nous vérifions votre paiement auprès du prestataire. Cette page se met à jour toute seule ; vous pouvez aussi l'actualiser dans quelques instants.",
    refresh: "Actualiser la page",
    succeededTitle: "Merci pour votre don !",
    succeededText: (amount: string, campaign: string | null) =>
      campaign ? `Votre don de ${amount} pour « ${campaign} » a bien été reçu.` : `Votre don de ${amount} a bien été reçu.`,
    failedTitle: "Le paiement n'a pas abouti",
    failedText: "Le prestataire n'a pas confirmé ce paiement. Vous pouvez faire une nouvelle tentative.",
    cancelledTitle: "Le paiement a été annulé",
    cancelledText: "Ce paiement a été annulé avant d'être confirmé. Vous pouvez faire une nouvelle tentative.",
    refundedTitle: "Ce paiement a été remboursé",
    refundedText: "Le montant de ce don vous a été remboursé.",
    notFoundTitle: "Paiement introuvable",
    notFoundText:
      "Nous ne trouvons aucun paiement correspondant à ce lien. Si un montant a été débité, contactez-nous en indiquant la date et le montant de votre don.",
    unavailableTitle: "Suivi indisponible",
    unavailableText: "Le suivi des paiements en ligne n'est pas encore disponible sur ce site.",
    amountLabel: "Montant",
    campaignLabel: "Appel aux dons",
    retry: "Faire un don",
    contact: "Nous contacter",
  },
} as const;
