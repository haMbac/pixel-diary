import type { Locale } from "@/lib/locale";

export type { Locale };

// Vsetky texty appky, rozdelene do "namespace"-ov podla oblasti appky (napr.
// "sheet" pre stranku jedneho sheetu). Kazdy namespace ma vlastne rozhranie
// nizsie - hodnota je bud obycajny string, alebo funkcia pre parametrizovane
// texty (napr. "Krok {n} z {m}" sa zavola ako t.sheet.stepLabel(n, m)).
// Pridanie/premenovanie kluca bez upravy oboch (sk aj en) objektov nahlasi
// TypeScript chybu vdaka Record<Locale, DictionaryShape>.

interface HomeDict {
  loggedInAs: (userName: string) => string;
  accountLink: string;
  logoutButton: string;
  sheetsHeading: string;
  objectsHeading: string;
}

interface DailyEntryDict {
  openButton: string;
  noValuesTitle: string;
  alreadyDoneTitle: string;
  fillTitle: string;
  summaryLabel: string;
  stepLabel: (currentStep: number, totalSteps: number) => string;
  closeLabel: string;
  backButton: string;
  cancelSelectionButton: string;
  nextButton: string;
  skipButton: string;
  alreadyDoneHeading: string;
  summaryHeading: string;
  changeHint: string;
  skippedLabel: string;
  savingLabel: string;
  doneButton: string;
}

interface SheetsBrowseDict {
  prevArrowLabel: string;
  nextArrowLabel: string;
  newSheetTileLabel: string;
  newSheetModalTitle: string;
  closeButtonLabel: string;
  nameFieldLabel: string;
  nameFieldPlaceholder: string;
  yearFieldLabel: string;
  yearFieldPlaceholder: string;
  creatingButtonLabel: string;
  createButtonLabel: string;
  deleteConfirmMessage: (sheetName: string) => string;
  deleteButtonTitle: string;
  deleteButtonAriaLabel: (sheetName: string) => string;
}

interface ObjectsBrowseDict {
  prevCategoriesLabel: string;
  nextCategoriesLabel: string;
  newCategoryLabel: string;
  closeLabel: string;
  nameLabel: string;
  namePlaceholder: string;
  createButton: string;
  creatingButton: string;
  deleteCategoryConfirm: (name: string) => string;
  deleteCategoryButtonTitle: string;
  deleteCategoryAriaLabel: (name: string) => string;
}

interface SheetDict {
  nameRequiredError: string;
  sheetNameExistsError: (name: string) => string;
  colorRequiredError: string;
  valueNameExistsError: (name: string) => string;
  colorTooSimilarError: string;
  valuesHeading: string;
  reorderValuesHint: string;
  valueLimitReached: (max: number) => string;
  eraserSelectTitle: string;
  eraserLabel: string;
  paletteLabel: string;
  addValueTitle: string;
  viewSwitcherLabel: string;
  viewAuto: string;
  viewColumns: string;
  viewRows: string;
  viewCalendar: string;
  weekdayMon: string;
  weekdayTue: string;
  weekdayWed: string;
  weekdayThu: string;
  weekdayFri: string;
  weekdaySat: string;
  weekdaySun: string;
  monthJan: string;
  monthFeb: string;
  monthMar: string;
  monthApr: string;
  monthMay: string;
  monthJun: string;
  monthJul: string;
  monthAug: string;
  monthSep: string;
  monthOct: string;
  monthNov: string;
  monthDec: string;
  cellTitle: (day: number, month: string) => string;
  savingButton: string;
  saveNameButton: string;
  deleteSheetConfirm: (name: string) => string;
  deletingButton: string;
  deleteSheetButton: string;
  changeColorTitle: string;
  selectValueTitle: (name: string) => string;
  deleteTitle: string;
  valueInUseConfirm: (name: string) => string;
  noReplacementOption: string;
  replaceWithOption: (name: string) => string;
  cancelButton: string;
  confirmDeleteButton: string;
  namePlaceholder: string;
  addingButton: string;
  addButton: string;
  backToHomeTitle: string;
  endEditTitle: string;
  editButtonTitle: string;
  prevSheetAriaLabel: string;
  prevSheetTitle: (name: string) => string;
  nextSheetAriaLabel: string;
  nextSheetTitle: (name: string) => string;
  pdfExportTitle: string;
  pdfButtonLabel: string;
  sheetsMenuTitle: string;
  sheetsMenuHeading: string;
  editMenuButtonTitle: string;
  closeAriaLabel: string;
}

interface ObjectDict {
  nameRequiredError: string;
  categoryNameExistsError: (name: string) => string;
  attributeTypeInvalidError: string;
  categoryNotFoundError: string;
  attributeNameExistsError: (name: string) => string;
  attributeInvalidError: string;
  attributeNotFoundError: string;
  objectNameExistsError: (name: string) => string;
  objectInvalidError: string;
  attributeTypeText: string;
  attributeTypeNumber: string;
  attributeTypeRatingOf: (scale: number) => string;
  attributesHeading: string;
  noAttributesMessage: string;
  objectsHeading: string;
  changeCategoryIconLabel: string;
  defaultIconHint: string;
  savingEllipsis: string;
  saveButton: string;
  saveNameButton: string;
  deleteCategoryConfirm: (name: string) => string;
  deletingEllipsis: string;
  deleteCategoryButton: string;
  attributeTypeTextOption: string;
  attributeTypeNumberOption: string;
  attributeTypeRatingOption: string;
  ratingScaleOf5Option: string;
  ratingScaleOf10Option: string;
  ratingDisplayStarsOption: string;
  ratingDisplayNumberOption: string;
  featuredCheckboxLabel: string;
  savingBrief: string;
  cancelButton: string;
  featuredOnTileTooltip: string;
  featuredIndicatorText: string;
  editButtonTitle: string;
  deleteButtonTitle: string;
  sortByLabel: string;
  sortByCreatedOption: string;
  sortByNameOption: string;
  sortAscendingTitle: string;
  sortDescendingTitle: string;
  noObjectsMessage: string;
  addAttributeFirstMessage: string;
  newObjectButton: string;
  newObjectHeading: string;
  closeButtonTitle: string;
  createObjectButton: string;
  creatingEllipsis: string;
  attributeNamePlaceholder: string;
  addingEllipsis: string;
  addButton: string;
  showOnTileCheckboxLabel: string;
  changeObjectIconLabel: string;
  ownIconLabel: string;
  inheritedCategoryIconLabel: string;
  nameLabel: string;
  starRatingLabel: (n: number, scale: number) => string;
  backToHomeTitle: string;
  exitEditModeTitle: string;
  previousCategoryTitle: string;
  previousCategoryWithNameTitle: (name: string) => string;
  nextCategoryTitle: string;
  nextCategoryWithNameTitle: (name: string) => string;
  categoriesMenuTitle: string;
  categoriesHeading: string;
  reorderDeleteModeTitle: string;
}

interface IconPickerDict {
  changeIconLabel: string;
  heicLoadError: string;
  cropFailedError: string;
  uploadFailedError: string;
  modalTitle: string;
  closeButton: string;
  defaultTab: string;
  customPhotoTab: string;
  zoomLabel: string;
  uploadingButton: string;
  useButton: string;
  useCategoryIconButton: string;
}

interface AuthDict {
  appTitle: string;
  loginHeading: string;
  signupHeading: string;
  noAccountText: string;
  signupLink: string;
  haveAccountText: string;
  loginLink: string;
  emailPlaceholder: string;
  namePlaceholder: string;
  sendingButton: string;
  loginButton: string;
  signupButton: string;
  codeSentInfo: (email: string) => string;
  verifyingButton: string;
  verifyButton: string;
  backButton: string;
  resendButton: string;
  resendCooldown: (seconds: number) => string;
  enterEmailError: string;
  accountNotFoundError: string;
  emailSendFailedError: string;
  enterNameError: string;
  accountExistsError: string;
  enterCodeError: string;
  rememberMeLabel: string;
  guestDefaultName: string;
  continueAsGuestButton: string;
  orDivider: string;
}

interface AccountDict {
  backToHome: string;
  heading: string;
  nameHeading: string;
  savingButton: string;
  saveButton: string;
  emailHeading: string;
  changeEmailButton: string;
  newEmailPlaceholder: string;
  sendingButton: string;
  sendCodeButton: string;
  cancelButton: string;
  codeSentPrefix: string;
  codeSentSuffix: string;
  codePlaceholder: string;
  verifyingButton: string;
  verifyButton: string;
  resendButton: string;
  resendButtonCooldown: (seconds: number) => string;
  deleteAccountHeading: string;
  deleteConfirmMessage: string;
  deletingButton: string;
  deleteAccountButton: string;
  nameRequiredError: string;
  emailRequiredError: string;
  emailTakenError: string;
  codeRequiredError: string;
  noEmailSetMessage: string;
  addEmailHint: string;
  addEmailButton: string;
}

interface PdfExportDict {
  pageTitle: string;
  backToSheet: string;
  layoutLabel: string;
  contentLabel: string;
  contentFilled: string;
  contentEmpty: string;
  includeLabel: string;
  legendToggle: string;
  weekendsToggle: string;
  notesToggle: string;
  paperPortrait: string;
  paperLandscape: string;
  saveButton: string;
  savingButton: string;
  saveFailedError: string;
  legendHeading: string;
  notesHeading: string;
  blocksHint: string;
  resetLayoutButton: string;
}

interface DictionaryShape {
  home: HomeDict;
  dailyEntry: DailyEntryDict;
  sheetsBrowse: SheetsBrowseDict;
  objectsBrowse: ObjectsBrowseDict;
  sheet: SheetDict;
  object: ObjectDict;
  iconPicker: IconPickerDict;
  auth: AuthDict;
  account: AccountDict;
  pdfExport: PdfExportDict;
}

export const dictionary: Record<Locale, DictionaryShape> = {
  sk: {
  home: {
    loggedInAs: (userName) => `Prihlásená ako ${userName}`,
    accountLink: "Účet",
    logoutButton: "Odhlásiť sa",
    sheetsHeading: "Sheets",
    objectsHeading: "Objekty",
  },
  dailyEntry: {
    openButton: "Dnes",
    noValuesTitle: "Zatiaľ nemáš sheet s hodnotami na vyplnenie.",
    alreadyDoneTitle: "Dnešný záznam je už vyplnený - klikni pre zobrazenie/zmenu",
    fillTitle: "Vyplniť dnešný záznam",
    summaryLabel: "Zhrnutie",
    stepLabel: (currentStep, totalSteps) => `Krok ${currentStep} z ${totalSteps}`,
    closeLabel: "Zavrieť",
    backButton: "← Späť",
    cancelSelectionButton: "Zrušiť výber",
    nextButton: "Ďalej →",
    skipButton: "Preskočiť →",
    alreadyDoneHeading: "Dnešný záznam je už vyplnený",
    summaryHeading: "Dnešný záznam",
    changeHint: "Klikni na položku, ak chceš niečo zmeniť.",
    skippedLabel: "Preskočené",
    savingLabel: "Ukladám…",
    doneButton: "Hotovo",
  },
  sheetsBrowse: {
    prevArrowLabel: "Predchádzajúce sheety",
    nextArrowLabel: "Ďalšie sheety",
    newSheetTileLabel: "Nový sheet",
    newSheetModalTitle: "Nový sheet",
    closeButtonLabel: "Zavrieť",
    nameFieldLabel: "Názov",
    nameFieldPlaceholder: "napr. Nálady 2027",
    yearFieldLabel: "Rok (nepovinné)",
    yearFieldPlaceholder: "napr. 2027",
    creatingButtonLabel: "Vytváram…",
    createButtonLabel: "Create",
    deleteConfirmMessage: (sheetName) => `Naozaj vymazať sheet „${sheetName}"?`,
    deleteButtonTitle: "Vymazať sheet",
    deleteButtonAriaLabel: (sheetName) => `Vymazať sheet ${sheetName}`,
  },
  objectsBrowse: {
    prevCategoriesLabel: "Predchádzajúce kategórie",
    nextCategoriesLabel: "Ďalšie kategórie",
    newCategoryLabel: "Nová kategória",
    closeLabel: "Zavrieť",
    nameLabel: "Názov",
    namePlaceholder: "napr. Knihy",
    createButton: "Create",
    creatingButton: "Vytváram…",
    deleteCategoryConfirm: (name) => `Naozaj vymazať kategóriu „${name}"? Vymažú sa aj všetky jej objekty.`,
    deleteCategoryButtonTitle: "Vymazať kategóriu",
    deleteCategoryAriaLabel: (name) => `Vymazať kategóriu ${name}`,
  },
  sheet: {
    nameRequiredError: "Zadaj názov.",
    sheetNameExistsError: (name) => `Sheet s názvom „${name}" už existuje.`,
    colorRequiredError: "Vyber farbu.",
    valueNameExistsError: (name) => `Hodnota s názvom „${name}" už existuje.`,
    colorTooSimilarError: "Táto farba je príliš podobná už použitej farbe v tomto sheete.",
    valuesHeading: "Hodnoty",
    reorderValuesHint: "Poradie zmeníš potiahnutím farby v palete hore.",
    valueLimitReached: (max) => `Sheet môže mať najviac ${max} hodnôt - viac farieb by sa v mriežke už ťažko rozlišovalo.`,
    eraserSelectTitle: "Vybrať gumu",
    eraserLabel: "Guma",
    paletteLabel: "Farba na maľovanie",
    addValueTitle: "Pridať hodnotu",
    viewSwitcherLabel: "Zobrazenie",
    viewAuto: "Automaticky (podľa orientácie obrazovky)",
    viewColumns: "Mesiace v stĺpcoch",
    viewRows: "Mesiace v riadkoch",
    viewCalendar: "Kalendár",
    weekdayMon: "Po",
    weekdayTue: "Ut",
    weekdayWed: "St",
    weekdayThu: "Št",
    weekdayFri: "Pi",
    weekdaySat: "So",
    weekdaySun: "Ne",
    monthJan: "Jan",
    monthFeb: "Feb",
    monthMar: "Mar",
    monthApr: "Apr",
    monthMay: "Máj",
    monthJun: "Jún",
    monthJul: "Júl",
    monthAug: "Aug",
    monthSep: "Sep",
    monthOct: "Okt",
    monthNov: "Nov",
    monthDec: "Dec",
    cellTitle: (day, month) => `${day}. ${month} – dvojklikom vymažeš`,
    savingButton: "Ukladám…",
    saveNameButton: "Uložiť názov",
    deleteSheetConfirm: (name) => `Naozaj vymazať sheet „${name}"? Vymažú sa aj všetky jeho hodnoty.`,
    deletingButton: "Mažem…",
    deleteSheetButton: "Vymazať sheet",
    changeColorTitle: "Zmeniť farbu",
    selectValueTitle: (name) => `Vybrať „${name}" ako aktívnu farbu`,
    deleteTitle: "Zmazať",
    valueInUseConfirm: (name) => `Hodnota „${name}" sa používa v mriežke. Nahradiť ju inou hodnotou, alebo vymazať bez náhrady (políčka sa vyprázdnia)?`,
    noReplacementOption: "Bez náhrady (vymazať)",
    replaceWithOption: (name) => `Nahradiť „${name}"`,
    cancelButton: "Zrušiť",
    confirmDeleteButton: "Vymazať",
    namePlaceholder: "Názov (napr. Cvičenie)",
    addingButton: "Pridávam…",
    addButton: "Pridať",
    backToHomeTitle: "Späť na hlavnú stránku",
    endEditTitle: "Ukončiť úpravu",
    editButtonTitle: "Upraviť",
    prevSheetAriaLabel: "Predchádzajúci sheet",
    prevSheetTitle: (name) => `Predchádzajúci sheet: ${name}`,
    nextSheetAriaLabel: "Nasledujúci sheet",
    nextSheetTitle: (name) => `Nasledujúci sheet: ${name}`,
    pdfExportTitle: "Export do PDF",
    pdfButtonLabel: "PDF",
    sheetsMenuTitle: "Menu sheetov",
    sheetsMenuHeading: "Sheets",
    editMenuButtonTitle: "Upraviť poradie/vymazať",
    closeAriaLabel: "Zavrieť",
  },
  object: {
    nameRequiredError: "Zadaj názov.",
    categoryNameExistsError: (name) => `Kategória s názvom „${name}" už existuje.`,
    attributeTypeInvalidError: "Neplatný typ atribútu.",
    categoryNotFoundError: "Kategória už neexistuje.",
    attributeNameExistsError: (name) => `Atribút s názvom „${name}" už existuje.`,
    attributeInvalidError: "Neplatný atribút.",
    attributeNotFoundError: "Atribút už neexistuje.",
    objectNameExistsError: (name) => `Objekt s názvom „${name}" už existuje.`,
    objectInvalidError: "Neplatný objekt.",
    attributeTypeText: "text",
    attributeTypeNumber: "číslo",
    attributeTypeRatingOf: (scale) => `hodnotenie z ${scale}`,
    attributesHeading: "Atribúty",
    noAttributesMessage: "Zatiaľ žiadne atribúty.",
    objectsHeading: "Objekty",
    changeCategoryIconLabel: "Zmeniť ikonu kategórie",
    defaultIconHint: "Predvolená ikona (dlaždica ukazuje najnovší pridaný objekt, ak má vlastnú fotku)",
    savingEllipsis: "Ukladám…",
    saveButton: "Uložiť",
    saveNameButton: "Uložiť názov",
    deleteCategoryConfirm: (name) => `Naozaj vymazať kategóriu „${name}"? Vymažú sa aj všetky jej objekty.`,
    deletingEllipsis: "Mažem…",
    deleteCategoryButton: "Vymazať kategóriu",
    attributeTypeTextOption: "Text",
    attributeTypeNumberOption: "Číslo",
    attributeTypeRatingOption: "Hodnotenie",
    ratingScaleOf5Option: "z 5",
    ratingScaleOf10Option: "z 10",
    ratingDisplayStarsOption: "Hviezdy",
    ratingDisplayNumberOption: "Číslo",
    featuredCheckboxLabel: "Na dlaždici",
    savingBrief: "…",
    cancelButton: "Zrušiť",
    featuredOnTileTooltip: "Zobrazuje sa na dlaždici objektu",
    featuredIndicatorText: "· na dlaždici",
    editButtonTitle: "Upraviť",
    deleteButtonTitle: "Zmazať",
    sortByLabel: "Zoradiť podľa",
    sortByCreatedOption: "vytvorenia",
    sortByNameOption: "mena",
    sortAscendingTitle: "Vzostupne",
    sortDescendingTitle: "Zostupne",
    noObjectsMessage: "Zatiaľ žiadne objekty.",
    addAttributeFirstMessage: "Najprv pridaj aspoň jeden atribút v Atribútoch.",
    newObjectButton: "+ Nový objekt",
    newObjectHeading: "Nový objekt",
    closeButtonTitle: "Zavrieť",
    createObjectButton: "Create",
    creatingEllipsis: "Vytváram…",
    attributeNamePlaceholder: "Názov atribútu (napr. Autor)",
    addingEllipsis: "Pridávam…",
    addButton: "Pridať",
    showOnTileCheckboxLabel: "Zobraziť na dlaždici objektu",
    changeObjectIconLabel: "Zmeniť ikonu objektu",
    ownIconLabel: "Vlastná ikona/fotka",
    inheritedCategoryIconLabel: "Ikona kategórie (predvolená)",
    nameLabel: "Názov",
    starRatingLabel: (n, scale) => `${n} z ${scale}`,
    backToHomeTitle: "Späť na hlavnú stránku",
    exitEditModeTitle: "Ukončiť úpravu",
    previousCategoryTitle: "Predchádzajúca kategória",
    previousCategoryWithNameTitle: (name) => `Predchádzajúca kategória: ${name}`,
    nextCategoryTitle: "Nasledujúca kategória",
    nextCategoryWithNameTitle: (name) => `Nasledujúca kategória: ${name}`,
    categoriesMenuTitle: "Menu kategórií",
    categoriesHeading: "Kategórie",
    reorderDeleteModeTitle: "Upraviť poradie/vymazať",
  },
  iconPicker: {
    changeIconLabel: "Zmeniť ikonu",
    heicLoadError: "Túto fotku sa nepodarilo načítať (možno formát HEIC). Skús inú fotku alebo screenshot.",
    cropFailedError: "Orezanie zlyhalo, skús to znova.",
    uploadFailedError: "Nahrávanie zlyhalo.",
    modalTitle: "Ikona",
    closeButton: "Zavrieť",
    defaultTab: "Predvolené",
    customPhotoTab: "Vlastná fotka",
    zoomLabel: "Priblíženie",
    uploadingButton: "Nahrávam…",
    useButton: "Použiť",
    useCategoryIconButton: "Použiť ikonu kategórie",
  },
  auth: {
    appTitle: "Pixel diár",
    loginHeading: "Prihlásenie",
    signupHeading: "Registrácia",
    noAccountText: "Nemáš účet?",
    signupLink: "Zaregistruj sa",
    haveAccountText: "Už máš účet?",
    loginLink: "Prihlás sa",
    emailPlaceholder: "tvoj@email.sk",
    namePlaceholder: "Meno",
    sendingButton: "Odosielam…",
    loginButton: "Log in",
    signupButton: "Vytvoriť účet",
    codeSentInfo: (email) => `Kód bol poslaný na ${email}. Platí 10 minút.`,
    verifyingButton: "Overujem…",
    verifyButton: "Overiť",
    backButton: "← Späť",
    resendButton: "Poslať znova",
    resendCooldown: (seconds) => `Poslať znova (${seconds}s)`,
    enterEmailError: "Zadaj email.",
    accountNotFoundError: "Účet s týmto emailom neexistuje.",
    emailSendFailedError: "Email s kódom sa nepodarilo odoslať. Skús to o chvíľu znova.",
    enterNameError: "Zadaj meno.",
    accountExistsError: "Účet s týmto emailom už existuje. Prihlás sa.",
    enterCodeError: "Zadaj kód.",
    rememberMeLabel: "Zapamätať si ma",
    guestDefaultName: "Hosť",
    continueAsGuestButton: "Pokračovať ako hosť",
    orDivider: "alebo",
  },
  account: {
    backToHome: "Späť na hlavnú stránku",
    heading: "Účet",
    nameHeading: "Meno",
    savingButton: "Ukladám…",
    saveButton: "Uložiť",
    emailHeading: "Email",
    changeEmailButton: "Zmeniť email",
    newEmailPlaceholder: "nový@email.sk",
    sendingButton: "Odosielam…",
    sendCodeButton: "Poslať kód",
    cancelButton: "Zrušiť",
    codeSentPrefix: "Kód bol poslaný na ",
    codeSentSuffix: ". Platí 10 minút.",
    codePlaceholder: "123456",
    verifyingButton: "Overujem…",
    verifyButton: "Overiť",
    resendButton: "Poslať znova",
    resendButtonCooldown: (seconds) => `Poslať znova (${seconds}s)`,
    deleteAccountHeading: "Vymazanie účtu",
    deleteConfirmMessage: "Naozaj vymazať účet? Vymažú sa aj všetky tvoje sheety a kategórie. Túto akciu nie je možné vrátiť späť.",
    deletingButton: "Mažem…",
    deleteAccountButton: "Vymazať účet",
    nameRequiredError: "Zadaj meno.",
    emailRequiredError: "Zadaj email.",
    emailTakenError: "Tento email už používa iný účet.",
    codeRequiredError: "Zadaj kód.",
    noEmailSetMessage: "Tento účet zatiaľ nemá priradený email.",
    addEmailHint: "Pridaj ho, aby si sa mohla prihlásiť aj z iného zariadenia.",
    addEmailButton: "Pridať email",
  },
  pdfExport: {
    pageTitle: "Export do PDF",
    backToSheet: "Späť na sheet",
    layoutLabel: "Zobrazenie",
    contentLabel: "Obsah",
    contentFilled: "Vyplnené",
    contentEmpty: "Prázdne (na vyfarbenie)",
    includeLabel: "Pridať na stránku",
    legendToggle: "Legenda",
    weekendsToggle: "Odlíšiť víkendy",
    notesToggle: "Riadky na poznámky",
    paperPortrait: "A4 na výšku",
    paperLandscape: "A4 na šírku",
    saveButton: "Uložiť PDF",
    savingButton: "Pripravujem PDF…",
    saveFailedError: "PDF sa nepodarilo vytvoriť. Skús to znova.",
    legendHeading: "Legenda",
    notesHeading: "Poznámky",
    blocksHint: "Bloky na stránke (nadpis, mriežku, legendu, poznámky) môžeš ťahaním presúvať a za roh vpravo dole meniť ich veľkosť.",
    resetLayoutButton: "Obnoviť rozloženie",
  },
  },
  en: {
  home: {
    loggedInAs: (userName) => `Logged in as ${userName}`,
    accountLink: "Account",
    logoutButton: "Log out",
    sheetsHeading: "Sheets",
    objectsHeading: "Objects",
  },
  dailyEntry: {
    openButton: "Today",
    noValuesTitle: "You don't have a sheet with values to fill in yet.",
    alreadyDoneTitle: "Today's entry is already filled in - click to view/change",
    fillTitle: "Fill in today's entry",
    summaryLabel: "Summary",
    stepLabel: (currentStep, totalSteps) => `Step ${currentStep} of ${totalSteps}`,
    closeLabel: "Close",
    backButton: "← Back",
    cancelSelectionButton: "Clear selection",
    nextButton: "Next →",
    skipButton: "Skip →",
    alreadyDoneHeading: "Today's entry is already filled in",
    summaryHeading: "Today's entry",
    changeHint: "Click an item if you want to change something.",
    skippedLabel: "Skipped",
    savingLabel: "Saving…",
    doneButton: "Done",
  },
  sheetsBrowse: {
    prevArrowLabel: "Previous sheets",
    nextArrowLabel: "Next sheets",
    newSheetTileLabel: "New sheet",
    newSheetModalTitle: "New sheet",
    closeButtonLabel: "Close",
    nameFieldLabel: "Name",
    nameFieldPlaceholder: "e.g. Moods 2027",
    yearFieldLabel: "Year (optional)",
    yearFieldPlaceholder: "e.g. 2027",
    creatingButtonLabel: "Creating…",
    createButtonLabel: "Create",
    deleteConfirmMessage: (sheetName) => `Really delete sheet "${sheetName}"?`,
    deleteButtonTitle: "Delete sheet",
    deleteButtonAriaLabel: (sheetName) => `Delete sheet ${sheetName}`,
  },
  objectsBrowse: {
    prevCategoriesLabel: "Previous categories",
    nextCategoriesLabel: "Next categories",
    newCategoryLabel: "New category",
    closeLabel: "Close",
    nameLabel: "Name",
    namePlaceholder: "e.g. Books",
    createButton: "Create",
    creatingButton: "Creating…",
    deleteCategoryConfirm: (name) => `Are you sure you want to delete the category "${name}"? All its objects will be deleted too.`,
    deleteCategoryButtonTitle: "Delete category",
    deleteCategoryAriaLabel: (name) => `Delete category ${name}`,
  },
  sheet: {
    nameRequiredError: "Enter a name.",
    sheetNameExistsError: (name) => `A sheet named "${name}" already exists.`,
    colorRequiredError: "Choose a color.",
    valueNameExistsError: (name) => `A value named "${name}" already exists.`,
    colorTooSimilarError: "This color is too similar to a color already used in this sheet.",
    valuesHeading: "Values",
    reorderValuesHint: "Drag a color in the palette above to change the order.",
    valueLimitReached: (max) => `A sheet can have at most ${max} values - more colors would be hard to tell apart in the grid.`,
    eraserSelectTitle: "Select eraser",
    eraserLabel: "Eraser",
    paletteLabel: "Paint color",
    addValueTitle: "Add value",
    viewSwitcherLabel: "View",
    viewAuto: "Auto (follows screen orientation)",
    viewColumns: "Months as columns",
    viewRows: "Months as rows",
    viewCalendar: "Calendar",
    weekdayMon: "Mo",
    weekdayTue: "Tu",
    weekdayWed: "We",
    weekdayThu: "Th",
    weekdayFri: "Fr",
    weekdaySat: "Sa",
    weekdaySun: "Su",
    monthJan: "Jan",
    monthFeb: "Feb",
    monthMar: "Mar",
    monthApr: "Apr",
    monthMay: "May",
    monthJun: "Jun",
    monthJul: "Jul",
    monthAug: "Aug",
    monthSep: "Sep",
    monthOct: "Oct",
    monthNov: "Nov",
    monthDec: "Dec",
    cellTitle: (day, month) => `${month} ${day} – double-click to clear`,
    savingButton: "Saving…",
    saveNameButton: "Save name",
    deleteSheetConfirm: (name) => `Really delete the sheet "${name}"? All its values will be deleted too.`,
    deletingButton: "Deleting…",
    deleteSheetButton: "Delete sheet",
    changeColorTitle: "Change color",
    selectValueTitle: (name) => `Select "${name}" as the active color`,
    deleteTitle: "Delete",
    valueInUseConfirm: (name) => `The value "${name}" is used in the grid. Replace it with another value, or delete it without a replacement (the cells will be cleared)?`,
    noReplacementOption: "No replacement (delete)",
    replaceWithOption: (name) => `Replace with "${name}"`,
    cancelButton: "Cancel",
    confirmDeleteButton: "Delete",
    namePlaceholder: "Name (e.g. Exercise)",
    addingButton: "Adding…",
    addButton: "Add",
    backToHomeTitle: "Back to home page",
    endEditTitle: "Finish editing",
    editButtonTitle: "Edit",
    prevSheetAriaLabel: "Previous sheet",
    prevSheetTitle: (name) => `Previous sheet: ${name}`,
    nextSheetAriaLabel: "Next sheet",
    nextSheetTitle: (name) => `Next sheet: ${name}`,
    pdfExportTitle: "Export to PDF",
    pdfButtonLabel: "PDF",
    sheetsMenuTitle: "Sheets menu",
    sheetsMenuHeading: "Sheets",
    editMenuButtonTitle: "Edit order/delete",
    closeAriaLabel: "Close",
  },
  object: {
    nameRequiredError: "Enter a name.",
    categoryNameExistsError: (name) => `A category named "${name}" already exists.`,
    attributeTypeInvalidError: "Invalid attribute type.",
    categoryNotFoundError: "The category no longer exists.",
    attributeNameExistsError: (name) => `An attribute named "${name}" already exists.`,
    attributeInvalidError: "Invalid attribute.",
    attributeNotFoundError: "The attribute no longer exists.",
    objectNameExistsError: (name) => `An object named "${name}" already exists.`,
    objectInvalidError: "Invalid object.",
    attributeTypeText: "text",
    attributeTypeNumber: "number",
    attributeTypeRatingOf: (scale) => `rating out of ${scale}`,
    attributesHeading: "Attributes",
    noAttributesMessage: "No attributes yet.",
    objectsHeading: "Objects",
    changeCategoryIconLabel: "Change category icon",
    defaultIconHint: "Default icon (the tile shows the most recently added object if it has its own photo)",
    savingEllipsis: "Saving…",
    saveButton: "Save",
    saveNameButton: "Save name",
    deleteCategoryConfirm: (name) => `Really delete the category "${name}"? All its objects will be deleted too.`,
    deletingEllipsis: "Deleting…",
    deleteCategoryButton: "Delete category",
    attributeTypeTextOption: "Text",
    attributeTypeNumberOption: "Number",
    attributeTypeRatingOption: "Rating",
    ratingScaleOf5Option: "out of 5",
    ratingScaleOf10Option: "out of 10",
    ratingDisplayStarsOption: "Stars",
    ratingDisplayNumberOption: "Number",
    featuredCheckboxLabel: "On tile",
    savingBrief: "…",
    cancelButton: "Cancel",
    featuredOnTileTooltip: "Shown on the object's tile",
    featuredIndicatorText: "· on tile",
    editButtonTitle: "Edit",
    deleteButtonTitle: "Delete",
    sortByLabel: "Sort by",
    sortByCreatedOption: "creation date",
    sortByNameOption: "name",
    sortAscendingTitle: "Ascending",
    sortDescendingTitle: "Descending",
    noObjectsMessage: "No objects yet.",
    addAttributeFirstMessage: "First add at least one attribute in Attributes.",
    newObjectButton: "+ New object",
    newObjectHeading: "New object",
    closeButtonTitle: "Close",
    createObjectButton: "Create",
    creatingEllipsis: "Creating…",
    attributeNamePlaceholder: "Attribute name (e.g. Author)",
    addingEllipsis: "Adding…",
    addButton: "Add",
    showOnTileCheckboxLabel: "Show on the object's tile",
    changeObjectIconLabel: "Change object icon",
    ownIconLabel: "Own icon/photo",
    inheritedCategoryIconLabel: "Category icon (default)",
    nameLabel: "Name",
    starRatingLabel: (n, scale) => `${n} out of ${scale}`,
    backToHomeTitle: "Back to home page",
    exitEditModeTitle: "Exit edit mode",
    previousCategoryTitle: "Previous category",
    previousCategoryWithNameTitle: (name) => `Previous category: ${name}`,
    nextCategoryTitle: "Next category",
    nextCategoryWithNameTitle: (name) => `Next category: ${name}`,
    categoriesMenuTitle: "Categories menu",
    categoriesHeading: "Categories",
    reorderDeleteModeTitle: "Edit order/delete",
  },
  iconPicker: {
    changeIconLabel: "Change icon",
    heicLoadError: "This photo could not be loaded (it might be a HEIC file). Try a different photo or a screenshot.",
    cropFailedError: "Cropping failed, please try again.",
    uploadFailedError: "Upload failed.",
    modalTitle: "Icon",
    closeButton: "Close",
    defaultTab: "Default",
    customPhotoTab: "Custom photo",
    zoomLabel: "Zoom",
    uploadingButton: "Uploading…",
    useButton: "Use",
    useCategoryIconButton: "Use category icon",
  },
  auth: {
    appTitle: "Pixel Diary",
    loginHeading: "Log in",
    signupHeading: "Sign up",
    noAccountText: "Don't have an account?",
    signupLink: "Sign up",
    haveAccountText: "Already have an account?",
    loginLink: "Log in",
    emailPlaceholder: "your@email.com",
    namePlaceholder: "Name",
    sendingButton: "Sending…",
    loginButton: "Log in",
    signupButton: "Create account",
    codeSentInfo: (email) => `The code was sent to ${email}. It's valid for 10 minutes.`,
    verifyingButton: "Verifying…",
    verifyButton: "Verify",
    backButton: "← Back",
    resendButton: "Resend",
    resendCooldown: (seconds) => `Resend (${seconds}s)`,
    enterEmailError: "Enter your email.",
    accountNotFoundError: "No account exists with this email.",
    emailSendFailedError: "Couldn't send the email with the code. Please try again in a moment.",
    enterNameError: "Enter your name.",
    accountExistsError: "An account with this email already exists. Log in.",
    enterCodeError: "Enter the code.",
    rememberMeLabel: "Remember me",
    guestDefaultName: "Guest",
    continueAsGuestButton: "Continue as guest",
    orDivider: "or",
  },
  account: {
    backToHome: "Back to home page",
    heading: "Account",
    nameHeading: "Name",
    savingButton: "Saving…",
    saveButton: "Save",
    emailHeading: "Email",
    changeEmailButton: "Change email",
    newEmailPlaceholder: "new@email.com",
    sendingButton: "Sending…",
    sendCodeButton: "Send code",
    cancelButton: "Cancel",
    codeSentPrefix: "The code was sent to ",
    codeSentSuffix: ". Valid for 10 minutes.",
    codePlaceholder: "123456",
    verifyingButton: "Verifying…",
    verifyButton: "Verify",
    resendButton: "Resend",
    resendButtonCooldown: (seconds) => `Resend (${seconds}s)`,
    deleteAccountHeading: "Account deletion",
    deleteConfirmMessage: "Are you sure you want to delete your account? All your sheets and categories will also be deleted. This action cannot be undone.",
    deletingButton: "Deleting…",
    deleteAccountButton: "Delete account",
    nameRequiredError: "Enter a name.",
    emailRequiredError: "Enter an email.",
    emailTakenError: "This email is already used by another account.",
    codeRequiredError: "Enter the code.",
    noEmailSetMessage: "This account doesn't have an email yet.",
    addEmailHint: "Add one so you can also log in from another device.",
    addEmailButton: "Add email",
  },
  pdfExport: {
    pageTitle: "Export to PDF",
    backToSheet: "Back to sheet",
    layoutLabel: "Layout",
    contentLabel: "Content",
    contentFilled: "Filled in",
    contentEmpty: "Empty (to color in)",
    includeLabel: "Add to page",
    legendToggle: "Legend",
    weekendsToggle: "Shade weekends",
    notesToggle: "Notes lines",
    paperPortrait: "A4 portrait",
    paperLandscape: "A4 landscape",
    saveButton: "Save PDF",
    savingButton: "Preparing PDF…",
    saveFailedError: "Couldn't create the PDF. Please try again.",
    legendHeading: "Legend",
    notesHeading: "Notes",
    blocksHint: "Drag the blocks on the page (title, grid, legend, notes) to move them, and their bottom-right corner to resize.",
    resetLayoutButton: "Reset layout",
  },
  },
};
