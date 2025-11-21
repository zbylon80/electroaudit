// Polish translations for the ElectroAudit application

export const translations = {
  // Common
  common: {
    save: 'Zapisz',
    cancel: 'Anuluj',
    delete: 'Usuń',
    edit: 'Edytuj',
    add: 'Dodaj',
    back: 'Wstecz',
    close: 'Zamknij',
    confirm: 'Potwierdź',
    yes: 'Tak',
    no: 'Nie',
    search: 'Szukaj',
    filter: 'Filtruj',
    all: 'Wszystkie',
    loading: 'Ładowanie...',
    error: 'Błąd',
    success: 'Sukces',
    required: 'Wymagane',
    optional: 'Opcjonalne',
  },

  // Navigation
  navigation: {
    orders: 'Zlecenia',
    clients: 'Klienci',
    rooms: 'Pomieszczenia',
    points: 'Punkty Pomiarowe',
    visualInspection: 'Przegląd Wizualny',
    protocol: 'Protokół',
    measurements: 'Pomiary',
  },

  // Order Status
  orderStatus: {
    draft: 'Szkic',
    in_progress: 'W trakcie',
    done: 'Zakończone',
  },

  // Point Status
  pointStatus: {
    unmeasured: 'Niezmierzony',
    ok: 'OK',
    not_ok: 'Nieprawidłowy',
  },

  // Point Types
  pointTypes: {
    socket_1p: 'Gniazdo 1-fazowe',
    socket_3p: 'Gniazdo 3-fazowe',
    lighting: 'Oświetlenie',
    rcd: 'RCD',
    earthing: 'Uziemienie',
    lps: 'LPS',
    other: 'Inne',
  },

  // Room Types (quick-add buttons)
  roomTypes: {
    room: 'Pokój',
    kitchen: 'Kuchnia',
    bathroom: 'Łazienka',
    hallway: 'Korytarz',
  },

  // Measurement Types
  measurementTypes: {
    loopImpedance: 'Impedancja pętli',
    insulation: 'Rezystancja izolacji',
    rcd: 'RCD',
    peContinuity: 'Ciągłość PE',
    earthing: 'Uziemienie',
    polarity: 'Polaryzacja',
    phaseSequence: 'Kolejność faz',
    breakersCheck: 'Sprawdzenie wyłączników',
    lps: 'LPS',
    visualInspection: 'Przegląd wizualny',
    polarityAndPhaseSequence: 'Polaryzacja i kolejność faz',
  },

  // Form Fields
  fields: {
    name: 'Nazwa',
    address: 'Adres',
    contactPerson: 'Osoba kontaktowa',
    phone: 'Telefon',
    email: 'Email',
    notes: 'Notatki',
    objectName: 'Nazwa obiektu',
    scheduledDate: 'Data planowana',
    status: 'Status',
    client: 'Klient',
    room: 'Pomieszczenie',
    label: 'Etykieta',
    type: 'Typ',
    circuitSymbol: 'Symbol obwodu',
    comments: 'Komentarze',
    summary: 'Podsumowanie',
    defectsFound: 'Wykryte wady',
    recommendations: 'Zalecenia',
    pass: 'Zaliczony',
    fail: 'Niezaliczony',
  },

  // Measurement Fields
  measurements: {
    loopImpedance: 'Impedancja pętli (Ω)',
    loopResultPass: 'Wynik impedancji pętli',
    insulationLn: 'Izolacja L-N (MΩ)',
    insulationLpe: 'Izolacja L-PE (MΩ)',
    insulationNpe: 'Izolacja N-PE (MΩ)',
    insulationResultPass: 'Wynik izolacji',
    rcdType: 'Typ RCD',
    rcdRatedCurrent: 'Prąd znamionowy RCD (mA)',
    rcdTime1x: 'Czas RCD 1x (ms)',
    rcdTime5x: 'Czas RCD 5x (ms)',
    rcdResultPass: 'Wynik RCD',
    peResistance: 'Rezystancja PE (Ω)',
    peResultPass: 'Wynik PE',
    earthingResistance: 'Rezystancja uziemienia (Ω)',
    earthingResultPass: 'Wynik uziemienia',
    polarityOk: 'Polaryzacja OK',
    phaseSequenceOk: 'Kolejność faz OK',
    breakerCheckOk: 'Sprawdzenie wyłączników OK',
    lpsEarthingResistance: 'Rezystancja uziemienia LPS (Ω)',
    lpsContinuityOk: 'Ciągłość LPS OK',
    lpsVisualOk: 'Przegląd wizualny LPS OK',
    enterLoopImpedance: 'Wprowadź impedancję pętli',
    enterInsulationLN: 'Wprowadź izolację L-N',
    enterInsulationLPE: 'Wprowadź izolację L-PE',
    enterInsulationNPE: 'Wprowadź izolację N-PE',
    selectRcdType: 'Wybierz typ RCD',
    enterRatedCurrent: 'Wprowadź prąd znamionowy',
    enterTimeAt1x: 'Wprowadź czas przy 1x',
    enterTimeAt5x: 'Wprowadź czas przy 5x',
    enterPeResistance: 'Wprowadź rezystancję PE',
    enterEarthingResistance: 'Wprowadź rezystancję uziemienia',
    enterLpsEarthingResistance: 'Wprowadź rezystancję uziemienia LPS',
    saveMeasurement: 'Zapisz pomiar',
  },

  // Screens
  screens: {
    orders: {
      title: 'Zlecenia',
      addOrder: 'Dodaj Zlecenie',
      noOrders: 'Brak zleceń',
      noOrdersDescription: 'Dodaj nowe zlecenie, aby rozpocząć',
    },
    clients: {
      title: 'Klienci',
      addClient: 'Dodaj Klienta',
      noClients: 'Brak klientów',
      noClientsDescription: 'Dodaj nowego klienta, aby rozpocząć',
      searchPlaceholder: 'Szukaj klientów...',
    },
    orderForm: {
      title: 'Zlecenie',
      newOrder: 'Nowe Zlecenie',
      editOrder: 'Edytuj Zlecenie',
      clientSelection: 'Wybór Klienta',
      selectClient: 'Wybierz klienta',
      objectInfo: 'Informacje o obiekcie',
      measurementScope: 'Zakres pomiarów',
      startMeasurements: 'Rozpocznij pomiary',
      addClient: 'Dodaj Klienta',
      objectNameRequired: 'Nazwa obiektu jest wymagana',
    },
    clientForm: {
      title: 'Klient',
      newClient: 'Nowy Klient',
      editClient: 'Edytuj Klienta',
    },
    orderDetails: {
      title: 'Szczegóły Zlecenia',
    },
    roomForm: {
      title: 'Pomieszczenie',
      newRoom: 'Nowe Pomieszczenie',
      editRoom: 'Edytuj Pomieszczenie',
    },
    pointForm: {
      title: 'Punkt Pomiarowy',
      newPoint: 'Nowy Punkt Pomiarowy',
      editPoint: 'Edytuj Punkt Pomiarowy',
      noRoom: 'Bez pomieszczenia',
    },
    measurementForm: {
      title: 'Pomiary',
      recordMeasurements: 'Zapisz Pomiary',
    },
    rooms: {
      title: 'Pomieszczenia',
      addRoom: 'Dodaj Pomieszczenie',
      addCustomRoom: 'Dodaj Własne Pomieszczenie',
      quickAdd: 'Szybkie dodawanie',
      noRooms: 'Brak pomieszczeń',
      noRoomsDescription: 'Dodaj pomieszczenie, aby rozpocząć',
    },
    points: {
      title: 'Punkty Pomiarowe',
      addPoint: 'Dodaj Punkt',
      noPoints: 'Brak punktów pomiarowych',
      noPointsDescription: 'Dodaj punkt pomiarowy, aby rozpocząć',
      unassigned: 'Nieprzypisane',
      selectRoom: 'Wybierz pomieszczenie',
      allRooms: 'Wszystkie pomieszczenia',
    },
    visualInspection: {
      title: 'Przegląd Wizualny',
      saved: 'Zapisano',
      notSaved: 'Niezapisane',
    },
    protocol: {
      title: 'Protokół',
      export: 'Eksportuj',
      print: 'Drukuj',
      inspector: 'Inspektor',
      clientInfo: 'Informacje o kliencie',
      objectInfo: 'Informacje o obiekcie',
      measurementScope: 'Zakres pomiarów',
      results: 'Wyniki',
      signature: 'Podpis',
      date: 'Data',
      protocolTitle: 'Protokół Przeglądu Elektrycznego',
      inspectedObject: 'Obiekt inspekcji',
      measurementResults: 'Wyniki pomiarów',
      room: 'Pomieszczenie',
      point: 'Punkt',
      type: 'Typ',
      status: 'Status',
      licenseNumber: 'Numer licencji',
      company: 'Firma',
      inspectionDate: 'Data inspekcji',
      loopImpedanceMeasurement: 'Pomiar impedancji pętli',
      insulationResistanceTesting: 'Badanie rezystancji izolacji',
      rcdTesting: 'Badanie RCD',
      peContinuityTesting: 'Badanie ciągłości PE',
      earthingResistanceMeasurement: 'Pomiar rezystancji uziemienia',
      polarityCheck: 'Sprawdzenie polaryzacji',
      phaseSequenceCheck: 'Sprawdzenie kolejności faz',
      circuitBreakersCheck: 'Sprawdzenie wyłączników',
      lightningProtectionSystem: 'System ochrony odgromowej',
    },
  },

  // Validation Messages
  validation: {
    required: 'To pole jest wymagane',
    invalidEmail: 'Nieprawidłowy adres email',
    invalidNumber: 'Nieprawidłowa liczba',
    invalidRange: 'Wartość poza dopuszczalnym zakresem',
    minLength: 'Minimalna długość: {{min}} znaków',
    maxLength: 'Maksymalna długość: {{max}} znaków',
    mustBePositive: 'Wartość musi być dodatnia',
    mustBeNonNegative: 'Wartość nie może być ujemna',
  },

  // Error Messages
  errors: {
    generic: 'Wystąpił błąd',
    databaseError: 'Błąd bazy danych',
    notFound: 'Nie znaleziono',
    cannotDelete: 'Nie można usunąć',
    cannotDeleteClientWithOrders: 'Nie można usunąć klienta z przypisanymi zleceniami',
    saveFailed: 'Nie udało się zapisać',
    loadFailed: 'Nie udało się załadować',
    exportFailed: 'Nie udało się wyeksportować',
    printFailed: 'Nie udało się wydrukować',
  },

  // Success Messages
  success: {
    saved: 'Zapisano pomyślnie',
    deleted: 'Usunięto pomyślnie',
    updated: 'Zaktualizowano pomyślnie',
    created: 'Utworzono pomyślnie',
    exported: 'Wyeksportowano pomyślnie',
  },

  // Confirmation Messages
  confirmations: {
    deleteClient: 'Czy na pewno chcesz usunąć tego klienta?',
    deleteOrder: 'Czy na pewno chcesz usunąć to zlecenie?',
    deleteRoom: 'Czy na pewno chcesz usunąć to pomieszczenie?',
    deletePoint: 'Czy na pewno chcesz usunąć ten punkt pomiarowy?',
    deleteTitle: 'Potwierdź usunięcie',
    unsavedChanges: 'Masz niezapisane zmiany. Czy na pewno chcesz wyjść?',
  },

  // Placeholders
  placeholders: {
    enterName: 'Wprowadź nazwę',
    enterAddress: 'Wprowadź adres',
    enterContactPerson: 'Wprowadź osobę kontaktową',
    enterPhone: 'Wprowadź telefon',
    enterEmail: 'Wprowadź email',
    enterNotes: 'Wprowadź notatki',
    enterObjectName: 'Wprowadź nazwę obiektu',
    enterLabel: 'Wprowadź etykietę',
    enterCircuitSymbol: 'Wprowadź symbol obwodu',
    enterComments: 'Wprowadź komentarze',
    enterSummary: 'Wprowadź podsumowanie',
    enterDefects: 'Wprowadź wykryte wady',
    enterRecommendations: 'Wprowadź zalecenia',
    selectDate: 'Wybierz datę',
    selectClient: 'Wybierz klienta',
    selectRoom: 'Wybierz pomieszczenie',
    selectType: 'Wybierz typ',
    search: 'Szukaj...',
    enterRoomName: 'Wprowadź nazwę pomieszczenia',
    enterAdditionalNotes: 'Wprowadź dodatkowe notatki',
    enterPointLabel: 'Wprowadź etykietę punktu pomiarowego',
    selectPointType: 'Wybierz typ punktu',
    enterAdditionalNotesMax200: 'Wprowadź dodatkowe notatki (max 200 znaków)',
  },

  // Units
  units: {
    ohm: 'Ω',
    megaohm: 'MΩ',
    milliampere: 'mA',
    millisecond: 'ms',
  },

  // RCD Types
  rcdTypes: {
    ac: 'AC',
    a: 'A',
    f: 'F',
  },
};

export default translations;
